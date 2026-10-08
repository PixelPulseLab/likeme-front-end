import { useCallback, useEffect, useState } from 'react';
import { courseService } from '@/services/course/courseService';
import type { ProgramCourse } from '@/types/course/course';
import { logger } from '@/utils/logger';

export function useProgramCourse(communityId: string, enabled: boolean) {
  const [course, setCourse] = useState<ProgramCourse | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      const trimmed = communityId.trim();
      if (!enabled || !trimmed) {
        setCourse(null);
        setLoading(false);
        return;
      }

      try {
        if (!silent) {
          setLoading(true);
        }

        const response = await courseService.getProgramCourseByCommunityId(trimmed);
        const isSuccess = response.success === true || (response as { status?: string }).status === 'success';
        if (!isSuccess || !response.data) {
          throw new Error(response.message || 'Erro ao carregar conteúdo do protocolo');
        }

        setCourse(response.data);
      } catch (loadError) {
        logger.error('[useProgramCourse] Falha ao carregar curso do protocolo', loadError);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    },
    [communityId, enabled],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return {
    course,
    loading,
    reload: () => load(true),
  };
}
