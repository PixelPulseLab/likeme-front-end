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

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

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

  it('ignora resposta iniciada antes da invalidação do scope', async () => {
    const staleRequest = deferred<unknown>();
    const freshActivity = { ...baseActivity, id: 'activity-fresh', updatedAt: '2026-07-01T00:00:00.000Z' };
    const freshRequest = deferred<unknown>();

    (activityService.listActivities as jest.Mock)
      .mockReturnValueOnce(staleRequest.promise)
      .mockReturnValueOnce(freshRequest.promise);

    const staleFetch = fetchActivityList('active');

    invalidateActivityListCache('active');

    const freshFetch = fetchActivityList('active');
    freshRequest.resolve({
      success: true,
      data: { activities: [freshActivity] },
    });

    await expect(freshFetch).resolves.toEqual([freshActivity]);
    expect(readCachedActivityList('active')).toEqual([freshActivity]);

    staleRequest.resolve({
      success: true,
      data: { activities: [baseActivity] },
    });

    await expect(staleFetch).rejects.toThrow('Ignoring stale activity list response for active');
    expect(readCachedActivityList('active')).toEqual([freshActivity]);
  });

  it('não transforma resposta sem sucesso em lista vazia quando não há cache', async () => {
    (activityService.listActivities as jest.Mock).mockResolvedValue({
      success: false,
      data: { activities: [baseActivity] },
    });

    await expect(fetchActivityList('active')).rejects.toThrow('Activity list request failed for active');
    expect(readCachedActivityList('active')).toBeNull();
  });
});
