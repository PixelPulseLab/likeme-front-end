import { applyEventBannerPresentation } from '@/utils/event/applyEventBannerPresentation';
import type { EventBannerFromApi } from '@/types/event';

const apiBanner: EventBannerFromApi = {
  id: 'evt-1',
  title: 'Sessão',
  host: 'Like:Me',
  status: 'scheduled',
  startsAt: '2026-06-30T18:00:00.000Z',
  endsAt: '2026-06-30T19:00:00.000Z',
  provider: 'zoom',
  joinMode: 'none',
  variant: 'purchase',
  communityId: 'community-1',
  programProductId: 'product-1',
};

describe('applyEventBannerPresentation', () => {
  const defaultParams = {
    communityAvatarUrl: null,
    defaultThumbnailUrl: 'https://example.com/default-thumb.jpg',
  };

  it('aplica thumbnail e host da tela', () => {
    const banner = applyEventBannerPresentation({
      ...defaultParams,
      banner: apiBanner,
      communityAvatarUrl: 'https://example.com/avatar.jpg',
      communityProviderName: 'Dr. Diogo',
      hasProgramAccess: false,
    });

    expect(banner).toEqual(
      expect.objectContaining({
        thumbnail: 'https://example.com/avatar.jpg',
        host: 'Dr. Diogo',
        status: 'Scheduled',
        startTime: '2026-06-30T18:00:00.000Z',
        variant: 'purchase',
      }),
    );
  });

  it('promove variant purchase para reminder quando hasProgramAccess é forçado na tela', () => {
    const banner = applyEventBannerPresentation({
      ...defaultParams,
      banner: apiBanner,
      hasProgramAccess: true,
    });

    expect(banner?.variant).toBe('reminder');
  });

  it('promove variant purchase para live_join quando evento está ao vivo', () => {
    const liveBanner: EventBannerFromApi = {
      ...apiBanner,
      status: 'live',
      externalUrl: 'https://zoom.us/j/1',
      joinMode: 'external_browser',
      variant: 'purchase',
    };

    const banner = applyEventBannerPresentation({
      ...defaultParams,
      banner: liveBanner,
      hasProgramAccess: true,
    });

    expect(banner?.variant).toBe('live_join');
    expect(banner?.status).toBe('Live Now');
  });

  it('retorna undefined quando API não envia banner', () => {
    expect(
      applyEventBannerPresentation({
        ...defaultParams,
        banner: null,
      }),
    ).toBeUndefined();
  });
});
