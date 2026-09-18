import { Alert } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useAuthLogin } from './useAuthLogin';

const mockGetToken = jest.fn();
const mockGetPendingInvitationCode = jest.fn();
const mockRemovePendingInvitationCode = jest.fn();
const mockLogin = jest.fn();
const mockValidateToken = jest.fn();
const mockActivatePendingStoredCode = jest.fn();

jest.mock('@/hooks/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/services', () => ({
  AuthService: {
    login: (...args: unknown[]) => mockLogin(...args),
    validateToken: (...args: unknown[]) => mockValidateToken(...args),
  },
  storageService: {
    getToken: (...args: unknown[]) => mockGetToken(...args),
    getPendingInvitationCode: (...args: unknown[]) => mockGetPendingInvitationCode(...args),
    removePendingInvitationCode: (...args: unknown[]) => mockRemovePendingInvitationCode(...args),
  },
}));

jest.mock('@/services/invitation/invitationService', () => ({
  invitationService: {
    activatePendingStoredCode: (...args: unknown[]) => mockActivatePendingStoredCode(...args),
  },
}));

describe('useAuthLogin', () => {
  const navigation = { reset: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockGetToken.mockResolvedValue(null);
    mockGetPendingInvitationCode.mockResolvedValue(null);
    mockRemovePendingInvitationCode.mockResolvedValue(undefined);
    mockLogin.mockResolvedValue({ accessToken: 'auth0' });
    mockValidateToken.mockResolvedValue(undefined);
    mockActivatePendingStoredCode.mockResolvedValue({ outcome: 'none' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('abre o Auth0 quando não há sessão', async () => {
    const { result } = renderHook(() => useAuthLogin(navigation));

    await act(async () => {
      await result.current.handleLogin();
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
      expect(mockValidateToken).toHaveBeenCalled();
      expect(mockActivatePendingStoredCode).toHaveBeenCalled();
    });
  });

  it('não reabre o Auth0 quando já há sessão e não há convite pendente', async () => {
    mockGetToken.mockResolvedValue('session-token');

    const { result } = renderHook(() => useAuthLogin(navigation));

    await act(async () => {
      await result.current.handleLogin();
    });

    await waitFor(() => {
      expect(mockActivatePendingStoredCode).toHaveBeenCalled();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('abre o Auth0 de novo quando há convite pendente mesmo com JWT local', async () => {
    mockGetToken.mockResolvedValue('session-token-a');
    mockGetPendingInvitationCode.mockResolvedValue('7F3K9Q');
    mockActivatePendingStoredCode.mockResolvedValue({ outcome: 'linked' });

    const { result } = renderHook(() => useAuthLogin(navigation));

    await act(async () => {
      await result.current.handleLogin();
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
      expect(mockValidateToken).toHaveBeenCalled();
      expect(mockActivatePendingStoredCode).toHaveBeenCalled();
    });
  });

  it('descarta o convite pendente e não reabre o Auth0 no login sem convite', async () => {
    mockGetToken.mockResolvedValue('session-token');
    mockGetPendingInvitationCode.mockImplementation(async () =>
      mockRemovePendingInvitationCode.mock.calls.length > 0 ? null : '7F3K9Q',
    );

    const { result } = renderHook(() => useAuthLogin(navigation));

    await act(async () => {
      await result.current.handleLogin({ discardPendingInvitation: true });
    });

    await waitFor(() => {
      expect(mockRemovePendingInvitationCode).toHaveBeenCalled();
      expect(mockActivatePendingStoredCode).toHaveBeenCalled();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
