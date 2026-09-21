import React, { useCallback, useState } from 'react';
import { RefreshControl, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { SPACING } from '@/constants';
import { TwoDotsLoading } from '@/components/ui/feedback/TwoDotsLoading';

export const PULL_TO_REFRESH_INDICATOR_SIZE = 20;

type PullToRefreshIndicatorProps = {
  visible: boolean;
  accessibilityLabel: string;
};

export function PullToRefreshIndicator({ visible, accessibilityLabel }: PullToRefreshIndicatorProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.indicator} pointerEvents='none'>
      <TwoDotsLoading size={PULL_TO_REFRESH_INDICATOR_SIZE} accessibilityLabel={accessibilityLabel} />
    </View>
  );
}

export function usePullToRefresh(refresh: () => void | Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
      setIsPulling(false);
    }
  }, [refresh]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pulling = event.nativeEvent.contentOffset.y < -SPACING.LG;
    setIsPulling((current) => (current === pulling ? current : pulling));
  }, []);

  return {
    refreshing,
    showIndicator: refreshing || isPulling,
    onScroll,
    refreshControl: (
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor='transparent' colors={['transparent']} />
    ),
  };
}

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    alignItems: 'center',
    paddingTop: SPACING.SM,
  },
});
