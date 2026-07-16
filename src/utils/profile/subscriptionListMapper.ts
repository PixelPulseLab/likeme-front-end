import type { SubscriptionListItem } from '@/types/subscription/subscription';
import type { UserSubscriptionListItem } from '@/services/payment/subscriptionService';
import type { Order } from '@/types/order';
import { PRODUCT_CATALOG_TYPE, catalogTypeTranslatedBadgeLabels } from '@/types/product';
import {
  subscriptionIsCancelingPresentation,
  subscriptionIsCanceledPresentation,
} from '@/utils/subscription/subscriptionManageDisplay';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400';

type TranslateFn = (key: string, options?: { defaultValue?: string }) => string;

function subscriptionStatusBadge(row: UserSubscriptionListItem, t: TranslateFn): string | null {
  if (subscriptionIsCanceledPresentation(row)) {
    return t('profile.acquisitionList.statusCanceled', { defaultValue: 'Cancelado' });
  }
  if (subscriptionIsCancelingPresentation(row)) {
    return t('profile.acquisitionList.statusCanceling', { defaultValue: 'Em cancelamento' });
  }
  return null;
}

export function mapSubscriptionToListItem(row: UserSubscriptionListItem, t: TranslateFn): SubscriptionListItem {
  const typeBadges = catalogTypeTranslatedBadgeLabels(row.product.type, t);
  const statusBadge = subscriptionStatusBadge(row, t);
  const isCanceled = subscriptionIsCanceledPresentation(row);
  const badges = [...typeBadges, ...(statusBadge ? [statusBadge] : [])];

  return {
    id: row.id,
    kind: 'protocol',
    productId: row.productId,
    title: row.product.name,
    image: row.product.image?.trim() || DEFAULT_IMAGE,
    badges,
    acquiredAt: row.createdAt,
    subscriptionId: row.id,
    communityId: row.programCommunity?.communityId,
    description: row.programCommunity?.description ?? row.product.description ?? null,
    status: row.status,
    cancelAtPeriodEnd: Boolean(row.cancelAtPeriodEnd),
    canceledAt: row.canceledAt ?? null,
    cancelRequestedAt: row.cancelRequestedAt ?? null,
    accessValidUntil: row.accessValidUntil ?? null,
    desaturated: isCanceled,
  };
}

export function serviceSubscriptionsFromOrders(orders: Order[]): SubscriptionListItem[] {
  const byProductId = new Map<string, SubscriptionListItem>();

  for (const order of orders) {
    if (order.paymentStatus !== 'paid') {
      continue;
    }

    for (const item of order.items ?? []) {
      const product = item.product;
      if (!product || product.type !== PRODUCT_CATALOG_TYPE.SERVICE) {
        continue;
      }

      const existing = byProductId.get(product.id);
      const acquiredAt = order.createdAt;
      if (existing && new Date(existing.acquiredAt).getTime() >= new Date(acquiredAt).getTime()) {
        continue;
      }

      byProductId.set(product.id, {
        id: `${order.id}-${product.id}`,
        kind: 'service',
        productId: product.id,
        title: product.name,
        image: product.image?.trim() || DEFAULT_IMAGE,
        badges: [],
        acquiredAt,
      });
    }
  }

  return Array.from(byProductId.values()).sort(
    (a, b) => new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime(),
  );
}

export function filterSubscriptionItems(items: SubscriptionListItem[], query: string): SubscriptionListItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return items;
  }
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(normalized) ||
      item.badges.some((badge) => badge.toLowerCase().includes(normalized)),
  );
}
