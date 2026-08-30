import { BACKEND_CONFIG, getEnvVarFromConstants } from '@/config/environment';
import { E2E_PRODUCTION_BACKEND_HOSTS, E2E_STAGING_BACKEND_HOST_MARKERS } from '@/constants/e2eBackendHosts';
import { logger } from '@/utils/logger';

function readPublicEnvFlag(key: string): string {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return String(process.env[key]).trim();
  }
  return (getEnvVarFromConstants(key) ?? '').trim();
}

function readProcessEnvValue(...keys: string[]): string {
  if (typeof process === 'undefined' || !process.env) {
    return '';
  }
  for (const key of keys) {
    const value = process.env[key];
    if (value) {
      return String(value).trim();
    }
  }
  return '';
}

export function backendHostFromBaseUrl(baseUrl: string): string | null {
  const trimmed = baseUrl.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(withProtocol).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isProductionBackendHost(host: string | null): boolean {
  if (!host) {
    return false;
  }
  return (E2E_PRODUCTION_BACKEND_HOSTS as readonly string[]).includes(host);
}

export function isStagingOrPreviewBackendHost(host: string | null): boolean {
  if (!host) {
    return false;
  }
  if (isProductionBackendHost(host)) {
    return false;
  }
  if (host === 'localhost' || host === '127.0.0.1') {
    return true;
  }
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) || /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return true;
  }
  return E2E_STAGING_BACKEND_HOST_MARKERS.some((marker) => host.includes(marker));
}

function isTruthyEnvFlag(value: string): boolean {
  const normalized = value.toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

/**
 * Bypass de Auth0 só para Maestro/E2E em staging/preview.
 * Nunca ativa se o backend apontar para produção, mesmo com a flag ligada.
 */
export function isE2eAuthBypassEnabled(): boolean {
  const flag = readPublicEnvFlag('EXPO_PUBLIC_E2E_AUTH_BYPASS');
  if (!isTruthyEnvFlag(flag)) {
    return false;
  }

  const host = backendHostFromBaseUrl(BACKEND_CONFIG.baseUrl);
  if (isProductionBackendHost(host)) {
    logger.error('[e2eAuthBypass] EXPO_PUBLIC_E2E_AUTH_BYPASS=true com backend de PRODUÇÃO — bypass bloqueado', {
      host,
      baseUrl: BACKEND_CONFIG.baseUrl,
    });
    return false;
  }

  if (!isStagingOrPreviewBackendHost(host)) {
    logger.error('[e2eAuthBypass] Backend fora da allowlist staging/preview — bypass bloqueado', {
      host,
      baseUrl: BACKEND_CONFIG.baseUrl,
    });
    return false;
  }

  return true;
}

export function e2eStagingTokenFromEnv(): string {
  return readProcessEnvValue('E2E_STAGING_TOKEN');
}

export function e2eStagingEmailFromEnv(): string {
  return readProcessEnvValue('E2E_LOGIN_EMAIL');
}

export function e2eStagingNameFromEnv(): string {
  return readProcessEnvValue('E2E_LOGIN_NAME');
}
