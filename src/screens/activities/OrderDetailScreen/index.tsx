import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { ScreenWithHeader } from '@/components/ui/layout';
import { SecondaryButton } from '@/components/ui/buttons';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { orderService } from '@/services';
import { useTranslation } from '@/hooks/i18n';
import { useAnalyticsScreen } from '@/analytics';
import { formatPrice } from '@/utils';
import { logger } from '@/utils/logger';
import { orderItemBadgeLabels } from '@/utils/marketplace/orderItemBadges';
import { orderItemActionKey } from '@/utils/marketplace/orderItemAction';
import { formatOrderDisplayId } from '@/utils/marketplace/orderDisplayId';
import { orderVoucherDiscountAmount } from '@/utils/marketplace/orderVoucherDiscount';
import { navigateToProductDetailsScreen } from '@/utils/navigation/productNavigation';
import { PRODUCT_CATALOG_TYPE } from '@/types/product';
import type { Order, OrderItem } from '@/types/order';
import type { RootStackParamList } from '@/types/navigation';
import { COLORS } from '@/constants';
import { styles } from './styles';

type Props = StackScreenProps<RootStackParamList, 'OrderDetail'>;

const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400';
const ORDER_LOAD_ERROR_MESSAGE = 'Não foi possível carregar o pedido.';

function formatItemDateDisplay(dateString?: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

const OrderDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  useAnalyticsScreen({ screenName: 'OrderDetail', screenClass: 'OrderDetailScreen' });
  const { t } = useTranslation();
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const orderIdRef = useRef(orderId);
  orderIdRef.current = orderId;

  useEffect(() => {
    let cancelled = false;

    const fetchOrder = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await orderService.getOrderById(orderIdRef.current);
        if (cancelled) return;
        if (!response.success || !response.data) {
          throw new Error(ORDER_LOAD_ERROR_MESSAGE);
        }
        setOrder(response.data);
      } catch (error) {
        if (cancelled) return;
        logger.error('[OrderDetailScreen] Falha ao carregar pedido', {
          orderId: orderIdRef.current,
          cause: error,
        });
        const message =
          error instanceof Error && error.message.trim() ? error.message.trim() : ORDER_LOAD_ERROR_MESSAGE;
        setLoadError(message);
        setOrder(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const voucherDiscount = order ? orderVoucherDiscountAmount(order) : 0;
  const voucherCode = order?.voucher?.code?.trim() ?? '';

  const openProduct = useCallback(
    (productId: string) => {
      navigateToProductDetailsScreen(navigation, { productId });
    },
    [navigation],
  );

  const renderItemAction = (item: OrderItem) => {
    const action = orderItemActionKey(item.product?.type);
    if (!action) return null;

    const labelKey = action === 'viewProgram' ? 'checkout.viewProgram' : 'checkout.addToCalendar';
    const defaultLabel = action === 'viewProgram' ? 'Ver programa' : 'Adicionar no calendário';

    return (
      <TouchableOpacity
        style={styles.orderItemActionButton}
        onPress={() => openProduct(item.productId)}
        activeOpacity={0.7}
      >
        <Text style={styles.orderItemActionButtonText}>{t(labelKey, { defaultValue: defaultLabel })}</Text>
      </TouchableOpacity>
    );
  };

  const renderOrderItem = (item: OrderItem) => {
    const product = item.product;
    const tagLabels = orderItemBadgeLabels(product, t, order?.subscription);
    const imageUri = product?.image?.trim() || DEFAULT_PRODUCT_IMAGE;
    const catalogType = product?.type;
    const showDeliveryForecast =
      catalogType === PRODUCT_CATALOG_TYPE.PHYSICAL || catalogType === PRODUCT_CATALOG_TYPE.AMAZON;

    return (
      <View key={item.id} style={styles.orderItemCard}>
        <CachedImage source={{ uri: imageUri }} style={styles.orderItemImage} />
        <View style={styles.orderItemContent}>
          {tagLabels.length > 0 && (
            <View style={styles.orderItemTags}>
              {tagLabels.map((label, index) => (
                <View key={`${label}-${index}`} style={styles.orderItemTag}>
                  <Text style={styles.orderItemTagText}>{label}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.orderItemTitle} numberOfLines={2}>
            {product?.name ?? t('activities.item')}
          </Text>

          {product?.description?.trim() ? (
            <Text style={styles.orderItemSubtitle} numberOfLines={2}>
              {product.description.trim()}
            </Text>
          ) : null}

          {product?.createdAt ? (
            <Text style={styles.orderItemMeta}>
              {t('cart.date')}: {formatItemDateDisplay(product.createdAt)}
            </Text>
          ) : null}

          <View style={styles.orderItemFooter}>
            <Text style={styles.orderItemPrice}>{formatPrice(item.unitPrice)}</Text>
            <Text style={styles.orderItemQuantity}>
              {t('cart.quantityShort', { defaultValue: 'QTD' })}: {String(item.quantity).padStart(2, '0')}
            </Text>
          </View>

          {showDeliveryForecast && order?.createdAt ? (
            <Text style={styles.orderItemMeta}>
              {t('checkout.deliveryForecast', { defaultValue: 'Previsão de entrega' })}{' '}
              {formatItemDateDisplay(order.createdAt)}
            </Text>
          ) : null}

          {renderItemAction(item)}
        </View>
      </View>
    );
  };

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{ onBackPress: () => navigation.goBack() }}
      contentContainerStyle={styles.container}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={COLORS.TEXT} />
        </View>
      ) : loadError || !order ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>
            {loadError ?? t('activities.orderLoadError', { defaultValue: ORDER_LOAD_ERROR_MESSAGE })}
          </Text>
          <SecondaryButton label={t('common.back')} onPress={() => navigation.goBack()} />
        </View>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.titleSection}>
              <Text style={styles.screenTitle}>{t('activities.order')}</Text>
              <View style={styles.titleUnderline} />
            </View>

            <Text style={styles.orderNumberLabel}>
              {t('activities.orderNumber', { defaultValue: 'Número do pedido' })}
            </Text>
            <Text style={styles.orderNumber}>{formatOrderDisplayId(order.id)}</Text>

            <View style={styles.summarySection}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('cart.subtotal')}</Text>
                <Text style={styles.summaryValue}>{formatPrice(order.subtotal)}</Text>
              </View>
              {voucherDiscount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    {voucherCode
                      ? t('activities.orderVoucherDiscount', {
                          code: voucherCode,
                          defaultValue: `Desconto (${voucherCode})`,
                        })
                      : t('checkout.voucherDiscount', { defaultValue: 'Desconto' })}
                  </Text>
                  <Text style={styles.summaryValue}>-{formatPrice(voucherDiscount)}</Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('cart.shipping')}</Text>
                <Text style={styles.summaryValue}>{formatPrice(order.shippingCost)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, styles.summaryTotalLabel]}>{t('cart.total')}</Text>
                <Text style={[styles.summaryValue, styles.summaryTotalValue]}>{formatPrice(order.total)}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.productsTitle}>{t('cart.yourProducts')}</Text>
            {(order.items ?? []).map(renderOrderItem)}
          </ScrollView>

          <View style={styles.footer}>
            <SecondaryButton
              label={t('common.back')}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              size='large'
            />
          </View>
        </>
      )}
    </ScreenWithHeader>
  );
};

export default OrderDetailScreen;
