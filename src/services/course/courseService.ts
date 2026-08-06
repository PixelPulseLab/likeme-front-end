import apiClient from '@/services/infrastructure/apiClient';
import type { Attachment } from '@/types/attachment';
import type { CourseStep, ProgramCourse } from '@/types/course/course';
import type { ApiResponse } from '@/types/infrastructure';

type ApiHostedVideo = {
  id?: string;
  title?: string | null;
  streamUrl?: string | null;
  playerUrl?: string | null;
  thumbnailUrl?: string | null;
  playable?: boolean;
  status?: string | null;
};

type ApiCourseStep = Omit<CourseStep, 'video'> & {
  video?: Attachment | null;
  postAttachment?: { video?: ApiHostedVideo | null } | null;
};

type ApiProgramCourse = Omit<ProgramCourse, 'steps'> & {
  steps: ApiCourseStep[];
};

function hostedVideoAttachment(video: ApiHostedVideo | null | undefined): Attachment | null {
  const id = video?.id?.trim();
  if (!id) {
    return null;
  }

  const streamUrl = video?.streamUrl?.trim() || null;
  const playerUrl = video?.playerUrl?.trim() || null;
  const url = streamUrl || playerUrl || '';
  const fileName = video?.title?.trim() || id;
  const posterUrl = video?.thumbnailUrl?.trim() || undefined;

  return {
    id,
    url,
    type: 'video',
    fileName,
    extension: '',
    posterUrl,
    streamUrl,
    playerUrl,
    playable: video?.playable,
    status: video?.status ?? null,
  };
}

function courseStepFromApi(step: ApiCourseStep): CourseStep {
  const video = step.video?.id?.trim() ? step.video : hostedVideoAttachment(step.postAttachment?.video);

  return {
    stepNumber: step.stepNumber,
    title: step.title,
    postId: step.postId,
    body: step.body,
    image: step.image,
    videoUrl: step.videoUrl,
    attachments: step.attachments ?? [],
    video,
    createdAt: step.createdAt,
    updatedAt: step.updatedAt,
  };
}

function programCourseFromApi(course: ApiProgramCourse): ProgramCourse {
  return {
    ...course,
    steps: (course.steps ?? []).map(courseStepFromApi),
  };
}

class CourseService {
  async getProgramCourseByCommunityId(communityId: string): Promise<ApiResponse<ProgramCourse>> {
    const trimmed = communityId.trim();

    const response = await apiClient.get<ApiResponse<ApiProgramCourse>>(
      `/api/courses/program/communities/${encodeURIComponent(trimmed)}`,
      undefined,
      true,
    );

    if (!response.data) {
      return response as ApiResponse<ProgramCourse>;
    }

    return {
      ...response,
      data: programCourseFromApi(response.data),
    };
  }
}

export const courseService = new CourseService();
