import { renderHook, waitFor } from '@testing-library/react-native';
import { useOnboardingRedirect } from './useOnboardingRedirect';
import type { NavWithParent } from '@/utils/navigation/rootStackNavigation';

const mockGetToken = jest.fn();
const mockRefreshBackendSession = jest.fn();
const mockGetCachedPostAuthRoute = jest.fn();

jest.mock('@/constants', () => ({
  FORCE_START_ONBOARDING_LOCALLY: false,
}));

jest.mock('@/services/auth/applyAuthSessionResponse', () => ({
  getCachedPostAuthRoute: (...args: unknown[]) => mockGetCachedPostAuthRoute(...args),
  clearCachedPostAuthRoute: jest.fn(),
}));

jest.mock('@/services/infrastructure/apiClient', () => ({
  invalidateApiClientAuthTokenMemoryCache: jest.fn(),
}));

const mockActivatePendingStoredCode = jest.fn();
const mockInvitationHomeRoute = jest.fn(
  async (screen?: string, params?: object): Promise<{ screen: string; params?: object }> => ({
    screen: screen ?? 'Wall',
    params,
  }),
);

jest.mock('@/services/invitation/invitationService', () => ({
  invitationService: {
    activatePendingStoredCode: (...args: unknown[]) => mockActivatePendingStoredCode(...args),
  },
  invitationHomeRoute: (screen?: string, params?: object) => mockInvitationHomeRoute(screen, params),
}));

jest.mock('@/hooks/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/services', () => ({
  storageService: {
    getToken: (...args: unknown[]) => mockGetToken(...args),
    clearAll: jest.fn(),
  },
  AuthService: {
    refreshBackendSessionFromStoredCredentials: (...args: unknown[]) => mockRefreshBackendSession(...args),
  },
}));

describe('useOnboardingRedirect', () => {
  const navigation = { reset: jest.fn() } as NavWithParent & { reset: jest.Mock };

  const expectResetTo = (screen: string, params?: object) => {
    expect(navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [params != null ? { name: screen, params } : { name: screen }],
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue('session-token');
    mockActivatePendingStoredCode.mockResolvedValue({ outcome: 'none' });
    mockInvitationHomeRoute.mockImplementation(async (screen?: string, params?: object) => ({
      screen: screen ?? 'Wall',
      params,
    }));
    mockRefreshBackendSession.mockResolvedValue({
      ok: true,
      postAuthRoute: { screen: 'Home' },
      releasePolicy: null,
      serverMustUpdate: null,
      serverRecommendUpdate: null,
      responseBody: {},
    });
  });

  it('não redireciona nem ativa convite quando não há sessão', async () => {
    mockGetToken.mockResolvedValue(null);

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expect(mockGetToken).toHaveBeenCalled();
    });
    expect(mockActivatePendingStoredCode).not.toHaveBeenCalled();
    expect(navigation.reset).not.toHaveBeenCalled();
  });

  it('após o activate sincroniza a sessão e segue o tapume', async () => {
    mockGetCachedPostAuthRoute.mockReturnValue({ screen: 'Wall' });

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expect(mockActivatePendingStoredCode).toHaveBeenCalled();
      expect(mockRefreshBackendSession).toHaveBeenCalledTimes(1);
      expect(mockInvitationHomeRoute).toHaveBeenCalledWith('Wall', undefined);
      expectResetTo('Wall');
    });
  });

  it('não segue Register nem onboarding quando o cache ainda traz essas telas', async () => {
    mockGetCachedPostAuthRoute.mockReturnValue({
      screen: 'InterestCategories',
      params: { userName: 'João Souza', firstName: 'João' },
    });

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expect(mockInvitationHomeRoute).toHaveBeenCalledWith(undefined, undefined);
      expectResetTo('Wall');
    });
  });

  it('cai no tapume quando o sync falha sem postAuthRoute', async () => {
    mockGetCachedPostAuthRoute.mockReturnValue(null);
    mockRefreshBackendSession.mockResolvedValue({ ok: false, postAuthRoute: null });

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expect(mockInvitationHomeRoute).toHaveBeenCalledWith(undefined, undefined);
      expectResetTo('Wall');
    });
  });

  it('vai à home quando a sessão aponta para Home', async () => {
    mockGetCachedPostAuthRoute.mockReturnValue({ screen: 'Home' });
    mockInvitationHomeRoute.mockResolvedValue({
      screen: 'Home',
    });

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expect(mockRefreshBackendSession).toHaveBeenCalled();
      expect(mockInvitationHomeRoute).toHaveBeenCalledWith('Home', undefined);
      expectResetTo('Home');
    });
  });

  it('vai à home quando o fallback do convite substitui rota inválida', async () => {
    mockGetCachedPostAuthRoute.mockReturnValue({ screen: 'Register', params: { userName: 'Camilla' } });
    mockInvitationHomeRoute.mockResolvedValue({
      screen: 'Home',
    });

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expect(mockInvitationHomeRoute).toHaveBeenCalledWith(undefined, undefined);
      expectResetTo('Home');
    });
  });
});
