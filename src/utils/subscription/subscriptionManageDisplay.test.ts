import {
  formatSubscriptionManageDate,
  subscriptionAccessUntilIso,
  subscriptionIsCancelingPresentation,
  subscriptionIsCanceledPresentation,
  subscriptionIsDesaturatedPresentation,
  subscriptionManageStatusLabel,
} from '@/utils/subscription/subscriptionManageDisplay';

describe('subscriptionManageDisplay', () => {
  it('formata dia de calendário UTC sem shift de fuso', () => {
    expect(formatSubscriptionManageDate('2026-07-31T00:00:00.000Z')).toBe('31/07/2026');
    expect(formatSubscriptionManageDate(null)).toBe('—');
  });

  it('prevê accessValidUntil como D−1 da próxima cobrança', () => {
    expect(subscriptionAccessUntilIso(null, '2026-08-01T00:00:00.000Z')).toBe('2026-07-31T00:00:00.000Z');
    expect(subscriptionAccessUntilIso('2026-07-15T00:00:00.000Z', '2026-08-01T00:00:00.000Z')).toBe(
      '2026-07-15T00:00:00.000Z',
    );
  });

  it('trata cancelAtPeriodEnd como em cancelamento, não como cancelado efetivo', () => {
    const row = { status: 'ACTIVE', cancelAtPeriodEnd: true };

    expect(subscriptionIsCancelingPresentation(row)).toBe(true);
    expect(subscriptionIsCanceledPresentation(row)).toBe(false);
    expect(subscriptionIsDesaturatedPresentation(row)).toBe(true);
    expect(subscriptionManageStatusLabel('ACTIVE', true)).toEqual({
      label: 'Em cancelamento',
      badgeColor: 'orange',
    });
  });

  it('trata status CANCELED como cancelado efetivo', () => {
    const row = { status: 'CANCELED', cancelAtPeriodEnd: false, canceledAt: '2026-07-01T00:00:00.000Z' };

    expect(subscriptionIsCancelingPresentation(row)).toBe(false);
    expect(subscriptionIsCanceledPresentation(row)).toBe(true);
    expect(subscriptionIsDesaturatedPresentation(row)).toBe(true);
    expect(subscriptionManageStatusLabel('CANCELED', false)).toEqual({
      label: 'Cancelado',
      badgeColor: 'orange',
    });
  });

  it('trata status PAST_DUE como pagamento pendente', () => {
    expect(subscriptionManageStatusLabel('PAST_DUE', false)).toEqual({
      label: 'Pagamento pendente',
      badgeColor: 'orange',
    });
  });
});
