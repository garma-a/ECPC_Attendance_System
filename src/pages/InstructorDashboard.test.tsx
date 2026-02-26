import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../tests/utils';
import InstructorDashboard from './InstructorDashboard';
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
      getSessions: vi.fn().mockResolvedValue([]),
      createSession: vi.fn().mockResolvedValue({ id: '1' }),
      getSessionAttendance: vi.fn().mockResolvedValue([]),
    },
  };
});

describe('InstructorDashboard Component', () => {
  it('renders instructor dashboard properly', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: '123', name: 'Test Instructor', role: 'instructor' } as any, login: vi.fn(), loading: false, logout: vi.fn(), isAuthenticated: true });

    render(<InstructorDashboard />);

    expect(screen.getByText('createSession')).toBeInTheDocument();
  });
});
