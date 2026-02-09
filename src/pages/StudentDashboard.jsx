import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import api from "../services/api";
import Layout from "../components/Layout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getUserStats(user.id);
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">{t("loading")}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {t("welcome")}, {stats?.user.name}!
          </h1>
          <p className="text-slate-300 mt-1">
            {t("group")}: {stats?.user.groupName || "N/A"}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6">
            <h3 className="text-sm font-medium text-slate-400">
              {t("totalSessions")}
            </h3>
            <p className="text-3xl font-bold text-slate-200 mt-2">
              {stats?.stats.totalSessions || 0}
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6">
            <h3 className="text-sm font-medium text-slate-400">
              {t("attendanceCount")}
            </h3>
            <p className="text-3xl font-bold text-green-400 mt-2">
              {stats?.stats.attendanceCount || 0}
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6">
            <h3 className="text-sm font-medium text-slate-400">
              {t("absenceCount")}
            </h3>
            <p className="text-3xl font-bold text-red-400 mt-2">
              {stats?.stats.absenceCount || 0}
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6">
            <h3 className="text-sm font-medium text-slate-400">
              {t("attendanceRate")}
            </h3>
            <p className="text-3xl font-bold text-cyan-400 mt-2">
              {stats?.stats.attendanceRate || 0}%
            </p>
          </div>
        </div>

        {/* Weekly Breakdown Chart */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">
            {t("weeklyBreakdown")}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.weeklyBreakdown || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="week" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '0.5rem',
                  color: '#e2e8f0'
                }}
              />
              <Legend wrapperStyle={{ color: '#94a3b8' }} />
              <Bar dataKey="attended" fill="#10b981" name={t("attended")} />
              <Bar dataKey="absent" fill="#ef4444" name={t("absent")} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Attendance */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">
            {t("recentAttendance")}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    {t("sessionName")}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    {t("courseName")}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {stats?.recentAttendances?.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">
                      {att.sessionName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">
                      {att.courseName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {new Date(att.scannedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
