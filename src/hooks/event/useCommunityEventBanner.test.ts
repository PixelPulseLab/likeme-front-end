import { act, renderHook } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import { useCommunityEventBanner } from '@/hooks/event/useCommunityEventBanner';
import { useEventList } from '@/hooks/event/useEventList';
import { eventService } from '@/services';
import { prefetchActivityList } from '@/utils/activity/activityListCache';
import { navigateToActivitiesActives } from '@/utils/navigation/activitiesNavigation';
import { navigateToProductDetailsScreen } from '@/utils/navigation/productNavigation';

jest.mock('@/hooks/event/useEventList', () => ({
  useEventList: jest.fn(),
}));

jest.mock('@/services', () => ({
  eventService: {
    registerScheduledCommunityEventReminder: jest.fn(),
  },
}));

jest.mock('@/hooks/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/utils/activity/activityListCache', () => ({
  prefetchActivityList: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/utils/navigation/activitiesNavigation', () => ({
  navigateToActivitiesActives: jest.fn(),
}));

jest.mock('@/utils/navigation/productNavigation', () => ({
  navigateToProductDetailsScreen: jest.fn(),
}));

const navigation = { navigate: jest.fn() } as never;
const useEventListMock = useEventList as jest.Mock;
const refreshEventsMock = jest.fn();

describe('useCommunityEventBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    useEventListMock.mockReturnValue({
      banner: null,
      programProductId: null,
      hasProgramAccess: false,
      loading: false,
      error: null,
      refresh: refreshEventsMock,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('handleEventBannerPress com live abre URL externa', async () => {
    const { result } = renderHook(() =>
      useCommunityEventBanner({
        enabled: true,
        communityId: 'community-1',
        navigation,
      }),
    );

    await act(async () => {
      await result.current.handleEventBannerPress({
        id: '1',
        title: 'Evento',
        host: 'Host',
        status: 'Live Now',
        startTime: '',
        endTime: '',
        thumbnail: '',
        externalUrl: 'https://us02web.zoom.us/j/123456789',
        variant: 'live_join',
      });
    });

    expect(Linking.openURL).toHaveBeenCalledWith('https://us02web.zoom.us/j/123456789');
    expect(result.current.eventJoinUrl).toBeNull();
  });

  it('variant purchase navega para PDP', async () => {
    const { result } = renderHook(() =>
      useCommunityEventBanner({
        enabled: true,
        communityId: 'community-1',
        navigation,
      }),
    );

    await act(async () => {
      await result.current.handleEventBannerPress({
        id: '1',
        title: 'Vivência',
        host: 'Host',
        status: 'Scheduled',
        startTime: '2026-06-30T18:00:00.000Z',
        endTime: '',
        thumbnail: '',
        variant: 'purchase',
        programProductId: 'product-99',
      });
    });

    expect(navigateToProductDetailsScreen).toHaveBeenCalledWith(navigation, { productId: 'product-99' });
  });

  it('mantem banner de compra quando API informa que usuario nao tem acesso ao programa', () => {
    useEventListMock.mockReturnValue({
      banner: {
        id: 'evt-live',
        title: 'Sessao ao vivo',
        host: 'Host',
        status: 'live',
        startsAt: '2026-06-30T18:00:00.000Z',
        endsAt: '2026-06-30T19:00:00.000Z',
        externalUrl: 'https://us02web.zoom.us/j/123456789',
        provider: 'zoom',
        joinMode: 'external_browser',
        variant: 'purchase',
        communityId: 'community-1',
        programProductId: 'product-99',
      },
      programProductId: 'product-99',
      hasProgramAccess: false,
      loading: false,
      error: null,
      refresh: refreshEventsMock,
    });

    const { result } = renderHook(() =>
      useCommunityEventBanner({
        enabled: true,
        communityId: 'community-1',
        programProductId: 'product-99',
        navigation,
      }),
    );

    expect(result.current.eventBanner).toEqual(expect.objectContaining({ variant: 'purchase' }));
  });

  it('variant reminder registra lembrete e atualiza lista de eventos', async () => {
    (eventService.registerScheduledCommunityEventReminder as jest.Mock).mockResolvedValue({
      data: { registered: true },
    });

    const { result } = renderHook(() =>
      useCommunityEventBanner({
        enabled: true,
        communityId: 'community-1',
        hasProgramAccess: true,
        navigation,
      }),
    );

    await act(async () => {
      await result.current.handleEventBannerPress({
        id: 'evt-reminder',
        title: 'Sessão',
        host: 'Host',
        status: 'Scheduled',
        startTime: '2026-06-30T18:00:00.000Z',
        endTime: '',
        thumbnail: '',
        variant: 'reminder',
        communityId: 'community-1',
      });
    });

    expect(eventService.registerScheduledCommunityEventReminder).toHaveBeenCalledWith({
      eventId: 'evt-reminder',
      title: 'Sessão',
      startsAt: '2026-06-30T18:00:00.000Z',
      communityId: 'community-1',
    });
    expect(refreshEventsMock).toHaveBeenCalled();
    expect(prefetchActivityList).toHaveBeenCalledWith('active');
    expect(navigateToActivitiesActives).toHaveBeenCalledWith(navigation);
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
