import { resolveCommunityHeroImageUri } from '@/utils/community/mappers';
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
  it('prioriza bannerImageUrl sobre os campos legados', () => {
    expect(
      resolveCommunityHeroImageUri(
        community({
          bannerImageUrl: 'https://cdn.example.com/banner.jpg',
          heroImageUrl: 'https://cdn.example.com/hero-legado.jpg',
          avatarUrl: 'https://cdn.example.com/avatar.jpg',
        }),
        [],
        'fallback',
      ),
    ).toBe('https://cdn.example.com/banner.jpg');
  });

  it('mantém fallback para heroImageUrl e avatarUrl', () => {
    expect(
      resolveCommunityHeroImageUri(
        community({ heroImageUrl: 'https://cdn.example.com/hero-legado.jpg' }),
        [],
        'fallback',
      ),
    ).toBe('https://cdn.example.com/hero-legado.jpg');
    expect(
      resolveCommunityHeroImageUri(community({ avatarUrl: 'https://cdn.example.com/avatar.jpg' }), [], 'fallback'),
    ).toBe('https://cdn.example.com/avatar.jpg');
  });
});
