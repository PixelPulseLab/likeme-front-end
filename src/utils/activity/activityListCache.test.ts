import {
  fetchActivityList,
  invalidateActivityListCache,
  readCachedActivityList,
  shouldSkipActivityListFetch,
  writeActivityListCache,
} from '@/utils/activity/activityListCache';
import activityService from '@/services/activity/activityService';

jest.mock('@/services/activity/activityService', () => ({
  __esModule: true,
  default: {
    listActivities: jest.fn(),
  },
}));

const baseActivity = {
  id: 'activity-1',
  userId: 'user-1',
  name: 'Yoga',
  type: 'event' as const,
  startDate: '2026-06-30T00:00:00.000Z',
  reminderEnabled: true,
  createdAt: '2026-06-30T00:00:00.000Z',
  updatedAt: '2026-06-30T00:00:00.000Z',
  deletedAt: null,
};

describe('activityListCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateActivityListCache();
  });

  it('deduplica requisições concorrentes', async () => {
    (activityService.listActivities as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                success: true,
                data: { activities: [baseActivity] },
              }),
            20,
          );
        }),
    );

    const [first, second] = await Promise.all([fetchActivityList('active'), fetchActivityList('active')]);

    expect(first).toEqual([baseActivity]);
    expect(second).toEqual([baseActivity]);
    expect(activityService.listActivities).toHaveBeenCalledTimes(1);
  });

  it('reutiliza cache recente para refresh silencioso', () => {
    writeActivityListCache('active', [baseActivity]);

    expect(readCachedActivityList('active')).toEqual([baseActivity]);
    expect(shouldSkipActivityListFetch('active')).toBe(true);
  });

  it('mantém cache separado por scope', () => {
    const historyActivity = { ...baseActivity, id: 'activity-history' };

    writeActivityListCache('active', [baseActivity]);
    writeActivityListCache('history', [historyActivity]);

    expect(readCachedActivityList('active')).toEqual([baseActivity]);
    expect(readCachedActivityList('history')).toEqual([historyActivity]);
  });
});
