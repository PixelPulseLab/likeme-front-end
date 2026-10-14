import { NativeModules, Platform } from 'react-native';

export const JITSI_APP_INFO_NATIVE_MODULE = 'AppInfo' as const;

export function isJitsiNativeSdkLinked(): boolean {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return false;
  }
  return NativeModules[JITSI_APP_INFO_NATIVE_MODULE] != null;
}
