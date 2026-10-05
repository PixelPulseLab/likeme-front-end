import apiClient from '@/services/infrastructure/apiClient';
import type { ProgramCourse, ProgramCourseContent, ProgramCourseModule } from '@/types/course/course';
import type { ApiResponse } from '@/types/infrastructure';

function mapProgramCourseContent(content: ProgramCourseContent): ProgramCourseContent {
  return {
    ...content,
    attachments: content.attachments ?? [],
    video: content.video?.id?.trim() ? content.video : null,
    durationMinutes: content.durationMinutes ?? null,
    level: content.level ?? null,
    learningOutcomes: content.learningOutcomes ?? [],
    tips: content.tips ?? [],
  };
}

function mapProgramCourseModule(module: ProgramCourseModule): ProgramCourseModule {
  return {
    ...module,
    submodules: (module.submodules ?? []).map((submodule) => ({
      ...submodule,
      contents: (submodule.contents ?? []).map(mapProgramCourseContent),
    })),
  };
}

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
        modules: (response.data.modules ?? []).map(mapProgramCourseModule),
        completedContentIds: response.data.completedContentIds ?? [],
      },
    };
  }

  async completeProgramContent(communityId: string, contentId: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<{ completedContentIds: string[] }>>(
      `/api/courses/program/communities/${encodeURIComponent(communityId.trim())}/contents/${encodeURIComponent(
        contentId.trim(),
      )}/completion`,
    );
    const isSuccess = response.success === true || (response as { status?: string }).status === 'success';
    if (!isSuccess) {
      throw new Error(response.message || 'Erro ao concluir a aula');
    }
  }
}

export const courseService = new CourseService();
