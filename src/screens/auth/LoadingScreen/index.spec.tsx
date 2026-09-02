import { act, render, waitFor } from '@testing-library/react-native';
import { Animated, Image } from 'react-native';
import LoadingScreen from './index';

const mockFetchWithTimeout = jest.fn();
const mockGetToken = jest.fn();
const mockSetToken = jest.fn();
const mockRemoveToken = jest.fn();
const mockEnsureI18nHydrated = jest.fn();
const mockHydrateI18nFromCache = jest.fn();
const mockStartI18nHydration = jest.fn();

jest.mock('@/utils/network/fetchWithTimeout', () => ({
  fetchWithTimeout: (...args: unknown[]) => mockFetchWithTimeout(...args),
}));

jest.mock('@/i18n/hydration', () => ({
  ensureI18nHydrated: (...args: unknown[]) => mockEnsureI18nHydrated(...args),
  hydrateI18nFromCache: (...args: unknown[]) => mockHydrateI18nFromCache(...args),
  startI18nHydration: (...args: unknown[]) => mockStartI18nHydration(...args),
}));

jest.mock('@/assets/auth', () => {
  const React = require('react');
  const { View } = require('react-native');
  const LogoPlaceholder = (props: any) => React.createElement(View, props);
  return {
    PartialLogo: LogoPlaceholder,
    PartialLogo3: LogoPlaceholder,
    LogoFullSvg: LogoPlaceholder,
    GradientSplash7: 1,
    GradientSplash8: 2,
    GradientSplash9: 3,
  };
});

jest.mock('@/analytics', () => ({
  useAnalyticsScreen: jest.fn(),
}));

jest.mock('@/components/ui/feedback/AppOpenLogoAnimation', () => {
  const React = require('react');
  return {
    AppOpenLogoAnimation: React.forwardRef((_props: unknown, ref: React.Ref<unknown>) => {
      React.useImperativeHandle(ref, () => ({
        dismiss: () => Promise.resolve(),
      }));
      return null;
    }),
  };
});

jest.mock('@/services', () => {
  const invalidateApiClientAuthTokenMemoryCache = jest.fn();
  return {
    storageService: {
      getToken: (...args: unknown[]) => mockGetToken(...args),
      setToken: (...args: unknown[]) => mockSetToken(...args),
      removeToken: (...args: unknown[]) => mockRemoveToken(...args),
    },
    invalidateApiClientAuthTokenMemoryCache,
    AuthService: {
      async refreshBackendSessionFromStoredCredentials() {
        const token = await mockGetToken();
        if (!token) {
          return { ok: false, responseBody: null };
        }
        const response = await mockFetchWithTimeout(
          'http://localhost/api/auth/token',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
          12_000,
        );
        if (!response.ok) {
          return { ok: false, responseBody: null };
        }
        const data = (await response.json()) as Record<string, unknown>;
        const payload = data.data ?? data;
        const sessionTokenCandidate =
          (typeof payload === 'object' &&
            payload !== null &&
            ((payload as Record<string, unknown>).token ?? (payload as Record<string, unknown>).accessToken)) ??
          data.token ??
          data.accessToken;
        const sessionToken = typeof sessionTokenCandidate === 'string' ? sessionTokenCandidate : null;
        if (sessionToken && sessionToken.length > 0) {
          await mockSetToken(sessionToken);
          invalidateApiClientAuthTokenMemoryCache();
        }
        return { ok: true, responseBody: data };
      },
    },
  };
});

jest.mock('@/config', () => ({
  getApiUrl: (path: string) => `http://localhost${path}`,
}));

describe('LoadingScreen', () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;

  beforeEach(() => {
    jest.useFakeTimers();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue(null);
    mockEnsureI18nHydrated.mockResolvedValue(undefined);
    mockHydrateI18nFromCache.mockResolvedValue(true);
    mockStartI18nHydration.mockResolvedValue(undefined);
    mockSetToken.mockResolvedValue(undefined);
    mockRemoveToken.mockResolvedValue(undefined);

    (Image.resolveAssetSource as any) = jest.fn().mockReturnValue({ width: 100, height: 200, uri: 'mock' });
    jest.spyOn(Animated, 'timing').mockImplementation((value: any, config: any) => {
      return {
        start: (cb?: any) => {
          if (value && typeof value.setValue === 'function' && config && typeof config.toValue === 'number') {
            value.setValue(config.toValue);
          }
          if (cb) cb({ finished: true });
        },
      } as any;
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    (Animated.timing as unknown as jest.Mock).mockRestore?.();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('navega para Unauthenticated quando não há token (sem login interativo na splash)', async () => {
    const replace = jest.fn();

    render(<LoadingScreen navigation={{ replace, navigate: jest.fn() }} />);
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    await waitFor(
      () => {
        expect(replace).toHaveBeenCalledWith('Unauthenticated');
      },
      { timeout: 12_000 },
    );
    expect(mockRemoveToken).not.toHaveBeenCalled();
    expect(mockHydrateI18nFromCache).not.toHaveBeenCalled();
    expect(mockEnsureI18nHydrated).toHaveBeenCalled();
  });

  it('navega para Authenticated quando o token é validado com sucesso', async () => {
    mockGetToken.mockResolvedValue('valid-token');
    mockFetchWithTimeout.mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'refreshed' }),
    });

    const replace = jest.fn();
    render(<LoadingScreen navigation={{ replace, navigate: jest.fn() }} />);
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    await waitFor(
      () => {
        expect(replace).toHaveBeenCalledWith('Authenticated');
      },
      { timeout: 12_000 },
    );

    expect(mockFetchWithTimeout).toHaveBeenCalledWith(
      'http://localhost/api/auth/token',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer valid-token' }),
      }),
      12_000,
    );
    expect(mockSetToken).toHaveBeenCalledWith('refreshed');
    expect(mockRemoveToken).not.toHaveBeenCalled();
    expect(mockHydrateI18nFromCache).toHaveBeenCalled();
    expect(mockEnsureI18nHydrated).not.toHaveBeenCalled();
  });

  it('não espera o splash de onboarding quando já há token em cache', async () => {
    mockGetToken.mockResolvedValue('valid-token');
    mockFetchWithTimeout.mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'refreshed' }),
    });

    const replace = jest.fn();
    render(<LoadingScreen navigation={{ replace, navigate: jest.fn() }} />);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(20);
    });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('Authenticated');
    });
  });

  it('primeiro launch permanece no splash de onboarding nos primeiros instantes', async () => {
    const replace = jest.fn();
    const view = render(<LoadingScreen navigation={{ replace, navigate: jest.fn() }} />);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(20);
    });

    expect(replace).not.toHaveBeenCalled();
    view.unmount();
  });

  it('em timeout da validação (AbortError), remove token e navega para Unauthenticated', async () => {
    mockGetToken.mockResolvedValue('slow-network-token');
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    mockFetchWithTimeout.mockRejectedValue(abortError);

    const replace = jest.fn();
    render(<LoadingScreen navigation={{ replace, navigate: jest.fn() }} />);
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    await waitFor(
      () => {
        expect(mockRemoveToken).toHaveBeenCalledTimes(1);
        expect(replace).toHaveBeenCalledWith('Unauthenticated');
      },
      { timeout: 12_000 },
    );
  });

  it('em erro de rede não-abort, navega para Unauthenticated', async () => {
    mockGetToken.mockResolvedValue('some-token');
    mockFetchWithTimeout.mockRejectedValue(new Error('Network request failed'));

    const replace = jest.fn();
    render(<LoadingScreen navigation={{ replace, navigate: jest.fn() }} />);
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    await waitFor(
      () => {
        expect(replace).toHaveBeenCalledWith('Unauthenticated');
      },
      { timeout: 12_000 },
    );
    expect(mockRemoveToken).toHaveBeenCalled();
  });

  it('quando a API responde não-OK, remove token e navega para Unauthenticated', async () => {
    mockGetToken.mockResolvedValue('expired-token');
    mockFetchWithTimeout.mockResolvedValue({
      ok: false,
      status: 401,
    });

    const replace = jest.fn();
    render(<LoadingScreen navigation={{ replace, navigate: jest.fn() }} />);
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    await waitFor(
      () => {
        expect(replace).toHaveBeenCalledWith('Unauthenticated');
      },
      { timeout: 12_000 },
    );
    expect(mockRemoveToken).toHaveBeenCalled();
  });

  it('aguarda retentativas do watchdog antes de exibir erro de internet', async () => {
    mockGetToken.mockImplementation(() => new Promise(() => {}));
    const replace = jest.fn();

    render(<LoadingScreen navigation={{ replace, navigate: jest.fn() }} />);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(23_999);
    });

    expect(replace).not.toHaveBeenCalled();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(1);
    });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('Error', {
        errorMessage: 'Conexao com a internet necessaria para continuar.',
      });
    });
  });
});
