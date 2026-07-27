import apiClient from '@/services/infrastructure/apiClient';
import activityService from '@/services/activity/activityService';

jest.mock('@/services/infrastructure/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedGet = apiClient.get as jest.Mock;

describe('activityService.getHistory', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('chama GET /api/activities/history', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      data: {
        activities: [],
        orders: [],
        subscriptionEvents: [],
      },
    });

    const response = await activityService.getHistory();

    expect(mockedGet).toHaveBeenCalledWith('/api/activities/history', undefined, true, false);
    expect(response.success).toBe(true);
    expect(response.data).toEqual({
      activities: [],
      orders: [],
      subscriptionEvents: [],
    });
  });
});
