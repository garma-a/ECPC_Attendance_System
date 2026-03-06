import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore, logoutStore } from "../store";
import LanguageToggle from "./LanguageToggle";

export default function Layout({ children }: { children: ReactNode }) {
  const user = useAppStore((state) => state.user);
  const t = useAppStore((state) => state.t);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutStore();
    navigate("/login");
  };

  if (!user) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }
  const ICPCLogo = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className="h-8 w-8"
    >
      {/* Outer circle */}
      <circle cx="50" cy="50" r="48" fill="white" stroke="#444" strokeWidth="2" />

      {/* Blue bar */}
      <rect x="25" y="30" width="12" height="40" rx="3" fill="#4285F4" />

      {/* Yellow bar */}
      <rect x="44" y="30" width="12" height="40" rx="3" fill="#FBBC05" />

      {/* Red bar */}
      <rect x="63" y="30" width="12" height="40" rx="3" fill="#EA4335" />
    </svg>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900 z-10">
      <nav className="sticky top-0 z-50 bg-slate-800/70 backdrop-blur-lg border-b border-slate-700/50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 rtl:space-x-reverse">

              {/* Upgraded Logo/Title Link */}
              <Link to="/" className="flex items-center gap-3 group">
                <ICPCLogo />
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap group-hover:scale-105 transition-transform">
                  {user.name}
                </span>
              </Link>

              {/* Upgraded Nav Links with Animated Underline */}
              {user.role === 'student' && (
                <>
                  <Link
                    to="/"
                    className="relative group px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors"
                  >
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
                  </Link>
                  <Link
                    to="/scan"
                    className="relative group px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors"
                  >
                    <span>{t('scanQR')}</span>
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
                  </Link>
                </>
              )}
              
              <Link
                to="/announcements"
                className="relative group p-2 mx-1 sm:mx-2 rounded-full text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors flex items-center justify-center"
                title="Announcements"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11l18-5v12L3 14v-3z"></path>
                  <path d="M11.5 21a2.5 2.5 0 0 0 5-2v-3"></path>
                 </svg>
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
              </Link>
              
              {(user.role === 'instructor' || user.role === 'admin') && (
                <>
                  <Link
                    to="/students"
                    className="relative group p-2 mx-1 sm:mx-2 rounded-full text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors flex items-center justify-center"
                    title="Students Directory"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
                  </Link>
                  <Link
                    to="/resources"
                    className="relative group p-2 mx-1 sm:mx-2 rounded-full text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors flex items-center justify-center"
                    title="Study Resources"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                      <polyline points="2 17 12 22 22 17"></polyline>
                      <polyline points="2 12 12 17 22 12"></polyline>
                    </svg>
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
                  </Link>
                </>
              )}
            </div>

            {/* Right side of Navbar */}
            <div className="flex items-center space-x-2 sm:space-x-4 rtl:space-x-reverse">
              <LanguageToggle />
              {/* Upgraded Logout Button */}
              <button
                onClick={handleLogout}
                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs sm:text-sm font-semibold 
                           rounded-lg shadow-lg hover:shadow-red-500/50
                           hover:scale-105 active:scale-95 
                           transition-all duration-300 ease-in-out"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto my-6 sm:my-8 px-4 sm:px-6 lg:px-8 z-10">
        {children}
      </main>

    </div>
  );
}
