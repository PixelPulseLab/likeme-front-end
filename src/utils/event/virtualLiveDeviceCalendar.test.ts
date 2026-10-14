import {
  virtualLiveCommunityDeepLink,
  virtualLiveDeviceCalendarNotes,
  virtualLiveDeviceCalendarTitle,
  virtualLiveScheduleFromBanner,
} from '@/utils/event/virtualLiveDeviceCalendar';
import type { EventBannerData } from '@/types/event';

function banner(partial: Partial<EventBannerData>): EventBannerData {
  return {
    id: 'evt-1',
    title: 'Meditação',
    host: 'Ana Silva',
    status: 'Scheduled',
    startTime: '2026-06-30T18:00:00.000Z',
    endTime: '2026-06-30T19:00:00.000Z',
    thumbnail: '',
    communityId: 'comm-1',
    ...partial,
  };
}

describe('virtualLiveScheduleFromBanner', () => {
  it('exige início e fim válidos com fim após início', () => {
    expect(virtualLiveScheduleFromBanner(banner({}))).not.toBeNull();
    expect(virtualLiveScheduleFromBanner(banner({ endTime: '' }))).toBeNull();
    expect(virtualLiveScheduleFromBanner(banner({ endTime: '2026-06-30T17:00:00.000Z' }))).toBeNull();
  });
});

describe('virtualLiveDeviceCalendarTitle', () => {
  it('inclui host no título quando disponível', () => {
    expect(virtualLiveDeviceCalendarTitle(banner({}))).toBe('Meditação — Ana Silva');
    expect(virtualLiveDeviceCalendarTitle(banner({ host: '' }))).toBe('Meditação');
  });
});

describe('virtualLiveCommunityDeepLink', () => {
  it('monta likeme://community/{id}', () => {
    expect(virtualLiveCommunityDeepLink('comm-1')).toBe('likeme://community/comm-1');
    expect(virtualLiveCommunityDeepLink('')).toBeNull();
  });
});

describe('virtualLiveDeviceCalendarNotes', () => {
  it('inclui host e deep link nas notas', () => {
    const notes = virtualLiveDeviceCalendarNotes(banner({}), 'likeme://community/comm-1');
    expect(notes).toContain('Ana Silva');
    expect(notes).toContain('likeme://community/comm-1');
  });
});
