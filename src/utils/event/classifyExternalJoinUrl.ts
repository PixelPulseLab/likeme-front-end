import { isJitsiJoinUrl } from '@/utils/event/isJitsiJoinUrl';
import { isZoomJoinUrl } from '@/utils/event/isZoomJoinUrl';

export type ExternalJoinUrlKind =
  | { kind: 'none' }
  | { kind: 'external_browser'; url: string }
  | { kind: 'zoom'; url: string }
  | { kind: 'jitsi'; url: string };

export function classifyExternalJoinUrl(externalUrl: string | undefined): ExternalJoinUrlKind {
  const url = externalUrl?.trim();
  if (!url) {
    return { kind: 'none' };
  }
  if (isJitsiJoinUrl(url)) {
    return { kind: 'jitsi', url };
  }
  if (isZoomJoinUrl(url)) {
    return { kind: 'zoom', url };
  }
  return { kind: 'external_browser', url };
}
