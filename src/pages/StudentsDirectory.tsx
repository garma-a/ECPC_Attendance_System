import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import Layout from "../components/Layout";
import { User } from "../types";

export default function StudentsDirectory() {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
  });

  const availableGroups = Array.from(new Set(users.map(u => u.groupName).filter(Boolean))) as string[];

  const filteredUsers = users.filter((u) => {
    // Only show students in this directory view
    if (u.role !== 'student') return false;
    
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = filterGroup === "all" || u.groupName === filterGroup;
    return matchesSearch && matchesGroup;
  });

  const updateUserMutation = useMutation({
    mutationFn: (updates: Partial<User>) => api.updateUser(editingUser!.id, updates),
    onSuccess: () => {
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

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Students Directory
        </h1>

        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6 relative z-10">
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

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-700">
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

            {/* Mobile Cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredUsers.map((u) => (
                <div key={u.id} className="bg-slate-900 border border-slate-700 rounded-lg p-5 space-y-4 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-cyan-400">{u.name}</h3>
                      <p className="text-sm text-slate-300 mt-1">@{u.username}</p>
                    </div>
                    {u.groupName && (
                      <span className="px-3 py-1 bg-slate-800 text-cyan-300 text-xs font-bold rounded-full border border-cyan-500/30 shrink-0">
                        {u.groupName}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end pt-4 border-t border-slate-700/50">
                    <button 
                      onClick={() => {
                        setEditingUser(u);
                        setEditFormData({
                          name: u.name,
                          username: u.username,
                          groupName: u.groupName || ""
                        });
                      }}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-sm font-bold rounded-lg shadow-md border border-slate-600 transition-all duration-300 w-full sm:w-auto"
                    >
                      Edit Student
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-slate-400 bg-slate-900 rounded-lg border border-slate-700">
                No students found matching your search.
              </div>
            )}
          </div>
        </div>
      </div>

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
