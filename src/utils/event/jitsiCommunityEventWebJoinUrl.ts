import type { CommunityEventJitsiJoinPayload } from '@/types/event';

export function jitsiCommunityEventWebJoinUrl(session: CommunityEventJitsiJoinPayload): string {
  const base = session.externalUrl.trim();
  const token = session.token?.trim();
  if (!token) {
    return base;
  }

  try {
    const normalizedBase = /^https?:\/\//i.test(base) ? base : `https://${base}`;
    const url = new URL(normalizedBase);
    url.searchParams.set('jwt', token);
    return url.toString();
  } catch {
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}jwt=${encodeURIComponent(token)}`;
  }
}
