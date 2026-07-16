// app.config.js - Carrega variáveis do .env dinamicamente
const path = require('path');
const fs = require('fs');

const appVersion = require('./app.version.json');

// Função para encontrar o arquivo .env no diretório original do projeto
function findOriginalEnvFile() {
  // Prioridade 1: Variável de ambiente com caminho absoluto (definida pelo script de build)
  if (process.env.ENV_FILE_PATH && fs.existsSync(process.env.ENV_FILE_PATH)) {
    return process.env.ENV_FILE_PATH;
  }

  const possiblePaths = [
    path.resolve(__dirname, '.env'), // Diretório do app.config.js
    path.join(__dirname, '..', '.env'), // Um nível acima
    path.join(process.cwd(), '..', '.env'), // Um nível acima do cwd
  ];

  // Tenta encontrar o arquivo .env
  for (const envPath of possiblePaths) {
    const resolvedPath = path.resolve(envPath);
    if (fs.existsSync(resolvedPath)) {
      return resolvedPath;
    }
  }

  return null;
}

// Função para copiar o .env para o diretório atual (onde o build está executando)
function ensureEnvFileInCurrentDir() {
  const currentDirEnv = path.resolve(process.cwd(), '.env');

  // Se já existe no diretório atual, usa ele
  if (fs.existsSync(currentDirEnv)) {
    return currentDirEnv;
  }

  // Tenta encontrar o .env original e copia para o diretório atual
  const originalEnvPath = findOriginalEnvFile();
  if (originalEnvPath && originalEnvPath !== currentDirEnv) {
    try {
      fs.copyFileSync(originalEnvPath, currentDirEnv);
      console.log('[app.config.js] ✓ Arquivo .env copiado do diretório original para:', currentDirEnv);
      return currentDirEnv;
    } catch (error) {
      console.warn('[app.config.js] ⚠️ Erro ao copiar .env:', error.message);
      // Retorna o caminho original como fallback
      return originalEnvPath;
    }
  }

  return originalEnvPath;
}

// Durante builds locais/CI, o processo pode não herdar todas as variáveis
// do shell. Por isso, copiamos o .env para o diretório atual e carregamos dele.
// As variáveis em process.env têm prioridade, mas carregamos o .env para garantir que
// todas as variáveis estejam disponíveis.
const hasEnvVarsInProcess = Object.keys(process.env).some((key) => key.startsWith('EXPO_PUBLIC_'));

// Garante que o .env esteja no diretório atual (copia se necessário)
const envPath = ensureEnvFileInCurrentDir();
let envLoaded = false;

if (envPath) {
  // Carrega o .env explicitamente
  const result = require('dotenv').config({ path: envPath });
  if (result.error) {
    console.warn('[app.config.js] ⚠️ Erro ao carregar .env:', result.error.message);
  } else {
    console.log('[app.config.js] ✓ Arquivo .env encontrado em:', envPath);
    // Log das variáveis carregadas (apenas nomes, não valores por segurança)
    const loadedVars = Object.keys(result.parsed || {});
    if (loadedVars.length > 0) {
      console.log(`[app.config.js] ✓ ${loadedVars.length} variáveis carregadas do .env:`, loadedVars.join(', '));
      envLoaded = true;

      // Verifica se há variáveis EXPO_PUBLIC_ no arquivo
      const expoPublicVars = loadedVars.filter((key) => key.startsWith('EXPO_PUBLIC_'));
      if (expoPublicVars.length > 0) {
        console.log(`[app.config.js] ✓ ${expoPublicVars.length} variáveis EXPO_PUBLIC_ encontradas no .env`);
      } else {
        console.warn('[app.config.js] ⚠️ O .env foi carregado mas não contém variáveis EXPO_PUBLIC_');
        console.warn('[app.config.js] ⚠️ Certifique-se de que as variáveis no .env começam com EXPO_PUBLIC_');
      }
    } else {
      console.warn('[app.config.js] ⚠️ Arquivo .env encontrado mas está vazio ou não contém variáveis válidas');
      console.warn('[app.config.js] ⚠️ Verifique se o arquivo .env tem o formato correto (KEY=value)');
    }
  }
} else {
  // Fallback: tenta carregar do diretório atual (dotenv procura automaticamente)
  const result = require('dotenv').config();
  if (result.error) {
    console.warn('[app.config.js] ⚠️ Arquivo .env não encontrado em nenhum dos caminhos testados');
    if (process.env.DEBUG_ENV === 'true') {
      console.warn(
        '[app.config.js] Caminhos testados:',
        path.resolve(__dirname, '.env'),
        path.resolve(process.cwd(), '.env'),
        process.env.ENV_FILE_PATH || 'não definido',
        '.env',
      );
    }
  } else {
    const loadedVars = Object.keys(result.parsed || {});
    if (loadedVars.length > 0) {
      console.log('[app.config.js] ✓ Arquivo .env carregado do diretório atual');
      console.log(`[app.config.js] ✓ ${loadedVars.length} variáveis carregadas:`, loadedVars.join(', '));
      envLoaded = true;
    } else {
      console.warn('[app.config.js] ⚠️ dotenv não encontrou variáveis no .env');
    }
  }
}

// Log sobre variáveis em process.env (podem vir do script ou do .env carregado)
if (hasEnvVarsInProcess) {
  const processVars = Object.keys(process.env).filter((key) => key.startsWith('EXPO_PUBLIC_'));
  console.log(`[app.config.js] ✓ ${processVars.length} variáveis EXPO_PUBLIC_ disponíveis em process.env`);
}

// Verifica se as variáveis EXPO_PUBLIC_ estão disponíveis
// Elas podem vir do .env carregado acima ou do ambiente (exportadas pelo script de build)
const foundVars = Object.keys(process.env).filter((key) => key.startsWith('EXPO_PUBLIC_'));
const hasEnvVars = foundVars.length > 0;

if (hasEnvVars) {
  console.log(`[app.config.js] ✓ ${foundVars.length} variáveis EXPO_PUBLIC_ disponíveis em process.env`);
  if (process.env.DEBUG_ENV === 'true') {
    console.log(`[app.config.js] Variáveis: ${foundVars.join(', ')}`);
  }
} else {
  console.warn('[app.config.js] ⚠️ Nenhuma variável EXPO_PUBLIC_ encontrada em process.env');
  if (!envLoaded) {
    console.warn('[app.config.js] ⚠️ O arquivo .env não foi encontrado ou carregado');
    console.warn('[app.config.js] ⚠️ Verifique se o arquivo .env existe na raiz do projeto');
  } else {
    console.warn('[app.config.js] ⚠️ O .env foi carregado mas não contém variáveis EXPO_PUBLIC_ válidas');
  }
}

// Função auxiliar para obter variável de ambiente com fallback
const getEnvVar = (key, defaultValue = '') => {
  // Tenta process.env primeiro (pode vir do ambiente exportado pelo script de build ou do dotenv)
  const value = process.env[key];
  if (value) {
    // Só loga em modo verbose (não durante build para evitar poluição)
    if (process.env.DEBUG_ENV === 'true') {
      console.log(`[app.config.js] ✓ ${key}: encontrado`);
    }
    return value;
  }

  // Log apenas para variáveis críticas sem default ou com default placeholder
  if (!defaultValue || defaultValue.includes('your-') || defaultValue === '') {
    if (process.env.DEBUG_ENV === 'true') {
      console.warn(`[app.config.js] ⚠️ ${key} não encontrado em process.env, usando default`);
    }
  }

  return defaultValue;
};

const DEFAULT_BACKEND_URL = 'https://likeme-back-end-one.vercel.app/';
const DEFAULT_SHARE_BASE_URL = 'https://app.likeme.global';

function shareBaseUrl() {
  const explicitShare = getEnvVar('EXPO_PUBLIC_SHARE_BASE_URL', '').replace(/\/+$/, '');
  if (explicitShare) {
    return explicitShare;
  }
  return DEFAULT_SHARE_BASE_URL;
}

function shareUniversalLinkHost() {
  const base = shareBaseUrl();
  try {
    return new URL(base).host;
  } catch {
    return 'app.likeme.global';
  }
}

const SHARE_UNIVERSAL_LINK_HOST = shareUniversalLinkHost();

const SHARE_ANDROID_PATH_PREFIXES = ['/post', '/community', '/product', '/protocol', '/affiliate', '/provider'];

const REVOPUSH_SERVER_URL = 'https://api.revopush.org';

function revopushDeploymentKey(platform) {
  const storeBuild = process.env.EXCLUDE_EXPO_DEV_CLIENT === '1';
  const productionKey = getEnvVar(`REVOPUSH_DEPLOYMENT_KEY_${platform}_PRODUCTION`, '');
  const stagingKey = getEnvVar(`REVOPUSH_DEPLOYMENT_KEY_${platform}_STAGING`, '');
  const legacyKey = getEnvVar(`REVOPUSH_DEPLOYMENT_KEY_${platform}`, '');

  if (storeBuild) {
    return productionKey || legacyKey;
  }

  return stagingKey || legacyKey;
}

function buildRevopushPluginConfig() {
  const iosKey = revopushDeploymentKey('IOS');
  const androidKey = revopushDeploymentKey('ANDROID');

  if (!iosKey || !androidKey) {
    console.warn(
      '[app.config.js] Revopush: defina REVOPUSH_DEPLOYMENT_KEY_IOS e REVOPUSH_DEPLOYMENT_KEY_ANDROID (ou *_STAGING / *_PRODUCTION) antes do prebuild.',
    );
    return null;
  }

  return [
    '@revopush/expo-code-push-plugin',
    {
      ios: {
        CodePushDeploymentKey: iosKey,
        CodePushServerUrl: REVOPUSH_SERVER_URL,
      },
      android: {
        CodePushDeploymentKey: androidKey,
        CodePushServerUrl: REVOPUSH_SERVER_URL,
      },
    },
  ];
}

const revopushPlugin = buildRevopushPluginConfig();

module.exports = {
  expo: {
    name: 'LikeMe',
    slug: 'likeme-front-end',
    version: appVersion.version,
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    platforms: ['ios', 'android', 'web'],
    jsEngine: 'hermes',
    sdkVersion: '54.0.0',
    plugins: [
      'expo-asset',
      'expo-font',
      [
        'expo-image-picker',
        {
          photosPermission: 'Precisamos acessar suas fotos para você escolher uma imagem de perfil.',
          cameraPermission: 'Precisamos da câmera para você tirar uma foto de perfil.',
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/app/icon.png',
          resizeMode: 'contain',
          backgroundColor: '#F4F3EC',
        },
      ],
      'expo-navigation-bar',
      '@react-native-community/datetimepicker',
      [
        'expo-build-properties',
        {
          ios: { newArchEnabled: false, deploymentTarget: '15.5' },
          android: {
            newArchEnabled: false,
            minSdkVersion: 28,
            compileSdkVersion: 35,
            targetSdkVersion: 35,
          },
        },
      ],
      [
        'react-native-auth0',
        {
          domain: getEnvVar('EXPO_PUBLIC_AUTH0_DOMAIN', 'likeme.us.auth0.com'),
        },
      ],
      './plugins/withPodfileModularHeaders.js',
      './plugins/withIosIphoneOnlyDestinations.js',
      './plugins/withIosShareAssociatedDomains.js',
      '@react-native-firebase/app',
      '@react-native-firebase/messaging',
      ...(revopushPlugin ? [revopushPlugin] : []),
    ],
    scheme: 'likeme',
    icon: './assets/app/icon.png',
    androidNavigationBar: {
      visibility: 'hidden',
    },
    // Mesma base que `COLORS.BACKGROUND` no app — evita flash branco antes do JS.
    splash: {
      image: './assets/app/icon.png',
      resizeMode: 'contain',
      backgroundColor: '#F4F3EC',
    },
    android: {
      package: 'com.likeme.app',
      versionCode: appVersion.android.versionCode,
      googleServicesFile: './google-services.json',
      softwareKeyboardLayoutMode: 'resize',
      adaptiveIcon: {
        foregroundImage: './assets/app/icon.png',
        backgroundColor: '#F4F3EC',
      },
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'likeme',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          autoVerify: true,
          data: SHARE_ANDROID_PATH_PREFIXES.map((pathPrefix) => ({
            scheme: 'https',
            host: SHARE_UNIVERSAL_LINK_HOST,
            pathPrefix,
          })),
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    ios: {
      bundleIdentifier: 'app.likeme.com',
      buildNumber: String(appVersion.ios.buildNumber),
      // App é iPhone-only. No iPad, a Apple exibe em "iPhone compat mode"
      // (janela com proporção de iPhone, letterbox no iPad) — comportamento
      // esperado para apps iPhone-only, não é motivo de rejeição.
      supportsTablet: false,
      googleServicesFile: './GoogleService-Info.plist',
      infoPlist: {
        FirebaseAppDelegateProxyEnabled: true,
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ['remote-notification'],
        NSBluetoothPeripheralUsageDescription:
          'Usamos Bluetooth para áudio em chamadas de vídeo quando você usa fones compatíveis.',
        NSCameraUsageDescription:
          'Precisamos da câmera para você tirar uma foto de perfil e participar de lives com vídeo.',
        NSMicrophoneUsageDescription: 'Precisamos do microfone para você participar das lives e reuniões com áudio.',
        NSPhotoLibraryUsageDescription: 'Precisamos acessar suas fotos para você escolher uma imagem de perfil.',
        LSApplicationQueriesSchemes: ['itms-apps', 'itms'],
      },
      entitlements: {
        'aps-environment': 'production',
        'com.apple.developer.applesignin': ['Default'],
        'com.apple.developer.associated-domains': [`applinks:${SHARE_UNIVERSAL_LINK_HOST}`],
      },
    },
    owner: 'pixelpulselab',
    extra: {
      eas: {
        projectId: '53bbcaf5-ed26-4155-a37b-a0c938635855',
      },
      // Injeta variáveis de ambiente do .env no extra.env
      // Estas serão disponibilizadas via Constants.expoConfig.extra.env
      env: {
        EXPO_PUBLIC_AUTH0_DOMAIN: getEnvVar('EXPO_PUBLIC_AUTH0_DOMAIN', 'likeme.us.auth0.com'),
        EXPO_PUBLIC_AUTH0_CLIENT_ID: getEnvVar('EXPO_PUBLIC_AUTH0_CLIENT_ID', ''),
        EXPO_PUBLIC_AUTH0_AUDIENCE: getEnvVar('EXPO_PUBLIC_AUTH0_AUDIENCE', ''),
        EXPO_PUBLIC_BACKEND_URL: getEnvVar('EXPO_PUBLIC_BACKEND_URL', 'https://likeme-back-end-one.vercel.app'),
        EXPO_PUBLIC_USE_AUTH_PROXY: getEnvVar('EXPO_PUBLIC_USE_AUTH_PROXY', 'false'),
        EXPO_PUBLIC_AUTH_SCHEME: getEnvVar('EXPO_PUBLIC_AUTH_SCHEME', 'likeme'),
        EXPO_PUBLIC_AUTH_REDIRECT_PATH: getEnvVar('EXPO_PUBLIC_AUTH_REDIRECT_PATH', 'auth'),
        EXPO_PUBLIC_SUPPORT_WHATSAPP_URL: getEnvVar('EXPO_PUBLIC_SUPPORT_WHATSAPP_URL', ''),
        EXPO_PUBLIC_SUPPORT_WHATSAPP_PHONE: getEnvVar('EXPO_PUBLIC_SUPPORT_WHATSAPP_PHONE', '5511953562902'),
        EXPO_PUBLIC_SUPPORT_WHATSAPP_MESSAGE: getEnvVar(
          'EXPO_PUBLIC_SUPPORT_WHATSAPP_MESSAGE',
          'Olá! Vim pelo app e gostaria de tirar uma dúvida.',
        ),
        EXPO_PUBLIC_ACCOUNT_DELETION_WEB_URL: getEnvVar('EXPO_PUBLIC_ACCOUNT_DELETION_WEB_URL', ''),
        EXPO_PUBLIC_IOS_APP_STORE_URL: getEnvVar(
          'EXPO_PUBLIC_IOS_APP_STORE_URL',
          'https://apps.apple.com/br/app/like-me/id6757706434',
        ),
        EXPO_PUBLIC_ANDROID_PLAY_STORE_URL: getEnvVar(
          'EXPO_PUBLIC_ANDROID_PLAY_STORE_URL',
          'https://play.google.com/store/apps/details?id=com.likeme.app',
        ),
        EXPO_PUBLIC_SHARE_BASE_URL: getEnvVar('EXPO_PUBLIC_SHARE_BASE_URL', shareBaseUrl()),
        EXPO_PUBLIC_LOGGER_ON_DEVICE: getEnvVar('EXPO_PUBLIC_LOGGER_ON_DEVICE', ''),
      },
    },
  },
};
