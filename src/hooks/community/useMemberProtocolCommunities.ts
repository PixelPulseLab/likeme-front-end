import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { communityService } from '@/services';
import type { Community, CommunityCategory, CommunityFile } from '@/types/community';
import { MEMBER_PROTOCOL_COMMUNITY_IMAGE_FALLBACK } from '@/constants/community/communityProtocol';
import { communityProtocolCardBadges } from '@/utils/community/communityProtocolCardBadges';
import { resolveCommunityHeroImageUri } from '@/utils/community/mappers';
import { logger } from '@/utils/logger';

const MEMBER_PROTOCOLS_FETCH_LIMIT = 50;

export type MemberProtocolCardItem = {
  communityId: string;
  title: string;
  badges: string[];
  image: string;
  description?: string | null;
  agreement?: string | null;
};

function mergeCommunitiesById(existing: Community[], incoming: Community[]): Community[] {
  const byId = new Map<string, Community>();
  for (const community of [...existing, ...incoming]) {
    const id = community.communityId?.trim();
    if (!id || byId.has(id)) {
      continue;
    }
    byId.set(id, community);
  }
  return Array.from(byId.values());
}

export function useMemberProtocolCommunities(appliedSearchQuery = '') {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [categories, setCategories] = useState<CommunityCategory[]>([]);
  const [communityFiles, setCommunityFiles] = useState<CommunityFile[]>([]);
  const [hasContent, setHasContent] = useState(false);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);
  const appliedSearchRef = useRef(appliedSearchQuery);
  appliedSearchRef.current = appliedSearchQuery;

  const loadProtocols = useCallback(async () => {
    if (loadingRef.current) {
      return;
    }
    loadingRef.current = true;
    const searchTerm = appliedSearchRef.current.trim();

    try {
      setLoading(true);

      const response = await communityService.listMemberProtocolCommunities({
        page: 1,
        limit: MEMBER_PROTOCOLS_FETCH_LIMIT,
        search: searchTerm || undefined,
      });

      const isSuccess = response.success === true || response.status === 'success';
      if (!isSuccess || !response.data) {
        throw new Error(response.message || 'Erro ao listar protocolos');
      }

      const nextCommunities = response.data.communities ?? [];
      const nextCategories = response.data.categories ?? [];
      const nextFiles = response.data.files ?? [];

      setCommunities(mergeCommunitiesById([], nextCommunities));
      setCategories(nextCategories);
      setCommunityFiles(nextFiles);

      if (!searchTerm) {
        setHasContent(nextCommunities.length > 0);
      }
    } catch (loadError) {
      logger.error('[useMemberProtocolCommunities] Falha ao carregar protocolos', loadError);
      setCommunities([]);
      setCategories([]);
      setCommunityFiles([]);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProtocols();
  }, [loadProtocols, appliedSearchQuery]);

  const protocolCards = useMemo((): MemberProtocolCardItem[] => {
    return communities.map((community) => ({
      communityId: community.communityId,
      title: community.displayName,
      badges: communityProtocolCardBadges(community, categories),
      image: resolveCommunityHeroImageUri(community, communityFiles, MEMBER_PROTOCOL_COMMUNITY_IMAGE_FALLBACK),
      description: community.description ?? community.socialDescription ?? null,
      agreement: community.agreement ?? null,
    }));
  }, [categories, communities, communityFiles]);

  return {
    loading,
    protocols: protocolCards,
    allProtocols: protocolCards,
    hasContent,
    reload: loadProtocols,
  };
}
