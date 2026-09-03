import { renderHook, waitFor } from '@testing-library/react-native';
import { useOnboardingRedirect } from './useOnboardingRedirect';

const mockGetToken = jest.fn();
const mockGetWelcomeScreenAccessedAt = jest.fn();
const mockGetPrivacyPolicyAcceptedAt = jest.fn();
const mockGetRegisterCompletedAt = jest.fn();
const mockGetCategorySelectedAt = jest.fn();
const mockGetUser = jest.fn();
const mockRefreshBackendSession = jest.fn();
const mockGetCachedPostAuthRoute = jest.fn();

jest.mock('@/constants', () => ({
  FORCE_START_ONBOARDING_LOCALLY: false,
}));

jest.mock('@/services/auth/applyAuthSessionResponse', () => ({
  getCachedPostAuthRoute: (...args: unknown[]) => mockGetCachedPostAuthRoute(...args),
}));

jest.mock('@/services/infrastructure/apiClient', () => ({
  invalidateApiClientAuthTokenMemoryCache: jest.fn(),
}));

jest.mock('@/services', () => ({
  storageService: {
    getToken: (...args: unknown[]) => mockGetToken(...args),
    getWelcomeScreenAccessedAt: (...args: unknown[]) => mockGetWelcomeScreenAccessedAt(...args),
    getPrivacyPolicyAcceptedAt: (...args: unknown[]) => mockGetPrivacyPolicyAcceptedAt(...args),
    getRegisterCompletedAt: (...args: unknown[]) => mockGetRegisterCompletedAt(...args),
    getCategorySelectedAt: (...args: unknown[]) => mockGetCategorySelectedAt(...args),
    getUser: (...args: unknown[]) => mockGetUser(...args),
    clearAll: jest.fn(),
  },
  AuthService: {
    refreshBackendSessionFromStoredCredentials: (...args: unknown[]) => mockRefreshBackendSession(...args),
  },
}));

describe('useOnboardingRedirect', () => {
  const navigationReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue('session-token');
    mockGetWelcomeScreenAccessedAt.mockResolvedValue('2026-01-01T00:00:00.000Z');
    mockGetPrivacyPolicyAcceptedAt.mockResolvedValue('2026-01-02T00:00:00.000Z');
    mockGetRegisterCompletedAt.mockResolvedValue('2026-01-03T00:00:00.000Z');
    mockGetCategorySelectedAt.mockResolvedValue('2026-01-04T00:00:00.000Z');
    mockGetUser.mockResolvedValue({ name: 'João Souza' });
    mockRefreshBackendSession.mockResolvedValue({
      ok: true,
      postAuthRoute: { screen: 'Home' },
      releasePolicy: null,
      serverMustUpdate: null,
      serverRecommendUpdate: null,
      responseBody: {},
    });
  });

  it('usa postAuthRoute em cache sem chamar backend novamente', async () => {
    mockGetCachedPostAuthRoute.mockReturnValue({ screen: 'Home' });

    renderHook(() => useOnboardingRedirect(navigationReplace));

    await waitFor(() => {
      expect(mockRefreshBackendSession).not.toHaveBeenCalled();
      expect(navigationReplace).toHaveBeenCalledWith('Home', undefined);
    });
  });

  it('sincroniza sessão quando não há postAuthRoute em cache', async () => {
    mockGetCachedPostAuthRoute
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({ screen: 'InterestCategories', params: { userName: 'João Souza', firstName: 'João' } });

    renderHook(() => useOnboardingRedirect(navigationReplace));

    await waitFor(() => {
      expect(mockRefreshBackendSession).toHaveBeenCalledTimes(1);
      expect(navigationReplace).toHaveBeenCalledWith('InterestCategories', {
        userName: 'João Souza',
        firstName: 'João',
      });
    });
  });

  it('cai no destino local quando sync falha sem postAuthRoute', async () => {
    mockGetCachedPostAuthRoute.mockReturnValue(null);
    mockRefreshBackendSession.mockResolvedValue({ ok: false, postAuthRoute: null });

    renderHook(() => useOnboardingRedirect(navigationReplace));

    await waitFor(() => {
      expect(navigationReplace).toHaveBeenCalledWith('Home', undefined);
    });
  });

  it('redireciona para Welcome quando ainda não foi acessada localmente', async () => {
    mockGetWelcomeScreenAccessedAt.mockResolvedValue(null);

    renderHook(() => useOnboardingRedirect(navigationReplace));

    await waitFor(() => {
      expect(mockRefreshBackendSession).not.toHaveBeenCalled();
      expect(navigationReplace).toHaveBeenCalledWith('Welcome');
    });
  });
});
