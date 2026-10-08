import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, StatusBar, StyleSheet, View } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { LIKEME_FONT_LOADER_MAP } from '@/constants/fontLoader';
import { AppThemeProvider } from '@/theme/AppThemeProvider';
import * as NavigationBar from 'expo-navigation-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { RootErrorBoundary } from './src/components/infrastructure/RootErrorBoundary';
import { COLORS, ROOT_SPLASH_FONT_LOAD_FALLBACK_MS } from './src/constants';
import { AUTH0_CONFIG } from './src/config/environment';
import { startI18nHydration } from './src/i18n/hydration';
import featureFlagService from './src/services/featureFlags/featureFlagService';
import { logger } from './src/utils/logger';
// Importar i18n antes de qualquer componente que use useTranslation
import './src/i18n';

const styles = StyleSheet.create({
  rootSurface: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
});

import { wrapAppWithRevopush } from '@/infrastructure/revopush/configureRevopush';

const App: React.FC = () => {
  const navBarHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const splashHiddenRef = useRef(false);
  const [fontsLoaded, fontError] = useFonts(LIKEME_FONT_LOADER_MAP);
  // Mesmo se as fontes nao carregarem dentro do tempo limite, libera o
  // RootNavigator para nao prender o usuario no splash indefinidamente.
  const [forceRenderApp, setForceRenderApp] = useState(false);
  const shouldRenderApp = fontsLoaded || Boolean(fontError) || forceRenderApp;

  const hideSplashOnce = useCallback(async () => {
    if (splashHiddenRef.current) {
      return;
    }
    splashHiddenRef.current = true;
    try {
      await SplashScreen.hideAsync();
    } catch {
      /* splash já oculto ou indisponível */
    }
  }, []);

  useEffect(() => {
    if (!fontsLoaded && !fontError) {
      return;
    }
    hideSplashOnce().catch(() => undefined);
  }, [fontError, fontsLoaded, hideSplashOnce]);

  const onLayoutRootView = useCallback(() => {
    if (fontsLoaded || fontError) {
      hideSplashOnce().catch(() => undefined);
    }
  }, [fontError, fontsLoaded, hideSplashOnce]);

  // Dois safety-nets para garantir que nunca fiquemos presos no splash em nenhum
  // cenário (inclusive o iPad em compat mode relatado na review da Apple):
  // 1) um timer curto que sempre tenta esconder o splash após o primeiro layout
  //    montar o JS; 2) o fallback maior caso `useFonts` não resolva.
  useEffect(() => {
    const earlyHideTimer = setTimeout(() => {
      hideSplashOnce().catch(() => undefined);
    }, 1_500);
    const fallbackTimer = setTimeout(() => {
      setForceRenderApp(true);
      hideSplashOnce().catch(() => undefined);
    }, ROOT_SPLASH_FONT_LOAD_FALLBACK_MS);
    return () => {
      clearTimeout(earlyHideTimer);
      clearTimeout(fallbackTimer);
    };
  }, [hideSplashOnce]);

  useEffect(() => {
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch((cause: unknown) => {
      logger.warn('[App] Não foi possível travar a orientação em retrato', { cause });
    });
  }, []);

  useEffect(() => {
    void startI18nHydration('pt-BR');
    void featureFlagService.initialize();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void startI18nHydration('pt-BR', { force: true });
        void featureFlagService.refresh();
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Bloco de debug do startup: so paga o custo (require de expo-constants,
    // monta strings, etc.) em DEV. Em release era 100% trabalho descartado,
    // ja que logger.debug e no-op fora de __DEV__.
    if (!__DEV__) {
      return;
    }
    try {
      logger.debug('═══════════════════════════════════════════════════════════');
      logger.debug('  DEBUG - Variáveis de Ambiente');
      logger.debug('═══════════════════════════════════════════════════════════');
      logger.debug('AUTH0_CONFIG:', {
        domain: AUTH0_CONFIG.domain,
        clientId: AUTH0_CONFIG.clientId ? `${AUTH0_CONFIG.clientId.substring(0, 10)}...` : 'NÃO ENCONTRADO',
        audience: AUTH0_CONFIG.audience ? 'ENCONTRADO' : 'NÃO ENCONTRADO',
      });
      logger.debug('');

      try {
        const Constants = require('expo-constants').default;
        if (Constants?.expoConfig) {
          logger.debug('Constants.expoConfig:', 'existe');
          logger.debug('Constants.expoConfig.extra:', Constants.expoConfig?.extra ? 'existe' : 'não existe');
          logger.debug('Constants.expoConfig.extra.env:', Constants.expoConfig?.extra?.env ? 'existe' : 'não existe');
          if (Constants.expoConfig?.extra?.env) {
            logger.debug('Variáveis em extra.env:', Object.keys(Constants.expoConfig.extra.env));
          }
        } else {
          logger.debug('Constants.expoConfig:', 'não existe (runtime pode não estar pronto)');
        }
      } catch {
        logger.debug('Constants:', 'não disponível ainda');
      }
      logger.debug('═══════════════════════════════════════════════════════════');
    } catch (error) {
      logger.warn('[App] Erro ao acessar Constants:', error);
    }
  }, []);

  useEffect(() => {
    const configureAndroidSystemUI = async () => {
      if (Platform.OS !== 'android') {
        return;
      }

      try {
        await NavigationBar.setVisibilityAsync('hidden');
      } catch (error) {
        logger.warn('[App] Falha ao ocultar barra de navegacao do Android:', error);
      }
    };

    void configureAndroidSystemUI();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void configureAndroidSystemUI();
      }
    });

    const visibilitySubscription =
      Platform.OS === 'android'
        ? NavigationBar.addVisibilityListener(({ visibility }) => {
            if (visibility !== 'visible') {
              return;
            }
            if (navBarHideTimeoutRef.current) {
              clearTimeout(navBarHideTimeoutRef.current);
            }
            navBarHideTimeoutRef.current = setTimeout(() => {
              void configureAndroidSystemUI();
            }, 300);
          })
        : null;

    return () => {
      subscription.remove();
      visibilitySubscription?.remove();
      if (navBarHideTimeoutRef.current) {
        clearTimeout(navBarHideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.rootSurface} onLayout={onLayoutRootView}>
      <SafeAreaProvider style={styles.rootSurface}>
        <AppThemeProvider>
          <StatusBar hidden={Platform.OS === 'android'} />
          {shouldRenderApp ? (
            <RootErrorBoundary>
              <RootNavigator />
            </RootErrorBoundary>
          ) : null}
        </AppThemeProvider>
      </SafeAreaProvider>
    </View>
  );
};

export default wrapAppWithRevopush(App);
