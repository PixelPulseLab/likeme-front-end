import {
  subscriptionIsCancelingPresentation,
  subscriptionIsCanceledPresentation,
  subscriptionManageStatusLabel,
} from '@/utils/subscription/subscriptionManageDisplay';

describe('subscriptionManageDisplay', () => {
  it('trata cancelAtPeriodEnd como em cancelamento, não como cancelado efetivo', () => {
    const row = { status: 'ACTIVE', cancelAtPeriodEnd: true };

    expect(subscriptionIsCancelingPresentation(row)).toBe(true);
    expect(subscriptionIsCanceledPresentation(row)).toBe(false);
    expect(subscriptionManageStatusLabel('ACTIVE', true)).toEqual({
      label: 'Em cancelamento',
      badgeColor: 'orange',
    });
  });

  it('trata status CANCELED como cancelado efetivo', () => {
    const row = { status: 'CANCELED', cancelAtPeriodEnd: false, canceledAt: '2026-07-01T00:00:00.000Z' };

    expect(subscriptionIsCancelingPresentation(row)).toBe(false);
    expect(subscriptionIsCanceledPresentation(row)).toBe(true);
    expect(subscriptionManageStatusLabel('CANCELED', false)).toEqual({
      label: 'Cancelado',
      badgeColor: 'orange',
    });
  });
});
