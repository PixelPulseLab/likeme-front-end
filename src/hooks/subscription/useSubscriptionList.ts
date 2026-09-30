import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  subscriptionService,
  type UserAcquiredServiceItem,
  type UserSubscriptionListItem,
} from '@/services/payment/subscriptionService';
import { buildMarketplaceCategoryBadgeLabels } from '@/utils/marketplace/buildMarketplaceCategoryBadgeLabels';
import type { SubscriptionListItem } from '@/types/subscription/subscription';
import { catalogTypeTranslatedBadgeLabels } from '@/types/product';
import { useTranslation } from '@/hooks/i18n';
import { logger } from '@/utils/logger';
import { subscriptionCardTestId } from '@/constants/e2eTestIds';
import { mapSubscriptionToListItem } from '@/utils/profile/subscriptionListMapper';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400';

function mapServiceToListItem(
  service: UserAcquiredServiceItem,
  translate: (key: string, options?: { defaultValue?: string }) => string,
): SubscriptionListItem {
  const categoryBadges = buildMarketplaceCategoryBadgeLabels(
    { categoryNames: service.product.categoryNames ?? [] },
    [],
  );
  const typeBadges = catalogTypeTranslatedBadgeLabels(service.product.type ?? 'service', translate);

  return {
    id: `${service.productId}-${service.acquiredAt}`,
    kind: 'service',
    productId: service.productId,
    title: service.product.name,
    image: service.product.image?.trim() || DEFAULT_IMAGE,
    badges: [...categoryBadges, ...typeBadges].filter(Boolean),
    acquiredAt: service.acquiredAt,
  };
}

export function useSubscriptionList(appliedSearchQuery = '') {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;

  const [subscriptions, setSubscriptions] = useState<UserSubscriptionListItem[]>([]);
  const [services, setServices] = useState<SubscriptionListItem[]>([]);
  const [hasContent, setHasContent] = useState(false);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);
  const appliedSearchRef = useRef(appliedSearchQuery);
  appliedSearchRef.current = appliedSearchQuery;

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    const searchTerm = appliedSearchRef.current.trim();
    const silent = Boolean(options?.silent);

    try {
      if (!silent) {
        setLoading(true);
      }

      const subscriptionsResponse = await subscriptionService.listUserSubscriptions(
        searchTerm ? { search: searchTerm } : {},
      );

      if (!subscriptionsResponse.success) {
        throw new Error('Falha ao carregar protocolos');
      }

      const subs = subscriptionsResponse.data?.subscriptions ?? [];
      const serviceRows = subscriptionsResponse.data?.services ?? [];
      setSubscriptions(subs);
      setServices(serviceRows.map((service) => mapServiceToListItem(service, tRef.current)));

      if (!searchTerm) {
        setHasContent(subs.length > 0 || serviceRows.length > 0);
      }
    } catch (loadError) {
      logger.error('[useSubscriptionList] Erro ao carregar assinaturas', loadError);
      setSubscriptions([]);
      setServices([]);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, appliedSearchQuery]);

  const reload = useCallback(() => load({ silent: true }), [load]);

  const protocols = useMemo((): SubscriptionListItem[] => {
    return subscriptions.map((sub) => ({
      ...mapSubscriptionToListItem(sub, tRef.current),
      testID: subscriptionCardTestId(sub.productId),
    }));
  }, [subscriptions]);

  return {
    loading,
    protocols,
    services,
    allProtocols: protocols,
    allServices: services,
    hasContent,
    reload,
  };
}
