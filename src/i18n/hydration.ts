import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/services';
import type { ApiResponse } from '@/types/infrastructure';
import { logger } from '@/utils/logger';
import i18n from './index';

type I18nTranslationDict = Record<string, unknown>;

export type I18nLabelsApiResponse = {
  version?: string;
  etag?: string;
  updatedAt?: string;
  translation?: I18nTranslationDict;
};

type I18nCachePayload = {
  version?: string;
  etag?: string;
  updatedAt?: string;
  translation: I18nTranslationDict;
};

const DEFAULT_LANGUAGE = 'pt-BR';
const STORAGE_KEY_PREFIX = '@likeme:i18n:translations:';
const MIN_FETCH_INTERVAL_MS = 60_000;

let hydrationPromise: Promise<void> | null = null;
let lastFetchAtMs = 0;

const buildStorageKey = (lang: string) => `${STORAGE_KEY_PREFIX}${lang}`;

const replaceTranslationBundle = (lang: string, translation: I18nTranslationDict) => {
  if (i18n.hasResourceBundle(lang, 'translation')) {
    i18n.removeResourceBundle(lang, 'translation');
  }
  i18n.addResourceBundle(lang, 'translation', translation, true, true);

  if (i18n.language === lang) {
    void i18n.changeLanguage(lang);
  }
};

const readCachedPayload = async (lang: string): Promise<I18nCachePayload | null> => {
  try {
    const raw = await AsyncStorage.getItem(buildStorageKey(lang));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<I18nCachePayload>;
    if (!parsed.translation || typeof parsed.translation !== 'object') {
      return null;
    }

    return parsed as I18nCachePayload;
  } catch (error) {
    logger.warn('[i18n] Falha ao ler traducoes do AsyncStorage:', error);
    return null;
  }
};

export const hydrateI18nFromCache = async (lang: string = DEFAULT_LANGUAGE): Promise<boolean> => {
  const cached = await readCachedPayload(lang);
  if (!cached) {
    return false;
  }

  replaceTranslationBundle(lang, cached.translation);
  return true;
};

const saveToCache = async (lang: string, payload: I18nCachePayload): Promise<void> => {
  try {
    await AsyncStorage.setItem(buildStorageKey(lang), JSON.stringify(payload));
  } catch (error) {
    logger.warn('[i18n] Falha ao salvar traducoes no AsyncStorage:', error);
  }
};

const fetchRemoteTranslationBundle = async (lang: string): Promise<I18nLabelsApiResponse | null> => {
  const response = await apiClient.get<ApiResponse<I18nLabelsApiResponse>>('/api/i18n/labels', { lang }, false);

  if (!response?.success) {
    logger.warn('[i18n] GET /api/i18n/labels retornou erro:', response?.message);
    return null;
  }

  const payload = response.data;
  if (!payload?.translation || typeof payload.translation !== 'object') {
    return null;
  }

  return payload;
};

export const startI18nHydration = (lang: string = DEFAULT_LANGUAGE, options?: { force?: boolean }): Promise<void> => {
  const force = options?.force === true;
  const now = Date.now();

  if (!force && hydrationPromise) {
    return hydrationPromise;
  }

  if (!force && now - lastFetchAtMs < MIN_FETCH_INTERVAL_MS) {
    return Promise.resolve();
  }

  lastFetchAtMs = now;

  hydrationPromise = (async () => {
    try {
      const remote = await fetchRemoteTranslationBundle(lang);
      if (remote?.translation) {
        replaceTranslationBundle(lang, remote.translation);
        await saveToCache(lang, {
          version: remote.version,
          etag: remote.etag,
          updatedAt: remote.updatedAt,
          translation: remote.translation,
        });
        return;
      }
    } catch (error) {
      logger.warn('[i18n] Falha ao buscar traducoes no backend:', error);
    }

    await hydrateI18nFromCache(lang);
  })()
    .then(() => {
      hydrationPromise = null;
    })
    .catch((error) => {
      logger.warn('[i18n] Falha ao hidratar traducoes:', error);
      hydrationPromise = null;
    });

  return hydrationPromise;
};

export const ensureI18nHydrated = async ({
  lang = DEFAULT_LANGUAGE,
  timeoutMs = 8000,
}: {
  lang?: string;
  timeoutMs?: number;
} = {}): Promise<void> => {
  const promise = startI18nHydration(lang);
  if (timeoutMs <= 0) {
    await promise;
    return;
  }

  await Promise.race([
    promise,
    new Promise<void>((resolve) => {
      setTimeout(() => resolve(), timeoutMs);
    }),
  ]);
};
