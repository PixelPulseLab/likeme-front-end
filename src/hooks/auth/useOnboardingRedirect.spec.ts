import { renderHook, waitFor } from '@testing-library/react-native';
import { useOnboardingRedirect } from './useOnboardingRedirect';
import type { NavWithParent } from '@/utils/navigation/rootStackNavigation';

const mockGetToken = jest.fn();
const mockGetPendingInvitationCode = jest.fn();
const mockRefreshBackendSession = jest.fn();
const mockGetCachedPostAuthRoute = jest.fn();
const mockGetCachedHasRedeemedInvitation = jest.fn();

jest.mock('@/constants', () => ({
  FORCE_START_ONBOARDING_LOCALLY: false,
}));

jest.mock('@/services/auth/applyAuthSessionResponse', () => ({
  getCachedPostAuthRoute: (...args: unknown[]) => mockGetCachedPostAuthRoute(...args),
  getCachedHasRedeemedInvitation: (...args: unknown[]) => mockGetCachedHasRedeemedInvitation(...args),
  clearCachedPostAuthRoute: jest.fn(),
}));

jest.mock('@/services/infrastructure/apiClient', () => ({
  invalidateApiClientAuthTokenMemoryCache: jest.fn(),
}));

const mockActivatePendingStoredCode = jest.fn();

jest.mock('@/services/invitation/invitationService', () => ({
  invitationService: {
    activatePendingStoredCode: (...args: unknown[]) => mockActivatePendingStoredCode(...args),
  },
}));

jest.mock('@/hooks/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/services', () => ({
  storageService: {
    getToken: (...args: unknown[]) => mockGetToken(...args),
    getPendingInvitationCode: (...args: unknown[]) => mockGetPendingInvitationCode(...args),
    clearAll: jest.fn(),
    removePendingInvitationCode: jest.fn(),
  },
  AuthService: {
    refreshBackendSessionFromStoredCredentials: (...args: unknown[]) => mockRefreshBackendSession(...args),
  },
}));

describe('useOnboardingRedirect', () => {
  const navigation = {
    reset: jest.fn(),
    getState: jest.fn(() => ({ index: 0, routes: [{ name: 'Authenticated' }] })),
  } as NavWithParent & { reset: jest.Mock; getState: jest.Mock };

  const expectResetTo = (screen: string, params?: object) => {
    expect(navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [params != null ? { name: screen, params } : { name: screen }],
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    navigation.getState.mockReturnValue({ index: 0, routes: [{ name: 'Authenticated' }] });
    mockGetToken.mockResolvedValue('session-token');
    mockGetPendingInvitationCode.mockResolvedValue(null);
    mockActivatePendingStoredCode.mockResolvedValue({ outcome: 'none' });
    mockGetCachedHasRedeemedInvitation.mockReturnValue(null);
    mockRefreshBackendSession.mockResolvedValue({
      ok: true,
      postAuthRoute: { screen: 'Home' },
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

  it('não segue Register nem onboarding quando o cache ainda traz essas telas', async () => {
    mockGetCachedPostAuthRoute.mockReturnValue({
      screen: 'InterestCategories',
      params: { userName: 'João Souza', firstName: 'João' },
    });

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expectResetTo('Home');
    });
  });

  it('cai na Home quando o sync falha sem postAuthRoute', async () => {
    mockGetCachedPostAuthRoute.mockReturnValue(null);
    mockRefreshBackendSession.mockResolvedValue({ ok: false, postAuthRoute: null });

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expectResetTo('Home');
    });
  });

  it('vai à home quando a sessão aponta para Home', async () => {
    mockGetCachedPostAuthRoute.mockReturnValue({ screen: 'Home' });
    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expect(mockRefreshBackendSession).toHaveBeenCalledWith(undefined);
      expectResetTo('Home');
    });
  });

  it('não sai do código quando a sessão não aponta para Home', async () => {
    mockGetCachedPostAuthRoute.mockReturnValue(null);
    navigation.getState.mockReturnValue({ index: 0, routes: [{ name: 'InvitationCode' }] });

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expect(mockRefreshBackendSession).toHaveBeenCalledWith(undefined);
    });
    expect(mockActivatePendingStoredCode).not.toHaveBeenCalled();
    expect(navigation.reset).not.toHaveBeenCalled();
  });

  it('não sai do código quando a sessão é Home e o convite não foi resgatado', async () => {
    mockGetCachedPostAuthRoute.mockReturnValue({ screen: 'Home' });
    mockGetCachedHasRedeemedInvitation.mockReturnValue(false);
    navigation.getState.mockReturnValue({ index: 0, routes: [{ name: 'InvitationCode' }] });

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expect(mockRefreshBackendSession).toHaveBeenCalled();
    });
    expect(navigation.reset).not.toHaveBeenCalled();
  });

  it('vai à home a partir do código quando o convite já foi resgatado', async () => {
    mockGetCachedPostAuthRoute.mockReturnValue({ screen: 'Home' });
    mockGetCachedHasRedeemedInvitation.mockReturnValue(true);
    navigation.getState.mockReturnValue({ index: 0, routes: [{ name: 'InvitationCode' }] });

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expectResetTo('Home');
    });
    expect(mockActivatePendingStoredCode).not.toHaveBeenCalled();
  });

  it('não ativa convite pendente com a sessão atual na tela de contexto', async () => {
    mockGetCachedPostAuthRoute.mockReturnValue(null);
    navigation.getState.mockReturnValue({ index: 0, routes: [{ name: 'InvitationContext' }] });

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expect(mockRefreshBackendSession).toHaveBeenCalled();
    });
    expect(mockActivatePendingStoredCode).not.toHaveBeenCalled();
    expect(navigation.reset).not.toHaveBeenCalled();
  });

  it('abre a PDP que a sessão de onboarding devolve', async () => {
    mockGetPendingInvitationCode.mockResolvedValue('7F3K9Q');
    mockGetCachedPostAuthRoute.mockReturnValue({
      screen: 'ProductDetails',
      params: { productId: 'program-1' },
    });

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expect(mockRefreshBackendSession).toHaveBeenCalledWith({ code: '7F3K9Q' });
      expect(navigation.reset).toHaveBeenCalledWith({
        index: 1,
        routes: [{ name: 'Home' }, { name: 'ProductDetails', params: { productId: 'program-1' } }],
      });
    });
  });

  it('não abre a PDP pelo programa do activate quando a sessão é Home', async () => {
    mockGetCachedPostAuthRoute.mockReturnValue({ screen: 'Home' });
    mockActivatePendingStoredCode.mockResolvedValue({
      outcome: 'linked',
      context: { program: { id: 'program-1' } },
    });

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expectResetTo('Home');
    });
  });

  it('vai à home quando a sessão traz uma rota que o app não segue', async () => {
    mockGetCachedPostAuthRoute.mockReturnValue({ screen: 'Register', params: { userName: 'Camilla' } });

    renderHook(() => useOnboardingRedirect(navigation));

    await waitFor(() => {
      expectResetTo('Home');
    });
  });
});
