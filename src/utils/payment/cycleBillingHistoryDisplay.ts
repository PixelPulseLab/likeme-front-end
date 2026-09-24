import type { CycleBillingHistory } from '@/types/activity';
import {
  ORDER_CARD_STATUS_PRESENTATION,
  type OrderCardStatusPresentation,
} from '@/utils/marketplace/orderStatusDisplay';

const CYCLE_BILLING_STATUS_KEY = {
  PAID: 'paid',
  PENDING: 'payment_pending',
  FAILED: 'payment_failed',
  REFUNDED: 'payment_refunded',
} as const;

export function cycleBillingStatusPresentation(status: CycleBillingHistory['status']): OrderCardStatusPresentation {
  return ORDER_CARD_STATUS_PRESENTATION[CYCLE_BILLING_STATUS_KEY[status]];
}

export function cycleBillingKindLabel(billingType: CycleBillingHistory['billingType']): {
  labelKey: string;
  labelDefault: string;
} {
  if (billingType === 'RETRY') {
    return {
      labelKey: 'activities.cycleBillingRetry',
      labelDefault: 'Nova tentativa',
    };
  }
  return {
    labelKey: 'activities.cycleBillingRenewal',
    labelDefault: 'Renovação',
  };
}

export function cycleBillingCardLabel(
  cycleBilling: Pick<CycleBillingHistory, 'cardBrand' | 'cardLastDigits'>,
): string | null {
  const lastDigits = cycleBilling.cardLastDigits;
  const maskedLastDigits = lastDigits ? `•••• ${lastDigits}` : null;
  const brand = cycleBilling.cardBrand?.trim() || null;
  const parts = [brand, maskedLastDigits].filter((part): part is string => part != null && part.length > 0);
  if (parts.length === 0) {
    return null;
  }
  return parts.join(' ');
}
