import apiClient from '@/services/infrastructure/apiClient';
import type { ProgramCourse, ProgramCourseContent, ProgramCourseModule } from '@/types/course/course';
import type { ApiResponse } from '@/types/infrastructure';

export const COURSE_CONTENT_COMMENT_REACTION = {
  LIKE: 'like',
  DISLIKE: 'dislike',
} as const;

export type CourseContentCommentReaction =
  (typeof COURSE_CONTENT_COMMENT_REACTION)[keyof typeof COURSE_CONTENT_COMMENT_REACTION];

export type CourseContentCommentReactionTotals = {
  likeCount: number;
  dislikeCount: number;
  viewerReaction: CourseContentCommentReaction | null;
};

export type CourseContentComment = {
  id: string;
  comment: string;
  createdAt: string;
  author: {
    name: string;
    username: string | null;
    avatar: string | null;
  };
} & CourseContentCommentReactionTotals;

function courseContentPath(communityId: string, contentId: string): string {
  return `/api/courses/program/communities/${encodeURIComponent(communityId.trim())}/contents/${encodeURIComponent(
    contentId.trim(),
  )}`;
}

function contentCommentsPath(communityId: string, contentId: string): string {
  return `${courseContentPath(communityId, contentId)}/comments`;
}

function commentReaction(value: string | null | undefined): CourseContentCommentReaction | null {
  if (value === COURSE_CONTENT_COMMENT_REACTION.LIKE) {
    return COURSE_CONTENT_COMMENT_REACTION.LIKE;
  }
  if (value === COURSE_CONTENT_COMMENT_REACTION.DISLIKE) {
    return COURSE_CONTENT_COMMENT_REACTION.DISLIKE;
  }
  return null;
}

function commentReactionTotals(totals: CourseContentCommentReactionTotals): CourseContentCommentReactionTotals {
  return {
    likeCount: totals.likeCount ?? 0,
    dislikeCount: totals.dislikeCount ?? 0,
    viewerReaction: commentReaction(totals.viewerReaction),
  };
}

function commentWithReaction(comment: CourseContentComment): CourseContentComment {
  return {
    ...comment,
    ...commentReactionTotals(comment),
  };
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
    completed: content.completed === true,
    locked: content.locked === true,
  };
}

function mapProgramCourseModule(module: ProgramCourseModule): ProgramCourseModule {
  return {
    ...module,
    contents: (module.contents ?? []).map(mapProgramCourseContent),
    status: module.status,
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
    return (response.data?.comments ?? []).map(commentWithReaction);
  }

  async reactToContentComment(
    communityId: string,
    contentId: string,
    ratingId: string,
    reaction: CourseContentCommentReaction,
  ): Promise<CourseContentCommentReactionTotals> {
    const response = await apiClient.post<ApiResponse<CourseContentCommentReactionTotals>>(
      `${contentCommentsPath(communityId, contentId)}/${encodeURIComponent(ratingId.trim())}/reaction`,
      { reaction },
    );
    const isSuccess = response.success === true || (response as { status?: string }).status === 'success';
    if (!isSuccess || !response.data) {
      throw new Error(response.message || 'Erro ao reagir ao comentário');
    }
    return commentReactionTotals(response.data);
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
