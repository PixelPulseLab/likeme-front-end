import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/layout';
import { COLORS } from '@/constants';
import type { CommunityEventJitsiJoinPayload } from '@/types/event';
import { logger } from '@/utils/logger';
import {
  getCachedJitsiMeetingExport,
  jitsiMeetingLoadErrorDetail,
  loadJitsiMeetingExport,
  type JitsiMeetingExport,
} from '@/infrastructure/jitsi/jitsiMeetingModuleLoader';
import { isJitsiNativeSdkLinked } from '@/utils/infrastructure/jitsiNativeSdkModule';

export type EventJitsiLiveSessionProps = {
  session: CommunityEventJitsiJoinPayload;
  onClose: () => void;
};

const JITSI_DISABLED_NOTIFICATION_SOUNDS = [
  'ASKED_TO_UNMUTE_SOUND',
  'E2EE_OFF_SOUND',
  'E2EE_ON_SOUND',
  'INCOMING_MSG_SOUND',
  'KNOCKING_PARTICIPANT_SOUND',
  'LIVE_STREAMING_OFF_SOUND',
  'LIVE_STREAMING_ON_SOUND',
  'NO_AUDIO_SIGNAL_SOUND',
  'NOISY_AUDIO_INPUT_SOUND',
  'OUTGOING_CALL_EXPIRED_SOUND',
  'OUTGOING_CALL_REJECTED_SOUND',
  'OUTGOING_CALL_RINGING_SOUND',
  'OUTGOING_CALL_START_SOUND',
  'PARTICIPANT_JOINED_SOUND',
  'PARTICIPANT_LEFT_SOUND',
  'RAISE_HAND_SOUND',
  'REACTION_SOUND',
  'RECORDING_OFF_SOUND',
  'RECORDING_ON_SOUND',
  'TALK_WHILE_MUTED_SOUND',
] as const;

const JITSI_VIEWER_CONFIG: Record<string, unknown> = {
  prejoinPageEnabled: false,
  startWithAudioMuted: true,
  startWithVideoMuted: true,
  startSilent: true,
  disableInitialGUM: true,
  disableModeratorIndicator: true,
  disableThirdPartyRequests: true,
  analytics: { disabled: true, rtcstatsEnabled: false },
  jaasConferenceCreatorUrl: '',
  disabledSounds: [...JITSI_DISABLED_NOTIFICATION_SOUNDS],
};

const JITSI_VIEWER_FLAGS: Record<string, unknown> = {
  'call-integration.enabled': false,
  'ios.screensharing.enabled': false,
};

const LIVE_SESSION_OVERLAY_Z_INDEX = 11000;
const LIVE_SESSION_FADE_MS = 220;

type LivePlayerMode = 'loading' | 'ready' | 'error';

type JitsiMeetingErrorBoundaryProps = {
  onFailure: (error: Error) => void;
  children: React.ReactNode;
};

type JitsiMeetingErrorBoundaryState = {
  hasError: boolean;
};

class JitsiMeetingErrorBoundary extends React.Component<
  JitsiMeetingErrorBoundaryProps,
  JitsiMeetingErrorBoundaryState
> {
  state: JitsiMeetingErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): JitsiMeetingErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    logger.error('[EventJitsiLiveSession] JitsiMeeting falhou ao renderizar', { cause: error });
    this.props.onFailure(error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

const NATIVE_MODULE_MISSING_MESSAGE =
  'A live nativa não está disponível nesta build. Reinstale o app (dev client) após rodar pod install.';

const LOAD_FAILED_MESSAGE =
  'Não foi possível carregar o player de live. Feche e tente de novo; se persistir, reinicie o Metro com cache limpo.';

export const EventJitsiLiveSession: React.FC<EventJitsiLiveSessionProps> = ({ session, onClose }) => {
  const nativeLinked = useMemo(() => isJitsiNativeSdkLinked(), []);
  const [playerMode, setPlayerMode] = useState<LivePlayerMode>(() => {
    if (!nativeLinked) {
      return 'error';
    }
    if (getCachedJitsiMeetingExport()) {
      return 'ready';
    }
    return 'loading';
  });
  const [errorMessage, setErrorMessage] = useState<string>(() => (nativeLinked ? '' : NATIVE_MODULE_MISSING_MESSAGE));
  const [JitsiMeetingCmp, setJitsiMeetingCmp] = useState<JitsiMeetingExport | null>(() =>
    getCachedJitsiMeetingExport(),
  );
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const isClosingRef = useRef(false);

  const runCloseAnimation = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }
    isClosingRef.current = true;
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: LIVE_SESSION_FADE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [onClose, overlayOpacity]);

  useEffect(() => {
    isClosingRef.current = false;
    overlayOpacity.setValue(0);
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: LIVE_SESSION_FADE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [session.roomName, session.serverURL, overlayOpacity]);

  const markLoadFailed = useCallback(
    (cause: unknown, context: string) => {
      logger.error(`[EventJitsiLiveSession] ${context}`, {
        roomName: session.roomName,
        detail: jitsiMeetingLoadErrorDetail(cause),
        stack: cause instanceof Error ? cause.stack : undefined,
      });
      setErrorMessage(LOAD_FAILED_MESSAGE);
      setPlayerMode('error');
    },
    [session.roomName],
  );

  useEffect(() => {
    if (!nativeLinked) {
      return;
    }

    if (getCachedJitsiMeetingExport()) {
      return;
    }

    let cancelled = false;
    void loadJitsiMeetingExport()
      .then((meetingExport) => {
        if (cancelled) {
          return;
        }
        setJitsiMeetingCmp(() => meetingExport);
        setPlayerMode('ready');
      })
      .catch((cause) => {
        if (!cancelled) {
          markLoadFailed(cause, 'Falha ao carregar SDK Jitsi');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [markLoadFailed, nativeLinked]);

  const onMeetingRenderFailure = useCallback(
    (error: Error) => {
      markLoadFailed(error, 'Erro ao renderizar JitsiMeeting');
    },
    [markLoadFailed],
  );

  const eventListeners = useMemo(
    () => ({
      onReadyToClose: () => {
        runCloseAnimation();
      },
      onConferenceLeft: () => {
        runCloseAnimation();
      },
    }),
    [runCloseAnimation],
  );

  const userInfo = useMemo(() => {
    const displayName = session.userName?.trim() || 'Participante Like:Me';
    const email = session.userEmail?.trim() || '';
    return { avatarURL: '', displayName, email };
  }, [session.userEmail, session.userName]);

  const { meetingRoom, meetingServerUrl } = useMemo(() => {
    let room = session.roomName.trim();
    const serverUrl = session.serverURL.trim();

    if (room.includes('://')) {
      try {
        const pathname = new URL(room).pathname.replace(/^\//, '');
        room = pathname || room;
      } catch {
        // mantém room original
      }
    }

    const slashIndex = room.indexOf('/');
    const hasTenantInRoomName = slashIndex !== -1 && room.startsWith('vpaas-magic-cookie-');
    if (hasTenantInRoomName) {
      const tenant = room.slice(0, slashIndex);
      const slug = room.slice(slashIndex + 1).toLowerCase();
      const baseOrigin = (() => {
        try {
          const normalized = serverUrl.endsWith('/') ? serverUrl : `${serverUrl}/`;
          return new URL(normalized).origin;
        } catch {
          return 'https://8x8.vc';
        }
      })();
      return {
        meetingRoom: slug,
        meetingServerUrl: `${baseOrigin}/${tenant}/`,
      };
    }

    const normalizedServer = serverUrl.endsWith('/') ? serverUrl : `${serverUrl}/`;
    return { meetingRoom: room, meetingServerUrl: normalizedServer };
  }, [session.roomName, session.serverURL]);

  const likemeHeader = (
    <SafeAreaView edges={['top']} style={styles.likemeHeaderSafeArea}>
      <Header showBackButton onBackPress={runCloseAnimation} showMenuWithAvatar={false} />
    </SafeAreaView>
  );

  const shell = (content: React.ReactNode) => (
    <Animated.View style={[styles.sessionShell, { opacity: overlayOpacity }]}>
      {likemeHeader}
      <View style={styles.playerHost}>{content}</View>
    </Animated.View>
  );

  if (playerMode === 'error') {
    return shell(
      <View style={styles.messageContainer}>
        <Text style={styles.errorTitle}>Live indisponível</Text>
        <Text style={styles.errorBody}>{errorMessage}</Text>
      </View>,
    );
  }

  if (playerMode === 'loading' || !JitsiMeetingCmp) {
    return shell(
      <View style={styles.loaderContainer}>
        <ActivityIndicator size='large' />
      </View>,
    );
  }

  const Meeting = JitsiMeetingCmp;

  return shell(
    <JitsiMeetingErrorBoundary onFailure={onMeetingRenderFailure}>
      <Meeting
        room={meetingRoom}
        serverURL={meetingServerUrl}
        token={session.token}
        userInfo={userInfo}
        config={JITSI_VIEWER_CONFIG}
        flags={JITSI_VIEWER_FLAGS}
        eventListeners={eventListeners}
        style={styles.meeting}
      />
    </JitsiMeetingErrorBoundary>,
  );
};

const styles = StyleSheet.create({
  sessionShell: {
    ...StyleSheet.absoluteFill,
    zIndex: LIVE_SESSION_OVERLAY_Z_INDEX,
    elevation: LIVE_SESSION_OVERLAY_Z_INDEX,
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
  },
  likemeHeaderSafeArea: {
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
  },
  playerHost: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  meeting: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#001137',
    marginBottom: 12,
  },
  errorBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
  },
});
