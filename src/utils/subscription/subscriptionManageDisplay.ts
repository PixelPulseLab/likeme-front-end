import { numberUtils } from '@/utils';
import {
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_STATUSES_ALLOWING_PAYMENT_METHOD_UPDATE,
  SUBSCRIPTION_STATUSES_WITH_PROTOCOL_ACCESS,
  type SubscriptionStatusKey,
} from '@/constants/subscription/subscriptionStatus';

const BILLING_PERIOD_SUFFIX: Record<string, string> = {
  WEEKLY: '/ semana',
  BIWEEKLY: '/ quinzena',
  MONTHLY: '/ mês',
  BIMONTHLY: '/ bimestre',
  QUARTERLY: '/ trimestre',
  SEMIANNUAL: '/ semestre',
  YEARLY: '/ ano',
};

/**
 * Datas de assinatura/cobrança são dias de calendário em UTC (ex.: D−1 de nextBillingAt).
 * Formatar em UTC evita o shift de um dia em America/Sao_Paulo.
 */
export function formatSubscriptionManageDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/** Preview do fim de acesso: persistido ou D−1 da próxima cobrança (espelha o backend). */
export function subscriptionAccessUntilIso(
  accessValidUntil: string | null | undefined,
  nextBillingAt: string | null | undefined,
): string | null {
  if (accessValidUntil) {
    return accessValidUntil;
  }
  if (!nextBillingAt) {
    return null;
  }
  const nextBilling = new Date(nextBillingAt);
  if (Number.isNaN(nextBilling.getTime())) {
    return null;
  }
  const accessUntil = new Date(nextBilling.getTime());
  accessUntil.setUTCDate(accessUntil.getUTCDate() - 1);
  return accessUntil.toISOString();
}

export function formatSubscriptionManagePrice(priceCents: number, billingPeriod: string): string {
  const amount = numberUtils.formatCurrency(priceCents / 100);
  const suffix = BILLING_PERIOD_SUFFIX[billingPeriod] ?? '';
  return suffix ? `${amount} ${suffix}` : amount;
}

export type SubscriptionCanceledFields = {
  status?: string | null;
  cancelAtPeriodEnd?: boolean | null;
  canceledAt?: string | null;
};

function normalizedSubscriptionStatus(status?: string | null): string {
  return status?.trim().toUpperCase() ?? '';
}

function isCanceledStatus(normalized: string): boolean {
  return normalized === SUBSCRIPTION_STATUS.CANCELED || normalized === 'CANCELLED';
}

export function subscriptionIsCancelingPresentation(subscription: SubscriptionCanceledFields): boolean {
  const normalized = normalizedSubscriptionStatus(subscription.status);
  if (isCanceledStatus(normalized)) {
    return false;
  }
  return Boolean(subscription.cancelAtPeriodEnd);
}

export function subscriptionIsCanceledPresentation(subscription: SubscriptionCanceledFields): boolean {
  if (subscription.canceledAt) {
    return true;
  }
  return isCanceledStatus(normalizedSubscriptionStatus(subscription.status));
}

export function subscriptionIsPastDuePresentation(status?: string | null): boolean {
  return normalizedSubscriptionStatus(status) === SUBSCRIPTION_STATUS.PAST_DUE;
}

export function subscriptionIsUnpaidPresentation(status?: string | null): boolean {
  return normalizedSubscriptionStatus(status) === SUBSCRIPTION_STATUS.UNPAID;
}

export function subscriptionAllowsPaymentMethodUpdate(status?: string | null): boolean {
  return SUBSCRIPTION_STATUSES_ALLOWING_PAYMENT_METHOD_UPDATE.includes(
    normalizedSubscriptionStatus(status) as SubscriptionStatusKey,
  );
}

export function subscriptionHasProtocolContentAccess(subscription: SubscriptionCanceledFields): boolean {
  if (subscriptionIsCanceledPresentation(subscription)) {
    return false;
  }
  const normalized = normalizedSubscriptionStatus(subscription.status);
  return normalized === '' || SUBSCRIPTION_STATUSES_WITH_PROTOCOL_ACCESS.includes(normalized as SubscriptionStatusKey);
}

/** Card/hero em PB: em cancelamento ou cancelado (APP-318 / APP-325). */
export function subscriptionIsDesaturatedPresentation(subscription: SubscriptionCanceledFields): boolean {
  return subscriptionIsCancelingPresentation(subscription) || subscriptionIsCanceledPresentation(subscription);
}

export function subscriptionCanceledOnDate(
  subscription: SubscriptionCanceledFields & { cancelRequestedAt?: string | null },
): string | null {
  return subscription.cancelRequestedAt || subscription.canceledAt || null;
}

export function subscriptionManageStatusLabel(
  status: string,
  cancelAtPeriodEnd: boolean,
): { label: string; badgeColor: 'lime' | 'orange' | 'beige' } {
  if (subscriptionIsCancelingPresentation({ status, cancelAtPeriodEnd })) {
    return { label: 'Em cancelamento', badgeColor: 'orange' };
  }
  const normalized = status.trim().toUpperCase();
  if (normalized === SUBSCRIPTION_STATUS.ACTIVE || normalized === SUBSCRIPTION_STATUS.PENDING) {
    return { label: 'Ativo', badgeColor: 'lime' };
  }
  if (normalized === SUBSCRIPTION_STATUS.PAST_DUE) {
    return { label: 'Pagamento pendente', badgeColor: 'orange' };
  }
  if (normalized === SUBSCRIPTION_STATUS.UNPAID) {
    return { label: 'Inadimplente', badgeColor: 'orange' };
  }
  if (isCanceledStatus(normalized)) {
    return { label: 'Cancelado', badgeColor: 'orange' };
  }
  return { label: status || '—', badgeColor: 'beige' };
}
