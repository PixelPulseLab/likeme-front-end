import apiClient from '@/services/infrastructure/apiClient';
import type { ProgramCourse, ProgramCourseContent, ProgramCourseModule } from '@/types/course/course';
import type { ApiResponse } from '@/types/infrastructure';

export type CourseContentComment = {
  id: string;
  comment: string;
  createdAt: string;
  author: {
    name: string;
    username: string | null;
    avatar: string | null;
  };
};

function courseContentPath(communityId: string, contentId: string): string {
  return `/api/courses/program/communities/${encodeURIComponent(communityId.trim())}/contents/${encodeURIComponent(
    contentId.trim(),
  )}`;
}

function contentCommentsPath(communityId: string, contentId: string): string {
  return `${courseContentPath(communityId, contentId)}/comments`;
}

function contentRatingPath(communityId: string, contentId: string): string {
  return `${courseContentPath(communityId, contentId)}/rating`;
}

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
    contents: (module.contents ?? []).map(mapProgramCourseContent),
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

  async listContentComments(communityId: string, contentId: string): Promise<CourseContentComment[]> {
    const response = await apiClient.get<ApiResponse<{ comments: CourseContentComment[] }>>(
      contentCommentsPath(communityId, contentId),
      undefined,
      true,
    );
    return response.data?.comments ?? [];
  }

  async saveContentRating(
    communityId: string,
    contentId: string,
    rating: { score: number; comment: string },
  ): Promise<void> {
    const response = await apiClient.post<ApiResponse<null>>(contentRatingPath(communityId, contentId), rating);
    const isSuccess = response.success === true || (response as { status?: string }).status === 'success';
    if (!isSuccess) {
      throw new Error(response.message || 'Erro ao gravar a avaliação');
    }
  }
}

export const courseService = new CourseService();
