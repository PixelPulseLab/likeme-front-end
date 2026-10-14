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
  });

  it('deduz jitsi_embed para URL Jitsi quando joinMode ausente', () => {
    expect(effectiveJoinMode({ ...base, externalUrl: 'https://meet.jit.si/LikeMeLiveTest' })).toBe('jitsi_embed');
  });

  it('deduz external_browser para URL de join Zoom quando joinMode ausente', () => {
    expect(effectiveJoinMode({ ...base })).toBe('external_browser');
  });

  it('normaliza joinMode legado zoom_sdk para external_browser', () => {
    expect(effectiveJoinMode({ ...base, joinMode: 'zoom_sdk' })).toBe('external_browser');
  });

  it('deduz external_browser quando joinMode ausente e URL não é Zoom join', () => {
    expect(effectiveJoinMode({ ...base, externalUrl: 'https://example.com/x' })).toBe('external_browser');
  });
});
