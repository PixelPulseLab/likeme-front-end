import type { CommunityFile, CommunityPost } from '@/types/community';
import type { Attachment } from '@/types/attachment';

export type CourseStep = {
  stepNumber: number;
  title: string;
  postId: string;
  body: string | null;
  image: string | null;
  videoUrl: string | null;
  attachments: Attachment[];
  video?: Attachment | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ProgramCourse = {
  type: 'program';
  communityId: string;
  steps: CourseStep[];
  files?: CommunityFile[];
  postChildren?: CommunityPost[];
  posts?: CommunityPost[];
};
