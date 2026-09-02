import { Platform } from 'react-native';
import type { ApplePayClientConfig, ApplePayPaymentData } from '@/types/payment/paymentInstrument';
import { logger } from '@/utils/logger';
import { brlAmountString, readNonEmptyString } from '@/services/payment/googlePayService';

export class ApplePayCancelledError extends Error {
  constructor() {
    super('Apple Pay cancelled');
    this.name = 'ApplePayCancelledError';
  }
}

type ApplePayNativeModule = {
  canMakePayments: () => Promise<boolean>;
  requestPayment: (options: Record<string, string>) => Promise<{ paymentDataJson?: string }>;
};

export function applePayPaymentDataFromTokenJson(tokenJson: string, merchantIdentifier: string): ApplePayPaymentData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(tokenJson);
  } catch (cause) {
    throw new Error('Token do Apple Pay inválido', { cause });
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Token do Apple Pay inválido');
  }

  const record = parsed as Record<string, unknown>;
  const headerRaw = record.header;
  const header = headerRaw && typeof headerRaw === 'object' ? (headerRaw as Record<string, unknown>) : null;
  const version = readNonEmptyString(record.version);
  const data = readNonEmptyString(record.data);
  const signature = readNonEmptyString(record.signature);
  const transactionId = readNonEmptyString(header?.transactionId) ?? readNonEmptyString(header?.transaction_id);
  const ephemeralPublicKey =
    readNonEmptyString(header?.ephemeralPublicKey) ?? readNonEmptyString(header?.ephemeral_public_key);
  const publicKeyHash = readNonEmptyString(header?.publicKeyHash) ?? readNonEmptyString(header?.public_key_hash);

  if (version !== 'EC_v1' || !data || !signature || !transactionId || !ephemeralPublicKey || !publicKeyHash) {
    throw new Error('Token do Apple Pay incompleto');
  }

  return {
    version: 'EC_v1',
    merchantIdentifier,
    header: {
      transactionId,
      ephemeralPublicKey,
      publicKeyHash,
    },
    signature,
    data,
  };
}

async function loadApplePayNative(): Promise<ApplePayNativeModule | null> {
  if (Platform.OS !== 'ios') {
    return null;
  }

  try {
    const { requireNativeModule } = await import('expo-modules-core');
    return requireNativeModule('ApplePay') as ApplePayNativeModule;
  } catch (cause) {
    logger.warn('[applePay] Módulo nativo indisponível', { cause });
    return null;
  }
}

export async function isApplePayAvailableOnDevice(): Promise<boolean> {
  const nativeModule = await loadApplePayNative();
  if (!nativeModule) {
    return false;
  }

  try {
    return (await nativeModule.canMakePayments()) === true;
  } catch (cause) {
    logger.warn('[applePay] canMakePayments falhou', { cause });
    return false;
  }
}

export async function requestApplePayPaymentData(
  config: ApplePayClientConfig,
  amount: number,
): Promise<ApplePayPaymentData> {
  const nativeModule = await loadApplePayNative();
  if (!nativeModule) {
    throw new Error('Apple Pay indisponível neste dispositivo');
  }

  try {
    const response = await nativeModule.requestPayment({
      merchantIdentifier: config.merchantIdentifier,
      merchantName: config.merchantName,
      countryCode: config.countryCode,
      currencyCode: config.currencyCode,
      amount: brlAmountString(amount),
    });
    const tokenJson = readNonEmptyString(response.paymentDataJson);
    if (!tokenJson) {
      throw new Error('Resposta do Apple Pay sem token');
    }
    return applePayPaymentDataFromTokenJson(tokenJson, config.merchantIdentifier);
  } catch (cause) {
    if (cause instanceof ApplePayCancelledError) {
      throw cause;
    }
    const message = cause instanceof Error ? cause.message : String(cause);
    if (/cancel/i.test(message) || /abort/i.test(message)) {
      throw new ApplePayCancelledError();
    }
    throw cause instanceof Error ? cause : new Error('Falha ao solicitar Apple Pay', { cause });
  }
}
