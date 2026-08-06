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
  targetId?: string | null;
  targetType: AdvertiserRecommendationTargetType;
  enabled?: boolean;
};

const RECOMMENDATIONS_PAGE_SIZE = 100;

async function loadAdvertiserProfilesById(advertiserIds: string[]): Promise<Map<string, Advertiser>> {
  const uniqueIds = [...new Set(advertiserIds.map((id) => id.trim()).filter(Boolean))];
  const entries = await Promise.all(
    uniqueIds.map(async (advertiserId) => {
      try {
        const response = await advertiserService.getAdvertiserById(advertiserId);
        if (response.success && response.data) {
          return [advertiserId, response.data] as const;
        }
      } catch (error) {
        logger.error('[useAdvertiserRecommendation] Falha ao carregar perfil do advertiser', {
          advertiserId,
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
  targetId: string;
}): Promise<AdvertiserRecommendation[]> {
  const all: AdvertiserRecommendation[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await advertiserRecommendationService.list({
      targetType: params.targetType,
      targetId: params.targetId,
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

export function useAdvertiserRecommendation({ targetId, targetType, enabled = true }: Params) {
  const [recommendations, setRecommendations] = useState<AdvertiserRecommendation[]>([]);
  const [profilesByAdvertiserId, setProfilesByAdvertiserId] = useState<Map<string, Advertiser>>(() => new Map());
  const [loading, setLoading] = useState(false);

  const resolvedTargetId = targetId?.trim() || '';

  useEffect(() => {
    if (!enabled || !resolvedTargetId) {
      setRecommendations([]);
      setProfilesByAdvertiserId(new Map());
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const rows = await listAllActiveRecommendations({
          targetType,
          targetId: resolvedTargetId,
        });
        if (cancelled) {
          return;
        }

        setRecommendations(rows);

        const advertiserIds = rows.map((row) => row.advertiserId?.trim()).filter((id): id is string => Boolean(id));
        const profiles = await loadAdvertiserProfilesById(advertiserIds);
        if (!cancelled) {
          setProfilesByAdvertiserId(profiles);
        }
      } catch (error) {
        if (!cancelled) {
          logger.error('[useAdvertiserRecommendation] Falha ao carregar recomendações', {
            targetType,
            targetId: resolvedTargetId,
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
  }, [enabled, resolvedTargetId, targetType]);

  const recommenders = useMemo((): AdvertiserRecommenderPreview[] => {
    return recommendations
      .map((item): AdvertiserRecommenderPreview | null => {
        const advertiserId = item.advertiserId?.trim();
        if (!advertiserId) {
          return null;
        }
        const profile = profilesByAdvertiserId.get(advertiserId);
        const name = profile?.name?.trim();
        if (!name) {
          return null;
        }
        const preview: AdvertiserRecommenderPreview = {
          id: item.id,
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
      })
      .filter((item): item is AdvertiserRecommenderPreview => item != null);
  }, [recommendations, profilesByAdvertiserId]);

  return {
    recommendations,
    recommenders,
    recommendersCount: recommenders.length,
    hasMultipleRecommenders: recommenders.length > 1,
    loading,
  };
}
