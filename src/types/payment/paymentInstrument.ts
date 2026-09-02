import { PAYMENT_METHOD, type PaymentMethod } from '@/constants/payment/paymentMethod';

export type GooglePayPaymentData = {
  signature: string;
  intermediateSigningKey: {
    signedKey: string;
    signatures: string[];
  };
  version: 'ECv2';
  signedMessage: string;
  merchantIdentifier: string;
};

export type GooglePayPaymentInstrument = {
  type: typeof PAYMENT_METHOD.GOOGLE_PAY;
  payload: GooglePayPaymentData;
  cpf?: string;
  phone?: string;
};

export type ApplePayPaymentData = {
  version: 'EC_v1';
  merchantIdentifier: string;
  header: {
    transactionId: string;
    ephemeralPublicKey: string;
    publicKeyHash: string;
  };
  signature: string;
  data: string;
};

export type ApplePayPaymentInstrument = {
  type: typeof PAYMENT_METHOD.APPLE_PAY;
  payload: ApplePayPaymentData;
  cpf?: string;
  phone?: string;
};

export type WalletPaymentInstrument = GooglePayPaymentInstrument | ApplePayPaymentInstrument;

export type PaymentMethodAvailability = {
  type: PaymentMethod;
  oneOff: boolean;
  subscription: boolean;
  reason?: string;
};

export type GooglePayClientConfig = {
  gateway: 'pagarme';
  gatewayMerchantId: string;
  merchantName: string;
};

export type ApplePayClientConfig = {
  merchantIdentifier: string;
  merchantName: string;
  countryCode: 'BR';
  currencyCode: 'BRL';
};

export type ListPaymentMethodsResponse = {
  paymentMethods: PaymentMethodAvailability[];
  googlePay?: GooglePayClientConfig | null;
  applePay?: ApplePayClientConfig | null;
};

export function isWalletCheckoutMethod(value: PaymentMethod): boolean {
  return value === PAYMENT_METHOD.GOOGLE_PAY || value === PAYMENT_METHOD.APPLE_PAY;
}
