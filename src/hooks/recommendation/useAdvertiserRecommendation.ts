import { useEffect, useMemo, useState } from 'react';
import type { AdvertiserRecommendationTargetType } from '@/constants/recommendation/advertiserRecommendationTargetType';
import advertiserService from '@/services/advertiser/advertiserService';
import advertiserRecommendationService from '@/services/recommendation/advertiserRecommendationService';
import type { Advertiser } from '@/types/ad';
import type {
  AdvertiserRecommendation,
  AdvertiserRecommenderPreview,
} from '@/types/recommendation/advertiserRecommendation';
import { logger } from '@/utils/logger';

type Params = {
  targetType: AdvertiserRecommendationTargetType;
  /** Alvo da recomendação (PDP / “Recomendado por”). */
  targetId?: string | null;
  /** Fonte: recomendações feitas por este provider (curadoria provider↔provider). */
  advertiserId?: string | null;
  enabled?: boolean;
};

const RECOMMENDATIONS_PAGE_SIZE = 100;

async function loadAdvertiserProfilesById(advertiserIds: string[]): Promise<Map<string, Advertiser>> {
  const uniqueIds = [...new Set(advertiserIds.map((id) => id.trim()).filter(Boolean))];
  const entries = await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const response = await advertiserService.getAdvertiserById(id);
        if (response.success && response.data) {
          return [id, response.data] as const;
        }
      } catch (error) {
        logger.error('[useAdvertiserRecommendation] Falha ao carregar perfil do advertiser', {
          advertiserId: id,
          error,
        });
      }
      return null;
    }),
  );

  return new Map(entries.filter((entry): entry is readonly [string, Advertiser] => entry != null));
}

async function listAllActiveRecommendations(params: {
  targetType: AdvertiserRecommendationTargetType;
  targetId?: string;
  advertiserId?: string;
}): Promise<AdvertiserRecommendation[]> {
  const all: AdvertiserRecommendation[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await advertiserRecommendationService.list({
      targetType: params.targetType,
      targetId: params.targetId,
      advertiserId: params.advertiserId,
      activeOnly: true,
      page,
      limit: RECOMMENDATIONS_PAGE_SIZE,
    });

    if (!response.success) {
      break;
    }

    all.push(...(response.data?.recommendations ?? []));
    totalPages = Math.max(1, response.data?.pagination?.totalPages ?? 1);
    page += 1;
  } while (page <= totalPages);

  return all;
}

function recommenderPreviewFromProfile(
  recommendationId: string,
  advertiserId: string,
  profile: Advertiser | undefined,
): AdvertiserRecommenderPreview | null {
  const name = profile?.name?.trim();
  if (!name) {
    return null;
  }
  const preview: AdvertiserRecommenderPreview = {
    id: recommendationId,
    advertiserId,
    name,
  };
  const avatar = profile?.logo?.trim();
  if (avatar) {
    preview.avatar = avatar;
  }
  const specialty = profile?.description?.trim();
  if (specialty) {
    preview.specialty = specialty;
  }
  return preview;
}

export function useAdvertiserRecommendation({ targetId, advertiserId, targetType, enabled = true }: Params) {
  const [recommendations, setRecommendations] = useState<AdvertiserRecommendation[]>([]);
  const [profilesByAdvertiserId, setProfilesByAdvertiserId] = useState<Map<string, Advertiser>>(() => new Map());
  const [loading, setLoading] = useState(false);

  const resolvedTargetId = targetId?.trim() || '';
  const resolvedAdvertiserId = advertiserId?.trim() || '';
  const listBySourceAdvertiser = Boolean(resolvedAdvertiserId) && !resolvedTargetId;
  const queryId = listBySourceAdvertiser ? resolvedAdvertiserId : resolvedTargetId;

  useEffect(() => {
    if (!enabled || !queryId) {
      setRecommendations([]);
      setProfilesByAdvertiserId(new Map());
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const rows = await listAllActiveRecommendations(
          listBySourceAdvertiser
            ? { targetType, advertiserId: resolvedAdvertiserId }
            : { targetType, targetId: resolvedTargetId },
        );
        if (cancelled) {
          return;
        }

        const sorted = listBySourceAdvertiser ? [...rows].sort((a, b) => a.sortOrder - b.sortOrder) : rows;
        setRecommendations(sorted);

        const profileIds = listBySourceAdvertiser
          ? sorted
              .map((row) => row.targetId?.trim())
              .filter((id): id is string => Boolean(id) && id !== resolvedAdvertiserId)
          : sorted.map((row) => row.advertiserId?.trim()).filter((id): id is string => Boolean(id));

        const profiles = await loadAdvertiserProfilesById(profileIds);
        if (!cancelled) {
          setProfilesByAdvertiserId(profiles);
        }
      } catch (error) {
        if (!cancelled) {
          logger.error('[useAdvertiserRecommendation] Falha ao carregar recomendações', {
            targetType,
            targetId: resolvedTargetId || undefined,
            advertiserId: resolvedAdvertiserId || undefined,
            error,
          });
          setRecommendations([]);
          setProfilesByAdvertiserId(new Map());
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, listBySourceAdvertiser, queryId, resolvedAdvertiserId, resolvedTargetId, targetType]);

  const recommenders = useMemo((): AdvertiserRecommenderPreview[] => {
    const seen = new Set<string>();
    const result: AdvertiserRecommenderPreview[] = [];

    for (const item of recommendations) {
      const profileAdvertiserId = listBySourceAdvertiser ? item.targetId?.trim() : item.advertiserId?.trim();
      if (!profileAdvertiserId) {
        continue;
      }
      if (listBySourceAdvertiser && profileAdvertiserId === resolvedAdvertiserId) {
        continue;
      }
      if (seen.has(profileAdvertiserId)) {
        continue;
      }

      const preview = recommenderPreviewFromProfile(
        item.id,
        profileAdvertiserId,
        profilesByAdvertiserId.get(profileAdvertiserId),
      );
      if (!preview) {
        continue;
      }
      seen.add(profileAdvertiserId);
      result.push(preview);
    }

    return result;
  }, [listBySourceAdvertiser, profilesByAdvertiserId, recommendations, resolvedAdvertiserId]);

  return {
    recommendations,
    recommenders,
    recommendersCount: recommenders.length,
    hasMultipleRecommenders: recommenders.length > 1,
    loading,
  };
}
