import { logger } from '@/utils/logger';

function pickStringFromRecord(record: unknown, key: string): string | undefined {
  if (!record || typeof record !== 'object') {
    return undefined;
  }
  if (!Object.prototype.hasOwnProperty.call(record, key)) {
    return undefined;
  }
  const value = (record as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : undefined;
}

function pickFromExtraEnv(extra: unknown, key: string): string | undefined {
  const env = pickStringFromRecord((extra as { env?: Record<string, unknown> })?.env ?? null, key);
  if (env !== undefined) {
    return env;
  }
  return pickStringFromRecord(extra, key);
}

export const getEnvVarFromConstants = (key: string): string | undefined => {
  try {
    const Constants = require('expo-constants').default;
    const m2 = (Constants as { manifest2?: { extra?: { expoClient?: { extra?: unknown } } } })?.manifest2;

    const extraCandidates: unknown[] = [
      Constants?.expoConfig?.extra,
      (Constants as { manifest?: { extra?: unknown } })?.manifest?.extra,
      m2?.extra?.expoClient?.extra,
      m2?.extra,
    ];

    for (const extra of extraCandidates) {
      const fromEnv = pickFromExtraEnv(extra, key);
      if (fromEnv !== undefined) {
        return fromEnv;
      }
    }
  } catch {
    // Constants indisponível em alguns ambientes
  }

  return undefined;
};

const getEnvVar = (key: string, defaultValue?: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }

  const fromConstants = getEnvVarFromConstants(key);
  if (fromConstants !== undefined) {
    return fromConstants;
  }

  if (!defaultValue || defaultValue.includes('your-')) {
    logger.warn(`[ENV] Variável ${key} não encontrada. Usando default: ${defaultValue || 'vazio'}`);
  }

  return defaultValue || '';
};

export const AUTH0_CONFIG = {
  domain: getEnvVar('EXPO_PUBLIC_AUTH0_DOMAIN', 'your-auth0-domain.auth0.com'),
  clientId: getEnvVar('EXPO_PUBLIC_AUTH0_CLIENT_ID', 'your-auth0-client-id'),
  audience: getEnvVar('EXPO_PUBLIC_AUTH0_AUDIENCE', 'your-api-identifier'),
};

const DEFAULT_BACKEND_URL = 'https://likeme-back-end-one.vercel.app/';

function normalizePublicBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export const BACKEND_CONFIG = {
  baseUrl: getEnvVar('EXPO_PUBLIC_BACKEND_URL', DEFAULT_BACKEND_URL),
  apiVersion: 'v1',
};

export const AUTH_CONFIG = {
  useAuthProxy: getEnvVar('EXPO_PUBLIC_USE_AUTH_PROXY', 'true') !== 'false',
  scheme: getEnvVar('EXPO_PUBLIC_AUTH_SCHEME', 'likeme'),
  proxyUrl: getEnvVar('EXPO_PUBLIC_AUTH_PROXY_URL'),
  projectNameForProxy: getEnvVar('EXPO_PUBLIC_AUTH_PROXY_PROJECT'),
  redirectPath: getEnvVar('EXPO_PUBLIC_AUTH_REDIRECT_PATH', 'auth'),
};

export const SUPPORT_CONFIG = {
  whatsappUrl: getEnvVar('EXPO_PUBLIC_SUPPORT_WHATSAPP_URL', ''),
  whatsappPhone: getEnvVar('EXPO_PUBLIC_SUPPORT_WHATSAPP_PHONE', '5511953562902'),
  whatsappDefaultMessage: getEnvVar(
    'EXPO_PUBLIC_SUPPORT_WHATSAPP_MESSAGE',
    'Olá! Vim pelo app e gostaria de tirar uma dúvida.',
  ),
};

/** Página web opcional (ex.: política / suporte) ligada à exclusão de conta — Apple 5.1.1(v) quando o fluxo inclui o site. */
export const ACCOUNT_CONFIG = {
  deletionWebUrl: getEnvVar('EXPO_PUBLIC_ACCOUNT_DELETION_WEB_URL', '').trim(),
};

const DEFAULT_IOS_APP_STORE_URL = 'https://apps.apple.com/br/app/like-me/id6757706434';
const DEFAULT_ANDROID_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.likeme.app';

/** URLs das lojas quando o backend não envia `storeUrlIos` / `storeUrlAndroid` (fallback local). */
export const STORE_URL_CONFIG = {
  ios: getEnvVar('EXPO_PUBLIC_IOS_APP_STORE_URL', DEFAULT_IOS_APP_STORE_URL).trim(),
  android: getEnvVar('EXPO_PUBLIC_ANDROID_PLAY_STORE_URL', DEFAULT_ANDROID_PLAY_STORE_URL).trim(),
};

/** Host base dos Universal/App Links (links compartilháveis). */
const DEFAULT_SHARE_BASE_URL = 'https://app.likeme.global';

export const SHARE_CONFIG = {
  baseUrl: normalizePublicBaseUrl(getEnvVar('EXPO_PUBLIC_SHARE_BASE_URL', '') || DEFAULT_SHARE_BASE_URL),
};

export const getApiUrl = (endpoint: string) => {
  const base = (BACKEND_CONFIG.baseUrl || '').replace(/\/+$/, '');
  if (endpoint.startsWith('/api')) {
    return `${base}${endpoint}`;
  }
  return `${base}/api/${BACKEND_CONFIG.apiVersion}${endpoint}`;
};
