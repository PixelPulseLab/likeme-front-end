import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Video, { type OnLoadData, type OnProgressData, type VideoRef } from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PlayerBackIcon from '@/assets/course/player-back-15.svg';
import PlayerForwardIcon from '@/assets/course/player-forward-15.svg';
import PlayerFullscreenIcon from '@/assets/course/player-fullscreen.svg';
import PlayerMoreIcon from '@/assets/course/player-more.svg';
import PlayerPlayIcon from '@/assets/course/player-play.svg';
import PlayerVolumeIcon from '@/assets/course/player-volume.svg';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { PostEmbeddedVideo, videoSourceFromUri } from '@/components/sections/community/PostCard/PostEmbeddedVideo';
import { useTranslation } from '@/hooks/i18n';
import type { Attachment } from '@/types/attachment';
import { COLORS, SPACING } from '@/constants';
import { logger } from '@/utils/logger';
import { isRncWebViewTurboModuleLinked } from '@/utils/infrastructure/rncWebViewModule';
import { styles } from './styles';

const SEEK_STEP_SECONDS = 15;

const COURSE_VIDEO_STATUS = {
  FAILED: 'FAILED',
} as const;

type Props = {
  video: Attachment;
  opensFullscreen?: boolean;
  startOpen?: boolean;
  onClose?: () => void;
  presentation?: 'card' | 'lesson';
  title?: string;
  durationMinutes?: number | null;
};

function clockLabel(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remain = seconds % 60;
  const paddedSeconds = String(remain).padStart(2, '0');
  if (hours > 0) {
    const paddedMinutes = String(minutes).padStart(2, '0');
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }
  return `${minutes}:${paddedSeconds}`;
}

function LessonPauseIcon() {
  return (
    <View style={styles.lessonPause}>
      <View style={styles.lessonPauseBar} />
      <View style={styles.lessonPauseBar} />
    </View>
  );
}

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

export const VideoPlayer: React.FC<Props> = ({
  video,
  opensFullscreen = false,
  startOpen = false,
  onClose,
  presentation = 'card',
  title = '',
  durationMinutes = null,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<VideoRef>(null);
  const positionRef = useRef(0);
  const [playbackOpen, setPlaybackOpen] = useState(startOpen && opensFullscreen);
  const [WebViewCmp, setWebViewCmp] = useState<WebViewComponent | null>(null);
  const [embedFailed, setEmbedFailed] = useState(false);
  const [streamFailed, setStreamFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [positionSeconds, setPositionSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [streamReady, setStreamReady] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const pendingSeekRef = useRef<number | null>(null);
  const isLesson = presentation === 'lesson';

  const streamUrl = video.streamUrl?.trim() || '';
  const playerUrl = video.playerUrl?.trim() || (!streamUrl ? video.url?.trim() || '' : '');
  const posterUri = video.posterUrl?.trim() || undefined;
  const videoStatus = video.status?.trim().toUpperCase() ?? '';
  const isFailedVideo = videoStatus === COURSE_VIDEO_STATUS.FAILED;
  const canPlay = video.playable === true && !isFailedVideo && videoHasPlaybackUrl(video);
  const canUseWebView = isRncWebViewTurboModuleLinked();

  const useStreamPlayer = Boolean(streamUrl) && !streamFailed;
  const useEmbedPlayer = !useStreamPlayer && Boolean(playerUrl) && canUseWebView && !embedFailed;
  const needsWebViewPlayer = playbackOpen && useEmbedPlayer;

  useEffect(() => {
    setPlaybackOpen(startOpen && opensFullscreen);
    setEmbedFailed(false);
    setStreamFailed(false);
    setPlaying(false);
    setStarted(false);
    setFullscreen(false);
    setPositionSeconds(0);
    setDurationSeconds(null);
    setStreamReady(false);
    positionRef.current = 0;
    pendingSeekRef.current = null;
  }, [video.id, startOpen, opensFullscreen]);

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
        setEmbedFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [needsWebViewPlayer, video.id]);

  if (!canPlay) {
    const unavailableStyle = isLesson ? styles.lessonUnavailable : styles.placeholder;
    const shellStyle = isLesson ? styles.lessonContainer : styles.container;
    const unavailableLabel = isFailedVideo
      ? t('course.video.failed', { defaultValue: 'Este vídeo está indisponível.' })
      : t('course.video.unavailable', {
          defaultValue: 'Vídeo ainda não está disponível para reprodução.',
        });
    const unavailableIcon = isFailedVideo ? 'error-outline' : 'hourglass-empty';
    return (
      <View style={shellStyle} testID='video-player-unavailable'>
        <View style={unavailableStyle}>
          <Icon name={unavailableIcon} size={36} color={COLORS.NEUTRAL.LOW.MEDIUM} />
          <Text style={styles.statusText}>{unavailableLabel}</Text>
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
              setEmbedFailed(true);
              openPlayerExternally();
            }}
          />
          {opensFullscreen ? null : (
            <Pressable
              style={styles.collapseTouch}
              onPress={closePlayback}
              accessibilityRole='button'
              accessibilityLabel={t('course.video.collapse', { defaultValue: 'Voltar à capa do vídeo' })}
            >
              <View style={styles.collapseInner}>
                <Icon name='keyboard-arrow-down' size={26} color='rgba(255,255,255,0.95)' />
              </View>
            </Pressable>
          )}
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
          hideCollapse={opensFullscreen}
          onCollapse={() => setPlaybackOpen(false)}
          onPlaybackError={() => {
            logger.warn('[VideoPlayer] Falha no stream HLS; tentando embed ou URL externa', {
              videoId: video.id,
              streamUrl,
              hasPlayerUrl: Boolean(playerUrl),
            });
            setStreamFailed(true);
            if (playerUrl && canUseWebView && !embedFailed) {
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

  const editorialSeconds = durationMinutes != null && durationMinutes > 0 ? durationMinutes * 60 : 0;
  const totalSeconds = durationSeconds ?? editorialSeconds;
  const progressRatio = totalSeconds > 0 ? Math.min(1, positionSeconds / totalSeconds) : 0;
  const elapsedLabel = clockLabel(positionSeconds);
  const totalLabel = clockLabel(totalSeconds);
  const timeLabel = `${elapsedLabel} / ${totalLabel}`;
  const progressWidth = trackWidth * progressRatio;
  const playLabel = playing ? 'Pausar vídeo' : t('course.video.play', { defaultValue: 'Reproduzir vídeo' });
  const volumeLabel = muted ? 'Ativar som' : 'Silenciar';
  const fullscreenLabel = fullscreen ? 'Sair da tela cheia' : 'Tela cheia';
  const lessonCanStream = Boolean(streamUrl) && !streamFailed;
  const showLessonSpinner = started && playing && lessonCanStream && !streamReady;
  const lessonResizeMode = fullscreen ? 'contain' : 'cover';
  const lessonPlayIcon = playing ? <LessonPauseIcon /> : <PlayerPlayIcon />;
  const volumeStyle = muted ? styles.lessonControlMuted : undefined;
  const lessonFrameStyle = fullscreen ? styles.lessonFrameFill : null;
  const chromeBottom = fullscreen ? insets.bottom + SPACING.SM : SPACING.SM;

  const rememberPosition = (next: number) => {
    positionRef.current = next;
    setPositionSeconds(next);
  };

  const toggleLessonPlay = () => {
    if (lessonCanStream) {
      setStarted(true);
      setPlaying((current) => !current);
      return;
    }
    setPlaybackOpen(true);
  };

  const seekBy = (delta: number) => {
    if (!lessonCanStream) {
      return;
    }
    const ceiling = totalSeconds > 0 ? totalSeconds : positionSeconds + Math.max(delta, 0);
    const next = Math.min(ceiling, Math.max(0, positionSeconds + delta));
    rememberPosition(next);
    if (!started) {
      pendingSeekRef.current = next;
      setStarted(true);
      setPlaying(true);
      return;
    }
    setPlaying(true);
    videoRef.current?.seek(next);
  };

  const scrubTo = (locationX: number, width: number) => {
    if (!lessonCanStream || width <= 0 || totalSeconds <= 0) {
      return;
    }
    const ratio = Math.min(1, Math.max(0, locationX / width));
    seekBy(ratio * totalSeconds - positionSeconds);
  };

  const onStreamLoad = (data: OnLoadData) => {
    setStreamReady(true);
    if (data.duration > 0) {
      setDurationSeconds(data.duration);
    }
    const pending = pendingSeekRef.current;
    pendingSeekRef.current = null;
    const position = pending ?? positionRef.current;
    if (position > 0) {
      videoRef.current?.seek(position);
    }
  };

  const onStreamProgress = (data: OnProgressData) => {
    rememberPosition(data.currentTime);
  };

  const onStreamError = () => {
    logger.warn('[VideoPlayer] Falha no stream da aula', {
      videoId: video.id,
      streamUrl,
    });
    setStreamFailed(true);
    setPlaying(false);
    setFullscreen(false);
    setStarted(false);
    if (playerUrl) {
      setPlaybackOpen(true);
    }
  };

  const toggleFullscreen = () => {
    if (!lessonCanStream) {
      setPlaybackOpen(true);
      return;
    }
    if (!started) {
      setStarted(true);
      setPlaying(true);
    }
    setFullscreen((current) => !current);
  };

  const closePlayback = () => {
    setPlaybackOpen(false);
    onClose?.();
  };

  const embedModal =
    playbackOpen && (opensFullscreen || isLesson) ? (
      <Modal
        visible
        animationType='fade'
        statusBarTranslucent
        supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
        onRequestClose={closePlayback}
      >
        <View style={styles.fullscreenStage}>
          <View style={styles.fullscreenPlayer}>{renderPlayer()}</View>
          <Pressable
            style={[styles.fullscreenClose, { top: insets.top + SPACING.SM }]}
            onPress={closePlayback}
            accessibilityRole='button'
            accessibilityLabel={t('course.video.collapse', { defaultValue: 'Voltar à capa do vídeo' })}
          >
            <View style={styles.collapseInner}>
              <Icon name='close' size={22} color='rgba(255,255,255,0.95)' />
            </View>
          </Pressable>
        </View>
      </Modal>
    ) : null;

  if (isLesson) {
    const lessonPoster = posterUri ? (
      <CachedImage
        source={{ uri: posterUri }}
        style={styles.posterImage}
        contentFit='cover'
        recyclingKey={`video-poster-${video.id}`}
      />
    ) : (
      <View style={styles.posterFallback} />
    );

    const showLessonPoster = !(started && lessonCanStream);
    const lessonVisual = showLessonPoster ? lessonPoster : null;
    const lessonStream =
      started && lessonCanStream ? (
        <Video
          ref={videoRef}
          source={videoSourceFromUri(streamUrl)}
          style={StyleSheet.absoluteFill}
          controls={false}
          paused={!playing}
          muted={muted}
          resizeMode={lessonResizeMode}
          repeat={false}
          ignoreSilentSwitch='ignore'
          playInBackground={false}
          onLoad={onStreamLoad}
          onProgress={onStreamProgress}
          onEnd={() => setPlaying(false)}
          onError={onStreamError}
        />
      ) : null;
    const lessonSpinner = showLessonSpinner ? (
      <View style={styles.lessonSpinner} pointerEvents='none'>
        <ActivityIndicator color={COLORS.NEUTRAL.HIGH.LIGHT} />
      </View>
    ) : null;

    const lessonFrame = (
      <View style={[styles.lessonFrame, lessonFrameStyle]}>
        {lessonVisual}
        {lessonStream}
        <Pressable style={StyleSheet.absoluteFill} onPress={toggleLessonPlay} accessible={false} />
        {lessonSpinner}
        <View style={[styles.lessonChrome, { paddingBottom: chromeBottom }]} pointerEvents='box-none'>
          <LinearGradient
            pointerEvents='none'
            colors={['rgba(8,9,13,0)', 'rgba(8,9,13,0.9)']}
            style={styles.lessonChromeFade}
          />
          <View style={styles.lessonChromeBody} pointerEvents='auto'>
            <View style={styles.lessonChromeMeta}>
              <Text style={styles.lessonChromeTitle} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.lessonChromeTime}>{timeLabel}</Text>
            </View>
            <Pressable
              style={styles.lessonTrackHit}
              onPress={(event) => scrubTo(event.nativeEvent.locationX, trackWidth)}
              onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
              accessibilityRole='adjustable'
              accessibilityLabel={timeLabel}
            >
              <View style={styles.lessonTrack}>
                <View style={[styles.lessonTrackFill, { width: progressWidth }]} />
              </View>
            </Pressable>
            <View style={styles.lessonChromeControls}>
              <View style={styles.lessonChromeGroup}>
                <Pressable
                  style={styles.lessonControl}
                  onPress={toggleLessonPlay}
                  accessibilityRole='button'
                  accessibilityLabel={playLabel}
                >
                  {lessonPlayIcon}
                </Pressable>
                <Pressable
                  style={styles.lessonControl}
                  onPress={() => seekBy(-SEEK_STEP_SECONDS)}
                  accessibilityRole='button'
                  accessibilityLabel='Voltar 15 segundos'
                >
                  <PlayerBackIcon />
                </Pressable>
                <Pressable
                  style={styles.lessonControl}
                  onPress={() => seekBy(SEEK_STEP_SECONDS)}
                  accessibilityRole='button'
                  accessibilityLabel='Avançar 15 segundos'
                >
                  <PlayerForwardIcon />
                </Pressable>
              </View>
              <View style={styles.lessonChromeGroup}>
                <Pressable
                  style={styles.lessonControl}
                  onPress={() => setMuted((current) => !current)}
                  accessibilityRole='button'
                  accessibilityLabel={volumeLabel}
                >
                  <View style={volumeStyle}>
                    <PlayerVolumeIcon />
                  </View>
                </Pressable>
                <Pressable
                  style={styles.lessonControl}
                  onPress={toggleFullscreen}
                  accessibilityRole='button'
                  accessibilityLabel={fullscreenLabel}
                >
                  <PlayerFullscreenIcon />
                </Pressable>
                <View
                  style={styles.lessonControl}
                  accessibilityElementsHidden
                  importantForAccessibility='no-hide-descendants'
                >
                  <PlayerMoreIcon />
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    );

    const lessonStage = fullscreen ? (
      <Modal
        visible
        animationType='fade'
        statusBarTranslucent
        supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
        onRequestClose={() => setFullscreen(false)}
      >
        <View style={styles.fullscreenStage}>{lessonFrame}</View>
      </Modal>
    ) : (
      lessonFrame
    );

    return (
      <View style={styles.lessonContainer} testID='video-player'>
        {lessonStage}
        {embedModal}
      </View>
    );
  }

  if (startOpen && opensFullscreen) {
    return embedModal;
  }

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

        {playbackOpen && !opensFullscreen ? (
          <View style={styles.playerOverlay}>{renderPlayer()}</View>
        ) : (
          <TouchableOpacity
            style={styles.playOverlay}
            activeOpacity={0.9}
            onPress={() => setPlaybackOpen(true)}
            accessibilityRole='button'
            accessibilityLabel={t('course.video.play', { defaultValue: 'Reproduzir vídeo' })}
          >
            <Icon name='play-circle-outline' size={56} color='rgba(255,255,255,0.95)' />
          </TouchableOpacity>
        )}
      </View>
      {embedModal}
    </View>
  );
};
