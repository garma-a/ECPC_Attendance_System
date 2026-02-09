import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import LanguageToggle from "./LanguageToggle";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
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
              {/* {user.role === 'admin' && ( */}
              {/*   <Link */}
              {/*     to="/" */}
              {/*     className="relative group px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors" */}
              {/*   > */}
              {/*     <span>{t('adminPanel')}</span> */}
              {/*     <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span> */}
              {/*   </Link> */}
              {/* )} */}
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
