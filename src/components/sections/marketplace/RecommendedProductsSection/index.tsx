import React, { useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { ProductsCarousel } from '@/components/sections/product';
import { MARKETPLACE_PRODUCT_PLACEHOLDER_IMAGE_URI } from '@/constants';
import {
  SUGGESTED_PRODUCTS_HOME_ACTIVITIES_DEFAULTS,
  useSuggestedProducts,
} from '@/hooks/marketplace/useSuggestedProducts';
import { useTranslation } from '@/hooks/i18n';
import { logSelectContent } from '@/analytics';
import type { RootStackParamList } from '@/types/navigation';
import { formatPriceLabel } from '@/utils/formatters/priceFormatter';
import { navigateToProductDetailsScreen } from '@/utils/navigation/productNavigation';

type RecommendedProductsSectionProps = {
  navigation: StackNavigationProp<RootStackParamList, keyof RootStackParamList>;
  analyticsScreenName: string;
  /** Quando true (default), busca recomendações. */
  enabled?: boolean;
  /** Exclui o produto atual da lista (PDP). */
  excludeProductId?: string;
  categoryId?: string | null;
  providerName?: string;
  limit?: number;
  style?: StyleProp<ViewStyle>;
};

export function RecommendedProductsSection({
  navigation,
  analyticsScreenName,
  enabled = true,
  excludeProductId,
  categoryId,
  providerName = '',
  limit = SUGGESTED_PRODUCTS_HOME_ACTIVITIES_DEFAULTS.limit,
  style,
}: RecommendedProductsSectionProps) {
  const { t } = useTranslation();
  const { products: suggestedProducts, loading } = useSuggestedProducts({
    ...SUGGESTED_PRODUCTS_HOME_ACTIVITIES_DEFAULTS,
    limit,
    categoryId: categoryId ?? undefined,
    enabled,
  });

  const recommendedProducts = useMemo(() => {
    const withoutCurrent = excludeProductId
      ? (suggestedProducts || []).filter((product) => product.id !== excludeProductId)
      : suggestedProducts || [];
    return withoutCurrent.slice(0, limit);
  }, [suggestedProducts, excludeProductId, limit]);

  if (loading && recommendedProducts.length === 0) {
    return null;
  }

  if (recommendedProducts.length === 0) {
    return null;
  }

  return (
    <View style={style}>
      <ProductsCarousel
        title={t('marketplace.recommendedProductsForJourney', { provider: providerName })}
        subtitle={t('marketplace.discoverOptionsForYou')}
        products={recommendedProducts}
        onProductPress={(product) => {
          logSelectContent({
            content_type: 'product',
            item_id: product.id,
            item_name: product.title,
            screen_name: analyticsScreenName,
          });
          navigateToProductDetailsScreen(navigation, {
            productId: product.id,
            product: {
              id: product.id,
              title: product.title,
              price: formatPriceLabel(product.price),
              image: product.image || MARKETPLACE_PRODUCT_PLACEHOLDER_IMAGE_URI,
            },
          });
        }}
      />
    </View>
  );
}
