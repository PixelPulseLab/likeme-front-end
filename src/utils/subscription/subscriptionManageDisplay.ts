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

export function formatSubscriptionManageDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR');
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
