import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, TouchableOpacity, View } from 'react-native';
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
  javaScriptEnabled?: boolean;
  domStorageEnabled?: boolean;
  originWhitelist?: string[];
  startInLoadingState?: boolean;
  renderLoading?: () => React.ReactElement;
  onError?: (event: { nativeEvent?: { description?: string } }) => void;
}>;

function videoHasPlaybackUrl(video: Attachment): boolean {
  return Boolean(video.streamUrl?.trim() || video.playerUrl?.trim() || video.url?.trim());
}

export const VideoPlayer: React.FC<Props> = ({ video }) => {
  const { t } = useTranslation();
  const [playbackOpen, setPlaybackOpen] = useState(false);
  const [WebViewCmp, setWebViewCmp] = useState<WebViewComponent | null>(null);
  const [preferStreamFallback, setPreferStreamFallback] = useState(false);
  const [streamFailed, setStreamFailed] = useState(false);

  const streamUrl = video.streamUrl?.trim() || '';
  const playerUrl = video.playerUrl?.trim() || (!streamUrl ? video.url?.trim() || '' : '');
  const posterUri = video.posterUrl?.trim() || undefined;
  const playable = video.playable !== false && videoHasPlaybackUrl(video);
  const canUseWebView = isRncWebViewTurboModuleLinked();

  // Embed do provedor quando há WebView; HLS como fallback (ou único caminho sem módulo nativo).
  const useEmbedPlayer = Boolean(playerUrl) && !preferStreamFallback && canUseWebView;
  const useStreamPlayer = Boolean(streamUrl) && !streamFailed && (!playerUrl || preferStreamFallback || !canUseWebView);
  const needsWebViewPlayer = playbackOpen && useEmbedPlayer;

  useEffect(() => {
    setPlaybackOpen(false);
    setPreferStreamFallback(false);
    setStreamFailed(false);
  }, [video.id]);

  useEffect(() => {
    if (!needsWebViewPlayer) {
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
        if (streamUrl) {
          setPreferStreamFallback(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [needsWebViewPlayer, streamUrl, video.id]);

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

  const openPlayerExternally = () => {
    if (!playerUrl) {
      return;
    }
    void Linking.openURL(playerUrl).catch((cause) => {
      logger.error('[VideoPlayer] Falha ao abrir player externo', {
        videoId: video.id,
        playerUrl,
        cause,
      });
    });
  };

  const renderPlayer = () => {
    if (useEmbedPlayer && WebViewCmp) {
      const WV = WebViewCmp;
      return (
        <>
          <WV
            source={{ uri: playerUrl }}
            style={styles.webView}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size='large' color={COLORS.PRIMARY.PURE} />
              </View>
            )}
            onError={(event) => {
              logger.error('[VideoPlayer] Erro no WebView do player', {
                videoId: video.id,
                playerUrl,
                description: event.nativeEvent?.description,
              });
              if (streamUrl) {
                setPreferStreamFallback(true);
                return;
              }
              openPlayerExternally();
            }}
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

    if (useEmbedPlayer) {
      return (
        <View style={styles.webViewLoading}>
          <ActivityIndicator size='large' color={COLORS.PRIMARY.PURE} />
        </View>
      );
    }

    if (useStreamPlayer) {
      return (
        <PostEmbeddedVideo
          videoUri={streamUrl}
          fillContainer
          onCollapse={() => setPlaybackOpen(false)}
          onPlaybackError={() => {
            logger.warn('[VideoPlayer] Falha no stream HLS; tentando embed ou URL externa', {
              videoId: video.id,
              streamUrl,
              hasPlayerUrl: Boolean(playerUrl),
            });
            setStreamFailed(true);
            if (playerUrl && canUseWebView) {
              setPreferStreamFallback(false);
              return;
            }
            if (playerUrl) {
              openPlayerExternally();
            }
          }}
        />
      );
    }

    if (playerUrl) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.statusText}>
            {t('course.video.openExternal', {
              defaultValue: 'Não foi possível reproduzir aqui. Abra no navegador.',
            })}
          </Text>
          <TouchableOpacity onPress={openPlayerExternally} accessibilityRole='button'>
            <Text style={styles.statusLink}>
              {t('course.video.openExternalCta', { defaultValue: 'Tocar no navegador' })}
            </Text>
          </TouchableOpacity>
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
