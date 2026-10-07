import type { Attachment } from '@/types/attachment';
import type { CourseStep, ProgramCourseContent, ProgramCourseModule } from '@/types/course/course';

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
  createdAt: string | null;
  completed: boolean;
  durationMinutes: number | null;
  level: string | null;
  learningOutcomes: string[];
  tips: string[];
};

export type CourseModule = {
  id: string;
  position: number;
  title: string;
  summary: string | null;
  isArchive: boolean;
  status: CourseModuleStatus;
  contents: CourseContent[];
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

export function contentSummary(body: string | null): string | null {
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

function contentCoverUri(source: {
  video?: { posterUrl?: string | null; id?: string } | null;
  attachments?: Attachment[];
}): string | null {
  const poster = source.video?.posterUrl?.trim();
  if (poster) {
    return poster;
  }
  const image = (source.attachments ?? []).find((attachment) => attachment.type === 'image' && attachment.url.trim());
  return image?.url.trim() || null;
}

function contentFromStep(step: CourseStep, completedStepIds: ReadonlySet<string>): CourseContent {
  return {
    id: step.postId,
    title: step.title,
    body: step.body,
    coverUri: contentCoverUri(step),
    video: step.video?.id?.trim() ? step.video : null,
    attachments: step.attachments ?? [],
    createdAt: step.createdAt,
    completed: completedStepIds.has(step.postId),
    durationMinutes: null,
    level: null,
    learningOutcomes: [],
    tips: [],
  };
}

function contentFromOutline(content: ProgramCourseContent, completedStepIds: ReadonlySet<string>): CourseContent {
  return {
    id: content.id,
    title: content.title,
    body: content.body,
    coverUri: contentCoverUri(content),
    video: content.video?.id?.trim() ? content.video : null,
    attachments: content.attachments ?? [],
    createdAt: content.createdAt ?? null,
    completed: completedStepIds.has(content.id),
    durationMinutes: content.durationMinutes ?? null,
    level: content.level?.trim() || null,
    learningOutcomes: content.learningOutcomes ?? [],
    tips: content.tips ?? [],
  };
}

function courseFromModules(modules: CourseModule[]): Course {
  const journeyModules = modules.filter((courseModule) => !courseModule.isArchive);
  const contents = journeyModules.flatMap((courseModule) => courseModule.contents);
  const completedContents = contents.filter((content) => content.completed).length;
  const continueModule =
    journeyModules.find((courseModule) => courseModule.status === COURSE_MODULE_STATUS.AVAILABLE) ?? null;
  const continueContentItem = continueModule?.contents.find((content) => !content.completed) ?? null;
  const continueSummary = contentSummary(continueContentItem?.body ?? null);
  const continueContent =
    continueModule && continueContentItem
      ? {
          courseModuleId: continueModule.id,
          courseModuleTitle: continueModule.title,
          contentTitle: continueContentItem.title,
          summary: continueSummary,
          coverUri: continueContentItem.coverUri,
        }
      : null;

  return {
    modules,
    completedContents,
    totalContents: contents.length,
    continueContent,
  };
}

function buildSteppedCourse(steps: CourseStep[], completedStepIds: ReadonlySet<string>): Course {
  const modules: CourseModule[] = [];
  let previousModuleCompleted = true;

  steps.forEach((step, index) => {
    const content = contentFromStep(step, completedStepIds);
    let status: CourseModuleStatus = COURSE_MODULE_STATUS.LOCKED;
    if (content.completed) {
      status = COURSE_MODULE_STATUS.COMPLETED;
    } else if (previousModuleCompleted) {
      status = COURSE_MODULE_STATUS.AVAILABLE;
    }

    modules.push({
      id: step.postId,
      position: index + 1,
      title: step.title,
      summary: contentSummary(step.body),
      isArchive: false,
      status,
      contents: [content],
    });

    previousModuleCompleted = content.completed;
  });

  return courseFromModules(modules);
}

function buildOutlinedCourse(outline: ProgramCourseModule[], completedStepIds: ReadonlySet<string>): Course {
  const modules: CourseModule[] = [];
  let previousModuleCompleted = true;
  const orderedModules = [...outline].sort((left, right) => left.position - right.position);

  for (const outlineModule of orderedModules) {
    const moduleContents = [...outlineModule.contents]
      .sort((left, right) => left.position - right.position)
      .map((content) => contentFromOutline(content, completedStepIds));
    if (outlineModule.isArchive) {
      modules.push({
        id: outlineModule.id,
        position: outlineModule.position,
        title: outlineModule.title,
        summary: outlineModule.summary,
        isArchive: true,
        status: COURSE_MODULE_STATUS.AVAILABLE,
        contents: moduleContents,
      });
      continue;
    }
    const isCompleted = moduleContents.length > 0 && moduleContents.every((content) => content.completed);
    let status: CourseModuleStatus = COURSE_MODULE_STATUS.LOCKED;
    if (isCompleted) {
      status = COURSE_MODULE_STATUS.COMPLETED;
    } else if (previousModuleCompleted) {
      status = COURSE_MODULE_STATUS.AVAILABLE;
    }
    const blocksNextModule = moduleContents.length > 0 && !isCompleted;
    previousModuleCompleted = !blocksNextModule;

    modules.push({
      id: outlineModule.id,
      position: outlineModule.position,
      title: outlineModule.title,
      summary: outlineModule.summary,
      isArchive: false,
      status,
      contents: moduleContents,
    });
  }

  return courseFromModules(modules);
}

export function buildCourse(
  steps: CourseStep[],
  completedStepIds: ReadonlySet<string> = new Set(),
  outline: ProgramCourseModule[] = [],
): Course {
  if (outline.length > 0) {
    return buildOutlinedCourse(outline, completedStepIds);
  }
  return buildSteppedCourse(steps, completedStepIds);
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
