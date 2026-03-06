import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "../store";
import api from "../services/api";
import Layout from "../components/Layout";
import SessionCard from "../components/SessionCard";
import { QRCodeSVG } from "qrcode.react";
import { Session, Attendance, QRToken, User } from "../types";

export default function InstructorDashboard() {
  const user = useAppStore((state) => state.user);
  const t = useAppStore((state) => state.t);
  const queryClient = useQueryClient();

  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [qrData, setQrData] = useState<{ token: string; expiresAt: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    courseName: "",
    date: new Date().toISOString().slice(0, 16),
  });

  // --- Student Search & Edit State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});

  const qrIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: () => api.getSessions(),
  });

  const { data: attendances = [] } = useQuery<Attendance[]>({
    queryKey: ['attendance', selectedSession],
    queryFn: () => api.getSessionAttendance(selectedSession!) as Promise<Attendance[]>,
    enabled: !!selectedSession,
    refetchInterval: 5000,
  });

  const createSessionMutation = useMutation({
    mutationFn: (data: Partial<Session>) => api.createSession(data),
    onSuccess: () => {
      setShowCreateForm(false);
      setFormData({
        name: "",
        courseName: "",
        date: new Date().toISOString().slice(0, 16),
      });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (error: any) => {
      alert("Failed to create session: " + error.message);
    }
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
  });

  const availableGroups = Array.from(new Set(users.map(u => u.groupName).filter(Boolean))) as string[];

  const filteredUsers = users.filter((u) => {
    // Basic instructor view filter to hide other admins/instructors if desired
    // But since the requirement says "all the students the admin register", we assume all.
    // However, if we only want students, we should filter by role:
    if (u.role !== 'student') return false;
    
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = filterGroup === "all" || u.groupName === filterGroup;
    return matchesSearch && matchesGroup;
  });

  const updateUserMutation = useMutation({
    mutationFn: (updates: Partial<User>) => api.updateUser(editingUser!.id, updates),
    onSuccess: () => {
      alert("Student updated successfully!");
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      alert("Failed to update student: " + error.message);
    }
  });

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    updateUserMutation.mutate(editFormData);
  };

  function handleSessionDeleted(deletedSessionId: string) {
    // Invalidate sessions list query
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
  }

  useEffect(() => {
    return () => {
      if (qrIntervalRef.current) {
        clearInterval(qrIntervalRef.current);
      }
    };
  }, []);

  // Countdown timer for QR expiry
  useEffect(() => {
    if (!selectedSession || !qrData) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedSession, qrData]);

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    createSessionMutation.mutate(formData);
  };

  const startQRRotation = async (sessionId: string) => {
    setSelectedSession(sessionId);

    // Initial QR generation
    await generateQR(sessionId);

    // Auto-refresh QR every 4 minutes (before 5-minute expiry)
    qrIntervalRef.current = setInterval(() => {
      generateQR(sessionId);
    }, 4 * 60 * 1000);
  };

  const generateQR = async (sessionId: string) => {
    try {
      const data = await api.generateSessionQR(sessionId);
      setQrData(data);
      // Calculate initial time left in seconds
      const remaining = Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
    } catch (error) {
      console.error("Failed to generate QR:", error);
    }
  };

  const stopQRRotation = () => {
    if (qrIntervalRef.current) {
      clearInterval(qrIntervalRef.current);
      qrIntervalRef.current = null;
    }
    setSelectedSession(null);
    setQrData(null);
  };

  const exportCSV = (sessionId: string) => {
    api.getSessionAttendance(sessionId, "csv");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="hidden sm:block text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {t("dashboard")} - {t("instructor")}
          </h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-cyan-500/50"
          >
            {t("createSession")}
          </button>
        </div>

        {/* Create Session Form */}
        {showCreateForm && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6">
            <h2 className="text-xl font-bold text-cyan-400 mb-4">
              {t("createSession")}
            </h2>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t("sessionName")}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t("courseName")}
                </label>
                <input
                  type="text"
                  value={formData.courseName}
                  onChange={(e) =>
                    setFormData({ ...formData, courseName: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t("sessionDate")}
                </label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex space-x-4 rtl:space-x-reverse">
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-green-500/50"
                >
                  {t("submit")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 bg-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-600 border border-slate-600 transition-all"
                >
                  {t("cancel")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* QR Display */}
        {selectedSession && qrData && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-cyan-400">{t("showQR")}</h2>
              <button
                onClick={stopQRRotation}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-rose-700 transition-all shadow-lg hover:shadow-red-500/50"
              >
                {t("close")}
              </button>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-44 h-44 sm:w-96 sm:h-96 border-4 border-cyan-500 rounded-lg shadow-lg shadow-cyan-500/30 transition-all duration-300 flex items-center justify-center bg-white p-4">
                <QRCodeSVG
                  value={qrData.token}
                  size={320}
                  level="H"
                  className="w-full h-full"
                />
              </div>
              <p className="mt-4 text-sm text-slate-300">
                Expires in: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Auto-refreshes every 4 minutes
              </p>
            </div>
          </div>
        )}

        {/* Live Attendance */}
        {selectedSession && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-cyan-400">
                {t("liveAttendance")}
              </h2>
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <span className="text-lg font-semibold text-green-400">
                  {attendances.length} {t("studentsPresent")}
                </span>
                <button
                  onClick={() => exportCSV(selectedSession)}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-green-500/50"
                >
                  {t("exportCSV")}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      {t("name")}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      {t("username")}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      {t("group")}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                  {attendances.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">
                        {att.user?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {att.user?.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {att.user?.groupName || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {new Date(att.scannedAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Desktop Sessions List */}
        <div className="hidden sm:block bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6 z-10">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">
            {t("sessions")}
          </h2>
          <div className="space-y-4">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                selectedSession={selectedSession}
                startQRRotation={startQRRotation}
                t={t}
                onSessionDeleted={handleSessionDeleted}
              />
            ))}
          </div>
        </div>

        {/* Mobile Sessions List */}
        <div className="sm:hidden">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">
            {t("sessions")}
          </h2>
          <div className="space-y-4">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                selectedSession={selectedSession}
                startQRRotation={startQRRotation}
                t={t}
                onSessionDeleted={handleSessionDeleted}
              />
            ))}
          </div>
        </div>

        {/* --- Students Directory --- */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6 relative z-10">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">
            Students Directory
          </h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <input
                type="text"
                placeholder="Search by name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">All Groups</option>
                {availableGroups.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-700">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">Group</th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">{u.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{u.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{u.groupName || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        <button 
                          onClick={() => {
                            setEditingUser(u);
                            setEditFormData({
                              name: u.name,
                              username: u.username,
                              groupName: u.groupName || ""
                            });
                          }}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-cyan-300 text-xs font-semibold rounded-lg shadow border border-slate-600 hover:border-cyan-500/50 transition-all duration-300"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
            <h3 className="text-2xl font-bold text-cyan-400 mb-6">Edit Student</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  value={editFormData.name || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  value={editFormData.username || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Group Name</label>
                <input
                  type="text"
                  value={editFormData.groupName || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, groupName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div className="flex gap-3 justify-end mt-8">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2.5 bg-slate-700 text-slate-300 font-medium rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-lg shadow-lg hover:shadow-cyan-500/25 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {updateUserMutation.isPending && (
                    <div className="h-4 w-4 border-2 border-slate-200 border-t-white rounded-full animate-spin"></div>
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
