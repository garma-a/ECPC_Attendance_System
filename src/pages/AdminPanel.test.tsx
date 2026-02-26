import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../tests/utils';
import AdminPanel from './AdminPanel';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

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

vi.mock('../services/api', () => {
  return {
    default: {
      getUsers: vi.fn().mockResolvedValue([]),
      getAllAttendance: vi.fn().mockResolvedValue([]),
      getSessions: vi.fn().mockResolvedValue([]),
    },
  };
});

// Recharts uses ResizeObserver which jsdom does not support natively
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('AdminPanel Component', () => {
  it('renders admin panel properly', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: '123', name: 'Test Admin', role: 'admin' } as any, login: vi.fn(), loading: false, logout: vi.fn(), isAuthenticated: true });
    
    render(<AdminPanel />);
    
    expect(screen.getByRole('button', { name: /users/i })).toBeInTheDocument();
  });
});
