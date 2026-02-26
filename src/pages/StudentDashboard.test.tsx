import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../tests/utils';
import StudentDashboard from './StudentDashboard';
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

// We need to mock the API functions used by React Query
vi.mock('../services/api', () => {
  return {
    default: {
      getStudentSessionStats: vi.fn().mockResolvedValue({ attendanceCount: 5, absenceCount: 2 }),
      getWeeklyBreakdown: vi.fn().mockResolvedValue([]),
      getRecentAttendance: vi.fn().mockResolvedValue([]),
    },
  };
});

describe('StudentDashboard Component', () => {
  it('renders student dashboard properly', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: '123', name: 'Test Student', role: 'student' } as any, login: vi.fn(), loading: false, logout: vi.fn(), isAuthenticated: true });
    
    render(<StudentDashboard />);
    
    expect(screen.getByText('Test Student')).toBeInTheDocument();
  });
});
