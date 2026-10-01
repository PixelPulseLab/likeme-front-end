import type { Attachment } from '@/types/attachment';
import type { CourseStep } from '@/types/course/course';

export const COURSE_MODULE_STATUS = {
  AVAILABLE: 'available',
  LOCKED: 'locked',
  COMPLETED: 'completed',
} as const;

export type CourseModuleStatus = (typeof COURSE_MODULE_STATUS)[keyof typeof COURSE_MODULE_STATUS];

export type CourseContent = {
  id: string;
  title: string;
  body: string | null;
  coverUri: string | null;
  video: Attachment | null;
  attachments: Attachment[];
};

export type CourseSubmodule = {
  id: string;
  title: string;
  summary: string | null;
  completed: boolean;
  content: CourseContent;
};

export type CourseModule = {
  id: string;
  position: number;
  title: string;
  summary: string | null;
  status: CourseModuleStatus;
  submodules: CourseSubmodule[];
};

export type CourseContinue = {
  courseModuleId: string;
  courseModuleTitle: string;
  contentTitle: string;
  summary: string | null;
  coverUri: string | null;
};

export type Course = {
  modules: CourseModule[];
  completedContents: number;
  totalContents: number;
  continueContent: CourseContinue | null;
};

function contentSummary(body: string | null): string | null {
  const line = body
    ?.split('\n')
    .map((part) => part.trim())
    .find(Boolean);
  if (!line) {
    return null;
  }
  const plain = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');
  if (plain.length <= 140) {
    return plain;
  }
  return `${plain.slice(0, 137)}...`;
}

function contentCoverUri(step: CourseStep): string | null {
  const poster = step.video?.posterUrl?.trim();
  if (poster) {
    return poster;
  }
  const image = step.attachments.find((attachment) => attachment.type === 'image' && attachment.url.trim());
  return image?.url.trim() || null;
}

function contentFromStep(step: CourseStep): CourseContent {
  return {
    id: step.postId,
    title: step.title,
    body: step.body,
    coverUri: contentCoverUri(step),
    video: step.video?.id?.trim() ? step.video : null,
    attachments: step.attachments ?? [],
  };
}

function submoduleFromStep(step: CourseStep, completedStepIds: ReadonlySet<string>): CourseSubmodule {
  const content = contentFromStep(step);
  return {
    id: step.postId,
    title: step.title,
    summary: contentSummary(step.body),
    completed: completedStepIds.has(step.postId),
    content,
  };
}

export function buildCourse(steps: CourseStep[], completedStepIds: ReadonlySet<string> = new Set()): Course {
  const modules: CourseModule[] = [];
  let previousModuleCompleted = true;

  steps.forEach((step, index) => {
    const submodule = submoduleFromStep(step, completedStepIds);
    const isCompleted = submodule.completed;
    let status: CourseModuleStatus = COURSE_MODULE_STATUS.LOCKED;
    if (isCompleted) {
      status = COURSE_MODULE_STATUS.COMPLETED;
    } else if (previousModuleCompleted) {
      status = COURSE_MODULE_STATUS.AVAILABLE;
    }

    modules.push({
      id: step.postId,
      position: index + 1,
      title: step.title,
      summary: submodule.summary,
      status,
      submodules: [submodule],
    });

    previousModuleCompleted = isCompleted;
  });

  const submodules = modules.flatMap((courseModule) => courseModule.submodules);
  const completedContents = submodules.filter((submodule) => submodule.completed).length;
  const continueModule = modules.find((courseModule) => courseModule.status === COURSE_MODULE_STATUS.AVAILABLE) ?? null;
  const continueSubmodule = continueModule?.submodules.find((submodule) => !submodule.completed) ?? null;
  const continueContent =
    continueModule && continueSubmodule
      ? {
          courseModuleId: continueModule.id,
          courseModuleTitle: continueModule.title,
          contentTitle: continueSubmodule.content.title,
          summary: continueSubmodule.summary,
          coverUri: continueSubmodule.content.coverUri,
        }
      : null;

  return {
    modules,
    completedContents,
    totalContents: submodules.length,
    continueContent,
  };
}

export function formatCourseLiveWhen(startTime: string): string {
  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const dateLabel = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' }).format(date);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeLabel =
    minutes === 0 ? `${hours}h` : `${String(hours).padStart(2, '0')}h${String(minutes).padStart(2, '0')}`;
  return `${dateLabel} - ${timeLabel}`;
}
