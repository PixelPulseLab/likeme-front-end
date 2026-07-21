import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, Linking } from 'react-native';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { StickyFilterCarouselRow, type ButtonCarouselOption } from '@/components/ui/menu';
import { GradientBackground, ScreenWithHeader } from '@/components/ui/layout';
import { Toggle, PrimaryButton, Badge, IconButton } from '@/components/ui';
import { CreateActivityModal } from '@/components/sections/activity';
import ProfileFloatingMenu from '@/components/sections/profile/ProfileFloatingMenu';
import { DoneIcon, CloseIcon } from '@/assets/ui';
import { HOME_MVP_ASSETS } from '@/assets/homeMvp';
import { PlansCarousel, type Plan } from '@/components/sections/product';
import { RecommendedProductsSection } from '@/components/sections/marketplace/RecommendedProductsSection';
import { EventReminder } from '@/components/ui/cards';
import { orderService, activityService } from '@/services';
import { storageService } from '@/services';
import { formatPrice, sortByDateTime, sortByDateField } from '@/utils';
import { COLORS } from '@/constants';
import { useActivities, useMenuItems } from '@/hooks';
import { useSetFloatingMenu } from '@/contexts/FloatingMenuContext';
import { useTranslation } from '@/hooks/i18n';
// import { AnamnesisPromptCard } from '@/components/sections/anamnesis';
import type { Order } from '@/types/order';
import type { RootStackParamList } from '@/types/navigation';
import { useAnalyticsScreen } from '@/analytics';
import { logger } from '@/utils/logger';
import { formatOrderDisplayId } from '@/utils/marketplace/orderDisplayId';
import { navigateToOrderDetail } from '@/utils/navigation/activitiesNavigation';
import { navigateRootStack, rootStackNavigationFrom } from '@/utils/navigation/rootStackNavigation';
import { orderCardStatusPresentation, orderCardTitle } from '@/utils/marketplace/orderStatusDisplay';
import { invalidateActivityListCache } from '@/utils/activity/activityListCache';
import { styles } from './styles';

type ActivitiesScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Activities'>;
  route?: {
    params?: {
      initialTab?: 'actives' | 'history';
      initialFilter?: 'all' | 'activities' | 'appointments' | 'orders';
      focusActivityId?: string;
    };
  };
};

type TabType = 'actives' | 'history';

function activityListScopeForTab(tab: TabType): 'active' | 'history' {
  return tab === 'history' ? 'history' : 'active';
}
type FilterType = 'all' | 'activities' | 'appointments' | 'orders';

import type { ActivityItem } from '@/types/activity/hooks';
import type { UserActivity } from '@/types/activity';

const ActivitiesScreen: React.FC<ActivitiesScreenProps> = ({ navigation, route }) => {
  useAnalyticsScreen({ screenName: 'Activities', screenClass: 'ActivitiesScreen' });
  const { t } = useTranslation();
  const rootNavigation = rootStackNavigationFrom(navigation) ?? navigation;
  const [activeTab, setActiveTab] = useState<TabType>(route?.params?.initialTab ?? 'actives');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>(route?.params?.initialFilter ?? 'all');
  const [showFestivalBanner, setShowFestivalBanner] = useState(true);
  const [isCreateActivityModalVisible, setIsCreateActivityModalVisible] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingActivityData, setEditingActivityData] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [daySortOrder, setDaySortOrder] = useState<'asc' | 'desc'>('desc');
  const [menuVisibleForId, setMenuVisibleForId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [_hasCompletedAnamnesis, setHasCompletedAnamnesis] = useState<boolean>(false);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [userAvatarUri, setUserAvatarUri] = useState<string | null>(null);
  const hasFocusedOnceRef = useRef(false);

  // Usar o hook useActivities
  const {
    activities,
    rawActivities,
    loading: _isLoadingActivities,
    loadActivities,
    formatDate,
    parseTimeString,
    isToday,
  } = useActivities({
    enabled: true,
    listScope: 'active',
    autoLoad: false,
  });

  const openActivityEditorFromUserActivity = useCallback((activity: UserActivity) => {
    setEditingActivityData({
      name: activity.name,
      type: activity.type,
      startDate: activity.startDate?.split('T')[0],
      startTime: activity.startTime ?? undefined,
      endDate: activity.endDate?.split('T')[0],
      endTime: activity.endTime ?? undefined,
      location: activity.location ?? undefined,
      description: activity.description ?? undefined,
      reminderEnabled: activity.reminderEnabled,
      reminderMinutes: activity.reminderOffset ? Number.parseInt(activity.reminderOffset, 10) : 5,
    });
    setEditingActivityId(activity.id);
    setIsCreateActivityModalVisible(true);
  }, []);

  const openActivityEditor = useCallback(
    async (activityId: string) => {
      const fromList = rawActivities.find((entry) => entry.id === activityId);
      if (fromList) {
        openActivityEditorFromUserActivity(fromList);
        setMenuVisibleForId(null);
        return;
      }

      try {
        const response = await activityService.getActivityById(activityId);
        if (response.success && response.data) {
          openActivityEditorFromUserActivity(response.data);
          setMenuVisibleForId(null);
          return;
        }
      } catch (error) {
        logger.error('Error loading activity for edit:', error);
      }

      Alert.alert(t('errors.error'), t('activities.saveError'));
    },
    [openActivityEditorFromUserActivity, rawActivities, t],
  );

  const loadOrders = useCallback(async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setIsLoadingOrders(true);
      }
      const response = await orderService.listOrders({
        page: 1,
        limit: 50,
      });
      if (response.success && response.data?.orders) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      logger.error('Error loading orders:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    void loadActivities(activityListScopeForTab(activeTab), { silent: true });
  }, [activeTab, loadActivities]);

  useEffect(() => {
    if (activeTab === 'history') {
      void loadOrders();
    }
  }, [activeTab, loadOrders]);

  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnceRef.current) {
        hasFocusedOnceRef.current = true;
        return;
      }

      void loadActivities(activityListScopeForTab(activeTab), { silent: true });
      if (activeTab === 'history') {
        void loadOrders({ silent: orders.length > 0 });
      }
    }, [activeTab, loadActivities, loadOrders, orders.length]),
  );

  useFocusEffect(
    useCallback(() => {
      const p = route?.params;
      if (p?.initialTab == null && p?.initialFilter == null && p?.focusActivityId == null) {
        return;
      }

      if (p?.initialFilter === 'orders') {
        setActiveTab('history');
        setSelectedFilter('orders');
      } else {
        if (p?.initialTab === 'history' || p?.initialTab === 'actives') {
          setActiveTab(p.initialTab);
        }
        if (p?.initialFilter != null) {
          setSelectedFilter(p.initialFilter);
        }
      }

      navigation.setParams({
        initialTab: undefined,
        initialFilter: undefined,
        focusActivityId: p?.focusActivityId,
      } as never);
    }, [navigation, route?.params?.initialTab, route?.params?.initialFilter, route?.params?.focusActivityId]),
  );

  useEffect(() => {
    const focusActivityId = route?.params?.focusActivityId?.trim();
    if (!focusActivityId) {
      return;
    }

    const fromList = rawActivities.find((entry) => entry.id === focusActivityId);
    if (fromList) {
      openActivityEditorFromUserActivity(fromList);
      navigation.setParams({ focusActivityId: undefined } as never);
      return;
    }

    if (_isLoadingActivities) {
      return;
    }

    void activityService
      .getActivityById(focusActivityId)
      .then((response) => {
        if (!response.success || !response.data) {
          return;
        }
        openActivityEditorFromUserActivity(response.data);
        navigation.setParams({ focusActivityId: undefined } as never);
      })
      .catch((error) => {
        logger.error('[ActivitiesScreen] Falha ao abrir atividade do push', { focusActivityId, error });
      });
  }, [
    navigation,
    openActivityEditorFromUserActivity,
    rawActivities,
    route?.params?.focusActivityId,
    _isLoadingActivities,
  ]);

  useEffect(() => {
    const checkAnamnesisStatus = async () => {
      try {
        const anamnesisCompletedAt = await storageService.getAnamnesisCompletedAt();
        setHasCompletedAnamnesis(!!anamnesisCompletedAt);
      } catch (error) {
        logger.error('Error checking anamnesis status:', error);
        setHasCompletedAnamnesis(false);
      }
    };

    checkAnamnesisStatus();
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await storageService.getUser();
        setUserAvatarUri(user?.picture ?? null);
      } catch (error) {
        logger.error('[ActivitiesScreen] Erro ao carregar usuário para o header', error);
        setUserAvatarUri(null);
      }
    };

    void loadUser();
  }, []);

  // Função para encontrar a próxima atividade que acontece hoje usando dados originais
  const getUpcomingActivity = useMemo(() => {
    if (activeTab === 'history' || rawActivities.length === 0) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Filtrar atividades que não estão deletadas, têm startDate e acontecem hoje
    const todayActivities = rawActivities
      .filter((activity) => {
        if (activity.deletedAt || !activity.startDate) return false;

        try {
          // Verificar se a data é hoje - parsear como data local
          // O backend retorna como ISO string (ex: "2024-01-09T00:00:00.000Z")
          // Precisamos extrair apenas a parte da data (YYYY-MM-DD)
          let startDate: Date;
          if (typeof activity.startDate === 'string') {
            // Extrair apenas a parte da data da string ISO
            const dateOnly = activity.startDate.split('T')[0];
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
              // Formato YYYY-MM-DD - criar como data local para preservar o dia correto
              const [year, month, day] = dateOnly.split('-').map(Number);
              startDate = new Date(year, month - 1, day);
            } else {
              startDate = new Date(activity.startDate);
            }
          } else {
            startDate = new Date(activity.startDate);
          }
          startDate.setHours(0, 0, 0, 0);

          // Verificar se é hoje
          const isTodayDate = startDate.getTime() === today.getTime();

          // Retornar true se for hoje (mostrar todas as atividades de hoje)
          return isTodayDate;
        } catch (error) {
          logger.error('Error parsing activity date/time:', error);
          return false;
        }
      })
      .sort((a, b) => {
        try {
          // Parsear datas corretamente (extrair da string ISO)
          let dateA: Date;
          let dateB: Date;

          if (typeof a.startDate === 'string') {
            const dateOnlyA = a.startDate.split('T')[0];
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnlyA)) {
              const [year, month, day] = dateOnlyA.split('-').map(Number);
              dateA = new Date(year, month - 1, day);
            } else {
              dateA = new Date(a.startDate);
            }
          } else {
            dateA = new Date(a.startDate);
          }

          if (typeof b.startDate === 'string') {
            const dateOnlyB = b.startDate.split('T')[0];
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnlyB)) {
              const [year, month, day] = dateOnlyB.split('-').map(Number);
              dateB = new Date(year, month - 1, day);
            } else {
              dateB = new Date(b.startDate);
            }
          } else {
            dateB = new Date(b.startDate);
          }

          // Se ambas têm startTime, ordenar por hora
          if (a.startTime && b.startTime) {
            const timeA = parseTimeString(a.startTime, dateA);
            const timeB = parseTimeString(b.startTime, dateB);
            return timeA.getTime() - timeB.getTime();
          }

          // Se só uma tem startTime, priorizar a que tem
          if (a.startTime && !b.startTime) return -1;
          if (!a.startTime && b.startTime) return 1;

          // Se nenhuma tem, manter ordem original
          return 0;
        } catch {
          return 0;
        }
      });

    return todayActivities.length > 0 ? todayActivities[0] : null;
  }, [rawActivities, activeTab]);

  // Função para calcular tempo restante e formatar mensagem
  const getReminderMessage = (activity: any): string => {
    if (!activity || !activity.startDate) {
      return activity?.name || t('activities.eventReminderSoon');
    }

    try {
      const now = new Date();

      // Se não tiver startTime, apenas mostrar que é hoje
      if (!activity.startTime) {
        return t('activities.eventReminderToday', { name: activity.name });
      }

      // Parsear como data local para evitar problemas de timezone
      // O backend retorna como ISO string, extrair apenas a parte da data
      let startDate: Date;
      if (typeof activity.startDate === 'string') {
        const dateOnly = activity.startDate.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
          // Formato YYYY-MM-DD - criar como data local
          const [year, month, day] = dateOnly.split('-').map(Number);
          startDate = new Date(year, month - 1, day);
        } else {
          startDate = new Date(activity.startDate);
        }
      } else {
        startDate = new Date(activity.startDate);
      }
      const activityDateTime = parseTimeString(activity.startTime, startDate);
      const diffMs = activityDateTime.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);

      if (diffHours > 0) {
        return t('activities.eventReminder', { name: activity.name, hours: diffHours });
      } else if (diffMinutes > 0) {
        return t('activities.eventReminderMinutes', { name: activity.name, minutes: diffMinutes });
      } else if (diffMinutes > -60) {
        // Se passou há menos de 1 hora, ainda mostrar
        return t('activities.eventReminderNow', { name: activity.name });
      }
      return t('activities.eventReminderToday', { name: activity.name });
    } catch (error) {
      logger.error('Error calculating reminder message:', error);
      return t('activities.eventReminderToday', { name: activity.name });
    }
  };

  // Função para extrair data e hora
  const getReminderDateAndTime = (activity: any): { date: string; time: string } => {
    if (!activity || !activity.startDate) {
      return { date: t('activities.today'), time: '' };
    }

    try {
      // Parsear como data local para evitar problemas de timezone
      // O backend retorna como ISO string, extrair apenas a parte da data
      let startDate: Date;
      if (typeof activity.startDate === 'string') {
        const dateOnly = activity.startDate.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
          // Formato YYYY-MM-DD - criar como data local
          const [year, month, day] = dateOnly.split('-').map(Number);
          startDate = new Date(year, month - 1, day);
        } else {
          startDate = new Date(activity.startDate);
        }
      } else {
        startDate = new Date(activity.startDate);
      }
      const isTodayDate = isToday(startDate);

      return {
        date: isTodayDate ? t('activities.today') : formatDate(startDate),
        time: activity.startTime || '',
      };
    } catch (error) {
      logger.error('Error parsing date and time:', error);
      return { date: t('activities.today'), time: '' };
    }
  };

  const filteredActivities = useMemo(() => {
    let source = activities;

    // Apply filter
    if (selectedFilter === 'all') {
      // Keep all
    } else if (selectedFilter === 'activities') {
      source = source.filter((a) => a.type === 'program' || a.type === 'personal');
    } else {
      source = source.filter((a) => a.type === 'appointment');
    }

    // Sort by date
    const sorted = sortByDateTime(source, daySortOrder, (item) => item.dateTime);

    return sorted;
  }, [activeTab, selectedFilter, daySortOrder, activities]);

  const menuItems = useMenuItems(navigation);
  useSetFloatingMenu(menuItems, 'activities');

  const handleMenuPress = () => {
    setIsProfileMenuVisible(true);
  };

  const handleCartPress = () => {
    navigateRootStack(rootNavigation, 'Cart');
  };

  const reloadActivitiesAfterMutation = useCallback(async () => {
    const listScope = activityListScopeForTab(activeTab);
    invalidateActivityListCache(listScope);
    await loadActivities(listScope);
  }, [activeTab, loadActivities]);

  const handleMarkAsDone = async (activityId: string) => {
    try {
      const activity = activities.find((a) => a.id === activityId);
      if (!activity) return;

      // Atualizar a descrição para incluir marcador de completada antes de deletar
      const updatedDescription = activity.description.startsWith('[COMPLETED]')
        ? activity.description
        : `[COMPLETED]${activity.description}`;

      // Atualizar a atividade com a descrição marcada antes de deletar
      await activityService.updateActivity(activityId, {
        description: updatedDescription,
      });

      // Marcar atividade como concluída (deletada) para que apareça no histórico como completada
      await activityService.deleteActivity(activityId);
      // Recarregar atividades para atualizar a lista
      await reloadActivitiesAfterMutation();
    } catch (error) {
      logger.error('Error marking activity as done:', error);
      Alert.alert(t('errors.error'), t('activities.markError'));
    }
  };

  const handleViewActivity = (activity: ActivityItem) => {
    void openActivityEditor(activity.id);
  };

  const handleDeleteActivity = async (activityId: string) => {
    Alert.alert(t('activities.deleteConfirm'), t('activities.deleteConfirmMessage'), [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('activities.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await activityService.deleteActivity(activityId);
            await reloadActivitiesAfterMutation();
            setMenuVisibleForId(null);
          } catch (error) {
            logger.error('Error deleting activity:', error);
            Alert.alert(t('errors.error'), t('activities.deleteError'));
          }
        },
      },
    ]);
  };

  const handleActivityCardMenuPress = (activityId: string, event: any) => {
    event.persist();
    const { pageX, pageY } = event.nativeEvent;
    // Ajustar posição para aparecer abaixo e à direita do botão
    setMenuPosition({ x: pageX - 100, y: pageY + 10 });
    setMenuVisibleForId(activityId);
  };

  const handleSkipAppointment = async (activityId: string) => {
    try {
      // Marcar atividade como declinada (deletada) para que apareça no histórico como declinada
      await activityService.deleteActivity(activityId);
      // Recarregar atividades para atualizar a lista
      await reloadActivitiesAfterMutation();
    } catch (error) {
      logger.error('Error skipping activity:', error);
      Alert.alert(t('errors.error'), t('activities.skipError'));
    }
  };

  const handleOpenMeet = (activity: ActivityItem) => {
    if (!activity.meetUrl) {
      return;
    }

    const url =
      activity.meetUrl.startsWith('http://') || activity.meetUrl.startsWith('https://')
        ? activity.meetUrl
        : `https://${activity.meetUrl}`;

    Linking.openURL(url).catch((err: Error) => {
      logger.error('Error opening meet URL:', err);
      Alert.alert(t('errors.error'), t('activities.openMeetError'));
    });
  };

  const handleActivityCardPress = (activity: ActivityItem) => {
    if (activity.meetUrl) {
      handleOpenMeet(activity);
    }
  };

  // AnamnesisPromptCard temporariamente comentado
  // const handleStartAnamnesis = () => {
  //   rootNavigation.navigate('Anamnesis' as never);
  // };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <Toggle
        options={[t('activities.actives'), t('activities.history')] as any}
        selected={activeTab === 'actives' ? t('activities.actives') : t('activities.history')}
        onSelect={(option) => {
          const newTab = option === t('activities.actives') ? 'actives' : 'history';
          setActiveTab(newTab);
          // Resetar filtro para 'all' se estiver em 'orders' e mudar para 'actives'
          if (newTab === 'actives' && selectedFilter === 'orders') {
            setSelectedFilter('all');
          }
        }}
      />
    </View>
  );

  const filterCarouselOptions: ButtonCarouselOption<FilterType>[] = useMemo(() => {
    const baseOptions: ButtonCarouselOption<FilterType>[] = [
      { id: 'all', label: t('activities.all') },
      { id: 'activities', label: t('activities.activities') },
      { id: 'appointments', label: t('activities.appointments') },
    ];

    // Orders só aparece quando estiver na aba History
    if (activeTab === 'history') {
      baseOptions.push({ id: 'orders', label: t('activities.orders') });
    }

    return baseOptions;
  }, [activeTab]);

  const handleDaySortToggle = () => {
    setDaySortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <StickyFilterCarouselRow
        filterButtonLabel={t('activities.day')}
        onFilterButtonPress={handleDaySortToggle}
        filterButtonIcon={daySortOrder === 'asc' ? 'arrow-drop-up' : 'arrow-drop-down'}
        carouselOptions={filterCarouselOptions}
        selectedCarouselId={selectedFilter}
        onCarouselSelect={(optionId) => setSelectedFilter(optionId)}
      />
      {activeTab === 'actives' && (
        <View style={styles.createButtonContainer}>
          <PrimaryButton
            label={t('activities.createActivities')}
            onPress={() => {
              setEditingActivityId(null);
              setEditingActivityData(null);
              setIsCreateActivityModalVisible(true);
            }}
            style={styles.createButton}
          />
        </View>
      )}
    </View>
  );

  const renderEventReminder = () => {
    if (activeTab === 'history') return null;

    const upcomingActivity = getUpcomingActivity;

    if (!upcomingActivity) return null;

    const { date, time } = getReminderDateAndTime(upcomingActivity);
    const message = getReminderMessage(upcomingActivity);

    return (
      <View style={styles.eventReminderContainer}>
        <EventReminder
          message={message}
          date={date}
          time={time}
          onClose={() => setShowFestivalBanner(false)}
          visible={showFestivalBanner}
        />
      </View>
    );
  };

  const sortedOrders = useMemo(() => {
    return sortByDateField(orders, 'createdAt', daySortOrder);
  }, [orders, daySortOrder]);

  const renderOrderCard = (order: Order) => {
    const statusPresentation = orderCardStatusPresentation(order);
    const cardTitle = orderCardTitle(order) || t('activities.order');

    return (
      <TouchableOpacity
        key={`order-${order.id}`}
        style={styles.activityCard}
        onPress={() => navigateToOrderDetail(rootNavigation, order.id)}
        activeOpacity={0.7}
        accessibilityRole='button'
        accessibilityLabel={`${t('activities.order')} ${formatOrderDisplayId(order.id)}`}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Badge label={t('activities.order')} color='orange' />
          </View>

          <View style={styles.orderCardTitleRow}>
            <CachedImage source={HOME_MVP_ASSETS.cart} style={styles.orderCardCartIcon} contentFit='contain' />
            <Text style={styles.orderCardTitle} numberOfLines={2}>
              {cardTitle}
            </Text>
          </View>

          <View style={styles.orderCardDetails}>
            <Text style={styles.orderCardDetailLine}>
              {t('activities.orderNumberShort', { defaultValue: 'Pedido' })}: {formatOrderDisplayId(order.id)}
            </Text>
            <Text style={styles.orderCardDetailLine}>
              {t('activities.orderTotal', { defaultValue: 'Total' })} {formatPrice(order.total)}
            </Text>
            <Text style={styles.orderCardDetailLine}>
              {t(statusPresentation.deliveryLabelKey, {
                defaultValue: statusPresentation.deliveryLabelDefault,
              })}
            </Text>
          </View>

          <View style={[styles.cardActions, styles.orderCardStatusAction]}>
            <IconButton
              icon={statusPresentation.icon}
              variant={statusPresentation.variant}
              backgroundTintColor={statusPresentation.backgroundTintColor}
              iconColor={statusPresentation.iconColor}
              backgroundSize='medium'
              iconSize={24}
              onPress={() => navigateToOrderDetail(rootNavigation, order.id)}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderActivityCard = (activity: ActivityItem) => {
    const typeLabels = {
      program: t('activities.programs'),
      appointment: t('activities.appointments'),
      personal: t('activities.personal'),
    };

    // For appointments, show date/time in title row
    if (activity.type === 'appointment') {
      const cardBody = (
        <>
          <View style={styles.cardHeader}>
            <Badge label={typeLabels[activity.type]} color='orange' />
            <TouchableOpacity activeOpacity={0.7} onPress={(e) => handleActivityCardMenuPress(activity.id, e)}>
              <Icon name='more-vert' size={20} color={COLORS.TEXT} />
            </TouchableOpacity>
          </View>

          <View>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>{activity.title}</Text>
            </View>

            {activity.dateTime && (
              <View style={styles.appointmentDateTimeRow}>
                <Icon name='event' size={16} color={COLORS.TEXT} />
                <Text style={styles.appointmentDateTimeText}>{activity.dateTime}</Text>
              </View>
            )}

            {activity.providerName && (
              <View style={styles.providerContainer}>
                <Text style={styles.providerText}>{t('activities.therapySession')}</Text>
                <View style={styles.providerAvatar}>
                  <Text style={styles.providerAvatarText}>{activity.providerAvatar || 'A'}</Text>
                </View>
                <Text style={styles.providerName}>{activity.providerName}</Text>
              </View>
            )}
          </View>
        </>
      );

      return (
        <View key={activity.id} style={[styles.activityCard, styles.appointmentCard]}>
          <View style={styles.cardContent}>
            {activity.meetUrl ? (
              <TouchableOpacity activeOpacity={0.7} onPress={() => handleActivityCardPress(activity)}>
                {cardBody}
              </TouchableOpacity>
            ) : (
              cardBody
            )}

            <View style={styles.cardActions}>
              {activity.meetUrl && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.openButton]}
                  onPress={() => handleOpenMeet(activity)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.openButtonText}>{t('activities.openMeet')}</Text>
                </TouchableOpacity>
              )}

              {activeTab === 'actives' && (
                <TouchableOpacity onPress={() => handleSkipAppointment(activity.id)} activeOpacity={0.7}>
                  <Text style={styles.viewLink}>{t('activities.skip')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    }

    // For regular activities (programs/personal)
    return (
      <View key={activity.id} style={styles.activityCard}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Badge label={typeLabels[activity.type]} color='orange' />
            <TouchableOpacity activeOpacity={0.7} onPress={(e) => handleActivityCardMenuPress(activity.id, e)}>
              <Icon name='more-vert' size={20} color={COLORS.TEXT} />
            </TouchableOpacity>
          </View>

          <View>
            <View style={styles.cardTitleRow}>
              {activity.isFavorite && <Icon name='star' size={20} color={COLORS.TEXT} style={styles.starIcon} />}
              <Text style={styles.cardTitle}>{activity.title}</Text>
            </View>
            <Text style={styles.cardDescription}>{activity.description}</Text>
          </View>

          <View style={styles.cardActions}>
            {activeTab === 'history' ? (
              activity.declined || activity.completed ? (
                <View style={[styles.actionButton]}>
                  <CachedImage source={activity.declined ? CloseIcon : DoneIcon} style={styles.statusIcon} />
                </View>
              ) : null
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.markButton]}
                onPress={() => handleMarkAsDone(activity.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.markButtonText}>{t('activities.markAsDone')}</Text>
              </TouchableOpacity>
            )}

            {activeTab === 'actives' && (
              <TouchableOpacity onPress={() => handleViewActivity(activity)} activeOpacity={0.7}>
                <Text style={styles.viewLink}>{t('common.view')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Plans: exibir apenas quando houver dados reais (por enquanto vazio)
  const plans: Plan[] = [];

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        showBackButton: false,
        showMenuWithAvatar: true,
        onMenuPress: handleMenuPress,
        userAvatarUri,
        showCartButton: true,
        onCartPress: handleCartPress,
      }}
      contentContainerStyle={styles.container}
    >
      <View pointerEvents='none' style={styles.gradientBackground}>
        <GradientBackground />
      </View>
      <View style={styles.content}>
        {renderTabs()}
        {renderFilters()}
        {renderEventReminder()}

        {activeTab === 'actives' && filteredActivities.length > 0 && (
          <Text style={styles.sectionLabel}>{t('activities.markAsDoneLabel')}</Text>
        )}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'history' ? (
            <>
              {selectedFilter === 'all' && (
                <>
                  {filteredActivities.map(renderActivityCard)}
                  {sortedOrders.map(renderOrderCard)}
                </>
              )}
              {selectedFilter === 'activities' && filteredActivities.map(renderActivityCard)}
              {selectedFilter === 'appointments' && filteredActivities.map(renderActivityCard)}
              {selectedFilter === 'orders' && sortedOrders.map(renderOrderCard)}
              {selectedFilter === 'all' &&
                filteredActivities.length === 0 &&
                sortedOrders.length === 0 &&
                !isLoadingOrders && (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>{t('activities.noHistoryFound')}</Text>
                  </View>
                )}
              {selectedFilter === 'activities' && filteredActivities.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>{t('activities.noActivitiesFound')}</Text>
                </View>
              )}
              {selectedFilter === 'appointments' && filteredActivities.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>{t('activities.noAppointmentsFound')}</Text>
                </View>
              )}
              {selectedFilter === 'orders' && sortedOrders.length === 0 && !isLoadingOrders && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>{t('activities.noOrdersFound')}</Text>
                </View>
              )}
            </>
          ) : (
            <>
              {filteredActivities.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>{t('activities.noActivitiesFound')}</Text>
                </View>
              ) : (
                filteredActivities.map(renderActivityCard)
              )}
              {/* TODO: AnamnesisPromptCard temporariamente comentado
              {!hasCompletedAnamnesis && (
                <View style={styles.anamnesisPromptContainer}>
                  <AnamnesisPromptCard onStartPress={handleStartAnamnesis} />
                </View>
              )}
              */}
              {activeTab === 'actives' && plans.length > 0 && (
                <View>
                  <PlansCarousel
                    title={t('activities.plansForYou')}
                    subtitle={t('activities.discoverOptions')}
                    plans={plans}
                    onPlanPress={(plan) => logger.debug('[ActivitiesScreen] plan press (stub)', { planId: plan.id })}
                  />
                </View>
              )}
              {activeTab === 'actives' ? (
                <RecommendedProductsSection
                  navigation={rootNavigation as StackNavigationProp<RootStackParamList, keyof RootStackParamList>}
                  analyticsScreenName='activities'
                />
              ) : null}
            </>
          )}
        </ScrollView>
      </View>
      <CreateActivityModal
        visible={isCreateActivityModalVisible}
        onClose={() => {
          setIsCreateActivityModalVisible(false);
          setEditingActivityId(null);
          setEditingActivityData(null);
        }}
        onSave={async (data, activityId) => {
          try {
            let response;
            if (activityId) {
              // Update existing activity
              response = await activityService.updateActivity(activityId, {
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
              logger.debug('[ActivitiesScreen] activity updated', { activityId });
            } else {
              // Create new activity
              response = await activityService.createActivity({
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
              logger.debug('[ActivitiesScreen] activity created', { activityId: response.data?.id });
            }

            // Verificar se a operação foi bem-sucedida antes de recarregar
            if (response && response.success && response.data) {
              // Refresh activities list after save
              await reloadActivitiesAfterMutation();
            } else {
              throw new Error(response?.message || 'Failed to save activity');
            }
          } catch (error: any) {
            logger.error('Error saving activity:', error);
            Alert.alert(t('errors.error'), error?.message || t('activities.saveError'), [{ text: t('common.ok') }]);
          }
        }}
        activityId={editingActivityId || undefined}
        initialData={editingActivityData}
      />

      {/* Action Menu Modal */}
      <Modal
        visible={menuVisibleForId !== null}
        transparent
        animationType='fade'
        onRequestClose={() => setMenuVisibleForId(null)}
      >
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuVisibleForId(null)}>
          {menuPosition && (
            <View style={[styles.menuContainer, { top: menuPosition.y, left: menuPosition.x }]}>
              {menuVisibleForId && !menuVisibleForId.startsWith('order-') && (
                <>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      const activity = activities.find((a) => a.id === menuVisibleForId);
                      if (activity) {
                        handleViewActivity(activity);
                      }
                    }}
                  >
                    <Icon name='edit' size={20} color={COLORS.TEXT} />
                    <Text style={styles.menuItemText}>{t('activities.edit')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      if (menuVisibleForId) {
                        handleDeleteActivity(menuVisibleForId);
                      }
                    }}
                  >
                    <Icon name='delete' size={20} color='#F44336' />
                    <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>{t('activities.delete')}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </TouchableOpacity>
      </Modal>
      <ProfileFloatingMenu
        visible={isProfileMenuVisible}
        navigation={rootNavigation}
        onClose={() => setIsProfileMenuVisible(false)}
      />
    </ScreenWithHeader>
  );
};

export default ActivitiesScreen;
