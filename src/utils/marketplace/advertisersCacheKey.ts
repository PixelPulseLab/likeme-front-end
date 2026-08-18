import type { UseAdvertisersListOptions } from '@/hooks/marketplace/useAdvertisers';

export function advertisersListCacheKey(
  options: {
    communityId?: string;
    fetchAllPages?: boolean;
  } & UseAdvertisersListOptions,
): string {
  return [
    'advertisers',
    options.communityId ?? '',
    options.fetchAllPages ? 'all' : 'page',
    String(options.page ?? 1),
    String(options.limit ?? 50),
    options.status ?? '',
    options.type ?? '',
    options.search?.trim() ?? '',
    options.categoryId?.trim() ?? '',
  ].join('::');
}
