import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { GA4_EVENTS, logEvent, ANALYTICS_PARAMS } from '@/analytics';
import { deferredShareUrlTestUtils, readDeferredShareUrlOnce } from '@/utils/share/deferredShareUrl';
import { shareDeepLinkTargetFromUrl } from '@/utils/share/shareDeepLink';

jest.mock('@/analytics', () => ({
  GA4_EVENTS: { SELECT_CONTENT: 'select_content' },
  ANALYTICS_PARAMS: {
    ACTION_NAME: 'action_name',
    ITEM_ID: 'item_id',
  },
  logEvent: jest.fn(),
}));

jest.mock('@/config/environment', () => ({
  SHARE_CONFIG: {
    baseUrl: 'https://likeme-back-end-one.vercel.app',
  },
}));

jest.mock('@/utils/share/shareDeepLink', () => ({
  shareDeepLinkTargetFromUrl: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('react-native-play-install-referrer', () => ({
  default: {
    getInstallReferrerInfo: jest.fn(),
  },
}));

jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn(),
}));

const PlayInstallReferrer = jest.requireMock('react-native-play-install-referrer').default as {
  getInstallReferrerInfo: jest.Mock;
};

const Clipboard = jest.requireMock('expo-clipboard') as {
  getStringAsync: jest.Mock;
};

const SHARE_URL = 'https://likeme-back-end-one.vercel.app/post/post-abc';

describe('deferredShareUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (shareDeepLinkTargetFromUrl as jest.Mock).mockReturnValue({ screen: 'Community' });
    Platform.OS = 'android';
    PlayInstallReferrer.getInstallReferrerInfo.mockResolvedValue({
      installReferrer: `url=${encodeURIComponent(SHARE_URL)}`,
    });
  });

  it('parseDeferredShareUrlFromInstallReferrer extrai url= do referrer Play Store', () => {
    const referrer = `url=${encodeURIComponent(SHARE_URL)}`;
    expect(deferredShareUrlTestUtils.parseDeferredShareUrlFromInstallReferrer(referrer)).toBe(SHARE_URL);
  });

  it('readDeferredShareUrlOnce retorna null quando já foi verificado', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('1');

    await expect(readDeferredShareUrlOnce()).resolves.toBeNull();
    expect(PlayInstallReferrer.getInstallReferrerInfo).not.toHaveBeenCalled();
  });

  it('readDeferredShareUrlOnce retorna URL válida e registra analytics na primeira execução Android', async () => {
    await expect(readDeferredShareUrlOnce()).resolves.toBe(SHARE_URL);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('likeme_deferred_share_referrer_checked', '1');
    expect(logEvent).toHaveBeenCalledWith(GA4_EVENTS.SELECT_CONTENT, {
      [ANALYTICS_PARAMS.ACTION_NAME]: 'deferred_deep_link_open',
      [ANALYTICS_PARAMS.ITEM_ID]: SHARE_URL,
    });
  });

  it('readDeferredShareUrlOnce rejeita URL de host desconhecido', async () => {
    PlayInstallReferrer.getInstallReferrerInfo.mockResolvedValue({
      installReferrer: `url=${encodeURIComponent('https://evil.example/post/abc')}`,
    });

    await expect(readDeferredShareUrlOnce()).resolves.toBeNull();
    expect(logEvent).not.toHaveBeenCalled();
  });

  it('readDeferredShareUrlOnce rejeita URL sem target de deep link', async () => {
    (shareDeepLinkTargetFromUrl as jest.Mock).mockReturnValue(null);

    await expect(readDeferredShareUrlOnce()).resolves.toBeNull();
    expect(logEvent).not.toHaveBeenCalled();
  });

  it('readDeferredShareUrlOnce retorna null em iOS sem URL válida no clipboard', async () => {
    Platform.OS = 'ios';
    Clipboard.getStringAsync.mockResolvedValue('');

    await expect(readDeferredShareUrlOnce()).resolves.toBeNull();
    expect(PlayInstallReferrer.getInstallReferrerInfo).not.toHaveBeenCalled();
  });

  it('readDeferredShareUrlOnce retorna URL do clipboard iOS na primeira execução', async () => {
    Platform.OS = 'ios';
    Clipboard.getStringAsync.mockResolvedValue(SHARE_URL);

    await expect(readDeferredShareUrlOnce()).resolves.toBe(SHARE_URL);

    expect(Clipboard.getStringAsync).toHaveBeenCalled();
    expect(logEvent).toHaveBeenCalledWith(GA4_EVENTS.SELECT_CONTENT, {
      [ANALYTICS_PARAMS.ACTION_NAME]: 'deferred_deep_link_open',
      [ANALYTICS_PARAMS.ITEM_ID]: SHARE_URL,
    });
  });

  it('readDeferredShareUrlOnce rejeita clipboard iOS com host desconhecido', async () => {
    Platform.OS = 'ios';
    Clipboard.getStringAsync.mockResolvedValue('https://evil.example/post/abc');

    await expect(readDeferredShareUrlOnce()).resolves.toBeNull();
    expect(logEvent).not.toHaveBeenCalled();
  });
});
