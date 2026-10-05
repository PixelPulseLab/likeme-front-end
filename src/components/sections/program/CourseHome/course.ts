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
  completed: boolean;
  durationMinutes: number | null;
  level: string | null;
  learningOutcomes: string[];
  tips: string[];
};

export type CourseSubmodule = {
  id: string;
  position: number;
  title: string;
  summary: string | null;
  completed: boolean;
  contents: CourseContent[];
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
    completed: completedStepIds.has(step.postId),
    durationMinutes: null,
    level: null,
    learningOutcomes: [],
    tips: [],
  };
}

function submoduleFromStep(step: CourseStep, completedStepIds: ReadonlySet<string>): CourseSubmodule {
  const content = contentFromStep(step, completedStepIds);
  return {
    id: step.postId,
    position: 1,
    title: step.title,
    summary: contentSummary(step.body),
    completed: content.completed,
    contents: [content],
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
    completed: completedStepIds.has(content.id),
    durationMinutes: content.durationMinutes ?? null,
    level: content.level?.trim() || null,
    learningOutcomes: content.learningOutcomes ?? [],
    tips: content.tips ?? [],
  };
}

function courseFromModules(modules: CourseModule[]): Course {
  const contents = modules.flatMap((courseModule) =>
    courseModule.submodules.flatMap((submodule) => submodule.contents),
  );
  const completedContents = contents.filter((content) => content.completed).length;
  const continueModule = modules.find((courseModule) => courseModule.status === COURSE_MODULE_STATUS.AVAILABLE) ?? null;
  const continueSubmodule =
    continueModule?.submodules.find((submodule) => submodule.contents.some((content) => !content.completed)) ?? null;
  const continueContentItem = continueSubmodule?.contents.find((content) => !content.completed) ?? null;
  const continueSummary = continueSubmodule?.summary ?? contentSummary(continueContentItem?.body ?? null);
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

  return courseFromModules(modules);
}

function buildOutlinedCourse(outline: ProgramCourseModule[], completedStepIds: ReadonlySet<string>): Course {
  const modules: CourseModule[] = [];
  let previousModuleCompleted = true;
  const orderedModules = [...outline].sort((left, right) => left.position - right.position);

  for (const outlineModule of orderedModules) {
    const submodules = [...outlineModule.submodules]
      .sort((left, right) => left.position - right.position)
      .map((outlineSubmodule) => {
        const contents = [...outlineSubmodule.contents]
          .sort((left, right) => left.position - right.position)
          .map((content) => contentFromOutline(content, completedStepIds));
        const completed = contents.length > 0 && contents.every((content) => content.completed);
        return {
          id: outlineSubmodule.id,
          position: outlineSubmodule.position,
          title: outlineSubmodule.title,
          summary: outlineSubmodule.summary,
          completed,
          contents,
        };
      });
    const moduleContents = submodules.flatMap((submodule) => submodule.contents);
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
      status,
      submodules,
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
