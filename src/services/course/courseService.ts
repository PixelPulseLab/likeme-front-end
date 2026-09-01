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

type ApiCourseStep = CourseStep & {
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
  const fileName = video?.title?.trim() || id;
  const posterUrl = video?.thumbnailUrl?.trim() || undefined;

  return {
    id,
    url: streamUrl || playerUrl || '',
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

function courseVideoFromApiStep(step: ApiCourseStep): Attachment | null {
  if (step.video?.id?.trim()) {
    return step.video;
  }
  return hostedVideoAttachment(step.postAttachment?.video);
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
          video: courseVideoFromApiStep(step),
        })),
      },
    };
  }
}

export const courseService = new CourseService();
