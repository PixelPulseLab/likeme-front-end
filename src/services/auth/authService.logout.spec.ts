import AuthService from './authService';
import storageService from './storageService';
import notificationService from '@/services/notification/notificationService';
import { clearAdvertisersListCache } from '@/services/advertiser/advertisersListCache';
import { clearSuggestedProductsCache } from '@/services/product/suggestedProductsCache';
import { clearPublicUserCache } from '@/services/user/publicUserCache';
import { invalidateApiClientAuthTokenMemoryCache } from '@/services/infrastructure/apiClient';
import { clearPendingDeepLinkNavigation } from '@/utils/navigation/pendingDeepLinkNavigation';
import { clearPendingPushNavigation } from '@/utils/navigation/pendingPushNavigation';
import { fetchWithTimeout } from '@/utils/network/fetchWithTimeout';

jest.mock('expo-auth-session', () => ({}));

jest.mock('@/config', () => ({
  AUTH0_CONFIG: {
    domain: 'auth.example.com',
    clientId: 'client-id',
    audience: 'api',
  },
  AUTH_CONFIG: {
    useAuthProxy: false,
    scheme: 'likeme',
    redirectPath: 'auth',
  },
  getApiUrl: (path: string) => `https://api.example.com${path}`,
}));

jest.mock('@/constants', () => ({
  AUTH_BOOTSTRAP_HTTP_TIMEOUT_MS: 1000,
  AUTH_LOGOUT_AND_POLICY_HTTP_TIMEOUT_MS: 1000,
}));

jest.mock('./setOnboardingStep', () => ({
  setOnboardingStep: jest.fn(),
}));

jest.mock('./storageService', () => ({
  __esModule: true,
  default: {
    getToken: jest.fn(),
    clearAll: jest.fn(),
  },
}));

jest.mock('@/services/notification/notificationService', () => ({
  __esModule: true,
  default: {
    unregisterDevice: jest.fn(),
  },
}));

jest.mock('@/services/infrastructure/apiClient', () => ({
  invalidateApiClientAuthTokenMemoryCache: jest.fn(),
}));

jest.mock('@/services/advertiser/advertisersListCache', () => ({
  clearAdvertisersListCache: jest.fn(),
}));

jest.mock('@/services/product/suggestedProductsCache', () => ({
  clearSuggestedProductsCache: jest.fn(),
}));

jest.mock('@/services/user/publicUserCache', () => ({
  clearPublicUserCache: jest.fn(),
}));

jest.mock('@/utils/navigation/pendingDeepLinkNavigation', () => ({
  clearPendingDeepLinkNavigation: jest.fn(),
}));

jest.mock('@/utils/navigation/pendingPushNavigation', () => ({
  clearPendingPushNavigation: jest.fn(),
}));

jest.mock('@/utils/network/fetchWithTimeout', () => ({
  fetchWithTimeout: jest.fn(),
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('AuthService.logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storageService.getToken as jest.Mock).mockResolvedValue('session-token');
    (storageService.clearAll as jest.Mock).mockResolvedValue(undefined);
    (notificationService.unregisterDevice as jest.Mock).mockResolvedValue(undefined);
    (fetchWithTimeout as jest.Mock).mockResolvedValue({ ok: true });
  });

  it('limpa destinos pendentes junto com dados de sessão', async () => {
    await AuthService.logout();

    expect(storageService.clearAll).toHaveBeenCalledTimes(1);
    expect(invalidateApiClientAuthTokenMemoryCache).toHaveBeenCalledTimes(1);
    expect(clearPublicUserCache).toHaveBeenCalledTimes(1);
    expect(clearSuggestedProductsCache).toHaveBeenCalledTimes(1);
    expect(clearAdvertisersListCache).toHaveBeenCalledTimes(1);
    expect(clearPendingDeepLinkNavigation).toHaveBeenCalledTimes(1);
    expect(clearPendingPushNavigation).toHaveBeenCalledTimes(1);
  });
});
