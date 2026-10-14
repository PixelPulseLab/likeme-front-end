import type { ComponentType } from 'react';

export type JitsiMeetingExport = ComponentType<{
  room: string;
  serverURL: string;
  token?: string;
  userInfo?: { avatarURL: string; displayName: string; email: string };
  config?: Record<string, unknown>;
  flags?: Record<string, unknown>;
  eventListeners?: Record<string, (...args: unknown[]) => void>;
  style?: object;
}>;

let cachedMeetingExport: JitsiMeetingExport | null = null;
let loadPromise: Promise<JitsiMeetingExport> | null = null;

export function getCachedJitsiMeetingExport(): JitsiMeetingExport | null {
  return cachedMeetingExport;
}

export function jitsiMeetingLoadErrorDetail(cause: unknown): string {
  if (cause instanceof Error) {
    return `${cause.name}: ${cause.message}`;
  }
  if (typeof cause === 'string' && cause.trim().length > 0) {
    return cause.trim();
  }
  if (cause && typeof cause === 'object') {
    const message = (cause as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message.trim();
    }
    try {
      const serialized = JSON.stringify(cause);
      if (serialized && serialized !== '{}') {
        return serialized;
      }
    } catch {
      // ignore
    }
  }
  return 'erro desconhecido ao carregar @jitsi/react-native-sdk';
}

export function loadJitsiMeetingExport(): Promise<JitsiMeetingExport> {
  if (cachedMeetingExport) {
    return Promise.resolve(cachedMeetingExport);
  }
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = import('@jitsi/react-native-sdk')
    .then((mod) => {
      const meetingExport = mod.JitsiMeeting ?? mod.default?.JitsiMeeting;
      if (meetingExport == null) {
        throw new Error('JitsiMeeting export ausente no @jitsi/react-native-sdk');
      }
      cachedMeetingExport = meetingExport as JitsiMeetingExport;
      return cachedMeetingExport;
    })
    .catch((error: unknown) => {
      loadPromise = null;
      throw error;
    });

  return loadPromise;
}
