import { Platform } from 'react-native';
import { renderHook, waitFor } from '@testing-library/react-native';
import { PAYMENT_METHOD } from '@/constants/payment/paymentMethod';
import { useCheckoutPaymentMethods } from './useCheckoutPaymentMethods';

const mockUseFeatureFlag = jest.fn();
const mockListPaymentMethods = jest.fn();
const mockIsGooglePayAvailableOnDevice = jest.fn();
const mockIsApplePayAvailableOnDevice = jest.fn();

jest.mock('@/hooks/featureFlags/useFeatureFlag', () => ({
  useFeatureFlag: (flagKey: string) => mockUseFeatureFlag(flagKey),
}));

jest.mock('@/services', () => ({
  paymentService: {
    listPaymentMethods: () => mockListPaymentMethods(),
  },
}));

jest.mock('@/services/payment/googlePayService', () => ({
  isGooglePayAvailableOnDevice: (...args: unknown[]) => mockIsGooglePayAvailableOnDevice(...args),
}));

jest.mock('@/services/payment/applePayService', () => ({
  isApplePayAvailableOnDevice: () => mockIsApplePayAvailableOnDevice(),
}));

describe('useCheckoutPaymentMethods', () => {
  const originalPlatform = Platform.OS;
  const googlePayConfig = {
    gateway: 'pagarme' as const,
    gatewayMerchantId: 'acc_merchant',
    merchantName: 'Like:Me',
  };
  const applePayConfig = {
    merchantIdentifier: 'merchant.app.likeme.com',
    merchantName: 'Like:Me',
    countryCode: 'BR' as const,
    currencyCode: 'BRL' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFeatureFlag.mockReturnValue({ isEnabled: true, isLoading: false });
    mockIsGooglePayAvailableOnDevice.mockResolvedValue(true);
    mockIsApplePayAvailableOnDevice.mockResolvedValue(true);
    mockListPaymentMethods.mockResolvedValue({
      data: {
        paymentMethods: [
          { type: PAYMENT_METHOD.GOOGLE_PAY, oneOff: true, subscription: false },
          { type: PAYMENT_METHOD.APPLE_PAY, oneOff: true, subscription: false },
        ],
        googlePay: googlePayConfig,
        applePay: applePayConfig,
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalPlatform });
  });

  it('não oferece wallet quando a feature flag está desligada', async () => {
    mockUseFeatureFlag.mockReturnValue({ isEnabled: false, isLoading: false });
    Object.defineProperty(Platform, 'OS', { value: 'android' });

    const { result } = renderHook(() => useCheckoutPaymentMethods(false));

    await waitFor(() => {
      expect(result.current.googlePayAvailable).toBe(false);
      expect(result.current.applePayAvailable).toBe(false);
    });
    expect(result.current.googlePayConfig).toBeNull();
    expect(result.current.applePayConfig).toBeNull();
    expect(mockListPaymentMethods).not.toHaveBeenCalled();
  });

  it('oferece Google Pay no Android quando a API e o device permitem', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'android' });

    const { result } = renderHook(() => useCheckoutPaymentMethods(false));

    await waitFor(() => {
      expect(result.current.googlePayAvailable).toBe(true);
    });
    expect(result.current.applePayAvailable).toBe(false);
    expect(mockIsGooglePayAvailableOnDevice).toHaveBeenCalled();
  });

  it('oferece Apple Pay no iOS quando a API e o device permitem', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios' });

    const { result } = renderHook(() => useCheckoutPaymentMethods(false));

    await waitFor(() => {
      expect(result.current.applePayAvailable).toBe(true);
    });
    expect(result.current.googlePayAvailable).toBe(false);
    expect(mockIsApplePayAvailableOnDevice).toHaveBeenCalled();
  });

  it('esconde Google Pay no carrinho de protocolo enquanto subscription for false', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'android' });

    const { result } = renderHook(() => useCheckoutPaymentMethods(true));

    await waitFor(() => {
      expect(result.current.googlePayAvailable).toBe(false);
    });
    expect(mockIsGooglePayAvailableOnDevice).not.toHaveBeenCalled();
  });

  it('não inventa merchant ID quando a API omite googlePay', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'android' });
    mockListPaymentMethods.mockResolvedValue({
      data: {
        paymentMethods: [{ type: PAYMENT_METHOD.GOOGLE_PAY, oneOff: true, subscription: false }],
      },
    });

    const { result } = renderHook(() => useCheckoutPaymentMethods(false));

    await waitFor(() => {
      expect(result.current.googlePayAvailable).toBe(false);
    });
    expect(result.current.googlePayConfig).toBeNull();
    expect(mockIsGooglePayAvailableOnDevice).not.toHaveBeenCalled();
  });
});
