import type { ModuleItem } from '@/components/sections/program/ModuleAccordion';
import type { ProgramCourse } from '@/types/course/course';
import type { CommunityPost } from '@/types/community';
import { mapCommunityPostToPost } from '@/utils/community/mappers';
import { isProtocolStepAutoCompleted } from '@/utils/course/protocolStepAutoCompleted';

function communityPostForStep(course: ProgramCourse, postId: string): CommunityPost | undefined {
  const fromPosts = course.posts?.find((post) => (post.postId ?? post._id) === postId);
  if (fromPosts) {
    return fromPosts;
  }

  const step = course.steps.find((item) => item.postId === postId);
  if (!step) {
    return undefined;
  }

  return {
    postId: step.postId,
    createdAt: step.createdAt ?? new Date(0).toISOString(),
    data: {
      title: step.title,
      text: step.body ?? undefined,
    },
  };
}

function enrichCoursePostForStep(
  post: CommunityPost,
  stepPostId: string,
  postChildren?: CommunityPost[],
): CommunityPost {
  const parentKeys = new Set(
    [post.postId, post._id, post.path, stepPostId].filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    ),
  );

  const matchedChildren = (postChildren ?? []).filter((child) => {
    const parentId = child.parentPostId?.trim();
    return parentId ? parentKeys.has(parentId) : false;
  });

  if (matchedChildren.length === 0) {
    return post;
  }

  const byId = new Map<string, CommunityPost>();
  for (const child of [...(post.childrenPosts ?? []), ...matchedChildren]) {
    const id = child.postId ?? child._id;
    if (id) {
      byId.set(id, child);
    }
  }

  return { ...post, childrenPosts: Array.from(byId.values()) };
}

type ModuleItemsFromProgramCourseOptions = {
  now?: Date;
};

export function moduleItemsFromProgramCourse(
  course: ProgramCourse,
  options?: ModuleItemsFromProgramCourseOptions,
): ModuleItem[] {
  const now = options?.now;
  const files = course.files;
  const postChildren = course.postChildren;
  const feedPosts = [...(course.posts ?? []), ...(course.postChildren ?? [])];

  return course.steps.map((step) => {
    const rawPost = communityPostForStep(course, step.postId);
    let image: string | undefined;
    let videoUrl: string | undefined;
    let attachments: ModuleItem['attachments'];

    if (rawPost) {
      const post = enrichCoursePostForStep(rawPost, step.postId, postChildren);
      const mapped = mapCommunityPostToPost(post, files, undefined, undefined, postChildren, feedPosts, {
        includeComments: false,
      });
      if (mapped) {
        image = mapped.image;
        videoUrl = mapped.videoUrl;
        attachments = mapped.attachments;
      }
    }

    return {
      id: step.postId,
      title: step.title,
      completed: isProtocolStepAutoCompleted(step.updatedAt, now),
      body: step.body,
      image,
      videoUrl,
      attachments,
    };
  });
}
