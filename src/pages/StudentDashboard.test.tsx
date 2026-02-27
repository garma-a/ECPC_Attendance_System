import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../tests/utils';
import StudentDashboard from './StudentDashboard';
import { useAppStore } from '../store';

vi.mock('../store', () => {
  return {
    useAppStore: vi.fn(),
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
    vi.mocked(useAppStore).mockImplementation((selector: any) => {
      const state = { 
        user: { id: '123', name: 'Test Student', role: 'student' } as any, 
        loading: false, 
        t: (key: string) => key 
      };
      return selector(state);
    });
    
    render(<StudentDashboard />);
    
    expect(screen.getByText('Test Student')).toBeInTheDocument();
  });
});
