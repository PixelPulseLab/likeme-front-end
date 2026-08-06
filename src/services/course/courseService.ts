import apiClient from '@/services/infrastructure/apiClient';
import type { CourseStep, ProgramCourse } from '@/types/course/course';
import type { ApiResponse } from '@/types/infrastructure';

function courseStepFromApi(step: CourseStep): CourseStep {
  return {
    stepNumber: step.stepNumber,
    title: step.title,
    postId: step.postId,
    body: step.body,
    attachments: step.attachments ?? [],
    video: step.video?.id?.trim() ? step.video : null,
    createdAt: step.createdAt,
    updatedAt: step.updatedAt,
  };
}

function programCourseFromApi(course: ProgramCourse): ProgramCourse {
  return {
    type: course.type,
    communityId: course.communityId,
    steps: (course.steps ?? []).map(courseStepFromApi),
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
      data: programCourseFromApi(response.data),
    };
  }
}

export const courseService = new CourseService();
