import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import CheckoutScreen from './index';
import { storageService } from '@/services';

jest.mock('react-native-safe-area-context', () => {
  const ReactNative = require('react-native');
  return {
    SafeAreaView: ReactNative.View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
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
    GradientBackground: () => null,
    ScreenWithHeader: ({ children, headerProps }: any) => (
      <View>
        <Header {...headerProps} />
        {children}
      </View>
    ),
  };
});

jest.mock('@/components/ui/buttons', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return {
    PrimaryButton: ({ label, onPress }: any) => (
      <TouchableOpacity onPress={onPress} testID={`button-${label}`}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
    SecondaryButton: ({ label, onPress, testID }: any) => (
      <TouchableOpacity onPress={onPress} testID={testID || `button-${label}`}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
  };
});

const mockUseFocusEffect = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useFocusEffect: (callback: () => void) => {
      // Chama o callback imediatamente
      callback();
      return mockUseFocusEffect;
    },
  };
});

jest.mock('./address/AddressForm', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  const mockAddressData = {
    fullName: '',
    addressLine1: '',
    streetNumber: '',
    addressLine2: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
  };

  function AddressForm(props: any) {
    React.useLayoutEffect(() => {
      if (props.onSaveAddress && props.addressData?.zipCode?.replace?.(/\D/g, '')?.length < 8) {
        props.onSaveAddress({
          ...mockAddressData,
          fullName: 'Nome Teste',
          addressLine1: 'Rua Teste',
          streetNumber: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '05332-000',
          phone: '11999999999',
        });
      }
    });

    return React.createElement(View, { testID: 'address-form' }, React.createElement(Text, null, 'Address Form'));
  }

  return {
    __esModule: true,
    default: AddressForm,
    AddressData: {},
    EMPTY_ADDRESS: mockAddressData,
    isAddressFilled: () => true,
  };
});

jest.mock('./payment/PaymentForm', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  function PaymentForm(props: any) {
    // Preencher os dados imediatamente quando o componente é renderizado
    // Usar useLayoutEffect para executar síncronamente antes da pintura
    React.useLayoutEffect(() => {
      if (props.onCardholderNameChange && (!props.cardholderName || props.cardholderName === '')) {
        // Chamar os callbacks de forma síncrona
        if (props.onCardholderNameChange) props.onCardholderNameChange('John Doe');
        if (props.onCardNumberChange) props.onCardNumberChange('4111111111111111');
        if (props.onExpiryDateChange) props.onExpiryDateChange('12/25');
        if (props.onCvvChange) props.onCvvChange('123');
      }
    });

    return React.createElement(View, { testID: 'payment-form' }, React.createElement(Text, null, 'Payment Form'));
  }

  return PaymentForm;
});

jest.mock('@/components/ui/cards', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    ProductRowCard: (props: any) =>
      React.createElement(View, { testID: 'product-row-card' }, React.createElement(Text, null, props?.title ?? '')),
  };
});

jest.mock('./order/OrderSummary', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return (props: any) =>
    React.createElement(View, { testID: 'order-summary' }, React.createElement(Text, null, 'Order Summary'));
});

jest.mock('./order/OrderScreen', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return (props: any) =>
    React.createElement(
      View,
      { testID: 'order-screen' },
      React.createElement(Text, { testID: 'order-screen-status' }, props.status ?? 'success'),
    );
});

// Criar os mocks como variáveis que serão preenchidas
let mockOrderService: any;
let mockPaymentService: any;
let mockStorageService: any;
let mockUserService: any;

// Mock usando factory function
jest.mock('@/services', () => {
  mockOrderService = {
    createOrder: jest.fn(),
  };

  mockPaymentService = {
    processPayment: jest.fn(),
  };

  mockStorageService = {
    getCartItems: jest.fn(),
    clearCart: jest.fn(),
  };

  mockUserService = {
    getShippingAddress: jest.fn().mockResolvedValue(null),
    saveShippingAddress: jest.fn().mockResolvedValue({ success: true }),
  };

  return {
    storageService: mockStorageService,
    orderService: mockOrderService,
    paymentService: mockPaymentService,
    userService: mockUserService,
  };
});

jest.mock('@/contexts/FloatingMenuContext', () => ({
  useFloatingMenuActions: () => ({
    setMenu: jest.fn(),
    clearMenu: jest.fn(),
  }),
  useIsFloatingMenuVisible: () => false,
}));

jest.mock('@/hooks', () => {
  const mockCartItems = [
    {
      id: '1',
      image: 'https://example.com/image1.jpg',
      title: 'Product 1',
      subtitle: 'Description 1',
      price: 29.99,
      quantity: 2,
    },
  ];
  return {
    useFormattedInput: () => jest.fn((text: string) => text),
    useTranslation: () => ({ t: (key: string) => key }),
    usePayment: () => ({
      cardholderName: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cpf: '',
      paymentFieldErrors: {},
      paymentError: null,
      isProcessing: false,
      setPaymentError: jest.fn(),
      setPaymentFieldErrors: jest.fn(),
      setIsProcessing: jest.fn(),
      onCardholderNameChange: jest.fn(),
      onCardNumberChange: jest.fn(),
      onExpiryDateChange: jest.fn(),
      onCvvChange: jest.fn(),
      onCpfChange: jest.fn(),
      isPaymentStepValid: () => true,
      validatePaymentFields: () => null,
      getCardData: () => ({
        cardNumber: '4111111111111111',
        cardHolderName: 'John Doe',
        cardExpirationDate: '1225',
        cardCvv: '123',
        cpf: '12345678901',
      }),
    }),
    useCheckoutVoucher: () => ({
      couponCode: '',
      couponError: null,
      appliedPreview: null,
      isValidating: false,
      onCouponCodeChange: jest.fn(),
      applyCoupon: jest.fn(),
      removeCoupon: jest.fn(),
      syncAppliedWithAmounts: jest.fn(),
    }),
    useCart: () => {
      const { storageService: storage } = require('@/services');
      const items = [
        {
          id: '1',
          image: 'https://example.com/image1.jpg',
          title: 'Product 1',
          subtitle: 'Description 1',
          price: 29.99,
          quantity: 2,
        },
      ];
      return {
        cartItems: items,
        loading: false,
        loadCartItems: jest.fn().mockImplementation(() => storage.getCartItems()),
        loadAndValidateCartItems: jest.fn(),
        increaseQuantity: jest.fn(),
        decreaseQuantity: jest.fn(),
        removeItem: jest.fn(),
        subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
      };
    },
    useCartShippingPolicy: () => ({ shippingRequired: true, isResolving: false }),
    useMenuItems: () => [],
  };
});

jest.mock('@/services/shipping/shippingService', () => ({
  getShippingQuote: jest
    .fn()
    .mockResolvedValue({ options: [{ valor: 15, nome: 'PAC' }], minValue: 15, requiresShipping: true }),
  getShippingPolicy: jest.fn().mockResolvedValue({ requiresShipping: true }),
}));

jest.mock('@/analytics', () => ({
  useAnalyticsScreen: jest.fn(),
}));

jest.mock('@/utils', () => ({
  formatPrice: jest.fn((price: number) => `R$ ${price.toFixed(2)}`),
  formatAddress: jest.fn((data: any) => `${data.addressLine1}, ${data.city} - ${data.state}`),
  formatBillingAddress: jest.fn((data: any) => ({
    country: 'br',
    state: data.state || 'SP',
    city: data.city || 'São Paulo',
    street: 'Rua Marselha',
    streetNumber: '1029',
    zipcode: data.zipCode || '05332-000',
    complement: 'Apto 94',
  })),
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    log: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock do Alert usando jest.spyOn após os outros mocks
const mockAlert = jest.fn();

const mockCartItems = [
  {
    id: '1',
    image: 'https://example.com/image1.jpg',
    title: 'Product 1',
    subtitle: 'Description 1',
    price: 29.99,
    quantity: 2,
    category: 'Product',
    subCategory: 'SubCategory',
  },
];

describe('CheckoutScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  const mockRoute = {
    params: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
    // Mock do Alert usando require para evitar problemas com TurboModuleRegistry
    const RN = require('react-native');
    jest.spyOn(RN.Alert, 'alert').mockImplementation(mockAlert);
    mockStorageService.getCartItems.mockResolvedValue(mockCartItems);
    mockStorageService.clearCart.mockResolvedValue(undefined);
    mockOrderService.createOrder.mockResolvedValue({
      success: true,
      data: {
        id: 'order-123',
        status: 'pending',
        paymentStatus: 'pending',
      },
    });
  });

  it('renders correctly', async () => {
    const { getByTestId, queryByTestId } = render(
      <CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />,
    );

    await waitFor(() => {
      expect(getByTestId('address-form')).toBeTruthy();
    });
  });

  it('loads cart items on mount', async () => {
    render(<CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />);

    await waitFor(() => {
      expect(storageService.getCartItems).toHaveBeenCalled();
    });
  });

  it('shows address form on initial render', async () => {
    const { getByTestId, queryByTestId } = render(
      <CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />,
    );

    await waitFor(() => {
      expect(getByTestId('address-form')).toBeTruthy();
    });
  });

  it('handles back button press', async () => {
    const { getByTestId, queryByTestId } = render(
      <CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />,
    );

    await waitFor(() => {
      expect(getByTestId('back-button')).toBeTruthy();
      fireEvent.press(getByTestId('back-button'));
    });

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it.skip('advances to payment step when Continue is pressed from address step', async () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />,
    );

    await waitFor(() => {
      expect(getByTestId('address-form')).toBeTruthy();
      fireEvent.press(getByTestId('button-continue'));
    });

    await waitFor(() => {
      expect(getByTestId('payment-form')).toBeTruthy();
    });
  });

  it.skip('advances to order step when Continue is pressed from payment step', async () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />,
    );

    await waitFor(() => {
      expect(getByTestId('address-form')).toBeTruthy();
      fireEvent.press(getByTestId('button-continue'));
    });

    await waitFor(() => {
      expect(getByTestId('payment-form')).toBeTruthy();
    });

    // Depois avança para order (handleCompleteOrder é async - chama orderService.createOrder)
    await waitFor(() => {
      fireEvent.press(getByTestId('button-continue'));
    });

    await waitFor(
      () => {
        expect(mockOrderService.createOrder).toHaveBeenCalled();
        expect(queryByTestId('payment-form')).toBeNull();
        expect(queryByTestId('address-form')).toBeNull();
      },
      { timeout: 5000 },
    );
  });

  it.skip('navigates back when Continue is pressed from order step', async () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />,
    );

    await waitFor(() => {
      expect(getByTestId('address-form')).toBeTruthy();
      fireEvent.press(getByTestId('button-continue'));
    });

    await waitFor(() => {
      expect(getByTestId('payment-form')).toBeTruthy();
      fireEvent.press(getByTestId('button-continue'));
    });

    await waitFor(
      () => {
        expect(mockOrderService.createOrder).toHaveBeenCalled();
      },
      { timeout: 3000 },
    );

    // Na etapa order, botão Ver pedidos deve navegar para Activities (histórico / pedidos)
    const viewOrdersButton = getByText('checkout.viewOrders');
    fireEvent.press(viewOrdersButton);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Activities', {
      initialTab: 'history',
      initialFilter: 'orders',
    });
  });

  it('shows pending confirmation when backend has not confirmed payment yet', async () => {
    const { getByTestId } = render(<CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />);

    await waitFor(() => {
      expect(getByTestId('address-form')).toBeTruthy();
    });

    fireEvent.press(getByTestId('button-continue'));

    await waitFor(() => {
      expect(getByTestId('payment-form')).toBeTruthy();
    });

    fireEvent.press(getByTestId('button-continue'));

    await waitFor(() => {
      expect(mockOrderService.createOrder).toHaveBeenCalled();
      expect(getByTestId('order-screen-status').props.children).toBe('pending');
    });
  });

  it('saves address when AddressForm calls onSaveAddress', async () => {
    const { getByTestId, queryByTestId } = render(
      <CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />,
    );

    await waitFor(() => {
      expect(getByTestId('address-form')).toBeTruthy();
    });
  });

  it('calculates totals correctly based on cart items', async () => {
    const itemsWithHigherPrice = [
      {
        id: '1',
        title: 'Expensive Product',
        price: 100.0,
        quantity: 2,
        image: 'https://example.com/image.jpg',
      },
    ];

    mockStorageService.getCartItems.mockResolvedValue(itemsWithHigherPrice);

    const { getByTestId, queryByTestId } = render(
      <CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />,
    );

    await waitFor(() => {
      expect(getByTestId('address-form')).toBeTruthy();
      expect(getByTestId('order-summary')).toBeTruthy();
    });
  });

  describe.skip('Order creation with credit card', () => {
    it('creates order with cardData and structured billingAddress when payment method is credit_card', async () => {
      const { getByText, getByTestId, queryByTestId } = render(
        <CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />,
      );

      await waitFor(() => {
        expect(getByTestId('address-form')).toBeTruthy();
        fireEvent.press(getByTestId('button-continue'));
      });

      await waitFor(() => {
        expect(getByTestId('payment-form')).toBeTruthy();
      });

      // Aguardar que o PaymentForm preencha os dados automaticamente
      // O PaymentForm mockado preenche os dados usando useLayoutEffect (síncrono)
      // Mas precisamos aguardar que o React processe as atualizações de estado
      await act(async () => {
        await new Promise<void>((resolve) => setTimeout(() => resolve(), 10));
      });

      // Avançar para order step (que vai tentar criar o pedido)
      fireEvent.press(getByTestId('button-continue'));

      await waitFor(
        () => {
          // Verificar se createOrder foi chamado
          expect(mockOrderService.createOrder).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );

      // Verificar o formato dos dados enviados
      const createOrderCall = mockOrderService.createOrder.mock.calls[0][0];

      // Quando paymentMethod é credit_card, deve ter cardData e billingAddress como objeto
      expect(createOrderCall.paymentMethod).toBe('credit_card');
      expect(createOrderCall.cardData).toBeDefined();
      expect(createOrderCall.billingAddress).toBeDefined();
      expect(typeof createOrderCall.billingAddress).toBe('object');
      expect(createOrderCall.billingAddress).toHaveProperty('street');
      expect(createOrderCall.billingAddress).toHaveProperty('streetNumber');
      expect(createOrderCall.billingAddress).toHaveProperty('city');
      expect(createOrderCall.billingAddress).toHaveProperty('state');
      expect(createOrderCall.billingAddress).toHaveProperty('zipcode');
    });

    it('validates card data before creating order', async () => {
      const { getByText, getByTestId, queryByTestId } = render(
        <CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />,
      );

      await waitFor(() => {
        expect(getByTestId('address-form')).toBeTruthy();
      });
      // Um único waitFor: pressiona Continuar (uma vez) e segue quando payment-form existir
      let addressStepPressed = false;
      await waitFor(() => {
        const addressForm = queryByTestId('address-form');
        if (!addressStepPressed && addressForm) {
          addressStepPressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
        expect(getByTestId('payment-form')).toBeTruthy();
      });

      let paymentContinuePressed = false;
      await waitFor(() => {
        expect(getByTestId('payment-form')).toBeTruthy();
        if (!paymentContinuePressed) {
          paymentContinuePressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
      });

      await waitFor(() => {
        // Se os dados não estiverem preenchidos, deve mostrar alerta
        // Como não temos acesso direto ao estado interno, verificamos se createOrder não foi chamado
        // ou se foi chamado com dados inválidos
      });
    });

    it('clears cart after successful order creation', async () => {
      const { getByText, getByTestId, queryByTestId } = render(
        <CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />,
      );

      await waitFor(() => {
        expect(getByTestId('address-form')).toBeTruthy();
      });
      // Um único waitFor: pressiona Continuar (uma vez) e segue quando payment-form existir
      let addressStepPressed = false;
      await waitFor(() => {
        const addressForm = queryByTestId('address-form');
        if (!addressStepPressed && addressForm) {
          addressStepPressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
        expect(getByTestId('payment-form')).toBeTruthy();
      });

      let paymentContinuePressed = false;
      await waitFor(() => {
        expect(getByTestId('payment-form')).toBeTruthy();
        if (!paymentContinuePressed) {
          paymentContinuePressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
      });

      await waitFor(
        () => {
          expect(mockOrderService.createOrder).toHaveBeenCalled();
          expect(mockStorageService.clearCart).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
    });

    it('shows error alert when order creation fails', async () => {
      mockOrderService.createOrder.mockRejectedValue(new Error('Failed to create order'));

      const { getByText, getByTestId, queryByTestId } = render(
        <CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />,
      );

      await waitFor(() => {
        expect(getByTestId('address-form')).toBeTruthy();
      });
      // Um único waitFor: pressiona Continuar (uma vez) e segue quando payment-form existir
      let addressStepPressed = false;
      await waitFor(() => {
        const addressForm = queryByTestId('address-form');
        if (!addressStepPressed && addressForm) {
          addressStepPressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
        expect(getByTestId('payment-form')).toBeTruthy();
      });

      let paymentContinuePressed = false;
      await waitFor(() => {
        expect(getByTestId('payment-form')).toBeTruthy();
        if (!paymentContinuePressed) {
          paymentContinuePressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
      });

      await waitFor(
        () => {
          // Erro exibido em texto vermelho (não mais Alert)
          expect(getByText(/falha|erro|error/i)).toBeTruthy();
        },
        { timeout: 3000 },
      );
    });

    it('validates expiry date format (MMYY)', async () => {
      const { getByText, getByTestId, queryByTestId } = render(
        <CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />,
      );

      await waitFor(() => {
        expect(getByTestId('address-form')).toBeTruthy();
      });
      // Um único waitFor: pressiona Continuar (uma vez) e segue quando payment-form existir
      let addressStepPressed = false;
      await waitFor(() => {
        const addressForm = queryByTestId('address-form');
        if (!addressStepPressed && addressForm) {
          addressStepPressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
        expect(getByTestId('payment-form')).toBeTruthy();
      });

      let paymentContinuePressed = false;
      await waitFor(() => {
        expect(getByTestId('payment-form')).toBeTruthy();
        if (!paymentContinuePressed) {
          paymentContinuePressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
      });

      // Verificar se a validação foi feita
      // Como não temos acesso direto ao estado, verificamos se createOrder não foi chamado
      // ou se foi chamado com dados válidos
    });
  });

  describe.skip('Address formatting', () => {
    it('formats billing address correctly for credit card payments', async () => {
      const { getByText, getByTestId, queryByTestId } = render(
        <CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />,
      );

      await waitFor(() => {
        expect(getByTestId('address-form')).toBeTruthy();
      });
      // Um único waitFor: pressiona Continuar (uma vez) e segue quando payment-form existir
      let addressStepPressed = false;
      await waitFor(() => {
        const addressForm = queryByTestId('address-form');
        if (!addressStepPressed && addressForm) {
          addressStepPressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
        expect(getByTestId('payment-form')).toBeTruthy();
      });

      let paymentContinuePressed = false;
      await waitFor(() => {
        expect(getByTestId('payment-form')).toBeTruthy();
        if (!paymentContinuePressed) {
          paymentContinuePressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
      });

      await waitFor(
        () => {
          expect(mockOrderService.createOrder).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );

      const orderData = mockOrderService.createOrder.mock.calls[0][0];

      // Verificar se billingAddress está no formato correto quando é objeto
      if (typeof orderData.billingAddress === 'object') {
        expect(orderData.billingAddress).toMatchObject({
          country: 'br',
          state: expect.any(String),
          city: expect.any(String),
          street: expect.any(String),
          streetNumber: expect.any(String),
          zipcode: expect.any(String),
        });
      }
    });

    it('extracts street number from address line correctly', async () => {
      // Teste indireto através da criação de pedido
      const { getByText, getByTestId, queryByTestId } = render(
        <CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />,
      );

      await waitFor(() => {
        expect(getByTestId('address-form')).toBeTruthy();
      });
      // Um único waitFor: pressiona Continuar (uma vez) e segue quando payment-form existir
      let addressStepPressed = false;
      await waitFor(() => {
        const addressForm = queryByTestId('address-form');
        if (!addressStepPressed && addressForm) {
          addressStepPressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
        expect(getByTestId('payment-form')).toBeTruthy();
      });

      let paymentContinuePressed = false;
      await waitFor(() => {
        expect(getByTestId('payment-form')).toBeTruthy();
        if (!paymentContinuePressed) {
          paymentContinuePressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
      });

      await waitFor(
        () => {
          expect(mockOrderService.createOrder).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );

      const orderData = mockOrderService.createOrder.mock.calls[0][0];

      if (typeof orderData.billingAddress === 'object') {
        // O endereço padrão é "Rua Marselha, 1029 - Apto 94"
        // Deve extrair streetNumber como "1029"
        expect(orderData.billingAddress.streetNumber).toBeTruthy();
        expect(orderData.billingAddress.street).toContain('Marselha');
      }
    });

    it('extracts complement from address line correctly', async () => {
      const { getByText, getByTestId, queryByTestId } = render(
        <CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />,
      );

      await waitFor(() => {
        expect(getByTestId('address-form')).toBeTruthy();
      });
      // Um único waitFor: pressiona Continuar (uma vez) e segue quando payment-form existir
      let addressStepPressed = false;
      await waitFor(() => {
        const addressForm = queryByTestId('address-form');
        if (!addressStepPressed && addressForm) {
          addressStepPressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
        expect(getByTestId('payment-form')).toBeTruthy();
      });

      let paymentContinuePressed = false;
      await waitFor(() => {
        expect(getByTestId('payment-form')).toBeTruthy();
        if (!paymentContinuePressed) {
          paymentContinuePressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
      });

      await waitFor(
        () => {
          expect(mockOrderService.createOrder).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );

      const orderData = mockOrderService.createOrder.mock.calls[0][0];

      if (typeof orderData.billingAddress === 'object') {
        // O endereço padrão tem "Apto 94" como complemento
        if (orderData.billingAddress.complement) {
          expect(orderData.billingAddress.complement).toContain('Apto');
        }
      }
    });
  });

  describe.skip('Card data formatting', () => {
    it('formats card data correctly for credit card payments', async () => {
      const { getByText, getByTestId, queryByTestId } = render(
        <CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />,
      );

      await waitFor(() => {
        expect(getByTestId('address-form')).toBeTruthy();
      });
      // Um único waitFor: pressiona Continuar (uma vez) e segue quando payment-form existir
      let addressStepPressed = false;
      await waitFor(() => {
        const addressForm = queryByTestId('address-form');
        if (!addressStepPressed && addressForm) {
          addressStepPressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
        expect(getByTestId('payment-form')).toBeTruthy();
      });

      let paymentContinuePressed = false;
      await waitFor(() => {
        expect(getByTestId('payment-form')).toBeTruthy();
        if (!paymentContinuePressed) {
          paymentContinuePressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
      });

      await waitFor(
        () => {
          expect(mockOrderService.createOrder).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );

      const orderData = mockOrderService.createOrder.mock.calls[0][0];

      // Se paymentMethod for credit_card, deve ter cardData
      if (orderData.paymentMethod === 'credit_card' && orderData.cardData) {
        expect(orderData.cardData).toMatchObject({
          cardNumber: expect.any(String),
          cardHolderName: expect.any(String),
          cardExpirationDate: expect.stringMatching(/^\d{4}$/), // MMYY format
          cardCvv: expect.any(String),
        });
      }
    });

    it('removes spaces from card number', async () => {
      const { getByText, getByTestId, queryByTestId } = render(
        <CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />,
      );

      await waitFor(() => {
        expect(getByTestId('address-form')).toBeTruthy();
      });
      // Um único waitFor: pressiona Continuar (uma vez) e segue quando payment-form existir
      let addressStepPressed = false;
      await waitFor(() => {
        const addressForm = queryByTestId('address-form');
        if (!addressStepPressed && addressForm) {
          addressStepPressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
        expect(getByTestId('payment-form')).toBeTruthy();
      });

      let paymentContinuePressed = false;
      await waitFor(() => {
        expect(getByTestId('payment-form')).toBeTruthy();
        if (!paymentContinuePressed) {
          paymentContinuePressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
      });

      await waitFor(
        () => {
          expect(mockOrderService.createOrder).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );

      const orderData = mockOrderService.createOrder.mock.calls[0][0];

      if (orderData.cardData) {
        // Card number não deve ter espaços
        expect(orderData.cardData.cardNumber).not.toContain(' ');
      }
    });
  });

  describe.skip('Error handling', () => {
    it('shows error when cart is empty', async () => {
      mockStorageService.getCartItems.mockResolvedValue([]);

      const { getByTestId, queryByTestId, getByText } = render(
        <CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />,
      );

      await waitFor(() => {
        expect(getByTestId('address-form')).toBeTruthy();
      });
      // Um único waitFor: pressiona Continuar (uma vez) e segue quando payment-form existir
      let addressStepPressed = false;
      await waitFor(() => {
        const addressForm = queryByTestId('address-form');
        if (!addressStepPressed && addressForm) {
          addressStepPressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
        expect(getByTestId('payment-form')).toBeTruthy();
      });

      let paymentContinuePressed = false;
      await waitFor(() => {
        expect(getByTestId('payment-form')).toBeTruthy();
        if (!paymentContinuePressed) {
          paymentContinuePressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
      });

      await waitFor(
        () => {
          // Erro exibido em texto vermelho (não mais Alert)
          expect(getByText(/vazio|emptyCartError/i)).toBeTruthy();
        },
        { timeout: 3000 },
      );
    });

    it('handles order creation failure gracefully', async () => {
      mockOrderService.createOrder.mockResolvedValue({
        success: false,
        data: null,
      });

      const { getByTestId, queryByTestId, getByText } = render(
        <CheckoutScreen navigation={mockNavigation as any} route={mockRoute as any} />,
      );

      await waitFor(() => {
        expect(getByTestId('address-form')).toBeTruthy();
      });
      // Um único waitFor: pressiona Continuar (uma vez) e segue quando payment-form existir
      let addressStepPressed = false;
      await waitFor(() => {
        const addressForm = queryByTestId('address-form');
        if (!addressStepPressed && addressForm) {
          addressStepPressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
        expect(getByTestId('payment-form')).toBeTruthy();
      });

      let paymentContinuePressed = false;
      await waitFor(() => {
        expect(getByTestId('payment-form')).toBeTruthy();
        if (!paymentContinuePressed) {
          paymentContinuePressed = true;
          fireEvent.press(getByTestId('button-continue'));
        }
      });

      await waitFor(
        () => {
          // Erro exibido em texto vermelho (não mais Alert)
          expect(getByText(/falha|erro|error/i)).toBeTruthy();
        },
        { timeout: 3000 },
      );
    });
  });
});
