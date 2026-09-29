import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import acquisitionGlow from '../../../../assets/profile/acquisitionGlow.png';
import { AcquisitionList } from '@/components/sections/subscription/AcquisitionList';
import { AcquisitionToolbar } from '@/components/sections/subscription/AcquisitionList/AcquisitionToolbar';
import Loading, { type LoadingHandle } from '@/components/ui/feedback/Loading';
import { PullToRefreshIndicator, usePullToRefresh } from '@/components/ui/feedback/PullToRefresh';
import { ScreenWithHeader } from '@/components/ui/layout';
import { useAnalyticsScreen } from '@/analytics';
import { COLORS } from '@/constants';
import { useFloatingMenuActions } from '@/contexts/FloatingMenuContext';
import { useMenuItems } from '@/hooks';
import { useTranslation } from '@/hooks/i18n';
import type { RootStackParamList } from '@/types/navigation';
import { navigateRootStack } from '@/utils/navigation/rootStackNavigation';
import { logger } from '@/utils/logger';
import { styles } from './styles';
import { useAcquisitionList } from './useAcquisitionList';

type Props = StackScreenProps<RootStackParamList, 'SubscriptionList'>;

const SubscriptionListScreen: React.FC<Props> = ({ navigation }) => {
  useAnalyticsScreen({ screenName: 'SubscriptionList', screenClass: 'SubscriptionListScreen' });
  const { t } = useTranslation();
  const menuItems = useMenuItems(navigation);
  const { setMenu } = useFloatingMenuActions();
  const {
    category,
    setCategory,
    filter,
    setFilter,
    isNewestFirst,
    toggleDateSort,
    listView,
    openCard,
    shareCard,
    openEventCommunity,
    shareCommunity,
    exploreMarketplace,
    isContentReady,
    reloadOnFocus,
    refresh,
  } = useAcquisitionList(navigation);
  const [holdsLoading, setHoldsLoading] = useState(true);
  const loadingRef = useRef<LoadingHandle>(null);

  useEffect(() => {
    if (!isContentReady) {
      setHoldsLoading(true);
      return;
    }
    if (!holdsLoading) {
      return;
    }
    let cancelled = false;
    const dismiss = loadingRef.current?.dismiss();
    if (!dismiss) {
      setHoldsLoading(false);
      return;
    }
    dismiss
      .then(() => {
        if (!cancelled) {
          setHoldsLoading(false);
        }
      })
      .catch((cause: unknown) => {
        logger.error('[SubscriptionListScreen] Falha ao encerrar o loading', { cause });
        if (!cancelled) {
          setHoldsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [holdsLoading, isContentReady]);

  useFocusEffect(
    useCallback(() => {
      setMenu(menuItems, 'profile');
      reloadOnFocus();
    }, [menuItems, reloadOnFocus, setMenu]),
  );

  const {
    showIndicator: showPullIndicator,
    onScroll: onPullScroll,
    refreshControl: pullRefreshControl,
  } = usePullToRefresh(refresh);

  const handleBack = () => {
    navigation.goBack();
  };

  const showPullRefresh = !holdsLoading && showPullIndicator;

  return (
    <View style={styles.screenRoot}>
      <ScreenWithHeader
        navigation={navigation}
        headerProps={{
          showBackButton: true,
          onBackPress: handleBack,
          showCartButton: true,
          onCartPress: () => navigateRootStack(navigation, 'Cart'),
        }}
        contentBackgroundColor={COLORS.BACKGROUND}
        contentContainerStyle={styles.screenContent}
      >
        <View style={styles.listWrap}>
          <PullToRefreshIndicator visible={showPullRefresh} accessibilityLabel={t('common.loading')} />
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={holdsLoading ? undefined : onPullScroll}
            refreshControl={holdsLoading ? undefined : pullRefreshControl}
          >
            <View pointerEvents='none' style={styles.glow}>
              <Image source={acquisitionGlow} style={styles.glowImage} />
            </View>
            <Text style={styles.screenTitle}>
              {t('profile.acquisitionList.headline', {
                defaultValue: 'Tudo o que você escolheu para cuidar de você está aqui.',
              })}
            </Text>
            <AcquisitionToolbar
              category={category}
              onCategoryChange={setCategory}
              filter={filter}
              onFilterChange={setFilter}
              isNewestFirst={isNewestFirst}
              onToggleDateSort={toggleDateSort}
            />
            <AcquisitionList
              listView={listView}
              onExplore={exploreMarketplace}
              onOpenCard={openCard}
              onShareCard={shareCard}
              onOpenCommunity={openEventCommunity}
              onShareCommunity={shareCommunity}
            />
          </ScrollView>
        </View>
      </ScreenWithHeader>
      {holdsLoading ? (
        <View style={styles.loadingOverlay} pointerEvents='auto'>
          <Loading ref={loadingRef} accessibilityLabel={t('common.loading')} fullScreen />
        </View>
      ) : null}
    </View>
  );
};

export default SubscriptionListScreen;
