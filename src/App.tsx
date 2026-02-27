import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore, initAuthListener } from "./store";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import ScanQR from "./pages/ScanQR";
import InstructorDashboard from "./pages/InstructorDashboard";
import AdminPanel from "./pages/AdminPanel";

function DashboardRouter() {
  const user = useAppStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "student") {
    return <StudentDashboard />;
  } else if (user.role === "instructor") {
    return <InstructorDashboard />;
  } else if (user.role === "admin") {
    return <AdminPanel />;
  }

  return <Navigate to="/login" replace />;
}

function AppContent() {
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="max-w-md p-8 bg-red-900/20 border border-red-700 rounded-lg">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Configuration Error</h2>
          <p className="text-red-200 mb-4">{error}</p>
          <p className="text-sm text-slate-300">Please check your environment variables and restart the dev server.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scan"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <ScanQR />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  useEffect(() => {
    const unsubscribe = initAuthListener();
    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
