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

function markdownImageUri(body: string | null | undefined): string | null {
  const match = body?.match(/!\[[^\]]*]\(([^)\s]+)/);
  return match?.[1]?.trim() || null;
}

function contentVideo(video: Attachment | null | undefined): Attachment | null {
  if (!video?.id?.trim()) {
    return null;
  }
  return video;
}

function attachmentImage(source: { attachments?: Attachment[] }): { url: string; fileName: string } | null {
  const attachment = (source.attachments ?? []).find((item) => item.type === 'image' && item.url.trim());
  if (!attachment) {
    return null;
  }
  const fileName = attachment.fileName.trim().toLowerCase();
  return { url: attachment.url.trim(), fileName };
}

function storageStamp(url: string): number {
  const name = url.split('/').pop() ?? '';
  const stamp = Number.parseInt(name, 10);
  return Number.isFinite(stamp) ? stamp : 0;
}

function imageOwners(items: Array<{ id: string; attachments?: Attachment[] }>): Map<string, string> {
  const grouped = new Map<string, { id: string; url: string }[]>();
  for (const item of items) {
    const image = attachmentImage(item);
    if (!image) {
      continue;
    }
    const key = image.fileName || image.url;
    const group = grouped.get(key) ?? [];
    group.push({ id: item.id, url: image.url });
    grouped.set(key, group);
  }

  const owners = new Map<string, string>();
  for (const [key, group] of grouped) {
    const owner = group.reduce((latest, image) =>
      storageStamp(image.url) >= storageStamp(latest.url) ? image : latest,
    );
    owners.set(key, owner.id);
  }
  return owners;
}

function ownedImageUri(
  source: { id: string; body?: string | null; attachments?: Attachment[] },
  owners: Map<string, string>,
): string | null {
  const fromBody = markdownImageUri(source.body);
  if (fromBody) {
    return fromBody;
  }
  const image = attachmentImage(source);
  if (!image) {
    return null;
  }
  const key = image.fileName || image.url;
  if (owners.get(key) !== source.id) {
    return null;
  }
  return image.url;
}

function contentCoverUri(
  source: {
    id: string;
    body?: string | null;
    video?: { posterUrl?: string | null } | null;
    attachments?: Attachment[];
  },
  owners: Map<string, string>,
): string | null {
  const imageUri = ownedImageUri(source, owners);
  if (imageUri) {
    return imageUri;
  }
  return source.video?.posterUrl?.trim() || null;
}

function contentPlayback(
  source: { id: string; body?: string | null; video?: Attachment | null; attachments?: Attachment[] },
  owners: Map<string, string>,
): Attachment | null {
  const video = contentVideo(source.video);
  const imageUri = ownedImageUri(source, owners);
  if (!video || !imageUri) {
    return video;
  }
  return { ...video, posterUrl: imageUri };
}

function contentFromStep(
  step: CourseStep,
  completedStepIds: ReadonlySet<string>,
  owners: Map<string, string>,
): CourseContent {
  const source = { ...step, id: step.postId };
  return {
    id: step.postId,
    title: step.title,
    body: step.body,
    coverUri: contentCoverUri(source, owners),
    video: contentPlayback(source, owners),
    attachments: step.attachments ?? [],
    createdAt: step.createdAt,
    completed: completedStepIds.has(step.postId),
    durationMinutes: null,
    level: null,
    learningOutcomes: [],
    tips: [],
  };
}

function contentFromOutline(
  content: ProgramCourseContent,
  completedStepIds: ReadonlySet<string>,
  owners: Map<string, string>,
): CourseContent {
  const coverUri = contentCoverUri(content, owners);
  const video = contentPlayback(content, owners);
  return {
    id: content.id,
    title: content.title,
    body: content.body,
    coverUri,
    video,
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

  const owners = imageOwners(steps.map((step) => ({ id: step.postId, attachments: step.attachments })));
  steps.forEach((step, index) => {
    const content = contentFromStep(step, completedStepIds, owners);
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
  const owners = imageOwners(
    orderedModules.flatMap((outlineModule) =>
      outlineModule.contents.map((content) => ({ id: content.id, attachments: content.attachments })),
    ),
  );

  for (const outlineModule of orderedModules) {
    const moduleContents = [...outlineModule.contents]
      .sort((left, right) => left.position - right.position)
      .map((content) => contentFromOutline(content, completedStepIds, owners));
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
