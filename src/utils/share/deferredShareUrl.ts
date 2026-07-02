import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { GA4_EVENTS, logEvent, ANALYTICS_PARAMS } from '@/analytics';
import { SHARE_CONFIG } from '@/config/environment';
import { shareDeepLinkTargetFromUrl } from '@/utils/share/shareDeepLink';
import { logger } from '@/utils/logger';

const DEFERRED_SHARE_REFERRER_CHECKED_KEY = 'likeme_deferred_share_referrer_checked';

function parseDeferredShareUrlFromInstallReferrer(referrer: string | null | undefined): string | null {
  if (!referrer?.trim()) {
    return null;
  }

  const trimmed = referrer.trim();

  try {
    const params = new URLSearchParams(trimmed);
    const urlParam = params.get('url')?.trim();
    if (urlParam) {
      return decodeURIComponent(urlParam);
    }
  } catch {
    // fall through
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return null;
}

function isShareHostUrl(url: string): boolean {
  try {
    const shareHost = new URL(SHARE_CONFIG.baseUrl).host;
    return new URL(url.trim()).host === shareHost;
  } catch {
    return false;
  }
}

async function fetchAndroidInstallReferrerString(): Promise<string | null> {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires -- módulo nativo opcional até rebuild
    const PlayInstallReferrer = require('react-native-play-install-referrer').default as {
      getInstallReferrerInfo: () => Promise<{ installReferrer?: string }>;
    };
    const info = await PlayInstallReferrer.getInstallReferrerInfo();
    return info?.installReferrer?.trim() || null;
  } catch (error) {
    logger.warn('[deferredShareUrl] Install Referrer indisponível', { cause: error });
    return null;
  }
}

async function fetchIosDeferredShareUrlFromClipboard(): Promise<string | null> {
  if (Platform.OS !== 'ios') {
    return null;
  }

  try {
    const clipboardText = (await Clipboard.getStringAsync())?.trim();
    return clipboardText || null;
  } catch (error) {
    logger.warn('[deferredShareUrl] Clipboard indisponível', { cause: error });
    return null;
  }
}

async function fetchDeferredShareUrlCandidate(): Promise<string | null> {
  if (Platform.OS === 'android') {
    const referrer = await fetchAndroidInstallReferrerString();
    return parseDeferredShareUrlFromInstallReferrer(referrer);
  }

  if (Platform.OS === 'ios') {
    return fetchIosDeferredShareUrlFromClipboard();
  }

  return null;
}

export async function readDeferredShareUrlOnce(): Promise<string | null> {
  const alreadyChecked = await AsyncStorage.getItem(DEFERRED_SHARE_REFERRER_CHECKED_KEY);
  if (alreadyChecked === '1') {
    return null;
  }

  await AsyncStorage.setItem(DEFERRED_SHARE_REFERRER_CHECKED_KEY, '1');

  const deferredUrl = await fetchDeferredShareUrlCandidate();
  if (!deferredUrl || !isShareHostUrl(deferredUrl)) {
    return null;
  }

  if (!shareDeepLinkTargetFromUrl(deferredUrl)) {
    return null;
  }

  logEvent(GA4_EVENTS.SELECT_CONTENT, {
    [ANALYTICS_PARAMS.ACTION_NAME]: 'deferred_deep_link_open',
    [ANALYTICS_PARAMS.ITEM_ID]: deferredUrl,
  });

  return deferredUrl;
}

/** Apenas para testes unitários. */
export const deferredShareUrlTestUtils = {
  parseDeferredShareUrlFromInstallReferrer,
};
