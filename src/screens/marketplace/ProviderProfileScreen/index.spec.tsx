import React from 'react';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { render, fireEvent } from '@testing-library/react-native';
import ProviderProfileScreen from './index';

const mockUseAdvertisers = jest.fn();

jest.mock('@/contexts/FloatingMenuContext', () => ({
  useSetFloatingMenu: jest.fn(),
}));

jest.mock('@/hooks/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { provider?: string }) => {
      if (key === 'marketplace.talkToProvider') {
        return `Talk to ${opts?.provider ?? ''}`;
      }
      const labels: Record<string, string> = {
        'common.loading': 'Loading',
        'common.error': 'Error',
        'marketplace.providerNotFound': 'Provider not found',
        'marketplace.about': 'About',
        'marketplace.myCommunities': 'My communities',
        'marketplace.allProducts': 'All products',
        'marketplace.curatedSpecialty': 'Curated specialty',
        'marketplace.specialistLabel': 'Specialist',
        'marketplace.chatInitialMessage': 'Hi',
        'marketplace.noAdsFound': 'No ads',
        'marketplace.noAdsFoundDescription': 'No ads description',
        'marketplace.providerCuratedComingSoon':
          'Em breve você poderá acessar a Curadoria feita por este especialista.',
        'community.viewProfile': 'View profile',
        'filterCategory.solutions.products': 'Products',
        'filterCategory.solutions.services': 'Services',
        'filterCategory.solutions.programs': 'Programs',
        'home.joinCommunityError': 'Join error',
      };
      return labels[key] ?? key;
    },
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const ReactNative = require('react-native');
  return {
    SafeAreaView: ReactNative.View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...props }: any) => <View {...props}>{children}</View>,
  };
});

jest.mock('@/components/ui/layout', () => {
  const { View, TouchableOpacity, Text } = require('react-native');
  const Header = ({ onBackPress }: any) => (
    <View>
      <TouchableOpacity onPress={onBackPress} testID='back-button'>
        <Text>Back</Text>
      </TouchableOpacity>
    </View>
  );
  return {
    Header,
    Background: () => null,
    HeroImage: ({ badges = [], children, ...rest }: any) => (
      <View testID='hero-image'>
        {(badges || []).map((b: string, i: number) => (
          <Text key={i}>{b}</Text>
        ))}
        {children}
      </View>
    ),
    ScreenWithHeader: ({ children, headerProps }: any) => (
      <View>
        <Header {...headerProps} />
        {children}
      </View>
    ),
  };
});

jest.mock('@/components/ui', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    Toggle: ({ options, selected, onSelect }: any) => (
      <View testID='toggle'>
        {options.map((option: string) => (
          <TouchableOpacity key={option} onPress={() => onSelect(option)}>
            <Text>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    ),
  };
});

jest.mock('@/components/ui/tabs', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    ToggleTabs: ({ tabs, activeTabId, onTabPress }: any) => (
      <View testID='toggle-tabs'>
        {(tabs || []).map((tab: { id: string; label: string }) => (
          <TouchableOpacity key={tab.id} onPress={() => onTabPress?.(tab.id)}>
            <Text>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    ),
  };
});

jest.mock('@/components/ui/buttons', () => {
  const { TouchableOpacity, Text, View } = require('react-native');
  return {
    IconButton: () => <View testID='icon-button' />,
    SecondaryButton: ({ label, onPress }: any) => (
      <TouchableOpacity onPress={onPress} testID={`button-${label}`}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('@/components/sections/community', () => {
  const { View, Text } = require('react-native');
  return {
    PostCard: ({ post }: any) => (
      <View testID={`post-${post.id}`}>
        <Text>{post.content}</Text>
      </View>
    ),
    NextEventsSection: ({ events }: any) => <View testID='next-events' />,
  };
});

jest.mock('@/components/ui/lists/JoinCardList', () => {
  const { View } = require('react-native');
  return {
    JoinCardList: () => <View testID='join-card-list' />,
  };
});

jest.mock('@/components/sections/product', () => ({
  Product: {},
}));

jest.mock('@/components/sections/marketplace', () => {
  const { View } = require('react-native');
  return {
    AdsList: () => <View testID='ads-list' />,
  };
});

jest.mock('@/hooks', () => ({
  useCommunities: () => ({
    communities: [],
    categories: [],
    loading: false,
    loadCommunities: jest.fn(),
  }),
  useAdvertisers: (params: any) => {
    if (params?.communityId) {
      return {
        advertisers: [],
        loading: false,
        error: null,
        refresh: jest.fn(),
      };
    }
    return mockUseAdvertisers(params);
  },
  useAdvertiser: (params: any) => {
    const base: any = mockUseAdvertisers(params);
    return {
      ...base,
      advertiser: base.advertisers?.[0] ?? null,
    };
  },
  useProviderAds: () => ({
    ads: [],
    loading: false,
    hasMore: false,
    loadAds: jest.fn(),
  }),
  useCategories: () => ({ categories: [] }),
  useFeatureFlag: () => ({ isEnabled: true, isLoading: false }),
  useMenuItems: () => [],
}));

jest.mock('@/services', () => ({
  communityService: {
    joinCommunity: jest.fn(),
  },
  advertiserService: {
    getAdvertiserProfiles: (jest.fn() as any).mockResolvedValue({
      success: true,
      data: { profiles: [] },
    }),
  },
}));

jest.mock('@/utils', () => ({
  formatPrice: jest.fn((price: number) => `$${price?.toFixed(2) || '0.00'}`),
}));

jest.mock('@/analytics', () => ({
  useAnalyticsScreen: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  CommonActions: {
    navigate: jest.fn((params: any) => ({ type: 'NAVIGATE', payload: params })),
  },
}));

jest.mock('@/assets', () => ({
  BackgroundIconButton: require('react-native').Image.resolveAssetSource({ uri: 'test' }),
}));

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  canGoBack: jest.fn(() => true),
  getParent: jest.fn(() => ({
    navigate: jest.fn(),
  })),
} as any;

const mockRouteWithProvider = {
  params: {
    providerId: 'provider-1',
    provider: {
      name: 'Dr. Avery Parker',
      title: 'Therapist & Wellness Coach',
      description: 'Specialized in mental health and wellness coaching.',
      rating: 4.8,
      specialties: ['Mental Health', 'Wellness Coaching', 'Therapy'],
      avatar: 'https://example.com/avatar.jpg',
    },
  },
} as any;

const mockRouteWithoutProvider = {
  params: {
    providerId: 'provider-1',
  },
} as any;

describe('ProviderProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    mockUseAdvertisers.mockReturnValue({
      advertisers: [],
      loading: false,
    });
  });

  it('renders correctly with provider data', () => {
    const { getByText, getAllByText } = render(
      <ProviderProfileScreen navigation={mockNavigation} route={mockRouteWithProvider} />,
    );

    expect(getByText('Dr. Avery Parker')).toBeTruthy();
    expect(getAllByText('Specialized in mental health and wellness coaching.').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Specialist')).toBeTruthy();
  });

  it('renders correctly with default provider data when not provided', () => {
    mockUseAdvertisers.mockReturnValue({
      advertisers: [
        {
          id: 'provider-1',
          name: 'Marcela Ferraz',
          description: '',
          logo: undefined,
        },
      ],
      loading: false,
    });

    const { getByText } = render(
      <ProviderProfileScreen navigation={mockNavigation} route={mockRouteWithoutProvider} />,
    );

    expect(getByText('Marcela Ferraz')).toBeTruthy();
  });

  it('calls goBack when back button is pressed', () => {
    const { getByTestId } = render(<ProviderProfileScreen navigation={mockNavigation} route={mockRouteWithProvider} />);

    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('renders correctly when provider has no avatar', () => {
    const routeWithoutAvatar = {
      params: {
        providerId: 'provider-1',
        provider: {
          name: 'Dr. Test',
          title: 'Test Title',
        },
      },
    } as any;

    const { getByText } = render(<ProviderProfileScreen navigation={mockNavigation} route={routeWithoutAvatar} />);

    expect(getByText('Dr. Test')).toBeTruthy();
  });
});
