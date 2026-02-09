import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const initialSessionHandled = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Only fetch profile for INITIAL_SESSION (page reload) and TOKEN_REFRESHED.
        // SIGNED_IN is handled directly inside login() to avoid the race condition.
        if (_event === 'INITIAL_SESSION' || _event === 'TOKEN_REFRESHED') {
          setTimeout(() => fetchProfile(session.user), 0);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
      initialSessionHandled.current = true;
    });

    // Safety timeout: if onAuthStateChange never fires (e.g. network issue),
    // stop showing a blank page after 5 seconds
    const timeout = setTimeout(() => {
      if (!initialSessionHandled.current) {
        console.warn("Auth initialization timed out - proceeding without session");
        setLoading(false);
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Helper to fetch the "role" from your custom table
  const fetchProfile = async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('User') // NOTE: This must match your Exact Table Name
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      }

      // Merge the Auth User with the Database Profile
      // This ensures user.role is available in your app
      setUser({ ...authUser, ...profile });
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    // Fetch profile before returning so user state is ready
    // when the caller navigates after await login()
    await fetchProfile(data.user);
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {error ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <div className="max-w-md p-8 bg-red-900/20 border border-red-700 rounded-lg">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Configuration Error</h2>
            <p className="text-red-200 mb-4">{error}</p>
            <p className="text-sm text-slate-300">Please check your environment variables and restart the dev server.</p>
          </div>
        </div>
      ) : loading ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <div className="text-xl text-white">Loading...</div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
