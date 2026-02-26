import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../tests/utils';
import Login from './Login';
import userEvent from '@testing-library/user-event';
import { useAuth } from '../context/AuthContext';

// Mock the AuthContext so we can override the login function
vi.mock('../context/AuthContext', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

// Mock the LanguageContext
vi.mock('../context/LanguageContext', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useLanguage: () => ({
      language: 'en',
      t: (key: string) => key,
      toggleLanguage: vi.fn(),
    }),
  };
});

describe('Login Component', () => {
  it('renders login form properly', () => {
    vi.mocked(useAuth).mockReturnValue({ login: vi.fn(), user: null, loading: false, logout: vi.fn(), checkSession: vi.fn() });

    render(<Login />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('handles user input and submits login form', async () => {
    const mockLogin = vi.fn().mockResolvedValue({});
    vi.mocked(useAuth).mockReturnValue({ login: mockLogin, user: null, loading: false, logout: vi.fn(), checkSession: vi.fn() });

    render(<Login />);

    const user = userEvent.setup();
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');

    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');

    const button = screen.getByRole('button', { name: /login/i });
    await user.click(button);

    // It should call login via react-query mutation
    // vitest may need wait for mutation
    expect(mockLogin).toHaveBeenCalledWith('testuser@system.local', 'password123');
  });
});
