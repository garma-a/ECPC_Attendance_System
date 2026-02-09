import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import LanguageToggle from "../components/LanguageToggle";
import { RingLoader } from "react-spinners";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const [loadedA, setLoadedA] = useState(false)
  const [loadedB, setLoadedB] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const emailToUse = username.includes('@') ? username : `${username}@system.local`;

      await login(emailToUse, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };
  // Add this component inside your Login.js file, above the `return`

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
    // Animated Gradient Background
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-blue-900 animate-gradient-slow flex items-center justify-center px-4 overflow-hidden ">

      {/* Top Right - Aswan ICPC Image */}
      <div
        className="absolute top-10 right-10 w-52 h-52 
                   pointer-events-none z-0 animate-float-gentle"
      >
        {/* Show Spinner while loading */}
        {!loadedA && (
          <div className="absolute inset-0 flex items-center justify-center 
                          rounded-bl-[100px] bg-slate-800/30 backdrop-blur-sm">
            {/* 3. Use the new spinner and pass in a color */}
            <RingLoader color="#3b82f6" size={80} />
          </div>
        )}

        {/* The Image (fades in when loaded) */}
        <img
          src="./imgs/aswanICPC.png"
          alt="Aswan ICPC Logo"
          className={`w-full h-full object-cover rounded-bl-[100px] glow-blue
                      transition-opacity duration-700 ${loadedA ? "opacity-100" : "opacity-0"
            }`}
          onLoad={() => setLoadedA(true)}
        />
      </div>

      {/* Bottom Left - ICPC Logo Image */}
      <div
        className="absolute bottom-10 left-10 w-52 h-52 
                   pointer-events-none z-0 animate-float-gentle-reverse"
      >
        {/* Show Spinner while loading */}
        {!loadedB && (
          <div className="absolute inset-0 flex items-center justify-center 
                          rounded-tr-[100px] bg-slate-800/30 backdrop-blur-sm">
            <RingLoader color="#22c55e" size={80} />
          </div>
        )}

        {/* The Image (fades in when loaded) */}
        <img
          src="./imgs/icpcLOGO.jpg"
          alt="ICPC Logo"
          className={`w-full h-full object-cover rounded-tr-[100px] glow-green
                      transition-opacity duration-700 ${loadedB ? "opacity-100" : "opacity-0"
            }`}
          onLoad={() => setLoadedB(true)}
        />
      </div>



      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(10)].map((_, i) => (
          <span
            key={i}
            className="shooting-star"
            style={{
              top: `${i * 10}%`,
              right: `${i * 20}px`,
              animationDelay: `${i * 2}s`,
              animationDuration: `${15 + i * 2}s`
            }}
          />
        ))}
      </div>

      <div className="max-w-md lg:max-w-4xl w-full animate-fade-in-up">

        <div className="relative rounded-2xl p-px bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 shadow-2xl shadow-cyan-500/20 animate-text-gradient">

          <div className="bg-slate-900/80 backdrop-blur-lg rounded-2xl lg:flex overflow-hidden">

            <div className="hidden lg:block lg:w-1/2 overflow-hidden">
              <img
                src="./imgs/AIGenerated_ICPC_GEMINI.png"
                alt="Aswan ICPC Logo"
                className="w-full h-full bg-cover bg-center animate-pan"
              />
            </div>

            <div className="w-full lg:w-1/2 p-8">

              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <ICPCLogo />
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent animate-text-gradient">
                    {t('login')}
                  </h2>

                </div>
                <LanguageToggle />
              </div>


              {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-lg animate-shake">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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

                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold 
                             rounded-lg shadow-lg hover:shadow-cyan-500/50 
                             hover:scale-105 active:scale-95 
                             transition-all duration-300 ease-in-out
                             disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100
                             flex items-center justify-center gap-2"
                >
                  {loading && (
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
                  {loading ? t('loading') : t('login')}
                </button>
              </form>

            </div>
          </div>
        </div>
      </div>

    </div >
  );
}
