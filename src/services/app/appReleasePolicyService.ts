import { Platform } from 'react-native';
import { getApiUrl } from '@/config';
import { APP_RELEASE_POLICY_FETCH_TIMEOUT_MS } from '@/constants';
import type { AppReleasePolicy } from '@/types/app/appReleasePolicy';
import { fetchWithTimeout } from '@/utils/network/fetchWithTimeout';
import { logger } from '@/utils/logger';
import { sanitizeExternalHttpUrl } from '@/utils/url/storeListingUrl';

export type AppReleasePolicyFetchResult = {
  policy: AppReleasePolicy | null;
  serverMustUpdate: boolean | null;
  serverRecommendUpdate: boolean | null;
};

function parseForceUpdateEnabled(value: unknown): boolean {
  if (value === true) {
    return true;
  }
  if (value === false) {
    return false;
  }
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    return v === '1' || v === 'true' || v === 'yes' || v === 'on';
  }
  return Boolean(value);
}

export function parseAppReleasePolicyPayload(raw: unknown): AppReleasePolicyFetchResult {
  if (!raw || typeof raw !== 'object') {
    return { policy: null, serverMustUpdate: null, serverRecommendUpdate: null };
  }
  const root = raw as Record<string, unknown>;
  const data = (root.data ?? root) as Record<string, unknown>;
  const minVersionIos = typeof data.minVersionIos === 'string' ? data.minVersionIos : null;
  const minVersionAndroid = typeof data.minVersionAndroid === 'string' ? data.minVersionAndroid : null;
  if (!minVersionIos || !minVersionAndroid) {
    return { policy: null, serverMustUpdate: null, serverRecommendUpdate: null };
  }
  const asOptionalString = (v: unknown): string | null => {
    if (v == null) {
      return null;
    }
    if (typeof v !== 'string') {
      return null;
    }
    const t = v.trim();
    return t.length > 0 ? t : null;
  };

  const serverMustUpdate = typeof data.mustUpdate === 'boolean' ? data.mustUpdate : null;
  const serverRecommendUpdate = typeof data.recommendUpdate === 'boolean' ? data.recommendUpdate : null;

  return {
    policy: {
      forceUpdateEnabled: parseForceUpdateEnabled(data.forceUpdateEnabled),
      minVersionIos,
      minVersionAndroid,
      recommendedVersionIos: asOptionalString(data.recommendedVersionIos),
      recommendedVersionAndroid: asOptionalString(data.recommendedVersionAndroid),
      storeUrlIos: sanitizeExternalHttpUrl(typeof data.storeUrlIos === 'string' ? data.storeUrlIos : ''),
      storeUrlAndroid: sanitizeExternalHttpUrl(typeof data.storeUrlAndroid === 'string' ? data.storeUrlAndroid : ''),
      message: typeof data.message === 'string' ? data.message : null,
    },
    serverMustUpdate,
    serverRecommendUpdate,
  };
}

export async function fetchAppReleasePolicy(installedVersion: string): Promise<AppReleasePolicyFetchResult> {
  try {
    const path = '/api/app/release-policy';
    const qs = new URLSearchParams();
    const trimmed = typeof installedVersion === 'string' ? installedVersion.trim() : '';
    if (trimmed !== '') {
      qs.set('currentVersion', trimmed);
    }
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      qs.set('platform', Platform.OS);
    }
    const url = getApiUrl(qs.toString() ? `${path}?${qs.toString()}` : path);
    const response = await fetchWithTimeout(
      url,
      { method: 'GET', headers: { Accept: 'application/json' } },
      APP_RELEASE_POLICY_FETCH_TIMEOUT_MS,
    );
    if (!response.ok) {
      logger.warn('[appReleasePolicyService] HTTP não OK ao buscar política de versão', {
        status: response.status,
      });
      return { policy: null, serverMustUpdate: null, serverRecommendUpdate: null };
    }
    const json: unknown = await response.json();
    return parseAppReleasePolicyPayload(json);
  } catch (cause) {
    logger.error('[appReleasePolicyService] Falha ao buscar política de versão', { cause });
    return { policy: null, serverMustUpdate: null, serverRecommendUpdate: null };
  }
}
