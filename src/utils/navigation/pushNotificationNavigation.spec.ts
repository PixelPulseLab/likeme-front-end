import {
  ACTIVITY_CREATED_PUSH_TYPE,
  ACTIVITY_REMINDER_PUSH_TYPE,
  SUBSCRIPTION_PAST_DUE_PUSH_TYPE,
  pushNavigationTargetFromData,
} from './pushNotificationNavigation';

describe('pushNavigationTargetFromData', () => {
  it('abre atividade específica para confirmação de criação', () => {
    expect(
      pushNavigationTargetFromData({
        type: ACTIVITY_CREATED_PUSH_TYPE,
        activityId: 'activity-42',
      }),
    ).toEqual({
      screen: 'Activities',
      params: {
        initialTab: 'actives',
        focusActivityId: 'activity-42',
      },
    });
  });

  it('abre atividade específica para lembrete agendado', () => {
    expect(
      pushNavigationTargetFromData({
        type: ACTIVITY_REMINDER_PUSH_TYPE,
        activityId: 'activity-99',
      }),
    ).toEqual({
      screen: 'Activities',
      params: {
        initialTab: 'actives',
        focusActivityId: 'activity-99',
      },
    });
  });

  it('abre gestão com foco em atualizar pagamento para subscription_past_due', () => {
    expect(
      pushNavigationTargetFromData({
        type: SUBSCRIPTION_PAST_DUE_PUSH_TYPE,
        subscriptionId: 'sub-past-due-1',
      }),
    ).toEqual({
      screen: 'ManageProtocolSubscription',
      params: {
        subscriptionId: 'sub-past-due-1',
        programName: 'Programa',
        focusUpdatePayment: true,
      },
    });
  });

  it('ignora subscription_past_due sem subscriptionId', () => {
    expect(pushNavigationTargetFromData({ type: SUBSCRIPTION_PAST_DUE_PUSH_TYPE })).toBeNull();
  });

  it('ignora payloads sem type conhecido', () => {
    expect(pushNavigationTargetFromData({ type: 'other', activityId: 'x' })).toBeNull();
    expect(pushNavigationTargetFromData(undefined)).toBeNull();
  });
});
