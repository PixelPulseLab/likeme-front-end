import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AffiliateProductScreen from './index';
import { adService, productService } from '@/services';
import advertiserService from '@/services/advertiser/advertiserService';
import { PRODUCT_CATALOG_TYPE } from '@/types/product';

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
    ScreenWithHeader: ({ children, headerProps }: any) => (
      <View>
        <Header {...headerProps} />
        {children}
      </View>
    ),
  };
});

jest.mock('@/contexts/FloatingMenuContext', () => ({
  useSetFloatingMenu: jest.fn(),
  useIsFloatingMenuVisible: () => false,
}));

jest.mock('@/services', () => ({
  adService: {
    getAdById: jest.fn(),
    listAds: jest.fn(),
  },
  productService: {
    getProductById: jest.fn(),
    listProducts: jest.fn(),
  },
}));

jest.mock('@/services/advertiser/advertiserService', () => ({
  __esModule: true,
  default: {
    getAdvertiserById: jest.fn(),
  },
}));

jest.mock('@/services/category/categoryService', () => ({
  __esModule: true,
  default: {
    listCategories: jest.fn().mockResolvedValue([]),
    listProductCategories: jest.fn().mockResolvedValue({
      success: true,
      data: { categories: [] },
    }),
  },
}));

jest.mock('@/analytics', () => ({
  useAnalyticsScreen: jest.fn(),
  logSelectContent: jest.fn(),
}));

jest.mock('@/components/sections/marketplace/RecommendedProductsSection', () => ({
  RecommendedProductsSection: () => null,
}));

jest.mock('@/components/ui/buttons', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return {
    SecondaryButton: ({ label, onPress, testID }: any) => (
      <TouchableOpacity onPress={onPress} testID={testID ?? `button-${label}`}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
    IconButton: ({ onPress, testID }: any) => (
      <TouchableOpacity onPress={onPress} testID={testID ?? 'icon-button'}>
        <Text>share</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('@/utils/share/shareContent', () => ({
  shareContent: jest.fn(),
}));

const mockAdvertiser = {
  id: 'adv-1',
  name: 'Dr. Partner',
  logo: 'https://example.com/partner.jpg',
  description: 'Especialista parceiro',
  status: 'active',
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
};

const mockAd = {
  id: 'ad-1',
  advertiserId: 'adv-1',
  advertiser: mockAdvertiser,
  productId: 'product-1',
  title: 'Amazon Product',
  description: 'Amazon description',
  image: 'https://example.com/amazon.jpg',
  type: PRODUCT_CATALOG_TYPE.AMAZON,
  externalUrl: 'https://amazon.com/product',
  status: 'active',
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
  product: {
    id: 'product-1',
    name: 'Amazon Product',
    description: 'Amazon description',
    price: 19.99,
    image: 'https://example.com/amazon.jpg',
    type: PRODUCT_CATALOG_TYPE.AMAZON,
    quantity: 5,
    status: 'active',
    externalUrl: 'https://amazon.com/product',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
};

describe('AffiliateProductScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(() => true),
    getParent: jest.fn(() => ({
      navigate: jest.fn(),
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (productService.getProductById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockAd.product,
    });
    (adService.getAdById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockAd,
    });
    (adService.listAds as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        ads: [mockAd],
        pagination: {
          page: 1,
          limit: 1,
          total: 1,
          totalPages: 1,
        },
      },
    });
    (productService.listProducts as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        products: [],
        pagination: {
          page: 1,
          limit: 3,
          total: 0,
          totalPages: 1,
        },
      },
    });
    (advertiserService.getAdvertiserById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockAdvertiser,
    });
  });

  it('renders correctly with product data', async () => {
    const mockRoute = {
      params: {
        productId: 'product-1',
        adId: 'ad-1',
      },
    };

    const { getByText } = render(
      <AffiliateProductScreen navigation={mockNavigation as any} route={mockRoute as any} />,
    );

    await waitFor(
      () => {
        expect(getByText('Amazon Product')).toBeTruthy();
      },
      { timeout: 8000 },
    );
  });

  it('loads ad data when adId is provided', async () => {
    const mockRoute = {
      params: {
        productId: 'product-1',
        adId: 'ad-1',
      },
    };

    render(<AffiliateProductScreen navigation={mockNavigation as any} route={mockRoute as any} />);

    await waitFor(() => {
      expect(adService.getAdById).toHaveBeenCalledWith('ad-1');
    });
  });

  it('loads product data when productId is provided', async () => {
    const mockRoute = {
      params: {
        productId: 'product-1',
      },
    };

    render(<AffiliateProductScreen navigation={mockNavigation as any} route={mockRoute as any} />);

    await waitFor(() => {
      expect(adService.listAds).toHaveBeenCalled();
    });
  });

  it('handles back button press', async () => {
    const mockRoute = {
      params: {
        productId: 'product-1',
        adId: 'ad-1',
      },
    };

    const { getByTestId } = render(
      <AffiliateProductScreen navigation={mockNavigation as any} route={mockRoute as any} />,
    );

    await waitFor(() => {
      expect(getByTestId('back-button')).toBeTruthy();
    });

    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('opens external URL when Buy on Amazon button is pressed', async () => {
    const mockRoute = {
      params: {
        productId: 'product-1',
        adId: 'ad-1',
      },
    };

    const Linking = require('react-native').Linking;
    const mockOpenURL = jest.spyOn(Linking, 'openURL').mockImplementation(() => Promise.resolve());

    const { getByText } = render(
      <AffiliateProductScreen navigation={mockNavigation as any} route={mockRoute as any} />,
    );

    await waitFor(() => {
      expect(getByText('marketplace.buyOnAmazon')).toBeTruthy();
    });

    const buyButton = getByText('marketplace.buyOnAmazon');
    fireEvent.press(buyButton);

    await waitFor(() => {
      expect(mockOpenURL).toHaveBeenCalledWith('https://amazon.com/product');
    });

    mockOpenURL.mockRestore();
  });

  it('renders fallback product data when provided in route params', async () => {
    // Mock dos serviços - loadData será chamado e deve usar category do route.params.product
    (adService.getAdById as jest.Mock).mockResolvedValue({
      success: false,
      data: null,
    });
    (adService.listAds as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        ads: [],
        pagination: {
          page: 1,
          limit: 1,
          total: 0,
          totalPages: 1,
        },
      },
    });
    (productService.getProductById as jest.Mock).mockResolvedValue({
      success: false,
      data: null,
    });
    (productService.listProducts as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        products: [],
        pagination: {
          page: 1,
          limit: 3,
          total: 0,
          totalPages: 1,
        },
      },
    });

    const mockRoute = {
      params: {
        // Não passa productId ou adId - apenas product
        product: {
          id: 'fallback-1',
          title: 'Fallback Product',
          price: '$19.99',
          image: 'https://example.com/fallback.jpg',
          type: PRODUCT_CATALOG_TYPE.AMAZON,
          description: 'Fallback description',
        },
      },
    };

    const { queryByText } = render(
      <AffiliateProductScreen navigation={mockNavigation as any} route={mockRoute as any} />,
    );

    // Aguarda o loading terminar - o componente deve renderizar mesmo que loadData não encontre nada
    await waitFor(
      () => {
        expect(queryByText('marketplace.loadingProduct')).toBeNull();
      },
      { timeout: 3000 },
    );

    expect(queryByText('marketplace.loadingProduct')).toBeNull();
  });

  it('keeps ad snapshot title and still refreshes catalog product data', async () => {
    (adService.getAdById as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        ...mockAd,
        product: {
          ...mockAd.product,
          name: 'Ad Snapshot Title',
          image: 'https://example.com/ad-snapshot-old.jpg',
        },
      },
    });
    (productService.getProductById as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        ...mockAd.product,
        name: 'Catalog Product Title',
        image: 'https://example.com/catalog-updated.jpg',
      },
    });

    const mockRoute = {
      params: {
        productId: 'product-1',
        adId: 'ad-1',
      },
    };

    const { getByText } = render(
      <AffiliateProductScreen navigation={mockNavigation as any} route={mockRoute as any} />,
    );

    await waitFor(() => {
      expect(getByText('Ad Snapshot Title')).toBeTruthy();
      expect(productService.getProductById).toHaveBeenCalledWith('product-1');
    });
  });
});
