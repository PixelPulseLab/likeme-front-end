import { navigateRootStack, rootStackNavigationFrom } from '@/utils/navigation/rootStackNavigation';

type Navigation = {
  getParent?: () => Navigation | undefined;
  navigate: (screen: string, params?: unknown) => void;
};

export function navigateToActivitiesActives(navigation: Navigation): void {
  navigateRootStack(navigation, 'Activities', { initialTab: 'actives' });
}

export function navigateToActivitiesOrders(navigation: Navigation): void {
  navigateRootStack(navigation, 'Activities', { initialTab: 'history', initialFilter: 'orders' });
}

export function navigateToOrderDetail(navigation: Navigation, orderId: string): void {
  navigateRootStack(navigation, 'OrderDetail', { orderId });
}
