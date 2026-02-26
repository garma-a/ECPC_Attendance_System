import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../tests/utils';
import ScanQR from './ScanQR';
import { useAuth } from '../context/AuthContext';

// Mock html5-qrcode
vi.mock('html5-qrcode', () => {
  return {
    Html5Qrcode: vi.fn().mockImplementation(() => ({
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn(),
    })),
  };
});

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

describe('ScanQR Component', () => {
  it('renders ScanQR properly', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: '123', name: 'Test User', role: 'student' } as any, login: vi.fn(), loading: false, logout: vi.fn(), isAuthenticated: true });
    
    render(<ScanQR />);
    
    expect(screen.getByText('scanQRCode')).toBeInTheDocument();
    expect(screen.getByText('startScanning')).toBeInTheDocument();
  });
});
