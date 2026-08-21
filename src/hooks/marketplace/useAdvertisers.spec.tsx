import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useAdvertisers } from './useAdvertisers';
import { advertiserService } from '@/services';
import { ADVERTISER_STATUS, ADVERTISER_TYPE } from '@/constants';
import {
  ADVERTISERS_LIST_CACHE_STALE_MS,
  clearAdvertisersListCache,
  getCachedAdvertisersList,
  setCachedAdvertisersList,
} from '@/services/advertiser/advertisersListCache';
import { advertisersListCacheKey } from '@/utils/marketplace/advertisersCacheKey';

jest.mock('@/services', () => ({
  advertiserService: {
    getAdvertisers: jest.fn(),
    getAdvertiserById: jest.fn(),
  },
}));

jest.mock('@/utils/image/prefetchImageUris', () => ({
  prefetchImageUris: jest.fn(),
}));

jest.mock('@/utils/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

const rankedAdvertisers = [
  {
    id: 'adv-1',
    name: 'Profissional Um',
    status: 'active',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'adv-2',
    name: 'Profissional Dois',
    status: 'active',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'adv-3',
    name: 'Profissional Três',
    status: 'active',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

describe('useAdvertisers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAdvertisersListCache();
  });

  it('reusa o cache na remontagem sem novo fetch', async () => {
    (advertiserService.getAdvertisers as jest.Mock).mockResolvedValue({
      success: true,
      data: { advertisers: rankedAdvertisers, pagination: { page: 1, limit: 50, total: 3, totalPages: 1 } },
    });

    const first = renderHook(() =>
      useAdvertisers({
        listOptions: { page: 1, limit: 50, status: ADVERTISER_STATUS.ACTIVE, type: ADVERTISER_TYPE.PERSON },
      }),
    );
    await waitFor(() => {
      expect(first.result.current.advertisers).toHaveLength(3);
    });
    first.unmount();

    const second = renderHook(() =>
      useAdvertisers({
        listOptions: { page: 1, limit: 50, status: ADVERTISER_STATUS.ACTIVE, type: ADVERTISER_TYPE.PERSON },
      }),
    );
    expect(second.result.current.advertisers.map((advertiser) => advertiser.id)).toEqual(['adv-1', 'adv-2', 'adv-3']);
    expect(second.result.current.loading).toBe(false);
    expect(advertiserService.getAdvertisers).toHaveBeenCalledTimes(1);
  });

  it('mantém a lista anterior visível enquanto busca outra chave', async () => {
    let resolveSecond: (value: unknown) => void = () => undefined;
    const secondResponse = new Promise((resolve) => {
      resolveSecond = resolve;
    });
    (advertiserService.getAdvertisers as jest.Mock)
      .mockResolvedValueOnce({
        success: true,
        data: { advertisers: rankedAdvertisers, pagination: { page: 1, limit: 50, total: 3, totalPages: 1 } },
      })
      .mockReturnValueOnce(secondResponse);

    const { result, rerender } = renderHook(
      ({ search }: { search?: string }) =>
        useAdvertisers({
          listOptions: { page: 1, limit: 50, status: ADVERTISER_STATUS.ACTIVE, type: ADVERTISER_TYPE.PERSON, search },
        }),
      { initialProps: { search: undefined as string | undefined } },
    );

    await waitFor(() => {
      expect(result.current.advertisers.map((advertiser) => advertiser.id)).toEqual(['adv-1', 'adv-2', 'adv-3']);
    });

    rerender({ search: 'sono' });

    expect(result.current.advertisers.map((advertiser) => advertiser.id)).toEqual(['adv-1', 'adv-2', 'adv-3']);
    expect(result.current.loading).toBe(false);

    await act(async () => {
      resolveSecond({
        success: true,
        data: { advertisers: [rankedAdvertisers[1]], pagination: { page: 1, limit: 50, total: 1, totalPages: 1 } },
      });
    });

    await waitFor(() => {
      expect(result.current.advertisers.map((advertiser) => advertiser.id)).toEqual(['adv-2']);
    });
  });

  it('descarta o cache após 5 minutos', () => {
    setCachedAdvertisersList('advertisers', rankedAdvertisers as never, 0);
    expect(getCachedAdvertisersList('advertisers', ADVERTISERS_LIST_CACHE_STALE_MS - 1)).toHaveLength(3);
    expect(getCachedAdvertisersList('advertisers', ADVERTISERS_LIST_CACHE_STALE_MS)).toBeUndefined();
  });

  it('não repovoa cache quando request inflight resolve após limpeza de sessão', async () => {
    let resolveFetch: (value: unknown) => void = () => undefined;
    const pendingResponse = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    (advertiserService.getAdvertisers as jest.Mock).mockReturnValueOnce(pendingResponse);

    const { unmount } = renderHook(() =>
      useAdvertisers({
        listOptions: { page: 1, limit: 50, status: ADVERTISER_STATUS.ACTIVE, type: ADVERTISER_TYPE.PERSON },
      }),
    );

    await waitFor(() => {
      expect(advertiserService.getAdvertisers).toHaveBeenCalledTimes(1);
    });

    unmount();
    clearAdvertisersListCache();

    await act(async () => {
      resolveFetch({
        success: true,
        data: { advertisers: rankedAdvertisers, pagination: { page: 1, limit: 50, total: 3, totalPages: 1 } },
      });
      await pendingResponse;
    });

    const key = advertisersListCacheKey({
      fetchAllPages: false,
      page: 1,
      limit: 50,
      status: ADVERTISER_STATUS.ACTIVE,
      type: ADVERTISER_TYPE.PERSON,
      search: '',
      categoryId: '',
    });
    expect(getCachedAdvertisersList(key)).toBeUndefined();
  });
});
