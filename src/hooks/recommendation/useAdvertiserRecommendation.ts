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
        const response = await advertiserRecommendationService.list({
          targetType,
          targetId: resolvedTargetId,
          activeOnly: true,
        });
        if (cancelled) {
          return;
        }

        const rows = response.success ? response.data?.recommendations ?? [] : [];
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
      .map((item) => {
        const advertiserId = item.advertiserId?.trim();
        if (!advertiserId) {
          return null;
        }
        const profile = profilesByAdvertiserId.get(advertiserId);
        const name = profile?.name?.trim();
        if (!name) {
          return null;
        }
        return {
          id: item.id,
          advertiserId,
          name,
          avatar: profile?.logo || undefined,
          specialty: profile?.description?.trim() || undefined,
        };
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
