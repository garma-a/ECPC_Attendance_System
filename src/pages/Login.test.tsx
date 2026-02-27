import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../tests/utils';
import Login from './Login';
import userEvent from '@testing-library/user-event';
import { useAppStore, loginStore } from '../store';

vi.mock('../store', () => {
  return {
    useAppStore: vi.fn(),
    loginStore: vi.fn(),
  };
});

describe('Login Component', () => {
  it('renders login form properly', () => {
    vi.mocked(useAppStore).mockImplementation((selector: any) => {
      const state = { user: null, loading: false, t: (key: string) => key };
      return selector(state);
    });

    render(<Login />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('handles user input and submits login form', async () => {
    const mockLogin = vi.mocked(loginStore).mockResolvedValue({});
    vi.mocked(useAppStore).mockImplementation((selector: any) => {
      const state = { user: null, loading: false, t: (key: string) => key };
      return selector(state);
    });

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
