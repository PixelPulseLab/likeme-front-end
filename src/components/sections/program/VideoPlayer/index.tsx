import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { PostEmbeddedVideo } from '@/components/sections/community/PostCard/PostEmbeddedVideo';
import { useTranslation } from '@/hooks/i18n';
import type { Attachment } from '@/types/attachment';
import { COLORS } from '@/constants';
import { logger } from '@/utils/logger';
import { isRncWebViewTurboModuleLinked } from '@/utils/infrastructure/rncWebViewModule';
import { styles } from './styles';

type Props = {
  video: Attachment;
};

type WebViewComponent = React.ComponentType<{
  source: { uri: string };
  style?: object;
  allowsFullscreenVideo?: boolean;
  allowsInlineMediaPlayback?: boolean;
  mediaPlaybackRequiresUserAction?: boolean;
  startInLoadingState?: boolean;
  renderLoading?: () => React.ReactElement;
}>;

function videoHasPlaybackUrl(video: Attachment): boolean {
  return Boolean(video.streamUrl?.trim() || video.playerUrl?.trim() || video.url?.trim());
}

export const VideoPlayer: React.FC<Props> = ({ video }) => {
  const { t } = useTranslation();
  const [playbackOpen, setPlaybackOpen] = useState(false);
  const [WebViewCmp, setWebViewCmp] = useState<WebViewComponent | null>(null);

  const streamUrl = video.streamUrl?.trim() || '';
  const playerUrl = video.playerUrl?.trim() || (!streamUrl ? video.url?.trim() || '' : '');
  const posterUri = video.posterUrl?.trim() || undefined;
  const playable = video.playable !== false && videoHasPlaybackUrl(video);

  const needsWebViewPlayer = playbackOpen && !streamUrl && Boolean(playerUrl);

  useEffect(() => {
    setPlaybackOpen(false);
  }, [video.id]);

  useEffect(() => {
    if (!needsWebViewPlayer || !isRncWebViewTurboModuleLinked()) {
      return;
    }

    let cancelled = false;
    void import('react-native-webview')
      .then((mod) => {
        if (!cancelled) {
          setWebViewCmp(() => mod.WebView as WebViewComponent);
        }
      })
      .catch((cause) => {
        logger.error('[VideoPlayer] Falha ao carregar WebView do player', {
          videoId: video.id,
          cause,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [needsWebViewPlayer, video.id]);

  if (!playable) {
    return (
      <View style={styles.container} testID='video-player-unavailable'>
        <View style={styles.placeholder}>
          <Icon name='hourglass-empty' size={36} color={COLORS.NEUTRAL.LOW.MEDIUM} />
          <Text style={styles.statusText}>
            {t('course.video.unavailable', {
              defaultValue: 'Vídeo ainda não está disponível para reprodução.',
            })}
          </Text>
        </View>
      </View>
    );
  }

  const renderPlayer = () => {
    if (streamUrl) {
      return <PostEmbeddedVideo videoUri={streamUrl} fillContainer onCollapse={() => setPlaybackOpen(false)} />;
    }

    if (playerUrl && WebViewCmp) {
      const WV = WebViewCmp;
      return (
        <>
          <WV
            source={{ uri: playerUrl }}
            style={styles.webView}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size='large' color={COLORS.PRIMARY.PURE} />
              </View>
            )}
          />
          <Pressable
            style={styles.collapseTouch}
            onPress={() => setPlaybackOpen(false)}
            accessibilityRole='button'
            accessibilityLabel={t('course.video.collapse', { defaultValue: 'Voltar à capa do vídeo' })}
          >
            <View style={styles.collapseInner}>
              <Icon name='keyboard-arrow-down' size={26} color='rgba(255,255,255,0.95)' />
            </View>
          </Pressable>
        </>
      );
    }

    if (playerUrl) {
      return (
        <View style={styles.webViewLoading}>
          <ActivityIndicator size='large' color={COLORS.PRIMARY.PURE} />
        </View>
      );
    }

    return (
      <View style={styles.placeholder}>
        <Text style={styles.statusText}>
          {t('course.video.loadError', {
            defaultValue: 'Não foi possível carregar o vídeo. Tente novamente mais tarde.',
          })}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container} testID='video-player'>
      <View style={styles.posterInner}>
        {posterUri ? (
          <CachedImage
            source={{ uri: posterUri }}
            style={styles.posterImage}
            contentFit='cover'
            recyclingKey={`video-poster-${video.id}`}
          />
        ) : (
          <View style={styles.posterFallback} />
        )}

        {!playbackOpen ? (
          <TouchableOpacity
            style={styles.playOverlay}
            activeOpacity={0.9}
            onPress={() => setPlaybackOpen(true)}
            accessibilityRole='button'
            accessibilityLabel={t('course.video.play', { defaultValue: 'Reproduzir vídeo' })}
          >
            <Icon name='play-circle-outline' size={56} color='rgba(255,255,255,0.95)' />
          </TouchableOpacity>
        ) : (
          <View style={styles.playerOverlay}>{renderPlayer()}</View>
        )}
      </View>
    </View>
  );
};

export default VideoPlayer;
