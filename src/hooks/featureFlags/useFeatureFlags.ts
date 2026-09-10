import { useEffect, useMemo, useState } from 'react';
import { FEATURE_FLAG_DEFAULTS, type FeatureFlagKey } from '@/constants';
import featureFlagService from '@/services/featureFlags/featureFlagService';
import { logger } from '@/utils/logger';

type UseFeatureFlagsReturn = {
  flags: Record<FeatureFlagKey, boolean>;
  isLoading: boolean;
};

function buildDefaultFlags(flagKeys: FeatureFlagKey[]): Record<FeatureFlagKey, boolean> {
  return flagKeys.reduce((acc, key) => {
    acc[key] = FEATURE_FLAG_DEFAULTS[key] ?? false;
    return acc;
  }, {} as Record<FeatureFlagKey, boolean>);
}

export function useFeatureFlags(flagKeys: FeatureFlagKey[]): UseFeatureFlagsReturn {
  const keysSignature = useMemo(() => Array.from(new Set(flagKeys)).sort().join('|'), [flagKeys]);
  const [flags, setFlags] = useState<Record<FeatureFlagKey, boolean>>(() =>
    buildDefaultFlags(keysSignature ? (keysSignature.split('|') as FeatureFlagKey[]) : []),
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const normalizedKeys = keysSignature ? (keysSignature.split('|') as FeatureFlagKey[]) : [];
    const defaultFlags = buildDefaultFlags(normalizedKeys);

    const loadFlags = async () => {
      if (normalizedKeys.length === 0) {
        if (!isMounted) return;
        setFlags(defaultFlags);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setFlags(defaultFlags);
      try {
        const nextFlags = await featureFlagService.getBooleans(normalizedKeys);
        if (!isMounted) {
          return;
        }
        setFlags(nextFlags);
      } catch (error) {
        logger.warn('[useFeatureFlags] Falha ao carregar flags; usando defaults locais', { cause: error });
        if (isMounted) {
          setFlags(defaultFlags);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadFlags();
    const unsubscribe = featureFlagService.subscribe(() => {
      void loadFlags();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [keysSignature]);

  return { flags, isLoading };
}

export default useFeatureFlags;
