import { resolveCommunityBannerImageUri, resolveCommunityHeroImageUri } from '@/utils/community/mappers';
import type { Community } from '@/types/community';

const community = (overrides: Partial<Community>): Community => ({
  communityId: 'community-1',
  displayName: 'Comunidade',
  isPublic: true,
  membersCount: 0,
  postsCount: 0,
  createdAt: '2026-08-20T00:00:00.000Z',
  ...overrides,
});

describe('resolveCommunityHeroImageUri', () => {
  it('prioriza heroImageUrl sobre banner e campos legados', () => {
    expect(
      resolveCommunityHeroImageUri(
        community({
          heroImageUrl: 'https://cdn.example.com/hero.jpg',
          bannerImageUrl: 'https://cdn.example.com/banner.jpg',
          avatarUrl: 'https://cdn.example.com/avatar.jpg',
        }),
        [],
        'fallback',
      ),
    ).toBe('https://cdn.example.com/hero.jpg');
  });

  it('usa bannerImageUrl quando não há hero cadastrado', () => {
    expect(
      resolveCommunityHeroImageUri(community({ bannerImageUrl: 'https://cdn.example.com/banner.jpg' }), [], 'fallback'),
    ).toBe('https://cdn.example.com/banner.jpg');
  });

  it('mantém fallback para avatarUrl', () => {
    expect(
      resolveCommunityHeroImageUri(community({ avatarUrl: 'https://cdn.example.com/avatar.jpg' }), [], 'fallback'),
    ).toBe('https://cdn.example.com/avatar.jpg');
  });
});

describe('resolveCommunityBannerImageUri', () => {
  it('prioriza bannerImageUrl sobre hero e campos legados', () => {
    expect(
      resolveCommunityBannerImageUri(
        community({
          heroImageUrl: 'https://cdn.example.com/hero.jpg',
          bannerImageUrl: 'https://cdn.example.com/banner.jpg',
          avatarUrl: 'https://cdn.example.com/avatar.jpg',
        }),
        [],
        'fallback',
      ),
    ).toBe('https://cdn.example.com/banner.jpg');
  });

  it('usa heroImageUrl quando não há banner cadastrado', () => {
    expect(
      resolveCommunityBannerImageUri(community({ heroImageUrl: 'https://cdn.example.com/hero.jpg' }), [], 'fallback'),
    ).toBe('https://cdn.example.com/hero.jpg');
  });

  it('resolve pela lista de files quando só há avatarFileId', () => {
    expect(
      resolveCommunityBannerImageUri(
        community({ avatarFileId: 'file-1' }),
        [{ fileId: 'file-1', fileUrl: 'https://cdn.example.com/file.jpg' } as never],
        'fallback',
      ),
    ).toBe('https://cdn.example.com/file.jpg');
  });
});
