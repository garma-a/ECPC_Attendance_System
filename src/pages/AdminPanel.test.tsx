import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../tests/utils';
import AdminPanel from './AdminPanel';
import { useAppStore } from '../store';

vi.mock('../store', () => {
  return {
    useAppStore: vi.fn(),
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
describe('AdminPanel Component', () => {
  it('renders admin panel properly', () => {
    vi.mocked(useAppStore).mockImplementation((selector: any) => {
      const state = { 
        user: { id: '123', name: 'Test Admin', role: 'admin' } as any, 
        loading: false, 
        t: (key: string) => key 
      };
      return selector(state);
    });
    
    render(<AdminPanel />);
    
    expect(screen.getByRole('button', { name: /users/i })).toBeInTheDocument();
  });
});
