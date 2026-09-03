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

import { applyAuthSessionResponse, clearCachedPostAuthRoute, getCachedPostAuthRoute } from './applyAuthSessionResponse';

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
    expect(mockSetToken).toHaveBeenCalledWith('jwt');
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
});
