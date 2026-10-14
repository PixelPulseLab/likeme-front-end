import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/constants';
import type { CommunityEventJitsiJoinPayload } from '@/types/event';
import { logger } from '@/utils/logger';
import { isJitsiNativeSdkLinked } from '@/utils/infrastructure/jitsiNativeSdkModule';

export type EventJitsiLiveSessionProps = {
  session: CommunityEventJitsiJoinPayload;
  onClose: () => void;
};

type JitsiMeetingComponent = React.ComponentType<{
  room: string;
  serverURL: string;
  token?: string;
  userInfo?: { avatarURL: string; displayName: string; email: string };
  config?: Record<string, unknown>;
  flags?: Record<string, unknown>;
  eventListeners?: Record<string, (...args: unknown[]) => void>;
  style?: object;
}>;

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
  const [playerMode, setPlayerMode] = useState<LivePlayerMode>(() => (nativeLinked ? 'loading' : 'error'));
  const [errorMessage, setErrorMessage] = useState<string>(() => (nativeLinked ? '' : NATIVE_MODULE_MISSING_MESSAGE));
  const [JitsiMeetingCmp, setJitsiMeetingCmp] = useState<JitsiMeetingComponent | null>(null);

  const markLoadFailed = useCallback(
    (cause: unknown, context: string) => {
      logger.error(`[EventJitsiLiveSession] ${context}`, {
        roomName: session.roomName,
        cause,
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

    let cancelled = false;
    void import('@jitsi/react-native-sdk')
      .then((mod) => {
        if (cancelled) {
          return;
        }
        const meetingExport = mod.JitsiMeeting ?? mod.default?.JitsiMeeting;
        if (meetingExport == null) {
          markLoadFailed(new Error('JitsiMeeting export inválido'), 'Export JitsiMeeting ausente');
          return;
        }
        setJitsiMeetingCmp(() => meetingExport as JitsiMeetingComponent);
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
        onClose();
      },
      onConferenceLeft: () => {
        onClose();
      },
    }),
    [onClose],
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

  const header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.8}>
        <Text style={styles.closeButtonText}>Fechar</Text>
      </TouchableOpacity>
    </View>
  );

  const shell = (content: React.ReactNode) => <View style={styles.sessionShell}>{content}</View>;

  if (playerMode === 'error') {
    return shell(
      <>
        {header}
        <View style={styles.messageContainer}>
          <Text style={styles.errorTitle}>Live indisponível</Text>
          <Text style={styles.errorBody}>{errorMessage}</Text>
        </View>
      </>,
    );
  }

  if (playerMode === 'loading' || !JitsiMeetingCmp) {
    return shell(
      <>
        {header}
        <View style={styles.loaderContainer}>
          <ActivityIndicator size='large' />
        </View>
      </>,
    );
  }

  const Meeting = JitsiMeetingCmp;

  return shell(
    <>
      {header}
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
      </JitsiMeetingErrorBoundary>
    </>,
  );
};

const styles = StyleSheet.create({
  sessionShell: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: COLORS.WHITE,
  },
  header: {
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DADADA',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  closeButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingRight: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#001137',
    fontWeight: '600',
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
