import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ManageProtocolSubscriptionScreen from './index';
import { subscriptionService } from '@/services/payment/subscriptionService';

const t = (key: string, opts?: Record<string, string>) => opts?.defaultValue ?? key;

jest.mock('@/hooks/i18n', () => ({
  useTranslation: () => ({ t }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@/analytics', () => ({
  useAnalyticsScreen: () => undefined,
}));

jest.mock('@/components/ui/layout', () => {
  const { View } = require('react-native');
  return {
    ScreenWithHeader: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
  };
});

jest.mock('@/components/ui/buttons', () => {
  const { Text, TouchableOpacity } = require('react-native');
  return {
    PrimaryButton: ({ label, onPress, disabled, testID }: any) => (
      <TouchableOpacity onPress={onPress} disabled={disabled} testID={testID ?? `button-${label}`}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
    SecondaryButton: ({ label, onPress, disabled, testID }: any) => (
      <TouchableOpacity onPress={onPress} disabled={disabled} testID={testID ?? `button-${label}`}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('@/components/ui/badge', () => {
  const { Text } = require('react-native');
  return ({ label }: any) => <Text>{label}</Text>;
});

jest.mock('@/screens/marketplace/CheckoutScreen/address/AddressForm', () => {
  const mockAddress = {
    fullName: 'Maria Silva',
    addressLine1: 'Rua Teste',
    streetNumber: '123',
    addressLine2: '',
    neighborhood: 'Centro',
    city: 'Sao Paulo',
    state: 'SP',
    zipCode: '05332-000',
    phone: '11999999999',
  };

  return {
    __esModule: true,
    default: () => null,
    EMPTY_ADDRESS: mockAddress,
    isAddressFilled: () => true,
  };
});

jest.mock('@/screens/marketplace/CheckoutScreen/payment/PaymentForm', () => {
  const { Text, View } = require('react-native');
  return function PaymentForm() {
    return (
      <View testID='payment-form'>
        <Text>Payment Form</Text>
      </View>
    );
  };
});

jest.mock('@/hooks/marketplace/usePayment', () => ({
  usePayment: () => ({
    cardholderName: 'Maria Silva',
    cardNumber: '4111111111111111',
    expiryDate: '12/30',
    cvv: '123',
    cpf: '12345678901',
    paymentFieldErrors: {},
    onCardholderNameChange: jest.fn(),
    onCardNumberChange: jest.fn(),
    onExpiryDateChange: jest.fn(),
    onCvvChange: jest.fn(),
    onCpfChange: jest.fn(),
    setPaymentFieldErrors: jest.fn(),
    validatePaymentFields: () => null,
    getCardData: () => ({
      cardNumber: '4111111111111111',
      cardHolderName: 'Maria Silva',
      cardExpirationDate: '1230',
      cardCvv: '123',
      cpf: '12345678901',
    }),
  }),
}));

jest.mock('@/services/payment/subscriptionService', () => ({
  subscriptionService: {
    getManageSubscription: jest.fn(),
    updateSubscriptionPaymentMethod: jest.fn(),
    reactivateSubscription: jest.fn(),
  },
}));

jest.mock('@/utils/navigation/productNavigation', () => ({
  navigateToProductDetailsScreen: jest.fn(),
}));

const navigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

describe('ManageProtocolSubscriptionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    (subscriptionService.getManageSubscription as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        subscriptionId: 'subscription-1',
        productId: 'product-1',
        status: 'PAST_DUE',
        cancelAtPeriodEnd: false,
        startedAt: '2026-08-01T00:00:00.000Z',
        lastBillingAt: '2026-08-01T00:00:00.000Z',
        nextBillingAt: '2026-09-01T00:00:00.000Z',
        accessValidUntil: '2026-09-01T00:00:00.000Z',
        priceCents: 9900,
        billingPeriod: 'MONTHLY',
        benefits: [],
        canCancel: false,
        canReactivate: false,
        canUpdatePaymentMethod: true,
      },
    });
  });

  it('ignora duplo toque enquanto a atualização de pagamento ainda está em andamento', async () => {
    let resolveUpdate: (value: unknown) => void = () => undefined;
    (subscriptionService.updateSubscriptionPaymentMethod as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve;
        }),
    );

    const { getByText, getByTestId } = render(
      <ManageProtocolSubscriptionScreen
        navigation={navigation as any}
        route={{
          key: 'ManageProtocolSubscription',
          name: 'ManageProtocolSubscription',
          params: {
            subscriptionId: 'subscription-1',
            programName: 'Programa',
            focusUpdatePayment: true,
          },
        }}
      />,
    );

    await waitFor(() => expect(getByTestId('payment-form')).toBeTruthy());

    const submitButton = getByText('Salvar novo cartão');
    fireEvent.press(submitButton);
    fireEvent.press(submitButton);

    expect(subscriptionService.updateSubscriptionPaymentMethod).toHaveBeenCalledTimes(1);

    resolveUpdate({
      success: true,
      data: {
        subscriptionId: 'subscription-1',
        status: 'ACTIVE',
        chargeRetried: true,
      },
    });

    await waitFor(() => {
      expect(subscriptionService.getManageSubscription).toHaveBeenCalledTimes(2);
    });
  });
});
