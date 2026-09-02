import { Platform } from 'react-native';
import { PAYMENT_METHOD } from '@/constants/payment/paymentMethod';
import type { GooglePayClientConfig, GooglePayPaymentData } from '@/types/payment/paymentInstrument';
import { logger } from '@/utils/logger';

export class GooglePayCancelledError extends Error {
  constructor() {
    super('Google Pay cancelled');
    this.name = 'GooglePayCancelledError';
  }
}

const GOOGLE_PAY_GATEWAY = 'pagarme';
const GOOGLE_PAY_ALLOWED_NETWORKS = ['VISA', 'MASTERCARD'] as const;
const GOOGLE_PAY_AUTH_METHODS = ['PAN_ONLY', 'CRYPTOGRAM_3DS'] as const;

type GooglePayPaymentDataRequest = {
  apiVersion: 2;
  apiVersionMinor: 0;
  merchantInfo: { merchantName: string };
  allowedPaymentMethods: Array<{
    type: 'CARD';
    parameters: {
      allowedAuthMethods: string[];
      allowedCardNetworks: string[];
    };
    tokenizationSpecification: {
      type: 'PAYMENT_GATEWAY';
      parameters: {
        gateway: string;
        gatewayMerchantId: string;
      };
    };
  }>;
  transactionInfo: {
    totalPriceStatus: 'FINAL';
    totalPrice: string;
    currencyCode: 'BRL';
    countryCode: 'BR';
  };
};

export function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => readNonEmptyString(item)).filter((item): item is string => item != null);
}

export function brlAmountString(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) {
    return '0.00';
  }
  return amount.toFixed(2);
}

export function googlePayPaymentDataFromTokenJson(tokenJson: string, merchantIdentifier: string): GooglePayPaymentData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(tokenJson);
  } catch (cause) {
    throw new Error('Token do Google Pay inválido');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Token do Google Pay inválido');
  }

  const record = parsed as Record<string, unknown>;
  const signature = readNonEmptyString(record.signature);
  const signedMessage = readNonEmptyString(record.signedMessage);
  const versionRaw = readNonEmptyString(record.protocolVersion) ?? readNonEmptyString(record.version);
  const signingKeyRaw = record.intermediateSigningKey;
  const signingKey =
    signingKeyRaw && typeof signingKeyRaw === 'object' ? (signingKeyRaw as Record<string, unknown>) : null;
  const signedKey = readNonEmptyString(signingKey?.signedKey) ?? readNonEmptyString(signingKey?.signed_key);
  const signatures = readStringArray(signingKey?.signatures);

  if (!signature || !signedMessage || !signedKey || signatures.length === 0 || versionRaw !== 'ECv2') {
    throw new Error('Token do Google Pay incompleto');
  }

  return {
    signature,
    intermediateSigningKey: {
      signedKey,
      signatures,
    },
    version: 'ECv2',
    signedMessage,
    merchantIdentifier,
  };
}

function tokenJsonFromPaymentResponse(details: unknown): string {
  if (!details || typeof details !== 'object') {
    throw new Error('Resposta do Google Pay vazia');
  }

  const paymentMethodData = (details as Record<string, unknown>).paymentMethodData;
  if (!paymentMethodData || typeof paymentMethodData !== 'object') {
    throw new Error('Resposta do Google Pay sem método de pagamento');
  }

  const tokenizationData = (paymentMethodData as Record<string, unknown>).tokenizationData;
  if (!tokenizationData || typeof tokenizationData !== 'object') {
    throw new Error('Resposta do Google Pay sem token');
  }

  const token = readNonEmptyString((tokenizationData as Record<string, unknown>).token);
  if (!token) {
    throw new Error('Resposta do Google Pay sem token');
  }

  return token;
}

function googlePayPaymentDataRequest(config: GooglePayClientConfig, totalPrice: string): GooglePayPaymentDataRequest {
  return {
    apiVersion: 2,
    apiVersionMinor: 0,
    merchantInfo: { merchantName: config.merchantName },
    allowedPaymentMethods: [
      {
        type: 'CARD',
        parameters: {
          allowedAuthMethods: [...GOOGLE_PAY_AUTH_METHODS],
          allowedCardNetworks: [...GOOGLE_PAY_ALLOWED_NETWORKS],
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            gateway: GOOGLE_PAY_GATEWAY,
            gatewayMerchantId: config.gatewayMerchantId,
          },
        },
      },
    ],
    transactionInfo: {
      totalPriceStatus: 'FINAL',
      totalPrice,
      currencyCode: 'BRL',
      countryCode: 'BR',
    },
  };
}

type MakePaymentModule = {
  PaymentRequest: new (
    methods: Array<{ supportedMethods: string; data: GooglePayPaymentDataRequest }>,
    details: { total: { amount: { currency: string; value: string } } },
  ) => {
    canMakePayment: () => Promise<boolean | null>;
    show: () => Promise<{ details?: unknown }>;
  };
};

async function loadMakePaymentModule(): Promise<MakePaymentModule | null> {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    return (await import('@google/react-native-make-payment')) as MakePaymentModule;
  } catch (cause) {
    logger.warn('[googlePay] Módulo nativo indisponível', { cause });
    return null;
  }
}

async function createPaymentRequest(config: GooglePayClientConfig, totalPrice: string) {
  const nativeModule = await loadMakePaymentModule();
  if (!nativeModule) {
    return null;
  }

  const request = googlePayPaymentDataRequest(config, totalPrice);
  return new nativeModule.PaymentRequest([{ supportedMethods: PAYMENT_METHOD.GOOGLE_PAY, data: request }], {
    total: {
      amount: {
        currency: 'BRL',
        value: totalPrice,
      },
    },
  });
}

export async function isGooglePayAvailableOnDevice(config: GooglePayClientConfig): Promise<boolean> {
  const paymentRequest = await createPaymentRequest(config, '1.00');
  if (!paymentRequest) {
    return false;
  }

  try {
    return (await paymentRequest.canMakePayment()) === true;
  } catch (cause) {
    logger.warn('[googlePay] canMakePayment falhou', { cause });
    return false;
  }
}

export async function requestGooglePayPaymentData(
  config: GooglePayClientConfig,
  amount: number,
): Promise<GooglePayPaymentData> {
  const totalPrice = brlAmountString(amount);
  const paymentRequest = await createPaymentRequest(config, totalPrice);
  if (!paymentRequest) {
    throw new Error('Google Pay indisponível neste dispositivo');
  }

  try {
    const response = await paymentRequest.show();
    const tokenJson = tokenJsonFromPaymentResponse(response.details);
    return googlePayPaymentDataFromTokenJson(tokenJson, config.gatewayMerchantId);
  } catch (cause) {
    if (cause instanceof GooglePayCancelledError) {
      throw cause;
    }
    const message = cause instanceof Error ? cause.message : String(cause);
    if (/cancel/i.test(message) || /abort/i.test(message)) {
      throw new GooglePayCancelledError();
    }
    throw cause instanceof Error ? cause : new Error('Falha ao solicitar Google Pay');
  }
}
