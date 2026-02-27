import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './index';

describe('Zustand Store', () => {
  beforeEach(() => {
    // Reset state before each test
    useAppStore.setState({
      user: null,
      isAuthenticated: false,
      loading: true,
      error: null,
      language: 'ar',
    });
  });

  it('should initialize with default values', () => {
    const state = useAppStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
    expect(state.language).toBe('ar');
  });

  describe('Auth Slice', () => {
    it('setUser should update user and isAuthenticated', () => {
      const mockUser = { id: '1', name: 'Test', username: 'testuser', role: 'student' as const };
      useAppStore.getState().setUser(mockUser);
      
      const state = useAppStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('setLoading should update loading state', () => {
      useAppStore.getState().setLoading(false);
      expect(useAppStore.getState().loading).toBe(false);
    });

    it('setError should update error state', () => {
      useAppStore.getState().setError('Authentication failed');
      expect(useAppStore.getState().error).toBe('Authentication failed');
    });
  });

  describe('Language Slice', () => {
    it('setLanguage should update language', () => {
      useAppStore.getState().setLanguage('en');
      expect(useAppStore.getState().language).toBe('en');
    });

    it('toggleLanguage should swap between ar and en', () => {
      // Default is 'ar'
      expect(useAppStore.getState().language).toBe('ar');
      
      useAppStore.getState().toggleLanguage();
      expect(useAppStore.getState().language).toBe('en');
      
      useAppStore.getState().toggleLanguage();
      expect(useAppStore.getState().language).toBe('ar');
    });

    it('t should translate basic keys', () => {
      // Arabic is default
      expect(useAppStore.getState().t('login')).toBe('تسجيل الدخول');
      
      useAppStore.getState().setLanguage('en');
      expect(useAppStore.getState().t('login')).toBe('Login');
      expect(useAppStore.getState().t('unknown_key')).toBe('unknown_key');
    });
  });
});
