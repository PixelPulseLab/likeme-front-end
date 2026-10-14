import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import EventBanner from '@/components/sections/community/EventBanner';
import { COLORS, SPACING } from '@/constants';
import { LIKEME_FONT_LOADER_MAP } from '@/constants/fontLoader';
import type { EventBannerData, EventBannerVariant } from '@/types/event';
import DesignSystemScreen from '@/screens/dev/DesignSystemScreen';
import { ensureI18nHydrated } from '@/i18n/hydration';
import '@/i18n';

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

function webLocationSearch(): string | null {
  const search = (globalThis as { location?: { search?: string } }).location?.search;
  return typeof search === 'string' ? search : null;
}

function readEventBannerQueryPreviewParams(): EventBannerQueryPreviewParams | null {
  const locationSearch = webLocationSearch();
  if (!locationSearch) {
    return null;
  }
  const params = new URLSearchParams(locationSearch);
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

type PreviewDomStyleTarget = { style: Record<string, string> };

type PreviewDomDocument = {
  documentElement: PreviewDomStyleTarget;
  body: PreviewDomStyleTarget;
  getElementById(id: string): PreviewDomStyleTarget | null;
};

function previewDocument(): PreviewDomDocument | null {
  const raw = (globalThis as { document?: unknown }).document;
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  return raw as PreviewDomDocument;
}

function useEventBannerPreviewDocumentStyles(enabled: boolean) {
  useEffect(() => {
    const document = previewDocument();
    if (!enabled || !document) {
      return;
    }
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyMargin: body.style.margin,
      htmlHeight: html.style.height,
      bodyHeight: body.style.height,
      bodyMinHeight: body.style.minHeight,
      rootHeight: root?.style.height ?? '',
      rootOverflow: root?.style.overflow ?? '',
      rootMinHeight: root?.style.minHeight ?? '',
    };
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.margin = '0';
    html.style.height = 'auto';
    body.style.height = 'auto';
    body.style.minHeight = '0';
    if (root) {
      root.style.height = 'auto';
      root.style.overflow = 'hidden';
      root.style.minHeight = '0';
    }
    return () => {
      html.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.margin = previous.bodyMargin;
      html.style.height = previous.htmlHeight;
      body.style.height = previous.bodyHeight;
      body.style.minHeight = previous.bodyMinHeight;
      if (root) {
        root.style.height = previous.rootHeight;
        root.style.overflow = previous.rootOverflow;
        root.style.minHeight = previous.rootMinHeight;
      }
    };
  }, [enabled]);
}

function EventBannerQueryPreview({ params }: { params: EventBannerQueryPreviewParams }) {
  useEventBannerPreviewDocumentStyles(true);
  const event = useMemo(() => eventBannerDataFromQueryParams(params), [params]);

  return (
    <View style={styles.bannerPreviewRoot}>
      <EventBanner event={event} onPress={() => undefined} onCtaPress={() => undefined} />
    </View>
  );
}

export default function DesignSystemWebApp() {
  const bannerPreviewParams = readEventBannerQueryPreviewParams();
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    void ensureI18nHydrated({ lang: 'pt-BR' }).finally(() => setI18nReady(true));
  }, []);

  const [fontsLoaded] = useFonts(LIKEME_FONT_LOADER_MAP);

  const isBootReady = fontsLoaded && i18nReady;

  if (!isBootReady) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={COLORS.PRIMARY.PURE} />
      </View>
    );
  }

  if (bannerPreviewParams != null) {
    return <EventBannerQueryPreview params={bannerPreviewParams} />;
  }

  return (
    <SafeAreaProvider>
      <DesignSystemScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  bannerPreviewRoot: {
    width: '100%',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.BACKGROUND,
  },
});
