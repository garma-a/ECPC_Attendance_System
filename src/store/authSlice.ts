import { StateCreator } from 'zustand';
import { supabase } from '../supabaseClient';
import { AuthState } from './types';
import { User } from '../types';

export const createAuthSlice: StateCreator<AuthState, [], [], AuthState> = (set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
});

export const initializeAuth = (setAuthStatus: (data: Partial<AuthState>) => void) => {
  let initialSessionHandled = false;

  const fetchProfile = async (authUser: any) => {
    try {
      const { data: profile, error } = await supabase
        .from('User')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      }

      setAuthStatus({
        user: { ...authUser, ...profile } as User,
        isAuthenticated: true
      });
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setAuthStatus({ loading: false });
    }
  };

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      if (session?.user) {
        if (_event === 'INITIAL_SESSION' || _event === 'TOKEN_REFRESHED') {
          setTimeout(() => fetchProfile(session.user), 0);
        }
      } else {
        setAuthStatus({ user: null, isAuthenticated: false, loading: false });
      }
      initialSessionHandled = true;
    }
  );

  const timeout = setTimeout(() => {
    if (!initialSessionHandled) {
      console.warn("Auth initialization timed out - proceeding without session");
      setAuthStatus({ loading: false });
    }
  }, 5000);

  return () => {
    subscription.unsubscribe();
    clearTimeout(timeout);
  };
};

export const loginWithSupabase = async (email: string, password: string, setAuthStatus: (data: Partial<AuthState>) => void) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  
  // Fetch profile before returning so user state is ready
  try {
    const { data: profile, error: profileError } = await supabase
      .from('User')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
    }

    setAuthStatus({
      user: { ...data.user, ...profile } as User,
      isAuthenticated: true
    });
  } catch (err) {
    console.error("Unexpected error:", err);
  }
  
  return data;
};

export const logoutFromSupabase = async (setAuthStatus: (data: Partial<AuthState>) => void) => {
  await supabase.auth.signOut();
  setAuthStatus({ user: null, isAuthenticated: false });
};
