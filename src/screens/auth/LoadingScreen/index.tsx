import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Image as RNImage, ImageStyle, Platform, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PartialLogo3, GradientSplash7, GradientSplash8, GradientSplash9 } from '@/assets/auth';
import { AppOpenLogoAnimation, type AppOpenLogoAnimationHandle } from '@/components/ui/feedback/AppOpenLogoAnimation';
import { styles, GRADIENT_STRIP_HEIGHT, GRADIENT_STRIP_WIDTH } from './styles';
import { invalidateApiClientAuthTokenMemoryCache, storageService } from '@/services';
import { useTranslation } from '@/hooks/i18n';
import { useAnalyticsScreen } from '@/analytics';
import { STORE_URL_CONFIG } from '@/config';
import type { AppReleasePolicy } from '@/types/app/appReleasePolicy';
import { getInstalledAppVersion, resolveStoreUrlForPlatform } from '@/utils/app/appVersionPolicy';
import { ensureI18nHydrated, startI18nHydration } from '@/i18n/hydration';
import { runReturningUserBootstrap } from '@/utils/auth/returningUserBootstrap';
import { logger } from '@/utils/logger';
import { openStoreListingWithFallback } from '@/utils/url/storeListingUrl';

const AnimatedImage = Animated.createAnimatedComponent(ExpoImage);
const GRADIENT_SOURCES = [GradientSplash7, GradientSplash8, GradientSplash9];
const BOOTSTRAP_WATCHDOG_INTERVAL_MS = 8_000;
const BOOTSTRAP_WATCHDOG_MAX_RETRIES = 2;

type BootstrapMode = 'pending' | 'returning' | 'firstLaunch';

type Props = { navigation: any };

const LoadingScreen: React.FC<Props> = ({ navigation }) => {
  useAnalyticsScreen({ screenName: 'Loading', screenClass: 'LoadingScreen' });
  const { t } = useTranslation();
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const taglineOpacity = useRef(new Animated.Value(1)).current;
  const [step, setStep] = useState(0);
  const [bootstrapMode, setBootstrapMode] = useState<BootstrapMode>('pending');
  const hasNavigatedRef = useRef(false);
  const logoAnimationRef = useRef<AppOpenLogoAnimationHandle>(null);
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

    const dismissReturningUserLogo = async () => {
      try {
        await logoAnimationRef.current?.dismiss();
      } catch (error) {
        logger.error('[LoadingScreen] Falha ao encerrar animação da logo', error);
      }
    };

    const showRecommendedUpdateAlert = (releasePolicy: AppReleasePolicy) => {
      const storeUrl = resolveStoreUrlForPlatform(releasePolicy, STORE_URL_CONFIG);
      if (storeUrl.length === 0) {
        return;
      }
      Alert.alert(
        t('appUpdate.recommendedTitle'),
        t('appUpdate.recommendedBody'),
        [
          { text: t('appUpdate.later'), style: 'cancel' },
          {
            text: t('appUpdate.openStore'),
            onPress: () => {
              void openStoreListingWithFallback(storeUrl).catch((linkError) => {
                logger.error('[LoadingScreen] Falha ao abrir loja (soft update)', {
                  storeUrl,
                  cause: linkError,
                });
              });
            },
          },
        ],
        { cancelable: true },
      );
    };

    const runFirstLaunchBootstrap = async () => {
      void startI18nHydration('pt-BR');

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

      await timing(fadeAnim, 1, 300);
      if (!isScreenActive) {
        return;
      }
      await delay(300);
      if (!isScreenActive) {
        return;
      }

      const firstOffset = cumulativeOffsets[0] ?? -GRADIENT_STRIP_HEIGHT;
      await Promise.all([timing(scrollAnim, firstOffset, 1200), fadeTagToStep(1, 160, 1040)]);
      if (!isScreenActive) {
        return;
      }
      await delay(240);
      if (!isScreenActive) {
        return;
      }

      const secondOffset = cumulativeOffsets[1] ?? cumulativeOffsets[0] ?? -GRADIENT_STRIP_HEIGHT;
      await Promise.all([timing(scrollAnim, secondOffset, 1200), fadeTagToStep(2, 160, 1040)]);
      if (!isScreenActive) {
        return;
      }
      await delay(360);
      if (!isScreenActive) {
        return;
      }

      try {
        await ensureI18nHydrated({ lang: 'pt-BR', timeoutMs: 8000 });
      } catch (hydrationError) {
        logger.error('[LoadingScreen] Falha ao aguardar i18n', hydrationError);
      }

      replaceOnce('Unauthenticated');
    };

    const runReturningUserBootstrapFlow = async (storedToken: string) => {
      if (isScreenActive) {
        setBootstrapMode('returning');
      }

      try {
        const installedVersion = getInstalledAppVersion();
        const bootstrap = await runReturningUserBootstrap(storedToken, installedVersion);

        if (__DEV__) {
          logger.info('[LoadingScreen] Política de versão (release-policy)', {
            platform: Platform.OS,
            installedVersion,
            serverMustUpdate: bootstrap.serverMustUpdate,
            serverRecommendUpdate: bootstrap.serverRecommendUpdate,
            minIos: bootstrap.releasePolicy?.minVersionIos,
            minAndroid: bootstrap.releasePolicy?.minVersionAndroid,
          });
        }

        if (bootstrap.releasePolicy && bootstrap.serverMustUpdate === true) {
          logger.warn('[LoadingScreen] mustUpdate: versão instalada abaixo do mínimo do backend', {
            platform: Platform.OS,
            installedVersion,
            minIos: bootstrap.releasePolicy.minVersionIos,
            minAndroid: bootstrap.releasePolicy.minVersionAndroid,
          });
          const storeUrl = resolveStoreUrlForPlatform(bootstrap.releasePolicy, STORE_URL_CONFIG);
          await dismissReturningUserLogo();
          replaceOnce('ForcedUpdate', {
            storeUrl,
            message: bootstrap.releasePolicy.message ?? undefined,
          });
          return;
        }

        if (bootstrap.shouldAuthenticate) {
          await dismissReturningUserLogo();
          replaceOnce('Authenticated');
          if (bootstrap.releasePolicy && bootstrap.serverRecommendUpdate === true) {
            showRecommendedUpdateAlert(bootstrap.releasePolicy);
          }
          return;
        }

        if (bootstrap.hadStoredToken) {
          try {
            await storageService.removeToken();
            invalidateApiClientAuthTokenMemoryCache();
          } catch (removeError) {
            logger.error('[LoadingScreen] Falha ao limpar token invalido', removeError);
          }
        }

        await dismissReturningUserLogo();
        replaceOnce('Unauthenticated');
      } catch (error) {
        logger.error('[LoadingScreen] Falha no bootstrap de returning user', error);
        await dismissReturningUserLogo();
        replaceOnce('Unauthenticated');
      }
    };

    const run = async () => {
      let storedToken: string | null = null;
      try {
        storedToken = await storageService.getToken();
      } catch (error) {
        logger.error('[LoadingScreen] Falha ao ler sessão local para o loading inicial', error);
      }

      if (storedToken) {
        await runReturningUserBootstrapFlow(storedToken);
        return;
      }

      if (isScreenActive) {
        setBootstrapMode('firstLaunch');
      }
      await runFirstLaunchBootstrap();
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
    void run();

    return () => {
      isScreenActive = false;
      clearBootstrapWatchdogTimers();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (bootstrapMode !== 'firstLaunch') {
    return (
      <View style={styles.container}>
        <AppOpenLogoAnimation ref={logoAnimationRef} />
      </View>
    );
  }

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
