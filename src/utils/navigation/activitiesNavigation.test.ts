import { navigateToActivitiesActives, navigateToActivitiesOrders, navigateToOrderDetail } from './activitiesNavigation';

describe('navigateToActivitiesActives', () => {
  it('navega para Activities na aba de ativos', () => {
    const navigate = jest.fn();
    navigateToActivitiesActives({ navigate });

    expect(navigate).toHaveBeenCalledWith('Activities', { initialTab: 'actives' });
  });
});

describe('navigateToActivitiesOrders', () => {
  it('navega para Activities com filtro de pedidos no navigator raiz', () => {
    const parentNavigate = jest.fn();
    const navigation = {
      getParent: () => ({ navigate: parentNavigate }),
      navigate: jest.fn(),
    };

    navigateToActivitiesOrders(navigation);

    expect(parentNavigate).toHaveBeenCalledWith('Activities', {
      initialTab: 'history',
      initialFilter: 'orders',
    });
  });

  it('usa o próprio navigation quando não há parent', () => {
    const navigate = jest.fn();
    const navigation = { navigate };

    navigateToActivitiesOrders(navigation);

    expect(navigate).toHaveBeenCalledWith('Activities', {
      initialTab: 'history',
      initialFilter: 'orders',
    });
  });
});

describe('navigateToOrderDetail', () => {
  it('navega para OrderDetail com orderId', () => {
    const navigate = jest.fn();
    navigateToOrderDetail({ navigate }, 'order-abc');

    expect(navigate).toHaveBeenCalledWith('OrderDetail', { orderId: 'order-abc' });
  });
});
