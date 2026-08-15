import { PRODUCT_CATALOG_TYPE } from '@/types/product';
import { ORDER_PAYMENT_STATUS } from '@/constants/order/orderPaymentStatus';
import type { Order, OrderItem } from '@/types/order';
import { orderCardStatusKey } from '@/utils/marketplace/orderStatusDisplay';
import { subscriptionIsCanceledPresentation } from '@/utils/subscription/subscriptionManageDisplay';

export type OrderItemActionKey = 'viewProtocol' | 'createActivity';

export type OrderItemPrimaryAction = { kind: 'action'; action: OrderItemActionKey } | { kind: 'canceled' };

export function orderItemActionKey(catalogType: string | undefined | null): OrderItemActionKey | null {
  if (catalogType === PRODUCT_CATALOG_TYPE.PROGRAM) {
    return 'viewProtocol';
  }
  if (catalogType === PRODUCT_CATALOG_TYPE.SERVICE) {
    return 'createActivity';
  }
  return null;
}

export function orderItemIsCanceled(
  order: Pick<Order, 'status' | 'deliveryStatus' | 'paymentStatus' | 'subscription'>,
  item: Pick<OrderItem, 'productId' | 'product'>,
): boolean {
  const statusKey = orderCardStatusKey(order);
  if (statusKey === 'cancelled' || statusKey === 'payment_refunded') {
    return true;
  }

  const subscription = order.subscription;
  if (
    subscription &&
    item.productId &&
    subscription.productId === item.productId &&
    subscriptionIsCanceledPresentation(subscription)
  ) {
    return true;
  }

  return false;
}

export function orderItemPrimaryAction(
  order: Pick<Order, 'status' | 'deliveryStatus' | 'paymentStatus' | 'subscription'>,
  item: Pick<OrderItem, 'productId' | 'product'>,
): OrderItemPrimaryAction | null {
  if (orderItemIsCanceled(order, item)) {
    const catalogAction = orderItemActionKey(item.product?.type);
    if (!catalogAction) {
      return null;
    }
    return { kind: 'canceled' };
  }

  if (order.paymentStatus !== ORDER_PAYMENT_STATUS.PAID) {
    return null;
  }

  const action = orderItemActionKey(item.product?.type);
  if (!action) {
    return null;
  }
  return { kind: 'action', action };
}
