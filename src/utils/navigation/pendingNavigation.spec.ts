import {
  clearPendingDeepLinkNavigation,
  consumePendingDeepLinkNavigation,
  setPendingDeepLinkNavigation,
} from './pendingDeepLinkNavigation';
import {
  clearPendingPushNavigation,
  consumePendingPushNavigation,
  setPendingPushNavigation,
} from './pendingPushNavigation';

describe('pending navigation helpers', () => {
  afterEach(() => {
    clearPendingDeepLinkNavigation();
    clearPendingPushNavigation();
  });

  it('limpa deep link pendente sem consumir destino obsoleto', () => {
    setPendingDeepLinkNavigation({
      screen: 'ManageProtocolSubscription',
      params: {
        subscriptionId: 'subscription-user-a',
        programName: 'Programa',
        focusUpdatePayment: true,
      },
    });

    clearPendingDeepLinkNavigation();

    expect(consumePendingDeepLinkNavigation()).toBeNull();
  });

  it('limpa push pendente sem consumir destino obsoleto', () => {
    setPendingPushNavigation({
      screen: 'ManageProtocolSubscription',
      params: {
        subscriptionId: 'subscription-user-a',
        programName: 'Programa',
        focusUpdatePayment: true,
      },
    });

    clearPendingPushNavigation();

    expect(consumePendingPushNavigation()).toBeNull();
  });
});
