declare module '@jitsi/react-native-sdk' {
  import type { ComponentType } from 'react';

  export type JitsiMeetingProps = {
    room: string;
    serverURL?: string;
    token?: string;
    config?: Record<string, unknown>;
    flags?: Record<string, unknown>;
    eventListeners?: Record<string, (...args: unknown[]) => void>;
    userInfo?: { avatarURL: string; displayName: string; email: string };
    style?: object;
  };

  export const JitsiMeeting: ComponentType<JitsiMeetingProps>;
}
