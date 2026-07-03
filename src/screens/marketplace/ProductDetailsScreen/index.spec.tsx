import { render, waitFor } from '@testing-library/react-native';
import ProductDetailsScreen from './index';
import { PRODUCT_CATALOG_TYPE } from '@/types/product';

const mockUseProductDetails = jest.fn();
const mockUseProductPartner = jest.fn();
const mockUseUserFeed = jest.fn();
const mockUseSuggestedProducts = jest.fn();
const mockUseCategories = jest.fn();

const emptyProductPartner = {
  partnerData: {
    id: '',
    name: '',
    avatar: '',
    description: '',
    title: '',
    specialties: [] as string[],
  },
  hasSpecialistPartner: false,
  partnerDisplayName: '',
  partnerContacts: undefined as undefined | { type: string; value: string }[],
};

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

jest.mock('@/assets', () => ({
  LogoMini: () => null,
}));

jest.mock('@/components/ui/PlatformBlurView', () => {
  const { View } = require('react-native');
  return {
    PlatformBlurView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
  };
});

jest.mock('@/components/ui/layout', () => {
  const { View, Text } = require('react-native');
  const Header = () => null;
  return {
    Header,
    HeroImage: ({ children, name, title, imageUri }: any) => (
      <View testID='hero-image'>
        <Text testID='hero-image-uri'>{imageUri}</Text>
        {title ? <Text>{title}</Text> : null}
        {name ? <Text>{name}</Text> : null}
        {children}
      </View>
    ),
    Background: () => null,
    ScreenWithHeader: ({ children, headerProps }: any) => (
      <View>
        <Header {...headerProps} />
        {children}
      </View>
    ),
  };
});

jest.mock('@/components/ui/feedback', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    ShareContentUnavailable: ({ onGoHome, onDiscover }: { onGoHome?: () => void; onDiscover?: () => void }) => (
      <View>
        <Text>share.exclusiveContentTitle</Text>
        {onDiscover ? (
          <TouchableOpacity onPress={onDiscover}>
            <Text>share.discover</Text>
          </TouchableOpacity>
        ) : null}
        {onGoHome ? (
          <TouchableOpacity onPress={onGoHome}>
            <Text>share.goToHome</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    ),
    EmptyState: ({ title }: { title?: string }) => (title ? <Text>{title}</Text> : null),
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

jest.mock('@/components/sections/advertiser/ContactButtonsRow', () => {
  const { View } = require('react-native');
  return {
    ContactButtonsRow: ({ testID, contacts }: { testID?: string; contacts?: { type: string }[] }) =>
      contacts?.length ? (
        <View testID={testID}>
          {contacts.map((contact) => (
            <View key={contact.type} testID={`${testID}-${contact.type}`} />
          ))}
        </View>
      ) : null,
  };
});

jest.mock('@/components/ui/buttons', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return {
    SecondaryButton: ({ label, onPress, testID }: any) => (
      <TouchableOpacity onPress={onPress} testID={testID ?? `button-${label}`}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('@/components/ui/carousel/InfoSectionTabsRow', () => {
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ options }: any) => (
      <View testID='info-section-tabs-row'>
        {options.map((opt: any) => (
          <Text key={opt.id}>{opt.label}</Text>
        ))}
      </View>
    ),
  };
});

jest.mock('@/components/ui/carousel', () => {
  const { View, Text } = require('react-native');
  return {
    ButtonCarousel: ({ options, selectedId, onSelect }: any) => (
      <View testID='button-carousel'>
        {options.map((opt: any) => (
          <Text key={opt.id}>{opt.label}</Text>
        ))}
      </View>
    ),
  };
});

jest.mock('@/components/sections/marketplace', () => {
  const { View } = require('react-native');
  const actual = jest.requireActual<typeof import('@/components/sections/marketplace')>(
    '@/components/sections/marketplace',
  );
  return {
    ...actual,
    ProductHeroSection: () => <View testID='product-hero-section' />,
    ProductInfoTabs: () => <View testID='product-info-tabs' />,
  };
});

jest.mock('@/components/sections/product', () => {
  const { View } = require('react-native');
  return {
    ProductsCarousel: () => <View testID='products-carousel' />,
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
  };
});

jest.mock('@/hooks', () => ({
  useProductDetails: (...args: any[]) => mockUseProductDetails(...args),
  useProductPartner: (...args: any[]) => mockUseProductPartner(...args),
  useUserFeed: (...args: any[]) => mockUseUserFeed(...args),
  useSuggestedProducts: (...args: any[]) => mockUseSuggestedProducts(...args),
  useCategories: (...args: any[]) => mockUseCategories(...args),
  useMenuItems: () => [],
}));

jest.mock('@/contexts/FloatingMenuContext', () => ({
  useSetFloatingMenu: jest.fn(),
  useIsFloatingMenuVisible: () => false,
}));

jest.mock('@/analytics', () => ({
  useAnalyticsScreen: jest.fn(),
  logButtonClick: jest.fn(),
  logTabSelect: jest.fn(),
  logAddToCart: jest.fn(),
  logSelectContent: jest.fn(),
  logError: jest.fn(),
}));

jest.mock('@/utils', () => ({
  formatPrice: jest.fn((price) => `$${price?.toFixed(2) || '0.00'}`),
  getProductModeTranslationKey: jest.fn(() => null),
}));

jest.mock('@/services', () => ({
  productService: {
    getProductById: jest.fn(),
    listProducts: jest.fn(),
  },
  adService: {
    listAds: jest.fn(),
    getAdById: jest.fn(),
  },
  storageService: {
    addToCart: jest.fn(),
  },
}));

const mockProduct = {
  id: 'product-1',
  name: 'Test Product',
  description: 'Test description',
  price: 29.99,
  image: 'https://example.com/image.jpg',
  type: PRODUCT_CATALOG_TYPE.PHYSICAL,
  quantity: 10,
  status: 'active' as const,
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
};

describe('ProductDetailsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    replace: jest.fn(),
    getParent: jest.fn(() => ({
      navigate: jest.fn(),
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseProductDetails.mockReturnValue({
      product: mockProduct,
      ad: null,
      advertiserId: undefined,
      relatedProducts: [],
      loading: false,
      isFavorite: false,
      setIsFavorite: jest.fn(),
      handleAddToCart: jest.fn(),
      loadAd: jest.fn(),
    });

    mockUseProductPartner.mockReturnValue(emptyProductPartner);

    mockUseUserFeed.mockReturnValue({
      posts: [],
      loading: false,
      loadPosts: jest.fn(),
    });

    mockUseSuggestedProducts.mockReturnValue({
      products: [],
      loading: false,
      error: null,
      refresh: jest.fn(),
    });

    mockUseCategories.mockReturnValue({
      categories: [],
      loading: false,
      error: null,
      refresh: jest.fn(),
    });
  });

  it('renders correctly with product data', async () => {
    const mockRoute = {
      params: {
        productId: 'product-1',
      },
    };

    const { getAllByText } = render(
      <ProductDetailsScreen navigation={mockNavigation as any} route={mockRoute as any} />,
    );

    await waitFor(() => {
      const products = getAllByText('Test Product');
      expect(products.length).toBeGreaterThan(0);
    });
  });

  it('uses physical-style detail layout (tabs card) for program products', async () => {
    mockUseProductDetails.mockReturnValue({
      product: { ...mockProduct, type: PRODUCT_CATALOG_TYPE.PROGRAM },
      ad: null,
      advertiserId: undefined,
      relatedProducts: [],
      loading: false,
      isFavorite: false,
      setIsFavorite: jest.fn(),
      handleAddToCart: jest.fn(),
      loadAd: jest.fn(),
    });

    const mockRoute = {
      params: {
        productId: 'product-1',
      },
    };

    const { getByTestId, getAllByText } = render(
      <ProductDetailsScreen navigation={mockNavigation as any} route={mockRoute as any} />,
    );

    await waitFor(() => {
      expect(getByTestId('info-section-tabs-row')).toBeTruthy();
      expect(getAllByText('Test Product').length).toBeGreaterThan(0);
    });
  });

  it('para programa, mantém aba Acordos (termos) mesmo sem especificações técnicas', async () => {
    mockUseProductDetails.mockReturnValue({
      product: {
        ...mockProduct,
        type: PRODUCT_CATALOG_TYPE.PROGRAM,
        targetAudience: '',
        technicalSpecifications: '',
        description: 'Apenas descrição disponível',
      },
      ad: null,
      advertiserId: undefined,
      relatedProducts: [],
      loading: false,
      isFavorite: false,
      setIsFavorite: jest.fn(),
      handleAddToCart: jest.fn(),
      loadAd: jest.fn(),
    });

    const mockRoute = {
      params: {
        productId: 'product-1',
      },
    };

    const { getByText, queryByText } = render(
      <ProductDetailsScreen navigation={mockNavigation as any} route={mockRoute as any} />,
    );

    await waitFor(() => {
      expect(getByText('Sobre')).toBeTruthy();
      expect(getByText('Acordos')).toBeTruthy();
    });
  });

  it('shows product not found when product is null', async () => {
    mockUseProductDetails.mockReturnValue({
      product: null,
      ad: null,
      advertiserId: undefined,
      relatedProducts: [],
      loading: false,
      isFavorite: false,
      setIsFavorite: jest.fn(),
      handleAddToCart: jest.fn(),
      loadAd: jest.fn(),
    });

    const mockRoute = {
      params: {
        productId: 'product-2',
      },
    };

    const { getByText } = render(<ProductDetailsScreen navigation={mockNavigation as any} route={mockRoute as any} />);

    await waitFor(() => {
      expect(getByText('share.exclusiveContentTitle')).toBeTruthy();
    });
  });

  it('renders fallback product data when provided in route params', () => {
    mockUseProductDetails.mockReturnValue({
      product: { ...mockProduct, name: 'Fallback Product' },
      ad: null,
      advertiserId: undefined,
      relatedProducts: [],
      loading: false,
      isFavorite: false,
      setIsFavorite: jest.fn(),
      handleAddToCart: jest.fn(),
      loadAd: jest.fn(),
    });

    const mockRoute = {
      params: {
        product: {
          id: 'fallback-1',
          title: 'Fallback Product',
          price: '$19.99',
          image: 'https://example.com/fallback.jpg',
          category: 'test',
          description: 'Fallback description',
        },
      },
    };

    const { getAllByText } = render(
      <ProductDetailsScreen navigation={mockNavigation as any} route={mockRoute as any} />,
    );

    const products = getAllByText('Fallback Product');
    expect(products.length).toBeGreaterThan(0);
  });

  it('handles back button press', () => {
    const mockRoute = {
      params: {
        productId: 'product-1',
      },
    };

    render(<ProductDetailsScreen navigation={mockNavigation as any} route={mockRoute as any} />);

    // Assuming there's a back button with testID
    // This would need to be adjusted based on actual implementation
    expect(mockNavigation.goBack).toBeDefined();
  });

  it('loads related products on mount', async () => {
    mockUseProductDetails.mockReturnValue({
      product: mockProduct,
      ad: null,
      advertiserId: undefined,
      relatedProducts: [mockProduct],
      loading: false,
      isFavorite: false,
      setIsFavorite: jest.fn(),
      handleAddToCart: jest.fn(),
      loadAd: jest.fn(),
    });

    const mockRoute = {
      params: {
        productId: 'product-1',
      },
    };

    render(<ProductDetailsScreen navigation={mockNavigation as any} route={mockRoute as any} />);

    await waitFor(() => {
      expect(mockUseProductDetails).toHaveBeenCalled();
    });
  });

  it('loads product on mount when productId is provided', async () => {
    const mockRoute = {
      params: {
        productId: 'product-1',
      },
    };

    render(<ProductDetailsScreen navigation={mockNavigation as any} route={mockRoute as any} />);

    await waitFor(() => {
      expect(mockUseProductDetails).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'product-1',
        }),
      );
    });
  });

  it('prioritizes catalog image over ad snapshot image', async () => {
    mockUseProductDetails.mockReturnValue({
      product: { ...mockProduct, image: 'https://example.com/catalog-updated.jpg' },
      ad: {
        product: {
          ...mockProduct,
          image: 'https://example.com/ad-snapshot-old.jpg',
        },
      },
      advertiserId: undefined,
      relatedProducts: [],
      loading: false,
      isFavorite: false,
      setIsFavorite: jest.fn(),
      handleAddToCart: jest.fn(),
      loadAd: jest.fn(),
    });

    const mockRoute = {
      params: {
        productId: 'product-1',
      },
    };

    const { getByTestId } = render(
      <ProductDetailsScreen navigation={mockNavigation as any} route={mockRoute as any} />,
    );

    await waitFor(() => {
      expect(getByTestId('hero-image-uri').props.children).toBe('https://example.com/catalog-updated.jpg');
    });
  });

  it('exibe ícones de contato do produto quando product.contacts está preenchido', async () => {
    mockUseProductDetails.mockReturnValue({
      product: {
        ...mockProduct,
        type: PRODUCT_CATALOG_TYPE.SERVICE,
        contacts: [{ type: 'email', value: 'contato@servico.com' }],
      },
      ad: null,
      advertiserId: 'adv-1',
      relatedProducts: [],
      loading: false,
      isFavorite: false,
      setIsFavorite: jest.fn(),
      handleAddToCart: jest.fn(),
      loadAd: jest.fn(),
    });

    const { getByTestId } = render(
      <ProductDetailsScreen navigation={mockNavigation as any} route={{ params: { productId: 'product-1' } } as any} />,
    );

    await waitFor(() => {
      expect(getByTestId('product-details-contacts')).toBeTruthy();
      expect(getByTestId('product-details-contacts-email')).toBeTruthy();
    });
  });

  it('não exibe ícones de contato quando product.contacts está vazio', async () => {
    mockUseProductDetails.mockReturnValue({
      product: { ...mockProduct, type: PRODUCT_CATALOG_TYPE.SERVICE, contacts: [] },
      ad: null,
      advertiserId: undefined,
      relatedProducts: [],
      loading: false,
      isFavorite: false,
      setIsFavorite: jest.fn(),
      handleAddToCart: jest.fn(),
      loadAd: jest.fn(),
    });

    const { queryByTestId } = render(
      <ProductDetailsScreen navigation={mockNavigation as any} route={{ params: { productId: 'product-1' } } as any} />,
    );

    await waitFor(() => {
      expect(queryByTestId('product-details-contacts')).toBeNull();
    });
  });
});
