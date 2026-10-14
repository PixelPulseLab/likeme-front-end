import { classifyExternalJoinUrl } from '@/utils/event/classifyExternalJoinUrl';

describe('classifyExternalJoinUrl', () => {
  it('retorna none quando URL ausente ou vazia', () => {
    expect(classifyExternalJoinUrl(undefined)).toEqual({ kind: 'none' });
    expect(classifyExternalJoinUrl('')).toEqual({ kind: 'none' });
    expect(classifyExternalJoinUrl('   ')).toEqual({ kind: 'none' });
  });

  it('retorna jitsi para link Jitsi', () => {
    const url = 'https://meet.jit.si/LikeMeLiveTest';
    expect(classifyExternalJoinUrl(url)).toEqual({ kind: 'jitsi', url });
  });

  it('retorna zoom para link Zoom', () => {
    const url = 'https://us02web.zoom.us/j/123456789';
    expect(classifyExternalJoinUrl(url)).toEqual({ kind: 'zoom', url });
  });

  it('retorna external_browser para URL que não é join Zoom', () => {
    const url = 'https://example.com/sessao';
    expect(classifyExternalJoinUrl(url)).toEqual({ kind: 'external_browser', url });
  });
});
