import type { AppReleasePolicy } from '@/types/app/appReleasePolicy';
import type { Product } from '@/types/product';
import type { ListCommunitiesApiResponse } from '@/types/community';
import { parseAppReleasePolicyPayload } from '@/services/app/appReleasePolicyService';
import { invalidateApiClientAuthTokenMemoryCache } from '@/services/infrastructure/apiClient';
import { setCachedSuggestedProducts, suggestedProductsCacheKey } from '@/services/product/suggestedProductsCache';
import {
  HOME_SUMMARY_COMMUNITIES_LIST_PARAMS,
  HOME_SUMMARY_COMMUNITIES_PAGE_SIZE,
  HOME_SUMMARY_SUGGESTED_PROGRAMS_QUERY,
} from '@/constants/home/summaryHomeData';
import {
  buildCommunitiesCacheEntryFromListResponse,
  clearCommunitiesListCache,
  communitiesListCacheKeyFromParams,
  writeCommunitiesListCache,
} from '@/utils/community/communitiesListCache';
import { logger } from '@/utils/logger';
import storageService from './storageService';
import { setOnboardingStep } from './setOnboardingStep';

/** Telas que o backend pode indicar em `postAuthRoute` (espelha AuthSessionPostAuthScreen). */
const AUTH_SESSION_POST_AUTH_SCREENS = new Set(['Home', 'PrivacyPolicies', 'Register', 'InterestCategories']);

export type AuthSessionPostAuthRoute = {
  screen: string;
  params?: { userName?: string; firstName?: string };
};

export type AuthSessionApplyResult = {
  ok: boolean;
  releasePolicy: AppReleasePolicy | null;
  serverMustUpdate: boolean | null;
  serverRecommendUpdate: boolean | null;
  postAuthRoute: AuthSessionPostAuthRoute | null;
};

let cachedPostAuthRoute: AuthSessionPostAuthRoute | null = null;

export function getCachedPostAuthRoute(): AuthSessionPostAuthRoute | null {
  return cachedPostAuthRoute;
}

export function clearCachedPostAuthRoute(): void {
  cachedPostAuthRoute = null;
}

function readSessionPayload(envelope: unknown): Record<string, unknown> | null {
  if (envelope == null || typeof envelope !== 'object') {
    return null;
  }
  const root = envelope as Record<string, unknown>;
  const data = root.data ?? root;
  if (data == null || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }
  return data as Record<string, unknown>;
}

function readPostAuthRoute(payload: Record<string, unknown>): AuthSessionPostAuthRoute | null {
  const raw = payload.postAuthRoute;
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const route = raw as Record<string, unknown>;
  const screen = typeof route.screen === 'string' ? route.screen.trim() : '';
  if (!AUTH_SESSION_POST_AUTH_SCREENS.has(screen)) {
    return null;
  }

  const paramsRaw = route.params;
  if (paramsRaw == null) {
    return { screen };
  }
  if (typeof paramsRaw !== 'object' || Array.isArray(paramsRaw)) {
    return { screen };
  }

  const paramsObj = paramsRaw as Record<string, unknown>;
  const params: AuthSessionPostAuthRoute['params'] = {};
  if (typeof paramsObj.userName === 'string') {
    params.userName = paramsObj.userName;
  }
  if (typeof paramsObj.firstName === 'string') {
    params.firstName = paramsObj.firstName;
  }

  return Object.keys(params).length > 0 ? { screen, params } : { screen };
}

async function persistSessionToken(payload: Record<string, unknown>): Promise<boolean> {
  const candidate = payload.token ?? payload.accessToken;
  const sessionToken = typeof candidate === 'string' ? candidate : null;
  if (!sessionToken || sessionToken.length === 0) {
    return false;
  }
  await storageService.setToken(sessionToken);
  invalidateApiClientAuthTokenMemoryCache();
  return true;
}

function seedHomeSummaryCaches(payload: Record<string, unknown>): void {
  const homeSummary = payload.homeSummary;
  if (homeSummary == null || typeof homeSummary !== 'object' || Array.isArray(homeSummary)) {
    return;
  }

  const summary = homeSummary as Record<string, unknown>;
  const communitiesData = summary.communities;
  if (communitiesData != null && typeof communitiesData === 'object' && !Array.isArray(communitiesData)) {
    try {
      clearCommunitiesListCache();
      const key = communitiesListCacheKeyFromParams(
        { ...HOME_SUMMARY_COMMUNITIES_LIST_PARAMS },
        HOME_SUMMARY_COMMUNITIES_PAGE_SIZE,
      );
      const entry = buildCommunitiesCacheEntryFromListResponse(
        {
          success: true,
          data: communitiesData as ListCommunitiesApiResponse['data'],
        },
        1,
      );
      writeCommunitiesListCache(key, entry);
    } catch (error) {
      logger.warn('[applyAuthSessionResponse] Falha ao semear cache de comunidades', { cause: error });
    }
  }

  const suggestedPrograms = summary.suggestedPrograms;
  if (suggestedPrograms != null && typeof suggestedPrograms === 'object' && !Array.isArray(suggestedPrograms)) {
    const products = (suggestedPrograms as Record<string, unknown>).products;
    if (Array.isArray(products)) {
      setCachedSuggestedProducts(
        suggestedProductsCacheKey(HOME_SUMMARY_SUGGESTED_PROGRAMS_QUERY),
        products as Product[],
      );
    }
  }
}

/**
 * Aplica resposta de GET /api/auth/token ou /api/auth/session.
 * Home summary / release policy só existem em /session.
 */
export async function applyAuthSessionResponse(envelope: unknown): Promise<AuthSessionApplyResult> {
  const payload = readSessionPayload(envelope);
  if (!payload) {
    return {
      ok: false,
      releasePolicy: null,
      serverMustUpdate: null,
      serverRecommendUpdate: null,
      postAuthRoute: null,
    };
  }

  await setOnboardingStep(envelope);
  const tokenPersisted = await persistSessionToken(payload);

  cachedPostAuthRoute = readPostAuthRoute(payload);
  seedHomeSummaryCaches(payload);

  const releasePolicyParsed =
    payload.releasePolicy != null
      ? parseAppReleasePolicyPayload(payload.releasePolicy)
      : { policy: null, serverMustUpdate: null, serverRecommendUpdate: null };

  return {
    ok: tokenPersisted,
    releasePolicy: releasePolicyParsed.policy,
    serverMustUpdate: releasePolicyParsed.serverMustUpdate,
    serverRecommendUpdate: releasePolicyParsed.serverRecommendUpdate,
    postAuthRoute: cachedPostAuthRoute,
  };
}
