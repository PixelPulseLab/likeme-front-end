declare module '@jitsi/react-native-sdk/react/features/base/lib-jitsi-meet/functions.any' {
  export function createLocalTrack(...args: unknown[]): Promise<unknown>;
  export function isAnalyticsEnabled(stateful: unknown): boolean;
  export function isFatalJitsiConferenceError(error: unknown): boolean;
  export function isFatalJitsiConnectionError(error: unknown): boolean;
}
