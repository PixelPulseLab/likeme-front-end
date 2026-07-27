import { numberUtils } from '@/utils';

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

/** Cancelamento agendado: ainda ACTIVE com acesso até o fim do ciclo. */
export function subscriptionIsCancelingPresentation(subscription: SubscriptionCanceledFields): boolean {
  const normalized = normalizedSubscriptionStatus(subscription.status);
  if (normalized === 'CANCELED' || normalized === 'CANCELLED') {
    return false;
  }
  return Boolean(subscription.cancelAtPeriodEnd);
}

/** Cancelamento efetivado: sem acesso ao conteúdo do protocolo. */
export function subscriptionIsCanceledPresentation(subscription: SubscriptionCanceledFields): boolean {
  if (subscription.canceledAt) {
    return true;
  }
  const normalized = normalizedSubscriptionStatus(subscription.status);
  return normalized === 'CANCELED' || normalized === 'CANCELLED';
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
  if (normalized === 'ACTIVE' || normalized === 'PENDING') {
    return { label: 'Ativo', badgeColor: 'lime' };
  }
  if (normalized === 'CANCELED' || normalized === 'CANCELLED') {
    return { label: 'Cancelado', badgeColor: 'orange' };
  }
  return { label: status || '—', badgeColor: 'beige' };
}
