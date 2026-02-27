import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../tests/utils';
import ScanQR from './ScanQR';
import { useAppStore } from '../store';

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

vi.mock('../store', () => {
  return {
    useAppStore: vi.fn(),
  };
});

describe('ScanQR Component', () => {
  it('renders ScanQR properly', () => {
    vi.mocked(useAppStore).mockImplementation((selector: any) => {
      const state = { 
        user: { id: '123', name: 'Test User', role: 'student' } as any, 
        loading: false, 
        t: (key: string) => key,
        language: 'en'
      };
      return selector(state);
    });
    
    render(<ScanQR />);
    
    expect(screen.getByText('scanQRCode')).toBeInTheDocument();
    expect(screen.getByText('startScanning')).toBeInTheDocument();
  });
});
