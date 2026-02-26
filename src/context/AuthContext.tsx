import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { supabase } from "../supabaseClient";
import { User } from "../types";

import { AuthChangeEvent, Session } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, isAuthenticated: false, login: async () => { }, logout: () => { }, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const initialSessionHandled = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
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
  const fetchProfile = async (authUser: any) => {
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
      setUser({ ...authUser, ...profile } as User);
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<any> => {
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

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>
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
export const useAuth = (): AuthContextType => useContext(AuthContext); 
