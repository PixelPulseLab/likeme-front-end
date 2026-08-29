import { render } from '@testing-library/react-native';
import CommunityScreen from './index';
import { ADVERTISER_STATUS, ADVERTISER_TYPE } from '@/constants';

const mockUseAdvertisers = jest.fn();
const mockLoadMore = jest.fn();
const mockUseProviderAds = jest.fn((_params?: unknown) => ({
  ads: [],
  loading: false,
  hasMore: false,
  loadAds: jest.fn(),
}));
const mockRoute = { params: {} };

jest.mock('@react-navigation/native', () => ({
  useRoute: () => mockRoute,
}));

jest.mock('@/analytics', () => ({
  useAnalyticsScreen: jest.fn(),
  logTabSelect: jest.fn(),
}));

jest.mock('@/contexts/FloatingMenuContext', () => ({
  useSetFloatingMenu: jest.fn(),
}));

jest.mock('@/components/sections/community', () => {
  const { Text, View } = require('react-native');
  return {
    ShoppingList: () => <View testID='shopping-list' />,
    EventBanner: () => <View testID='event-banner' />,
    PostCard: ({ post }: any) => <Text>{post.content}</Text>,
    NextEventsSection: () => <View testID='next-events' />,
    CommunityDescriptionSection: ({ specialist }: any) => (
      <Text testID='community-description'>{specialist?.name ?? 'sem especialista'}</Text>
    ),
    FeaturedPostsSection: () => <View testID='featured-posts' />,
  };
});

jest.mock('@/components/sections/marketplace/RecommendedProductsSection', () => {
  const { View } = require('react-native');
  return {
    RecommendedProductsSection: () => <View testID='recommended-products' />,
  };
});

jest.mock('@/components/sections/community/SocialList/styles', () => ({
  styles: {
    eventBannerContainer: {},
    recommendedSection: {},
    sectionContainer: {},
  },
}));

jest.mock('@/components/ui', () => {
  const { Text, View } = require('react-native');
  return {
    EmptyState: ({ title }: any) => <Text>{title}</Text>,
    ShareContentUnavailable: () => <View testID='share-content-unavailable' />,
  };
});

jest.mock('@/components/ui/carousel/InfoSectionTabsRow', () => {
  const { View } = require('react-native');
  return () => <View testID='info-tabs' />;
});

jest.mock('@/components/ui/layout', () => {
  const { Text, View } = require('react-native');
  return {
    HeroImage: ({ name }: any) => <Text>{name}</Text>,
    ScreenWithHeader: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock('@/components/ui/buttons/Toggle', () => {
  const { View } = require('react-native');
  return () => <View testID='toggle' />;
});

jest.mock('@/components/ui/inputs', () => {
  const { View } = require('react-native');
  return {
    Checkbox: () => <View testID='checkbox' />,
  };
});

jest.mock('@/components/infrastructure/webview/EventWebViewSession', () => ({
  EventWebViewSession: () => null,
}));

jest.mock('@/hooks', () => ({
  useUserFeed: () => ({
    posts: [],
    loading: false,
    loadingMore: false,
    error: null,
    hasMore: false,
    loadMore: mockLoadMore,
  }),
  useCommunityFeaturedPost: () => ({ post: null }),
  useCommunities: () => ({
    communities: [
      {
        communityId: 'community-1',
        displayName: 'Comunidade Sono',
        description: 'Descricao',
        socialDescription: 'Social',
        isPublic: true,
        membersCount: 1,
        postsCount: 0,
        createdAt: '2026-08-29T00:00:00.000Z',
      },
    ],
    categories: [],
    loading: false,
    loadingMore: false,
    error: null,
    hasMore: false,
    loadMore: jest.fn(),
    refresh: jest.fn(),
    feedEvents: [],
    communityFiles: [],
  }),
  useCommunity: () => ({
    termsAccepted: null,
    toggleTermsAccepted: jest.fn(),
  }),
  useAdvertisers: (...args: any[]) => mockUseAdvertisers(...args),
  useProviderAds: (params: unknown) => mockUseProviderAds(params),
  useMenuItems: () => [],
  useCommunityEventBanner: () => ({
    eventBanner: null,
    eventJoinUrl: null,
    closeEventSession: jest.fn(),
    handleEventBannerPress: jest.fn(),
    handleEventBannerCtaPress: jest.fn(),
  }),
}));

jest.mock('@/services', () => ({
  storageService: {
    getCommunityWelcomeDismissed: jest.fn(() => Promise.resolve(true)),
    getCommunityShoppingTipDismissed: jest.fn(() => Promise.resolve(true)),
    isCommunityFavorite: jest.fn(() => Promise.resolve(false)),
    setCommunityFavorite: jest.fn(() => Promise.resolve()),
    setCommunityWelcomeDismissed: jest.fn(() => Promise.resolve()),
    setCommunityShoppingTipDismissed: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@/utils/navigation/marketplaceNavigation', () => ({
  navigateToProviderProfile: jest.fn(),
}));

jest.mock('@/utils/navigation/shareHomeNavigation', () => ({
  goBackOrShareHome: jest.fn(),
  navigateToShareHome: jest.fn(),
}));

jest.mock('@/utils/navigation/shareDiscoverNavigation', () => ({
  navigateToShareDiscover: jest.fn(),
}));

jest.mock('@/utils/navigation/rootStackNavigation', () => ({
  navigateRootStack: jest.fn(),
  rootStackNavigationFrom: (navigation: unknown) => navigation,
}));

jest.mock('@/utils/share/shareContent', () => ({
  shareContent: jest.fn(),
}));

describe('CommunityScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setParams: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAdvertisers.mockReturnValue({
      advertisers: [],
      loading: false,
      error: null,
      refresh: jest.fn(),
    });
  });

  it('busca o provider da comunidade apenas entre anunciantes pessoa', () => {
    render(<CommunityScreen navigation={mockNavigation as never} />);

    const communityProviderCall = mockUseAdvertisers.mock.calls.find(
      ([params]) => params?.communityId === 'community-1' && params?.listOptions?.limit === 20,
    );

    expect(communityProviderCall?.[0]).toEqual(
      expect.objectContaining({
        communityId: 'community-1',
        fetchAllPages: false,
        enabled: true,
        listOptions: expect.objectContaining({
          page: 1,
          limit: 20,
          status: ADVERTISER_STATUS.ACTIVE,
          type: ADVERTISER_TYPE.PERSON,
        }),
      }),
    );
  });
});
