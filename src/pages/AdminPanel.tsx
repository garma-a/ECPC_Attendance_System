import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "../store";
import api from "../services/api";
import Layout from "../components/Layout";
import { User, Attendance, Session } from "../types";

export default function AdminPanel() {
  const t = useAppStore((state) => state.t);
  const queryClient = useQueryClient();

  const [selectedTab, setSelectedTab] = useState("users");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  // --- Search & Filter & Edit ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});

  // --- New State for Add User Form ---
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newRole, setNewRole] = useState("student"); // Default role
  // -------------------------------------

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
    enabled: selectedTab === 'users' || selectedTab === 'addUser',
  });

  const availableGroups = Array.from(new Set(users.map(u => u.groupName).filter(Boolean))) as string[];

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = filterGroup === "all" || u.groupName === filterGroup;
    return matchesSearch && matchesGroup;
  });

  const { data: attendances = [] } = useQuery<Attendance[]>({
    queryKey: ['allAttendance'],
    queryFn: () => api.getAllAttendance(),
    enabled: selectedTab === 'attendance',
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: () => api.getSessions(),
    enabled: selectedTab === 'sessions',
  });

  const deleteAttendanceMutation = useMutation({
    mutationFn: (id: string) => api.deleteAttendance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAttendance'] });
    },
    onError: (error: any) => {
      alert("Failed to delete: " + error.message);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      alert("Failed to delete: " + error.message);
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: (updates: Partial<User>) => api.updateUser(editingUser!.id, updates),
    onSuccess: () => {
      alert("User updated successfully!");
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      alert("Failed to update user: " + error.message);
    }
  });

  const createUserMutation = useMutation({
    mutationFn: (userData: Partial<User>) => api.createUser(userData),
    onSuccess: () => {
      alert("User created successfully!");
      setNewName("");
      setNewUsername("");
      setNewPassword("");
      setNewGroupName("");
      setNewRole("student");
      setSelectedTab("users");
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      alert("Failed to create user: " + (error?.response?.data?.message || error.message));
    }
  });

  const handleDeleteAttendance = (id: string) => {
    if (confirm("Are you sure you want to delete this attendance record?")) {
      deleteAttendanceMutation.mutate(id);
    }
  };

  const handleDeleteUser = (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(id);
    }
  };

  // --- New Handler for Creating User ---
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const userData = {
      name: newName,
      username: newUsername,
      password: newPassword,
      groupName: newGroupName,
      role: newRole as 'student' | 'instructor' | 'admin',
    };
    createUserMutation.mutate(userData);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    updateUserMutation.mutate(editFormData);
  };
  // ---------------------------------------

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{t("admin")}</h1>

        {/* Tabs */}
        <div className="flex space-x-4 rtl:space-x-reverse border-b border-slate-700">
          <button
            onClick={() => setSelectedTab("users")}
            className={`px-4 py-2 font-medium transition-colors ${selectedTab === "users"
              ? "text-cyan-400 border-b-2 border-cyan-400"
              : "text-slate-400 hover:text-slate-300"
              }`}
          >
            {t("users")}
          </button>
          <button
            onClick={() => setSelectedTab("attendance")}
            className={`px-4 py-2 font-medium transition-colors ${selectedTab === "attendance"
              ? "text-cyan-400 border-b-2 border-cyan-400"
              : "text-slate-400 hover:text-slate-300"
              }`}
          >
            {t("attendanceRecords")}
          </button>
          <button
            onClick={() => setSelectedTab("sessions")}
            className={`px-4 py-2 font-medium transition-colors ${selectedTab === "sessions"
              ? "text-cyan-400 border-b-2 border-cyan-400"
              : "text-slate-400 hover:text-slate-300"
              }`}
          >
            {t("sessions")}
          </button>
          {/* --- New Tab Button --- */}
          <button
            onClick={() => setSelectedTab("addUser")}
            className={`px-4 py-2 font-medium transition-colors ${selectedTab === "addUser"
              ? "text-cyan-400 border-b-2 border-cyan-400"
              : "text-slate-400 hover:text-slate-300"
              }`}
          >
            {t("addUser")}
          </button>
          {/* ---------------------- */}
        </div>

        {/* Users Tab */}
        {selectedTab === "users" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 bg-slate-800 p-4 rounded-lg border border-slate-700">
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
          {/* Desktop Table */}
          <div className="hidden md:block bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    {t("name")}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    {t("username")}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    {t("role")}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    {t("group")}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${user.role === "admin"
                          ? "bg-red-900 text-red-200 border border-red-700"
                          : user.role === "instructor"
                            ? "bg-blue-900 text-blue-200 border border-blue-700"
                            : "bg-green-900 text-green-200 border border-green-700"
                          }`}
                      >
                        {t(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {user.groupName || "N/A"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingUser(user);
                            setEditFormData({
                              name: user.name,
                              username: user.username,
                              groupName: user.groupName || ""
                            });
                          }}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-cyan-300 text-xs font-semibold rounded-lg shadow transition-all duration-300 ease-in-out border border-slate-600 hover:border-cyan-500/50"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDeleteUser(user.id)} className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-semibold rounded-lg shadow hover:shadow-red-500/50 hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-cyan-300">{user.name}</h3>
                    <p className="text-sm text-slate-400">@{user.username}</p>
                    <p className="text-xs text-slate-500 mt-1 font-mono break-all">{user.id}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase ${user.role === "admin"
                        ? "bg-red-900 text-red-200 border border-red-700"
                        : user.role === "instructor"
                          ? "bg-blue-900 text-blue-200 border border-blue-700"
                          : "bg-green-900 text-green-200 border border-green-700"
                        }`}>
                      {t(user.role)}
                    </span>
                    <span className="text-xs text-slate-400 border border-slate-600 px-2 py-0.5 rounded">{user.groupName || "N/A"}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                  <button 
                    onClick={() => {
                      setEditingUser(user);
                      setEditFormData({
                        name: user.name,
                        username: user.username,
                        groupName: user.groupName || ""
                      });
                    }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-cyan-300 text-sm font-semibold rounded-lg shadow"
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDeleteUser(user.id)} className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white text-sm font-semibold rounded-lg shadow">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          </div>
        )}

        {/* Attendance Tab */}
        {selectedTab === "attendance" && (
          <div className="space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      Session
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                  {attendances.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">
                        {att.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">
                        {att.user?.name || "N/A"} ({att.user?.username || "N/A"})
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-200">
                        {att.session?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {new Date(att.scannedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteAttendance(att.id)}
                          className="text-red-400 hover:text-red-300 font-medium transition-colors"
                        >
                          {t("delete")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center space-x-4 rtl:space-x-reverse">
              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page - 1 })
                }
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-slate-700 text-slate-300 font-medium rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-slate-300 font-medium">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page + 1 })
                }
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 bg-slate-700 text-slate-300 font-medium rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {selectedTab === "sessions" && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    {t("sessionName")}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    {t("courseName")}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    Instructor
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">
                      {session.id}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-200">
                      {session.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-200">
                      {session.courseName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {new Date(session.date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {session.creator?.name || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- New Add User Tab --- */}
        {
          selectedTab === "addUser" && (
            <div className="max-w-md mx-auto bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-8">
              {/* *
        * STYLES FROM YOUR SECOND FORM (HEADER) ARE ADDED HERE
        *
      */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent animate-text-gradient">
                    {t('createUser')} {/* Changed from t('login') to match the form */}
                  </h2>
                </div>
              </div>

              {/* *
        * ALL FIELDS FROM YOUR FIRST FORM ARE PRESERVED BELOW
        *
      */}
              <form onSubmit={handleCreateUser} className="space-y-8">
                {/* Name */}
                <div className="relative">
                  <input
                    id="name"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder=" "
                    className="peer w-full px-4 py-3 bg-transparent border-b-2 border-slate-600 text-white 
                       focus:outline-none focus:border-cyan-500 transition-all duration-300"
                    required
                  />
                  <label
                    htmlFor="name"
                    className="absolute left-4 -top-3.5 text-slate-400 transition-all duration-300 
                       text-sm 
                       peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                       peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-cyan-400
                       peer-[:not(:placeholder-shown)]:-top-3.5 
                       peer-[:not(:placeholder-shown)]:text-sm 
                       peer-[:not(:placeholder-shown)]:text-cyan-400
                       pointer-events-none"
                  >
                    {t('name')}
                  </label>
                </div>

                {/* Username */}
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder=" "
                    className="peer w-full px-4 py-3 bg-transparent border-b-2 border-slate-600 text-white 
                       focus:outline-none focus:border-cyan-500 transition-all duration-300"
                    required
                  />
                  <label
                    htmlFor="username"
                    className="absolute left-4 -top-3.5 text-slate-400 transition-all duration-300 
                       text-sm 
                       peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                       peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-cyan-400
                       peer-[:not(:placeholder-shown)]:-top-3.5 
                       peer-[:not(:placeholder-shown)]:text-sm 
                       peer-[:not(:placeholder-shown)]:text-cyan-400
                       pointer-events-none"
                  >
                    {t('username')}
                  </label>
                </div>

                {/* Password */}
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder=" "
                    className="peer w-full px-4 py-3 bg-transparent border-b-2 border-slate-600 text-white 
                       focus:outline-none focus:border-cyan-500 transition-all duration-300"
                    required
                  />
                  <label
                    htmlFor="password"
                    className="absolute left-4 -top-3.5 text-slate-400 transition-all duration-300 
                       text-sm 
                       peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                       peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-cyan-400
                       peer-[:not(:placeholder-shown)]:-top-3.5 
                       peer-[:not(:placeholder-shown)]:text-sm 
                       peer-[:not(:placeholder-shown)]:text-cyan-400
                       pointer-events-none"
                  >
                    {t('password')}
                  </label>
                </div>

                {/* Group Name */}
                <div className="relative">
                  <input
                    id="groupName"
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder=" "
                    className="peer w-full px-4 py-3 bg-transparent border-b-2 border-slate-600 text-white 
                       focus:outline-none focus:border-cyan-500 transition-all duration-300"
                    required
                  />
                  <label
                    htmlFor="groupName"
                    className="absolute left-4 -top-3.5 text-slate-400 transition-all duration-300 
                       text-sm 
                       peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                       peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-cyan-400
                       peer-[:not(:placeholder-shown)]:-top-3.5 
                       peer-[:not(:placeholder-shown)]:text-sm 
                       peer-[:not(:placeholder-shown)]:text-cyan-400
                       pointer-events-none"
                  >
                    {t('groupName')}
                  </label>
                </div>

                {/* Role */}
                <div className="relative">
                  <select
                    id="role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="peer w-full px-4 py-3 bg-transparent border-b-2 border-slate-600 text-white 
                       focus:outline-none focus:border-cyan-500 transition-all duration-300"
                    required
                  >
                    <option value="student" className="bg-slate-900 text-white">{t('student')}</option>
                    <option value="instructor" className="bg-slate-900 text-white">{t('instructor')}</option>
                  </select>
                  <label
                    htmlFor="role"
                    className="absolute left-4 -top-3.5 text-slate-400 transition-all duration-300 
                       text-sm 
                       peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                       peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-cyan-400
                       peer-[:not(:placeholder-shown)]:-top-3.5 
                       peer-[:not(:placeholder-shown)]:text-sm 
                       peer-[:not(:placeholder-shown)]:text-cyan-400
                       pointer-events-none"
                  >
                    {t('role')}
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="relative w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold 
                     rounded-lg shadow-lg hover:shadow-cyan-500/50 
                     hover:scale-105 active:scale-95 
                     transition-all duration-300 ease-in-out
                     disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100
                     flex items-center justify-center gap-2"
                >
                  {createUserMutation.isPending && (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  {createUserMutation.isPending ? t('loading') : t('createUser')}
                </button>
              </form>
            </div>
          )
        }
        {/* ---------------------- */}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
            <h3 className="text-2xl font-bold text-cyan-400 mb-6">Edit User</h3>
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
