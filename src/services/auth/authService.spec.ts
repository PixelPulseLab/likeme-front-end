import AuthService from './authService';
import storageService from './storageService';
import { fetchWithTimeout } from '@/utils/network/fetchWithTimeout';
import {
  invalidateActivityListCache,
  readCachedActivityList,
  writeActivityListCache,
} from '@/utils/activity/activityListCache';
import type { AuthResult } from '@/types/auth';
import type { UserActivity } from '@/types/activity';

jest.mock('@/services/notification/notificationService', () => ({
  __esModule: true,
  default: {
    unregisterDevice: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/services/infrastructure/apiClient', () => ({
  __esModule: true,
  default: {},
  invalidateApiClientAuthTokenMemoryCache: jest.fn(),
}));

jest.mock('@/services/user/publicUserCache', () => ({
  clearPublicUserCache: jest.fn(),
}));

jest.mock('@/utils/network/fetchWithTimeout', () => ({
  fetchWithTimeout: jest.fn(),
}));

const cachedActivity: UserActivity = {
  id: 'activity-from-user-a',
  userId: 'user-a',
  name: 'Consulta privada',
  type: 'event',
  startDate: '2026-07-20T00:00:00.000Z',
  startTime: '10:00',
  location: 'Meet privado',
  reminderEnabled: false,
  createdAt: '2026-07-20T00:00:00.000Z',
  updatedAt: '2026-07-20T00:00:00.000Z',
  deletedAt: null,
};

function mockJsonResponse(body: Record<string, unknown>) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: {
      get: jest.fn(() => 'application/json'),
    },
    json: jest.fn().mockResolvedValue(body),
  };
}

describe('AuthService session memory caches', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    invalidateActivityListCache();
    await storageService.clearAll();
  });

  it('limpa cache de atividades em memória no logout', async () => {
    await storageService.setToken('session-token-user-a');
    writeActivityListCache('active', [cachedActivity]);
    (fetchWithTimeout as jest.Mock).mockResolvedValueOnce({ ok: true });

    await AuthService.logout();

    expect(readCachedActivityList('active')).toBeNull();
  });

  it('limpa cache de atividades em memória ao validar login de outra conta', async () => {
    await storageService.setUser({ email: 'user-a@example.com', name: 'User A' });
    writeActivityListCache('active', [cachedActivity]);
    (fetchWithTimeout as jest.Mock).mockResolvedValueOnce(
      mockJsonResponse({
        token: 'session-token-user-b',
        data: {
          user: {
            avatar: 'https://cdn.example.com/user-b.png',
          },
          onboarding: {},
        },
      }),
    );

    const authResult: AuthResult = {
      accessToken: 'auth0-access-token',
      idToken: 'eyJhbGciOiJub25lIn0=.payload.signature',
      user: {
        email: 'user-b@example.com',
        name: 'User B',
        picture: 'https://cdn.example.com/auth0-user-b.png',
      },
    };

    await AuthService.validateToken(authResult);

    expect(readCachedActivityList('active')).toBeNull();
  });
});
