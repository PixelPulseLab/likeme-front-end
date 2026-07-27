import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Image as RNImage, ImageStyle, Platform, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PartialLogo3, GradientSplash7, GradientSplash8, GradientSplash9 } from '@/assets/auth';
import { styles, GRADIENT_STRIP_HEIGHT, GRADIENT_STRIP_WIDTH } from './styles';
import { AuthService, invalidateApiClientAuthTokenMemoryCache, storageService } from '@/services';
import { fetchAppReleasePolicy } from '@/services/app/appReleasePolicyService';
import { useTranslation } from '@/hooks/i18n';
import { useAnalyticsScreen } from '@/analytics';
import { STORE_URL_CONFIG } from '@/config';
import type { AppReleasePolicy } from '@/types/app/appReleasePolicy';
import { getInstalledAppVersion, resolveStoreUrlForPlatform } from '@/utils/app/appVersionPolicy';
import { ensureI18nHydrated, startI18nHydration } from '@/i18n/hydration';
import { logger } from '@/utils/logger';
import { openStoreListingWithFallback } from '@/utils/url/storeListingUrl';
import { isE2eAuthBypassEnabled } from '@/utils/e2e/e2eAuthBypass';

const AnimatedImage = Animated.createAnimatedComponent(ExpoImage);
const GRADIENT_SOURCES = [GradientSplash7, GradientSplash8, GradientSplash9];
const BOOTSTRAP_WATCHDOG_INTERVAL_MS = 8_000;
const BOOTSTRAP_WATCHDOG_MAX_RETRIES = 2;

type Props = { navigation: any };

const LoadingScreen: React.FC<Props> = ({ navigation }) => {
  useAnalyticsScreen({ screenName: 'Loading', screenClass: 'LoadingScreen' });
  const { t } = useTranslation();
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const taglineOpacity = useRef(new Animated.Value(1)).current;
  const [step, setStep] = useState(0);
  const hasNavigatedRef = useRef(false);
  const bootstrapWatchdogTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const navigationRef = useRef(navigation);
  navigationRef.current = navigation;

  const TAGLINES = [t('auth.taglineRhythm'), t('auth.taglineJourney'), t('auth.taglineRoutine')];

  const gradientAssets = useMemo(() => GRADIENT_SOURCES.map((source) => RNImage.resolveAssetSource(source)), []);

  const gradientHeights = useMemo(
    () =>
      gradientAssets.map((asset) => {
        if (!asset) {
          return GRADIENT_STRIP_HEIGHT;
        }
        const scale = asset.width ? GRADIENT_STRIP_WIDTH / asset.width : 1;
        const originalHeight = asset.height ?? GRADIENT_STRIP_HEIGHT;
        return originalHeight * scale;
      }),
    [gradientAssets],
  );

  const cumulativeOffsets = useMemo(() => {
    const offsets: number[] = [];
    let sum = 0;
    gradientHeights.forEach((heightValue, index) => {
      sum += heightValue;
      offsets[index] = -sum;
    });
    return offsets;
  }, [gradientHeights]);

  const totalGradientHeight = useMemo(
    () => gradientHeights.reduce((acc, heightValue) => acc + heightValue, 0),
    [gradientHeights],
  );

  useEffect(() => {
    let isScreenActive = true;

    const clearBootstrapWatchdogTimers = () => {
      bootstrapWatchdogTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      bootstrapWatchdogTimersRef.current = [];
    };

    const replaceOnce = (routeName: string, params?: Record<string, unknown>) => {
      if (!isScreenActive || hasNavigatedRef.current) {
        return;
      }

      hasNavigatedRef.current = true;
      clearBootstrapWatchdogTimers();
      const nav = navigationRef.current;
      if (params === undefined) {
        nav.replace(routeName);
        return;
      }
      nav.replace(routeName, params);
    };

    const run = async () => {
      let shouldAuthenticate = false;
      let hadStoredToken = false;
      let releasePolicy: AppReleasePolicy | null = null;
      let serverMustUpdate: boolean | null = null;
      let serverRecommendUpdate: boolean | null = null;
      const installedVersionForPolicy = getInstalledAppVersion();
      const releasePolicyPromise =
        Platform.OS === 'ios' || Platform.OS === 'android'
          ? fetchAppReleasePolicy(installedVersionForPolicy)
          : Promise.resolve({ policy: null, serverMustUpdate: null, serverRecommendUpdate: null });
      void startI18nHydration('pt-BR');

      // Token refresh tambem entra no bootstrap paralelo: ate aqui a gente so
      // disparava apos a release policy responder (sequencial). Disparamos em
      // paralelo e so consumimos o resultado depois da policy autorizar.
      // Atencao: hadStoredToken precisa refletir o "havia token salvo antes
      // do refresh", mesmo se o refresh em si falhar — e isso que dispara o
      // cleanup de token no fluxo de bootstrap.
      const tokenRefreshPromise: Promise<{ hadStoredToken: boolean; shouldAuthenticate: boolean }> = (async () => {
        let hadStoredTokenLocal = false;
        try {
          const token = await storageService.getToken();
          hadStoredTokenLocal = Boolean(token);
          if (!token) {
            return { hadStoredToken: false, shouldAuthenticate: false };
          }
          if (isE2eAuthBypassEnabled()) {
            return { hadStoredToken: true, shouldAuthenticate: true };
          }
          const { ok } = await AuthService.refreshBackendSessionFromStoredCredentials();
          return { hadStoredToken: true, shouldAuthenticate: ok };
        } catch (error) {
          logger.error('[LoadingScreen] Erro ao renovar token', error);
          return { hadStoredToken: hadStoredTokenLocal, shouldAuthenticate: false };
        }
      })();
      const safeSetStep = (next: number) => {
        if (isScreenActive) {
          setStep(next);
        }
      };
      const timing = (anim: Animated.Value, toValue: number, duration: number) =>
        new Promise<void>((resolve) => {
          Animated.timing(anim, { toValue, duration, useNativeDriver: true }).start(() => resolve());
        });
      const delay = (ms: number) => new Promise<void>((r) => setTimeout(() => r(), ms));
      const fadeTagToStep = (next: number, fadeOutMs = 180, fadeInMs = 900) =>
        new Promise<void>((resolve) => {
          Animated.timing(taglineOpacity, {
            toValue: 0,
            duration: fadeOutMs,
            useNativeDriver: true,
          }).start(() => {
            safeSetStep(next);
            Animated.timing(taglineOpacity, {
              toValue: 1,
              duration: fadeInMs,
              useNativeDriver: true,
            }).start(() => resolve());
          });
        });

      try {
        await timing(fadeAnim, 1, 300);
        await delay(300);

        const firstOffset = cumulativeOffsets[0] ?? -GRADIENT_STRIP_HEIGHT;

        await Promise.all([timing(scrollAnim, firstOffset, 1200), fadeTagToStep(1, 160, 1040)]);
        await delay(240);

        const secondOffset = cumulativeOffsets[1] ?? cumulativeOffsets[0] ?? -GRADIENT_STRIP_HEIGHT;

        await Promise.all([timing(scrollAnim, secondOffset, 1200), fadeTagToStep(2, 160, 1040)]);

        await delay(360);

        const policyFetch = await releasePolicyPromise;
        releasePolicy = policyFetch.policy;
        serverMustUpdate = policyFetch.serverMustUpdate;
        serverRecommendUpdate = policyFetch.serverRecommendUpdate;
        if (__DEV__) {
          logger.info('[LoadingScreen] Política de versão (release-policy)', {
            platform: Platform.OS,
            installedVersion: installedVersionForPolicy,
            serverMustUpdate,
            serverRecommendUpdate,
            minIos: releasePolicy?.minVersionIos,
            minAndroid: releasePolicy?.minVersionAndroid,
          });
        }
        if (releasePolicy && serverMustUpdate === true) {
          logger.warn('[LoadingScreen] mustUpdate: versão instalada abaixo do mínimo do backend', {
            platform: Platform.OS,
            installedVersion: installedVersionForPolicy,
            minIos: releasePolicy.minVersionIos,
            minAndroid: releasePolicy.minVersionAndroid,
          });
          const storeUrl = resolveStoreUrlForPlatform(releasePolicy, STORE_URL_CONFIG);
          replaceOnce('ForcedUpdate', {
            storeUrl,
            message: releasePolicy.message ?? undefined,
          });
          return;
        }

        const tokenResult = await tokenRefreshPromise;
        hadStoredToken = tokenResult.hadStoredToken;
        shouldAuthenticate = tokenResult.shouldAuthenticate;
      } catch (error) {
        logger.error('[LoadingScreen] Falha no fluxo inicial (animacao ou bootstrap)', error);
      }

      try {
        await ensureI18nHydrated({ lang: 'pt-BR', timeoutMs: 8000 });
      } catch (hydrationError) {
        logger.error('[LoadingScreen] Falha ao aguardar i18n', hydrationError);
      }

      if (releasePolicy && serverRecommendUpdate === true) {
        const storeUrl = resolveStoreUrlForPlatform(releasePolicy, STORE_URL_CONFIG);
        if (storeUrl.length > 0) {
          await new Promise<void>((resolve) => {
            Alert.alert(
              t('appUpdate.recommendedTitle'),
              t('appUpdate.recommendedBody'),
              [
                { text: t('appUpdate.later'), style: 'cancel', onPress: () => resolve() },
                {
                  text: t('appUpdate.openStore'),
                  onPress: () => {
                    void openStoreListingWithFallback(storeUrl).catch((linkError) => {
                      logger.error('[LoadingScreen] Falha ao abrir loja (soft update)', {
                        storeUrl,
                        cause: linkError,
                      });
                    });
                    resolve();
                  },
                },
              ],
              { cancelable: true, onDismiss: () => resolve() },
            );
          });
        }
      }

      if (shouldAuthenticate) {
        replaceOnce('Authenticated');
        return;
      }

      if (hadStoredToken) {
        try {
          await storageService.removeToken();
          invalidateApiClientAuthTokenMemoryCache();
        } catch (removeError) {
          logger.error('[LoadingScreen] Falha ao limpar token invalido', removeError);
        }
      }

      replaceOnce('Unauthenticated');
    };

    const scheduleBootstrapWatchdog = (retryAttempt: number) => {
      const watchdogTimer = setTimeout(() => {
        if (hasNavigatedRef.current) {
          return;
        }

        if (retryAttempt < BOOTSTRAP_WATCHDOG_MAX_RETRIES) {
          logger.warn(
            `[LoadingScreen] Bootstrap ainda em andamento. Retentativa ${
              retryAttempt + 1
            }/${BOOTSTRAP_WATCHDOG_MAX_RETRIES}.`,
          );
          scheduleBootstrapWatchdog(retryAttempt + 1);
          return;
        }

        logger.error('[LoadingScreen] Timeout de bootstrap inicial.');
        replaceOnce('Error', {
          errorMessage: 'Conexao com a internet necessaria para continuar.',
        });
      }, BOOTSTRAP_WATCHDOG_INTERVAL_MS);

      bootstrapWatchdogTimersRef.current.push(watchdogTimer);
    };

    scheduleBootstrapWatchdog(0);

    const timer = setTimeout(run, 300);
    return () => {
      isScreenActive = false;
      clearTimeout(timer);
      clearBootstrapWatchdogTimers();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- bootstrap só na montagem; `navigation` via ref (deps instáveis cancelavam o timer antes de `run()`)

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
        <View style={styles.gradientEffect}>
          <Animated.View
            style={[
              styles.scrollContainer,
              {
                transform: [{ translateY: scrollAnim }],
                height: totalGradientHeight || GRADIENT_STRIP_HEIGHT * GRADIENT_SOURCES.length,
              },
            ]}
          >
            {GRADIENT_SOURCES.map((source, index) => {
              const asset = RNImage.resolveAssetSource(source);
              const scale = asset.width ? GRADIENT_STRIP_WIDTH / asset.width : 1;
              const heightScaled =
                gradientHeights[index] ?? (asset.height ? asset.height * scale : GRADIENT_STRIP_HEIGHT);
              const combinedStyle: ImageStyle = {
                width: GRADIENT_STRIP_WIDTH,
                height: heightScaled,
              };
              return <AnimatedImage key={index} source={source} style={combinedStyle} contentFit='cover' />;
            })}
          </Animated.View>
        </View>

        <View style={styles.like}>
          <PartialLogo3 width='100%' height='100%' />
        </View>

        <Animated.View style={[styles.taglineContainer, { opacity: taglineOpacity }]}>
          <Text style={styles.taglineText}>{TAGLINES[step]}</Text>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default LoadingScreen;
