import type { OrderSubscriptionSummary } from '@/types/order';
import type { Product } from '@/types/product';
import { catalogTypeTranslatedBadgeLabels } from '@/types/product';
import {
  subscriptionIsCancelingPresentation,
  subscriptionIsCanceledPresentation,
} from '@/utils/subscription/subscriptionManageDisplay';

type TranslateFn = (key: string, options?: { defaultValue?: string }) => string;

export function orderItemBadgeLabels(
  product: Product | undefined,
  translate: TranslateFn,
  subscription?: OrderSubscriptionSummary | null,
): string[] {
  const labels = catalogTypeTranslatedBadgeLabels(product?.type, translate);
  const categoryName = product?.categoryNames?.[0] ?? product?.categoryName;
  if (categoryName?.trim()) {
    labels.push(categoryName.trim());
  }

  if (subscription && product?.id && subscription.productId === product.id) {
    if (subscriptionIsCanceledPresentation(subscription)) {
      labels.push(translate('profile.acquisitionList.statusCanceled', { defaultValue: 'Cancelado' }));
    } else if (subscriptionIsCancelingPresentation(subscription)) {
      labels.push(translate('profile.acquisitionList.statusCanceling', { defaultValue: 'Em cancelamento' }));
    }
  }

  return labels;
}
