import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { FEATURE_FLAGS } from '@/constants';
import { PAYMENT_METHOD } from '@/constants/payment/paymentMethod';
import { useFeatureFlag } from '@/hooks/featureFlags/useFeatureFlag';
import { paymentService } from '@/services';
import { isApplePayAvailableOnDevice } from '@/services/payment/applePayService';
import { isGooglePayAvailableOnDevice } from '@/services/payment/googlePayService';
import type { ApplePayClientConfig, GooglePayClientConfig } from '@/types/payment/paymentInstrument';
import { logger } from '@/utils/logger';

function methodEnabledForCheckout(
  methods: Array<{ type: string; oneOff?: boolean; subscription?: boolean }>,
  type: string,
  subscriptionCheckout: boolean,
): boolean {
  const method = methods.find((item) => item.type === type);
  return subscriptionCheckout ? Boolean(method?.subscription) : Boolean(method?.oneOff);
}

export function useCheckoutPaymentMethods(subscriptionCheckout: boolean) {
  const { isEnabled: isWalletEnabled } = useFeatureFlag(FEATURE_FLAGS.WALLET_ENABLED);
  const [googlePayConfig, setGooglePayConfig] = useState<GooglePayClientConfig | null>(null);
  const [applePayConfig, setApplePayConfig] = useState<ApplePayClientConfig | null>(null);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);
  const [applePayAvailable, setApplePayAvailable] = useState(false);

  useEffect(() => {
    const hideWallets = () => {
      setGooglePayAvailable(false);
      setApplePayAvailable(false);
      setGooglePayConfig(null);
      setApplePayConfig(null);
    };

    if (!isWalletEnabled) {
      hideWallets();
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const response = await paymentService.listPaymentMethods();
        const methods = response.data?.paymentMethods ?? [];
        const googlePayFromApi = response.data?.googlePay ?? null;
        const applePayFromApi = response.data?.applePay ?? null;
        const nextGooglePayConfig = googlePayFromApi?.gatewayMerchantId ? googlePayFromApi : null;
        const nextApplePayConfig = applePayFromApi?.merchantIdentifier ? applePayFromApi : null;

        if (cancelled) {
          return;
        }

        setGooglePayConfig(nextGooglePayConfig);
        setApplePayConfig(nextApplePayConfig);

        const googlePayEnabled = methodEnabledForCheckout(methods, PAYMENT_METHOD.GOOGLE_PAY, subscriptionCheckout);
        const applePayEnabled = methodEnabledForCheckout(methods, PAYMENT_METHOD.APPLE_PAY, subscriptionCheckout);

        if (Platform.OS === 'android' && googlePayEnabled && nextGooglePayConfig) {
          const available = await isGooglePayAvailableOnDevice(nextGooglePayConfig);
          if (!cancelled) {
            setGooglePayAvailable(available);
            setApplePayAvailable(false);
          }
          return;
        }

        if (Platform.OS === 'ios' && applePayEnabled && nextApplePayConfig) {
          const available = await isApplePayAvailableOnDevice();
          if (!cancelled) {
            setApplePayAvailable(available);
            setGooglePayAvailable(false);
          }
          return;
        }

        if (!cancelled) {
          setGooglePayAvailable(false);
          setApplePayAvailable(false);
        }
      } catch (cause) {
        logger.warn('[useCheckoutPaymentMethods] Falha ao listar métodos de pagamento', { cause });
        if (!cancelled) {
          hideWallets();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [subscriptionCheckout, isWalletEnabled]);

  return {
    googlePayAvailable,
    applePayAvailable,
    googlePayConfig,
    applePayConfig,
  };
}
