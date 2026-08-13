import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { ScreenWithHeader } from '@/components/ui/layout';
import { SecondaryButton } from '@/components/ui/buttons';
import { CachedImage } from '@/components/ui/media/CachedImage';
import CreateActivityModal, { type CreateActivityFormData } from '@/components/sections/activity/CreateActivityModal';
import { orderService, activityService } from '@/services';
import { useTranslation } from '@/hooks/i18n';
import { useAnalyticsScreen } from '@/analytics';
import { formatPrice } from '@/utils';
import { logger } from '@/utils/logger';
import { orderItemBadgeLabels } from '@/utils/marketplace/orderItemBadges';
import { orderItemPrimaryAction } from '@/utils/marketplace/orderItemAction';
import { formatOrderDisplayId } from '@/utils/marketplace/orderDisplayId';
import { orderVoucherDiscountAmount } from '@/utils/marketplace/orderVoucherDiscount';
import { activityInitialDataFromOrderProduct } from '@/utils/activity/activityInitialDataFromOrderProduct';
import { addActivityToDeviceCalendar } from '@/utils/activity/addActivityToDeviceCalendar';
import { navigateRootStack } from '@/utils/navigation/rootStackNavigation';
import { navigateToActivitiesActives } from '@/utils/navigation/activitiesNavigation';
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
  const [isCreateActivityModalVisible, setIsCreateActivityModalVisible] = useState(false);
  const [createActivityInitialData, setCreateActivityInitialData] = useState<CreateActivityFormData | null>(null);
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

  const openProtocol = useCallback(
    (productId: string) => {
      navigateRootStack(navigation, 'ProtocolDetail', { productId });
    },
    [navigation],
  );

  const openCreateActivity = useCallback((item: OrderItem) => {
    setCreateActivityInitialData(activityInitialDataFromOrderProduct(item.product));
    setIsCreateActivityModalVisible(true);
  }, []);

  const closeCreateActivityModal = useCallback(() => {
    setIsCreateActivityModalVisible(false);
    setCreateActivityInitialData(null);
  }, []);

  const saveActivityFromOrder = useCallback(
    async (data: CreateActivityFormData) => {
      try {
        const response = await activityService.createActivity({
          name: data.name,
          type: data.type,
          startDate: data.startDate,
          startTime: data.startTime,
          endDate: data.endDate,
          endTime: data.endTime,
          location: data.location,
          description: data.description,
          reminderEnabled: data.reminderEnabled,
          reminderOffset: data.reminderMinutes ? `${data.reminderMinutes}` : null,
        });

        if (!response?.success || !response.data) {
          throw new Error(response?.message || t('activities.saveError'));
        }

        if (data.addToDeviceCalendar) {
          try {
            await addActivityToDeviceCalendar({
              name: data.name,
              startDate: data.startDate,
              startTime: data.startTime,
              endDate: data.endDate,
              endTime: data.endTime,
              location: data.location,
              description: data.description,
            });
          } catch (calendarError) {
            logger.error('[OrderDetailScreen] Falha ao marcar na agenda do celular', {
              activityId: response.data.id,
              cause: calendarError,
            });
            Alert.alert(
              t('activities.createdWithoutDeviceCalendarTitle', {
                defaultValue: 'Atividade criada',
              }),
              t('activities.createdWithoutDeviceCalendarMessage', {
                defaultValue:
                  'A atividade foi salva em Minhas Atividades, mas não foi possível adicioná-la à agenda do celular.',
              }),
              [
                { text: t('common.ok') },
                {
                  text: t('activities.goToMyActivities', { defaultValue: 'Ver Minhas Atividades' }),
                  onPress: () => navigateToActivitiesActives(navigation),
                },
              ],
            );
            return;
          }
        }

        Alert.alert(
          t('activities.createdFromOrderTitle', { defaultValue: 'Atividade criada' }),
          t('activities.createdFromOrderMessage', {
            defaultValue: 'Sua atividade já está disponível em Minhas Atividades.',
          }),
          [
            { text: t('common.ok') },
            {
              text: t('activities.goToMyActivities', { defaultValue: 'Ver Minhas Atividades' }),
              onPress: () => navigateToActivitiesActives(navigation),
            },
          ],
        );
      } catch (error: unknown) {
        logger.error('[OrderDetailScreen] Falha ao criar atividade a partir do pedido', {
          orderId: orderIdRef.current,
          cause: error,
        });
        const message =
          error instanceof Error && error.message.trim() ? error.message.trim() : t('activities.saveError');
        Alert.alert(t('errors.error'), message, [{ text: t('common.ok') }]);
      }
    },
    [navigation, t],
  );

  const renderItemAction = (item: OrderItem) => {
    if (!order) return null;
    const primary = orderItemPrimaryAction(order, item);
    if (!primary) return null;

    if (primary.kind === 'canceled') {
      return (
        <View style={styles.orderItemCanceledTag} accessibilityRole='text'>
          <Text style={styles.orderItemCanceledTagText}>
            {t('activities.orderItemCanceled', { defaultValue: 'Cancelado' })}
          </Text>
        </View>
      );
    }

    const labelKey =
      primary.action === 'viewProtocol' ? 'activities.viewProtocol' : 'activities.createActivityFromOrder';
    const defaultLabel = primary.action === 'viewProtocol' ? 'Ver protocolo' : 'Criar atividade';

    return (
      <TouchableOpacity
        style={styles.orderItemActionButton}
        onPress={() => {
          if (primary.action === 'viewProtocol') {
            openProtocol(item.productId);
            return;
          }
          openCreateActivity(item);
        }}
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

      <CreateActivityModal
        visible={isCreateActivityModalVisible}
        onClose={closeCreateActivityModal}
        onSave={(data) => {
          void saveActivityFromOrder(data);
        }}
        initialData={createActivityInitialData ?? undefined}
      />
    </ScreenWithHeader>
  );
};

export default OrderDetailScreen;
