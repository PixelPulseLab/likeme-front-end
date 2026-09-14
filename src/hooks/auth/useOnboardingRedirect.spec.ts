import { renderHook, waitFor } from '@testing-library/react-native';
import { useOnboardingRedirect } from './useOnboardingRedirect';

const mockGetToken = jest.fn();
const mockGetWelcomeScreenAccessedAt = jest.fn();
const mockSetWelcomeScreenAccessedAt = jest.fn();
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

const mockActivatePendingStoredCode = jest.fn();
const mockInvitationHomeRoute = jest.fn(async (screen: string, params?: object) => ({
  screen,
  params,
}));

jest.mock('@/services/invitation/invitationService', () => ({
  invitationService: {
    activatePendingStoredCode: (...args: unknown[]) => mockActivatePendingStoredCode(...args),
  },
  invitationHomeRoute: (screen: string, params?: object) => mockInvitationHomeRoute(screen, params),
}));

jest.mock('@/hooks/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/services', () => ({
  storageService: {
    getToken: (...args: unknown[]) => mockGetToken(...args),
    getWelcomeScreenAccessedAt: (...args: unknown[]) => mockGetWelcomeScreenAccessedAt(...args),
    setWelcomeScreenAccessedAt: (...args: unknown[]) => mockSetWelcomeScreenAccessedAt(...args),
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
  const navigation = { reset: jest.fn() };

  const expectResetTo = (screen: string, params?: object) => {
    expect(navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [params != null ? { name: screen, params } : { name: screen }],
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue('session-token');
    mockGetWelcomeScreenAccessedAt.mockResolvedValue('2026-01-01T00:00:00.000Z');
    mockSetWelcomeScreenAccessedAt.mockResolvedValue(undefined);
    mockGetPrivacyPolicyAcceptedAt.mockResolvedValue('2026-01-02T00:00:00.000Z');
    mockGetRegisterCompletedAt.mockResolvedValue('2026-01-03T00:00:00.000Z');
    mockGetCategorySelectedAt.mockResolvedValue('2026-01-04T00:00:00.000Z');
    mockGetUser.mockResolvedValue({ name: 'João Souza' });
    mockActivatePendingStoredCode.mockResolvedValue({ outcome: 'none' });
    mockInvitationHomeRoute.mockImplementation(async (screen: string, params?: object) => ({
      screen,
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

  it('usa postAuthRoute em cache sem chamar backend novamente', async () => {
    mockGetCachedPostAuthRoute.mockReturnValue({ screen: 'Home' });

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expect(mockRefreshBackendSession).not.toHaveBeenCalled();
      expectResetTo('Home');
    });
  });

  it('sincroniza sessão quando não há postAuthRoute em cache', async () => {
    mockGetCachedPostAuthRoute
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({ screen: 'InterestCategories', params: { userName: 'João Souza', firstName: 'João' } });

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expect(mockRefreshBackendSession).toHaveBeenCalledTimes(1);
      expectResetTo('InterestCategories', {
        userName: 'João Souza',
        firstName: 'João',
      });
    });
  });

  it('cai no destino local quando sync falha sem postAuthRoute', async () => {
    mockGetCachedPostAuthRoute.mockReturnValue(null);
    mockRefreshBackendSession.mockResolvedValue({ ok: false, postAuthRoute: null });

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expectResetTo('Home');
    });
  });

  it('redireciona para Welcome quando ainda não foi acessada localmente', async () => {
    mockGetWelcomeScreenAccessedAt.mockResolvedValue(null);

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expect(mockRefreshBackendSession).not.toHaveBeenCalled();
      expect(mockInvitationHomeRoute).toHaveBeenCalledWith('Welcome', undefined);
      expectResetTo('Welcome');
    });
    expect(mockSetWelcomeScreenAccessedAt).not.toHaveBeenCalled();
  });

  it('pula o onboarding e vai à home do convite no primeiro acesso', async () => {
    mockGetWelcomeScreenAccessedAt.mockResolvedValue(null);
    mockInvitationHomeRoute.mockResolvedValue({
      screen: 'Home',
    });

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expect(mockInvitationHomeRoute).toHaveBeenCalledWith('Welcome', undefined);
      expect(mockSetWelcomeScreenAccessedAt).toHaveBeenCalled();
      expectResetTo('Home');
    });
    expect(mockRefreshBackendSession).not.toHaveBeenCalled();
  });

  it('pula Register do postAuthRoute quando o convite abre a home', async () => {
    mockGetCachedPostAuthRoute.mockReturnValue({ screen: 'Register', params: { userName: 'Camilla' } });
    mockInvitationHomeRoute.mockResolvedValue({
      screen: 'Home',
    });

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expect(mockInvitationHomeRoute).toHaveBeenCalledWith('Register', { userName: 'Camilla' });
      expectResetTo('Home');
    });
  });

  it('mantém Home quando o convite já aponta para a home', async () => {
    mockGetCachedPostAuthRoute.mockReturnValue({ screen: 'Home' });
    mockInvitationHomeRoute.mockResolvedValue({
      screen: 'Home',
    });

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expect(mockInvitationHomeRoute).toHaveBeenCalledWith('Home', undefined);
      expectResetTo('Home');
    });
  });
});
