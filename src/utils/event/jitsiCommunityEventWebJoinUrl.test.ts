import { jitsiCommunityEventWebJoinUrl } from '@/utils/event/jitsiCommunityEventWebJoinUrl';
import type { CommunityEventJitsiJoinPayload } from '@/types/event';

const baseSession: CommunityEventJitsiJoinPayload = {
  provider: 'jitsi',
  externalUrl: 'https://8x8.vc/vpaas-magic-cookie-abc/MyRoom',
  roomName: 'vpaas-magic-cookie-abc/MyRoom',
  serverURL: 'https://8x8.vc/',
  userName: 'Test User',
};

describe('jitsiCommunityEventWebJoinUrl', () => {
  it('retorna externalUrl quando não há token', () => {
    expect(jitsiCommunityEventWebJoinUrl(baseSession)).toBe(baseSession.externalUrl);
  });

  it('anexa jwt na query para JaaS', () => {
    const url = jitsiCommunityEventWebJoinUrl({ ...baseSession, token: 'signed.jwt.token' });
    expect(url).toContain('jwt=signed.jwt.token');
    expect(url.startsWith('https://8x8.vc/')).toBe(true);
  });
});
