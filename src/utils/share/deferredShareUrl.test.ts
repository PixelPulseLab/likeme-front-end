import { deferredShareUrlTestUtils } from '@/utils/share/deferredShareUrl';

describe('deferredShareUrl', () => {
  it('parseDeferredShareUrlFromInstallReferrer extrai url= do referrer Play Store', () => {
    const shareUrl = 'https://likeme.example/post/abc';
    const referrer = `url=${encodeURIComponent(shareUrl)}`;
    expect(deferredShareUrlTestUtils.parseDeferredShareUrlFromInstallReferrer(referrer)).toBe(shareUrl);
  });
});
