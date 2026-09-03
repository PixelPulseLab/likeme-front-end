import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  subscriptionService,
  type UserAcquiredServiceItem,
  type UserSubscriptionListItem,
} from '@/services/payment/subscriptionService';
import { productService } from '@/services';
import { buildMarketplaceCategoryBadgeLabels } from '@/utils/marketplace/buildMarketplaceCategoryBadgeLabels';
import { useCategories } from '@/hooks/category/useCategories';
import type { SubscriptionListItem } from '@/types/subscription/subscription';
import type { Product as ApiProduct } from '@/types/product';
import { catalogTypeTranslatedBadgeLabels } from '@/types/product';
import { useTranslation } from '@/hooks/i18n';
import { logger } from '@/utils/logger';
import { subscriptionCardTestId } from '@/constants/e2eTestIds';
import { mapSubscriptionToListItem } from '@/utils/profile/subscriptionListMapper';
import { programCommunityIdFromProduct } from '@/utils/profile/protocolDetailFromProduct';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400';

async function fetchProductDetails(productIds: string[]): Promise<Map<string, ApiProduct>> {
  const uniqueIds = [...new Set(productIds)];
  const results = await Promise.allSettled(uniqueIds.map((id) => productService.getProductById(id)));

  const map = new Map<string, ApiProduct>();
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success && result.value.data) {
      map.set(uniqueIds[index], result.value.data);
    }
  });
  return map;
}

function mapServiceToListItem(service: UserAcquiredServiceItem): SubscriptionListItem {
  return {
    id: `${service.productId}-${service.acquiredAt}`,
    kind: 'service',
    productId: service.productId,
    title: service.product.name,
    image: service.product.image?.trim() || DEFAULT_IMAGE,
    badges: [],
    acquiredAt: service.acquiredAt,
  };
}

export function useSubscriptionList(appliedSearchQuery = '') {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;

  const { categories } = useCategories();
  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;

  const [subscriptions, setSubscriptions] = useState<UserSubscriptionListItem[]>([]);
  const [services, setServices] = useState<SubscriptionListItem[]>([]);
  const [productMap, setProductMap] = useState<Map<string, ApiProduct>>(new Map());
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
      setServices(serviceRows.map(mapServiceToListItem));

      if (!searchTerm) {
        setHasContent(subs.length > 0 || serviceRows.length > 0);
      }

      const productIds = [...subs.map((s) => s.productId), ...serviceRows.map((s) => s.productId)];
      if (productIds.length > 0) {
        const products = await fetchProductDetails(productIds);
        setProductMap(products);
      } else {
        setProductMap(new Map());
      }
    } catch (loadError) {
      logger.error('[useSubscriptionList] Erro ao carregar assinaturas', loadError);
      setSubscriptions([]);
      setServices([]);
      setProductMap(new Map());
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
    return subscriptions.map((sub) => {
      const item = mapSubscriptionToListItem(sub, tRef.current);
      const fullProduct = productMap.get(sub.productId);
      const categoryBadges = fullProduct ? buildMarketplaceCategoryBadgeLabels(fullProduct, categoriesRef.current) : [];
      const badges = [...categoryBadges, ...item.badges].filter(Boolean);

      return {
        ...item,
        testID: subscriptionCardTestId(sub.productId),
        title: fullProduct?.name ?? item.title,
        image: fullProduct?.image || item.image,
        badges,
        description: item.description ?? fullProduct?.description ?? null,
        agreements: fullProduct?.technicalSpecifications?.trim() || null,
        programType: fullProduct?.programType ?? item.programType,
        communityId: item.communityId || (fullProduct ? programCommunityIdFromProduct(fullProduct) : undefined),
      };
    });
  }, [subscriptions, productMap, categories]);

  const enrichedServices = useMemo((): SubscriptionListItem[] => {
    return services.map((service) => {
      const fullProduct = productMap.get(service.productId);
      const categoryBadges = fullProduct ? buildMarketplaceCategoryBadgeLabels(fullProduct, categoriesRef.current) : [];
      const typeBadges = catalogTypeTranslatedBadgeLabels(fullProduct?.type ?? 'service', tRef.current);

      return {
        ...service,
        title: fullProduct?.name ?? service.title,
        image: fullProduct?.image || service.image,
        badges: [...categoryBadges, ...typeBadges].filter(Boolean),
      };
    });
  }, [services, productMap, categories]);

  return {
    loading,
    protocols,
    services: enrichedServices,
    allProtocols: protocols,
    allServices: enrichedServices,
    hasContent,
    reload,
  };
}
