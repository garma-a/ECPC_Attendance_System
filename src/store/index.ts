import { create } from 'zustand';
import { StoreState } from './types';
import { createAuthSlice, initializeAuth, loginWithSupabase, logoutFromSupabase } from './authSlice';
import { createLanguageSlice } from './languageSlice';

export const useAppStore = create<StoreState>()((set, get, api) => ({
  ...createAuthSlice(set, get, api),
  ...createLanguageSlice(set, get, api),
}));

export const initAuthListener = () => {
  return initializeAuth((newState) => useAppStore.setState(newState));
};

export const loginStore = async (email: string, password: string) => {
  return loginWithSupabase(email, password, (newState) => useAppStore.setState(newState));
};

export const logoutStore = async () => {
  return logoutFromSupabase((newState) => useAppStore.setState(newState));
};
