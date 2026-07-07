import {
  fetchActivityList,
  invalidateActivityListCache,
  readCachedActivityList,
  shouldSkipActivityListFetch,
  writeActivityListCache,
} from '@/utils/activity/activityListCache';
import { activityService } from '@/services';

jest.mock('@/services', () => ({
  activityService: {
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

    const [first, second] = await Promise.all([fetchActivityList(false), fetchActivityList(false)]);

    expect(first).toEqual([baseActivity]);
    expect(second).toEqual([baseActivity]);
    expect(activityService.listActivities).toHaveBeenCalledTimes(1);
  });

  it('reutiliza cache recente para refresh silencioso', () => {
    writeActivityListCache(false, [baseActivity]);

    expect(readCachedActivityList(false)).toEqual([baseActivity]);
    expect(shouldSkipActivityListFetch(false)).toBe(true);
  });
});
