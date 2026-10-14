import { effectiveJoinMode } from '@/utils/event/effectiveJoinMode';
import type { EventBannerData } from '@/types/event';

const base: Omit<EventBannerData, 'joinMode'> = {
  id: '1',
  title: 'T',
  host: 'H',
  status: 'Live Now',
  startTime: '',
  endTime: '',
  thumbnail: '',
  externalUrl: 'https://us02web.zoom.us/j/123456789',
};

describe('effectiveJoinMode', () => {
  it('usa joinMode do banner quando presente', () => {
    expect(effectiveJoinMode({ ...base, joinMode: 'external_browser' })).toBe('external_browser');
    expect(effectiveJoinMode({ ...base, joinMode: 'jitsi_embed' })).toBe('jitsi_embed');
  });

  it('normaliza joinMode legado zoom_sdk para external_browser', () => {
    expect(effectiveJoinMode({ ...base, joinMode: 'zoom_sdk' })).toBe('external_browser');
  });

  it('sem joinMode na API não infere Jitsi pela URL', () => {
    expect(effectiveJoinMode({ ...base, externalUrl: 'https://meet.jit.si/LikeMeLiveTest' })).toBe('external_browser');
  });

  it('sem joinMode e com URL cai em external_browser', () => {
    expect(effectiveJoinMode({ ...base })).toBe('external_browser');
    expect(effectiveJoinMode({ ...base, externalUrl: 'https://example.com/x' })).toBe('external_browser');
  });

  it('retorna none sem URL', () => {
    expect(effectiveJoinMode({ ...base, externalUrl: undefined })).toBe('none');
    expect(effectiveJoinMode({ ...base, externalUrl: '   ' })).toBe('none');
  });
});
