import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../tests/utils';
import InstructorDashboard from './InstructorDashboard';
import { useAppStore } from '../store';

vi.mock('../store', () => {
  return {
    useAppStore: vi.fn(),
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
    vi.mocked(useAppStore).mockImplementation((selector: any) => {
      const state = { 
        user: { id: '123', name: 'Test Instructor', role: 'instructor' } as any, 
        loading: false, 
        t: (key: string) => key 
      };
      return selector(state);
    });

    render(<InstructorDashboard />);

    expect(screen.getByText('createSession')).toBeInTheDocument();
  });
});
