import apiClient from '@/services/infrastructure/apiClient';
import type { ProgramCourse } from '@/types/course/course';
import type { ApiResponse } from '@/types/infrastructure';

class CourseService {
  async getProgramCourseByCommunityId(communityId: string): Promise<ApiResponse<ProgramCourse>> {
    const trimmed = communityId.trim();

    const response = await apiClient.get<ApiResponse<ProgramCourse>>(
      `/api/courses/program/communities/${encodeURIComponent(trimmed)}`,
      undefined,
      true,
    );

    if (!response.data) {
      return response;
    }

    return {
      ...response,
      data: {
        type: response.data.type,
        communityId: response.data.communityId,
        steps: (response.data.steps ?? []).map((step) => ({
          ...step,
          attachments: step.attachments ?? [],
          video: step.video?.id?.trim() ? step.video : null,
        })),
      },
    };
  }
}

export const courseService = new CourseService();
