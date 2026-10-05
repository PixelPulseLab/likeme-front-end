import type { Attachment } from '@/types/attachment';

export type CourseStep = {
  stepNumber: number;
  title: string;
  postId: string;
  body: string | null;
  attachments: Attachment[];
  video?: Attachment | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ProgramCourseContent = {
  id: string;
  position: number;
  title: string;
  body: string | null;
  attachments: Attachment[];
  video?: Attachment | null;
  durationMinutes?: number | null;
  level?: string | null;
  learningOutcomes?: string[];
  tips?: string[];
};

export type ProgramCourseSubmodule = {
  id: string;
  position: number;
  title: string;
  summary: string | null;
  contents: ProgramCourseContent[];
};

export type ProgramCourseModule = {
  id: string;
  position: number;
  title: string;
  summary: string | null;
  submodules: ProgramCourseSubmodule[];
};

export type ProgramCourse = {
  type: 'program';
  communityId: string;
  steps: CourseStep[];
  modules?: ProgramCourseModule[];
  completedContentIds: string[];
};
