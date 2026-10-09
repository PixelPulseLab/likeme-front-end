const mockSetToken = jest.fn();
const mockSetRegister = jest.fn();
const mockSetObjectives = jest.fn();
const mockSetPrivacy = jest.fn();

jest.mock('./storageService', () => ({
  __esModule: true,
  default: {
    setToken: (...args: unknown[]) => mockSetToken(...args),
    setRegisterCompletedAt: (...args: unknown[]) => mockSetRegister(...args),
    setObjectivesSelectedAt: (...args: unknown[]) => mockSetObjectives(...args),
    setPrivacyPolicyAcceptedAt: (...args: unknown[]) => mockSetPrivacy(...args),
  },
}));

jest.mock('@/services/infrastructure/apiClient', () => ({
  invalidateApiClientAuthTokenMemoryCache: jest.fn(),
}));

import {
  applyAuthSessionResponse,
  clearCachedPostAuthRoute,
  getCachedHasRedeemedInvitation,
  getCachedPostAuthRoute,
} from './applyAuthSessionResponse';

describe('applyAuthSessionResponse', () => {
  beforeEach(() => {
    clearCachedPostAuthRoute();
    jest.clearAllMocks();
    mockSetToken.mockResolvedValue(undefined);
    mockSetRegister.mockResolvedValue(undefined);
    mockSetObjectives.mockResolvedValue(undefined);
    mockSetPrivacy.mockResolvedValue(undefined);
  });

  it('aceita postAuthRoute na allowlist', async () => {
    const ok = await applyAuthSessionResponse({
      data: {
        token: 'jwt',
        onboarding: {
          registerCompletedAt: '2026-01-01T00:00:00.000Z',
          objectivesSelectedAt: '2026-01-02T00:00:00.000Z',
          privacyPolicyAcceptedAt: '2026-01-03T00:00:00.000Z',
        },
        postAuthRoute: { screen: 'Home' },
      },
    });
    expect(ok.ok).toBe(true);
    expect(getCachedPostAuthRoute()).toEqual({ screen: 'Home' });
    expect(getCachedHasRedeemedInvitation()).toBeNull();
    expect(mockSetToken).toHaveBeenCalledWith('jwt');
  });

  it('guarda hasRedeemedInvitation da sessão', async () => {
    await applyAuthSessionResponse({
      data: {
        token: 'jwt',
        postAuthRoute: { screen: 'Home' },
        hasRedeemedInvitation: false,
      },
    });
    expect(getCachedHasRedeemedInvitation()).toBe(false);
  });

  it('aceita a página do produto no onboarding', async () => {
    const ok = await applyAuthSessionResponse({
      data: {
        token: 'jwt',
        postAuthRoute: { screen: 'ProductDetails', params: { productId: ' program-1 ' } },
      },
    });
    expect(ok.postAuthRoute).toEqual({
      screen: 'ProductDetails',
      params: { productId: 'program-1' },
    });
  });

  it('rejeita ProductDetails sem productId', async () => {
    const rejected = await applyAuthSessionResponse({
      data: {
        token: 'jwt',
        postAuthRoute: { screen: 'ProductDetails' },
      },
    });
    expect(rejected.postAuthRoute).toBeNull();
  });

  it('rejeita postAuthRoute Wall', async () => {
    const rejected = await applyAuthSessionResponse({
      data: {
        token: 'jwt',
        postAuthRoute: { screen: 'Wall' },
      },
    });
    expect(rejected.ok).toBe(true);
    expect(rejected.postAuthRoute).toBeNull();
    expect(getCachedPostAuthRoute()).toBeNull();
  });

  it('rejeita tela fora da allowlist', async () => {
    const bad = await applyAuthSessionResponse({
      data: {
        token: 'jwt',
        postAuthRoute: { screen: 'AdminPanel' },
      },
    });
    expect(bad.ok).toBe(true);
    expect(bad.postAuthRoute).toBeNull();
    expect(getCachedPostAuthRoute()).toBeNull();
  });

  it('não aceita Register nem onboarding em postAuthRoute', async () => {
    const bad = await applyAuthSessionResponse({
      data: {
        token: 'jwt',
        postAuthRoute: { screen: 'Register', params: { userName: 'Camilla' } },
      },
    });
    expect(bad.postAuthRoute).toBeNull();
    expect(getCachedPostAuthRoute()).toBeNull();
  });
});
