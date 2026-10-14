const JITSI_JOIN_IN_URL = /(?:meet\.jit\.si|8x8\.vc|stage\.8x8\.vc)\/[^?\s#/]+/i;

export const isJitsiJoinUrl = (rawUrl: string): boolean => {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return false;
  }
  return JITSI_JOIN_IN_URL.test(trimmed);
};
