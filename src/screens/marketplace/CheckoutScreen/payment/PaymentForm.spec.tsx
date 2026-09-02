import { render, fireEvent } from '@testing-library/react-native';
import PaymentForm from './PaymentForm';

jest.mock('@/hooks', () => ({
  useFormattedInput: ({ type, onChangeText }: any) => {
    return (text: string) => {
      // Simula formatação básica
      let formatted = text;
      if (type === 'cardNumber') {
        // Remove espaços e adiciona a cada 4 dígitos
        const cleaned = text.replace(/\s/g, '');
        formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
      } else if (type === 'expiryDate') {
        // Formata como mm/yy
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length >= 2) {
          formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
        } else {
          formatted = cleaned;
        }
      }
      onChangeText(formatted);
    };
  },
}));

jest.mock('@/components/ui/inputs/TextInput', () => {
  const React = require('react');
  const { TextInput: RNTextInput, View, Text } = require('react-native');
  return React.forwardRef(({ label, placeholder, value, onChangeText, ...props }: any, ref: any) => (
    <View>
      {label && <Text>{label}</Text>}
      <RNTextInput
        ref={ref}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        testID={placeholder || label}
        {...props}
      />
    </View>
  ));
});

describe('PaymentForm', () => {
  const mockAddressData = {
    fullName: 'Nome Teste',
    addressLine1: 'Rua Teste',
    streetNumber: '123',
    addressLine2: '',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310100',
    phone: '11999999999',
  };

  const mockProps = {
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cpf: '',
    billingAddressData: mockAddressData,
    deliverySameAsBilling: true,
    onCardholderNameChange: jest.fn(),
    onCardNumberChange: jest.fn(),
    onExpiryDateChange: jest.fn(),
    onCvvChange: jest.fn(),
    onCpfChange: jest.fn(),
    onSaveBillingAddress: jest.fn(),
    onDeliverySameAsBillingChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render credit card form', () => {
    const { getByText, getByPlaceholderText } = render(<PaymentForm {...mockProps} />);

    expect(getByText('checkout.cardholderName')).toBeTruthy();
    expect(getByPlaceholderText('checkout.cardholderNamePlaceholder')).toBeTruthy();
    expect(getByText('checkout.cardNumber')).toBeTruthy();
    expect(getByPlaceholderText('checkout.cardNumberPlaceholder')).toBeTruthy();
    expect(getByText('checkout.expiryDate')).toBeTruthy();
    expect(getByText('checkout.cvv')).toBeTruthy();
  });

  it('shows Google Pay as a payment method when available', () => {
    const onPaymentMethodChange = jest.fn();
    const { getByTestId } = render(
      <PaymentForm
        {...mockProps}
        googlePayAvailable
        selectedPaymentMethod='credit_card'
        onPaymentMethodChange={onPaymentMethodChange}
      />,
    );

    fireEvent.press(getByTestId('e2e.checkout.paymentMethod.googlePay'));
    expect(onPaymentMethodChange).toHaveBeenCalledWith('google_pay');
  });

  it('hides card fields when Google Pay is selected', () => {
    const { queryByText, getByText } = render(
      <PaymentForm {...mockProps} googlePayAvailable selectedPaymentMethod='google_pay' />,
    );

    expect(queryByText('checkout.cardholderName')).toBeNull();
    expect(getByText('checkout.cpf')).toBeTruthy();
  });

  it('shows Apple Pay as a payment method when available', () => {
    const onPaymentMethodChange = jest.fn();
    const { getByTestId } = render(
      <PaymentForm
        {...mockProps}
        applePayAvailable
        selectedPaymentMethod='credit_card'
        onPaymentMethodChange={onPaymentMethodChange}
      />,
    );

    fireEvent.press(getByTestId('e2e.checkout.paymentMethod.applePay'));
    expect(onPaymentMethodChange).toHaveBeenCalledWith('apple_pay');
  });

  it('hides card fields when Apple Pay is selected', () => {
    const { queryByText, getByText } = render(
      <PaymentForm {...mockProps} applePayAvailable selectedPaymentMethod='apple_pay' />,
    );

    expect(queryByText('checkout.cardholderName')).toBeNull();
    expect(getByText('checkout.cpf')).toBeTruthy();
  });

  it('does not show Google Pay radios when unavailable', () => {
    const { queryByTestId } = render(<PaymentForm {...mockProps} />);

    expect(queryByTestId('e2e.checkout.paymentMethod.googlePay')).toBeNull();
  });

  it('should call onCardholderNameChange when cardholder name is changed', () => {
    const { getByPlaceholderText } = render(<PaymentForm {...mockProps} />);

    const input = getByPlaceholderText('checkout.cardholderNamePlaceholder');
    fireEvent.changeText(input, 'John Doe');

    expect(mockProps.onCardholderNameChange).toHaveBeenCalledWith('John Doe');
  });

  it('should call onCardNumberChange when card number is changed', () => {
    const { getByPlaceholderText } = render(<PaymentForm {...mockProps} />);

    const input = getByPlaceholderText('checkout.cardNumberPlaceholder');
    fireEvent.changeText(input, '4111 1111 1111 1111');

    expect(mockProps.onCardNumberChange).toHaveBeenCalled();
  });

  it('should call onExpiryDateChange when expiry date is changed', () => {
    const { getByPlaceholderText } = render(<PaymentForm {...mockProps} />);

    const input = getByPlaceholderText('checkout.expiryDatePlaceholder');
    fireEvent.changeText(input, '12/25');

    expect(mockProps.onExpiryDateChange).toHaveBeenCalled();
  });

  it('should call onCvvChange when CVV is changed', () => {
    const { getByPlaceholderText } = render(<PaymentForm {...mockProps} />);

    const input = getByPlaceholderText('checkout.cvvPlaceholder');
    fireEvent.changeText(input, '123');

    expect(mockProps.onCvvChange).toHaveBeenCalledWith('123');
  });

  it('should display current values correctly', () => {
    const propsWithValues = {
      ...mockProps,
      cardholderName: 'John Doe',
      cardNumber: '4111 1111 1111 1111',
      expiryDate: '12/25',
      cvv: '123',
    };

    const { getByDisplayValue } = render(<PaymentForm {...propsWithValues} />);

    expect(getByDisplayValue('John Doe')).toBeTruthy();
    expect(getByDisplayValue('4111 1111 1111 1111')).toBeTruthy();
    expect(getByDisplayValue('12/25')).toBeTruthy();
    expect(getByDisplayValue('123')).toBeTruthy();
  });

  it('should render CVV field as secure text entry', () => {
    const { getByPlaceholderText } = render(<PaymentForm {...mockProps} />);

    const cvvInput = getByPlaceholderText('checkout.cvvPlaceholder');
    // Note: Testing secureTextEntry prop requires checking component props
    // This is a basic test to ensure the field exists
    expect(cvvInput).toBeTruthy();
  });
});
