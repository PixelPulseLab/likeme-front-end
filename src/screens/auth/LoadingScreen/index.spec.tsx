import { act, render, waitFor } from '@testing-library/react-native';
import { Animated, Image } from 'react-native';
import LoadingScreen from './index';

const mockGetToken = jest.fn();
const mockRemoveToken = jest.fn();
const mockEnsureI18nHydrated = jest.fn();
const mockHydrateI18nFromCache = jest.fn();
const mockStartI18nHydration = jest.fn();

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

jest.mock('@/utils/auth/returningUserBootstrap', () => ({
  runReturningUserBootstrap: jest.fn(),
}));

import { runReturningUserBootstrap } from '@/utils/auth/returningUserBootstrap';

const mockRunReturningUserBootstrap = runReturningUserBootstrap as jest.MockedFunction<
  typeof runReturningUserBootstrap
>;

const mockDismissReturningUserLogo = jest.fn().mockResolvedValue(undefined);

jest.mock('@/components/ui/feedback/AppOpenLogoAnimation', () => {
  const React = require('react');
  return {
    AppOpenLogoAnimation: React.forwardRef((_props: unknown, ref: React.Ref<unknown>) => {
      React.useImperativeHandle(ref, () => ({
        dismiss: () => mockDismissReturningUserLogo(),
      }));
      return null;
    }),
  };
});

jest.mock('@/services', () => ({
  storageService: {
    getToken: (...args: unknown[]) => mockGetToken(...args),
    removeToken: (...args: unknown[]) => mockRemoveToken(...args),
  },
  invalidateApiClientAuthTokenMemoryCache: jest.fn(),
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
    mockRemoveToken.mockResolvedValue(undefined);
    mockRunReturningUserBootstrap.mockResolvedValue({
      hadStoredToken: true,
      shouldAuthenticate: true,
      releasePolicy: null,
      serverMustUpdate: null,
      serverRecommendUpdate: null,
    });

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

    expect(mockRunReturningUserBootstrap).toHaveBeenCalledWith('valid-token', expect.any(String));
    expect(mockDismissReturningUserLogo).toHaveBeenCalledTimes(1);
    expect(mockRemoveToken).not.toHaveBeenCalled();
    expect(mockEnsureI18nHydrated).not.toHaveBeenCalled();
  });

  it('não espera o splash de onboarding quando já há token em cache', async () => {
    mockGetToken.mockResolvedValue('valid-token');

    const replace = jest.fn();
    render(<LoadingScreen navigation={{ replace, navigate: jest.fn() }} />);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(20);
    });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('Authenticated');
    });
    expect(mockRunReturningUserBootstrap).toHaveBeenCalledTimes(1);
  });

  it('primeiro launch permanece no splash de onboarding nos primeiros instantes', async () => {
    const replace = jest.fn();
    const view = render(<LoadingScreen navigation={{ replace, navigate: jest.fn() }} />);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(20);
    });

    expect(replace).not.toHaveBeenCalled();
    expect(mockRunReturningUserBootstrap).not.toHaveBeenCalled();
    view.unmount();
  });

  it('em sessão inválida remove token e navega para Unauthenticated', async () => {
    mockGetToken.mockResolvedValue('slow-network-token');
    mockRunReturningUserBootstrap.mockResolvedValue({
      hadStoredToken: true,
      shouldAuthenticate: false,
      releasePolicy: null,
      serverMustUpdate: null,
      serverRecommendUpdate: null,
    });

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

  it('em erro de bootstrap de returning user navega para Unauthenticated', async () => {
    mockGetToken.mockResolvedValue('some-token');
    mockRunReturningUserBootstrap.mockRejectedValue(new Error('Network request failed'));

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
  });

  it('quando a sessão expira, remove token e navega para Unauthenticated', async () => {
    mockGetToken.mockResolvedValue('expired-token');
    mockRunReturningUserBootstrap.mockResolvedValue({
      hadStoredToken: true,
      shouldAuthenticate: false,
      releasePolicy: null,
      serverMustUpdate: null,
      serverRecommendUpdate: null,
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
