import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import EventBanner from '@/components/sections/community/EventBanner';
import { COLORS, SPACING } from '@/constants';
import { LIKEME_FONT_LOADER_MAP } from '@/constants/fontLoader';
import type { EventBannerData, EventBannerVariant } from '@/types/event';
import DesignSystemScreen from '@/screens/dev/DesignSystemScreen';
import { startI18nHydration } from '@/i18n/hydration';
import '@/i18n';

const MATERIAL_ICONS = require('react-native-vector-icons/Fonts/MaterialIcons.ttf');

const DEFAULT_BANNER_THUMBNAIL =
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80';

type EventBannerQueryPreviewParams = {
  variant: EventBannerVariant;
  title: string;
  host: string;
  status: 'live' | 'scheduled';
  startsAt?: string;
  endsAt?: string;
  thumbnail?: string;
};

function readEventBannerQueryPreviewParams(): EventBannerQueryPreviewParams | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get('preview') !== 'event-banner') {
    return null;
  }
  const variantParam = params.get('variant');
  const variant = variantParam === 'live_join' || variantParam === 'purchase' ? variantParam : ('purchase' as const);
  const title = params.get('title')?.trim() || 'Workshop ao vivo';
  const host = params.get('host')?.trim() || 'Provedor';
  const statusParam = params.get('status');
  const status = statusParam === 'live' ? 'live' : 'scheduled';
  return {
    variant,
    title,
    host,
    status,
    startsAt: params.get('startsAt')?.trim() || undefined,
    endsAt: params.get('endsAt')?.trim() || undefined,
    thumbnail: params.get('thumbnail')?.trim() || undefined,
  };
}

function eventBannerDataFromQueryParams(params: EventBannerQueryPreviewParams): EventBannerData {
  const uiStatus = params.status === 'live' ? 'Live Now' : 'Scheduled';
  const startsAt = params.startsAt ?? new Date().toISOString();
  const endsAt = params.endsAt ?? new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const thumbnail = params.thumbnail && params.thumbnail.length > 0 ? params.thumbnail : DEFAULT_BANNER_THUMBNAIL;

  return {
    id: 'design-system-preview',
    title: params.title,
    host: params.host,
    status: uiStatus,
    startTime: startsAt,
    endTime: endsAt,
    thumbnail,
    variant: params.variant,
    joinMode: params.variant === 'live_join' ? 'jitsi_embed' : 'none',
    externalUrl: params.variant === 'live_join' ? 'https://8x8.vc/preview' : undefined,
    provider: 'jitsi',
  };
}

function EventBannerQueryPreview({ params }: { params: EventBannerQueryPreviewParams }) {
  const event = useMemo(() => eventBannerDataFromQueryParams(params), [params]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        padding: SPACING.LG,
        backgroundColor: COLORS.BACKGROUND,
      }}
    >
      <EventBanner event={event} onPress={() => undefined} onCtaPress={() => undefined} />
    </View>
  );
}

export default function DesignSystemWebApp() {
  const bannerPreviewParams = readEventBannerQueryPreviewParams();

  useEffect(() => {
    void startI18nHydration('pt-BR');
  }, []);

  const [fontsLoaded] = useFonts({
    ...LIKEME_FONT_LOADER_MAP,
    MaterialIcons: MATERIAL_ICONS,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={COLORS.PRIMARY.PURE} />
      </View>
    );
  }

  const content =
    bannerPreviewParams != null ? <EventBannerQueryPreview params={bannerPreviewParams} /> : <DesignSystemScreen />;

  return <SafeAreaProvider>{content}</SafeAreaProvider>;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
});
