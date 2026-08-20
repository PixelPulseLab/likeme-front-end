import type {
  CommunityPost,
  CommunityFile,
  CommunityUser,
  CommunityComment,
  Community,
  CommunityCategory,
  CommunityFeedData,
} from '@/types/community';
import type { Post, Comment, Poll } from '@/types';
import type { Program } from '@/types/program';
import { logger } from '@/utils/logger';
import { resolvePollState } from '@/utils/community/pollClosure';
import {
  firstImageAndVideoFromAttachments,
  resolveCommunityPostAttachmentsWithChildren,
} from '@/utils/community/resolvePostAttachments';
import { resolveCommunityPostMediaWithChildren } from '@/utils/community/resolvePostMedia';
import { resolveCommentAuthorDisplayName } from '@/utils/community/commentAuthorDisplayName';

const mapCommunityCommentToComment = (
  communityComment: CommunityComment,
  users?: CommunityUser[],
  files?: CommunityFile[],
): Comment => {
  const content =
    communityComment.data?.text ||
    (typeof communityComment.data === 'string' ? communityComment.data : '') ||
    JSON.stringify(communityComment.data || {});

  const user = users?.find((u) => u.userId === communityComment.userId);
  const userRecord = user ? (user as unknown as Record<string, unknown>) : null;

  const reactionsObj = communityComment.reactions || {};
  const reactionsArray: Array<{ id: string; userId: string; type: string }> = [];
  if (Object.keys(reactionsObj).length > 0) {
    Object.entries(reactionsObj).forEach(([type, count]) => {
      const countNum = typeof count === 'number' ? count : 0;
      for (let i = 0; i < countNum; i++) {
        reactionsArray.push({
          id: `${communityComment.commentId}-${type}-${i}`,
          userId: '',
          type,
        });
      }
    });
  }
  const reactions: Comment['reactions'] = reactionsArray.length > 0 ? reactionsArray : undefined;

  return {
    id: communityComment.commentId,
    userId: communityComment.userId,
    content,
    createdAt: new Date(communityComment.createdAt),
    userName: resolveCommentAuthorDisplayName(userRecord, communityComment.userId),
    userAvatar: user?.avatarFileId ? files?.find((f) => f.fileId === user.avatarFileId)?.fileUrl : undefined,
    reactionsCount: communityComment.reactionsCount,
    reactions,
  };
};

const resolveFeedPostTypeKey = (communityPost: CommunityPost): string | undefined => {
  const fromData =
    typeof communityPost.data === 'object' &&
    communityPost.data != null &&
    'type' in communityPost.data &&
    (communityPost.data as { type?: unknown }).type != null
      ? String((communityPost.data as { type?: unknown }).type)
      : undefined;
  const raw = communityPost.structureType || communityPost.dataType || fromData;
  const trimmed = raw?.trim();
  return trimmed ? trimmed.toLowerCase() : undefined;
};

const mapCommunityPostToPoll = (communityPost: CommunityPost, _postChildren?: CommunityPost[]): Poll | undefined => {
  if (communityPost.structureType !== 'poll') {
    return undefined;
  }

  logger.debug('Processing poll post:', {
    postId: communityPost.postId || communityPost._id,
    structureType: communityPost.structureType,
    hasPollOptions: !!communityPost.pollOptions,
    pollOptionsCount: communityPost.pollOptions?.length || 0,
    question: communityPost.data?.text,
  });

  if (!communityPost.pollOptions || communityPost.pollOptions.length === 0) {
    logger.debug('Poll post sem pollOptions:', {
      postId: communityPost.postId || communityPost._id,
      structureType: communityPost.structureType,
    });
    return undefined;
  }

  const question = communityPost.data?.text || '';

  if (!question) {
    logger.warn('Poll post sem question (data.text):', {
      postId: communityPost.postId || communityPost._id,
      data: communityPost.data,
    });
    return undefined;
  }

  const sortedPollOptions = [...communityPost.pollOptions].sort((a, b) => {
    const seqA = a.sequenceNumber ?? 0;
    const seqB = b.sequenceNumber ?? 0;
    return seqA - seqB;
  });

  const pollOptions = sortedPollOptions.map((option, index) => {
    const text = option.data?.text || '';

    if (!text) {
      logger.warn('Poll option sem text (data.text):', {
        optionId: option.postId || option._id,
        index,
        sequenceNumber: option.sequenceNumber,
        data: option.data,
      });
    }

    const votes = option.reactionsCount || 0;

    const optionKey = option.postId || option._id || `option-${index}`;
    const dataAnswerId =
      typeof option.data === 'object' && option.data != null && 'answerId' in option.data
        ? String((option.data as { answerId?: unknown }).answerId ?? '').trim() || undefined
        : undefined;

    const dataIsVotedByUser =
      typeof option.data === 'object' &&
      option.data != null &&
      'isVotedByUser' in option.data &&
      (option.data as { isVotedByUser?: unknown }).isVotedByUser === true;

    return {
      id: optionKey,
      answerId: dataAnswerId ?? optionKey,
      text: text || `Opção ${index + 1}`,
      votes: Number(votes),
      percentage: 0,
      isSelected: dataIsVotedByUser,
    };
  });

  const totalVotes = pollOptions.reduce((sum, opt) => sum + opt.votes, 0);
  const pollOptionsWithPercentage = pollOptions.map((opt) => ({
    ...opt,
    percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0,
  }));

  const pollState = resolvePollState({
    endedAt: communityPost.data?.endedAt,
    endDate: communityPost.data?.endDate,
    closedAt: typeof communityPost.data?.closedAt === 'string' ? communityPost.data.closedAt : undefined,
    isFinished: communityPost.data?.isFinished === true,
    status: typeof communityPost.data?.status === 'string' ? communityPost.data.status : undefined,
  });

  let pollId = communityPost.data?.pollId;

  if (!pollId && sortedPollOptions.length > 0) {
    pollId = sortedPollOptions[0].data?.pollId;
  }

  return {
    id: communityPost.postId || communityPost._id || '',
    pollId: pollId || undefined,
    question,
    options: pollOptionsWithPercentage,
    totalVotes,
    endedAt: pollState.endedAt,
    isFinished: pollState.isClosed,
  };
};

const mapRawMyReactionsToStrings = (raw: unknown): string[] => {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const out: string[] = [];
  for (const item of raw) {
    if (typeof item === 'string') {
      const t = item.trim();
      if (t) out.push(t);
      continue;
    }
    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      const v = obj.reactionName ?? obj.type ?? obj.reaction ?? obj.name;
      if (typeof v === 'string') {
        const t = v.trim();
        if (t) out.push(t);
      }
    }
  }
  return out;
};

export type MapCommunityPostToPostOptions = {
  /** Na listagem do feed só usamos commentsCount; evita mapear todos os comentários do payload. */
  includeComments?: boolean;
  isFeatured?: boolean;
};

export const mapCommunityPostToPost = (
  communityPost: CommunityPost,
  files?: CommunityFile[],
  users?: CommunityUser[],
  comments?: CommunityComment[],
  postChildren?: CommunityPost[],
  feedPosts?: CommunityPost[],
  options?: MapCommunityPostToPostOptions,
): Post | null => {
  const includeComments = options?.includeComments !== false;
  const postId = communityPost.postId || communityPost._id || '';
  const userId = communityPost.postedUserId || communityPost.userId || '';

  if (!postId) {
    logger.warn('Post sem ID válido:', communityPost);
    return null;
  }

  if (!communityPost.createdAt) {
    logger.warn('Post sem createdAt:', communityPost);
    return null;
  }

  let attachments = resolveCommunityPostAttachmentsWithChildren(communityPost, files, postChildren, feedPosts);
  const fromAttachments = firstImageAndVideoFromAttachments(attachments);
  const legacyMedia = resolveCommunityPostMediaWithChildren(communityPost, files, postChildren, feedPosts);
  const imageUrl = attachments.length > 0 ? fromAttachments.imageUrl : legacyMedia.imageUrl;
  const videoUrl = attachments.length > 0 ? fromAttachments.videoUrl ?? legacyMedia.videoUrl : legacyMedia.videoUrl;

  if (videoUrl && !attachments.some((item) => item.type === 'video')) {
    attachments = [
      ...attachments,
      {
        id: `${postId}-resolved-video`,
        url: videoUrl,
        type: 'video',
        fileName: 'Vídeo',
        extension: '',
        posterUrl:
          fromAttachments.imageUrl ?? legacyMedia.imageUrl ?? attachments.find((item) => item.type === 'image')?.url,
      },
    ];
  }

  const user = users?.find((u) => u.userId === userId);
  const userName = user?.displayName || undefined;
  const userAvatar = user?.avatarFileId ? files?.find((f) => f.fileId === user.avatarFileId)?.fileUrl : undefined;

  const myReactionsRaw = (communityPost as any).myReactions as unknown;
  const myReactions = mapRawMyReactionsToStrings(myReactionsRaw);

  const isLiked = myReactions.some((name) => name.toLowerCase() !== 'dislike');

  const likes = communityPost.reactionsCount || 0;

  const postComments: Post['comments'] = includeComments
    ? (comments || [])
        .filter((comment) => {
          const referenceId = comment.referenceId;
          return referenceId === postId || referenceId === communityPost._id;
        })
        .map((comment) => mapCommunityCommentToComment(comment, users, files))
    : [];

  let content = '';
  let title: string | undefined;

  if (communityPost.data) {
    if (typeof communityPost.data === 'string') {
      content = communityPost.data;
    } else if (typeof communityPost.data === 'object') {
      content = communityPost.data.text || '';
      title = communityPost.data.title;

      if (!content && title) {
        logger.warn('Post sem data.text, usando title como fallback:', {
          postId,
          data: communityPost.data,
        });
        content = title;
        title = undefined;
      }
    }
  }

  if (!content) {
    logger.warn('Post sem conteúdo (data.text vazio):', {
      postId,
      structureType: communityPost.structureType,
      data: communityPost.data,
    });
    content = 'Post sem conteúdo';
  }

  const poll = mapCommunityPostToPoll(communityPost, postChildren);

  let tags: string | string[] | undefined;
  const rawTags = (communityPost as any).tags || communityPost.data?.tags;

  if (rawTags) {
    if (Array.isArray(rawTags)) {
      tags = rawTags.filter((tag) => tag && typeof tag === 'string' && tag.toLowerCase() !== 'tags');
    } else if (typeof rawTags === 'string' && rawTags.toLowerCase() !== 'tags') {
      tags = rawTags;
    } else if (typeof rawTags === 'object') {
      const tagValues = Object.values(rawTags).filter(
        (val) => val && typeof val === 'string' && val.toLowerCase() !== 'tags',
      );
      if (tagValues.length > 0) {
        tags = tagValues.length === 1 ? (tagValues[0] as string) : (tagValues as string[]);
      }
    }
  }

  const commentsCount = communityPost.commentsCount !== undefined ? communityPost.commentsCount : postComments.length;

  const feedPostType = resolveFeedPostTypeKey(communityPost);

  const post: Post = {
    id: postId,
    userId: userId,
    content,
    image: imageUrl,
    videoUrl,
    attachments: attachments.length > 0 ? attachments : undefined,
    likes,
    comments: postComments,
    commentsCount,
    createdAt: new Date(communityPost.createdAt),
    category: (communityPost as any).category || (communityPost as any).dataType || undefined,
    feedPostType,
    tags,
    overline: (communityPost as any).overline || undefined,
    title,
    userName,
    userAvatar,
    isLiked,
    myReactions: myReactions.length ? myReactions : undefined,
    poll,
    ...(options?.isFeatured === true || communityPost.isFeatured === true ? { isFeatured: true as const } : {}),
  };

  return post;
};

export function mapCommunityPostsForFeedList(
  feedPosts: CommunityPost[],
  feedData: Pick<CommunityFeedData, 'files' | 'users' | 'comments' | 'postChildren'>,
): Post[] {
  const mapped: Post[] = [];
  for (const communityPost of feedPosts) {
    const post = mapCommunityPostToPost(
      communityPost,
      feedData.files,
      feedData.users,
      feedData.comments,
      feedData.postChildren,
      feedPosts,
      { includeComments: false },
    );
    if (post) {
      mapped.push(post);
    }
  }
  return mapped;
}

const HTTP_URL_PREFIX = /^https?:\/\//i;

export function resolveCommunityHeroImageUri(
  community: Community | undefined,
  files: CommunityFile[] | undefined,
  fallbackUri: string,
): string {
  return communityImageUri(community, files, fallbackUri, [community?.heroImageUrl, community?.bannerImageUrl]);
}

export function resolveCommunityBannerImageUri(
  community: Community | undefined,
  files: CommunityFile[] | undefined,
  fallbackUri: string,
): string {
  return communityImageUri(community, files, fallbackUri, [community?.bannerImageUrl, community?.heroImageUrl]);
}

function communityImageUri(
  community: Community | undefined,
  files: CommunityFile[] | undefined,
  fallbackUri: string,
  prioritizedImageUrls: Array<string | null | undefined>,
): string {
  if (!community) {
    return fallbackUri;
  }
  const imageUrl = prioritizedImageUrls.map((url) => url?.trim()).find(Boolean);
  if (imageUrl) {
    return imageUrl;
  }
  const avatarUrl = community.avatarUrl?.trim();
  if (avatarUrl) {
    return avatarUrl;
  }
  const fileId = community.avatarFileId?.trim();
  if (fileId && HTTP_URL_PREFIX.test(fileId)) {
    return fileId;
  }
  if (fileId && files?.length) {
    const fileUrl = files.find((f) => f.fileId === fileId)?.fileUrl?.trim();
    if (fileUrl) {
      return fileUrl;
    }
  }
  return fallbackUri;
}

export const mapCommunityToProgram = (community: Community, files?: CommunityFile[]): Program => {
  let imageUrl: string | undefined;
  if (community.avatarFileId && files) {
    const file = files.find((f) => f.fileId === community.avatarFileId);
    imageUrl = file?.fileUrl;
  }

  const duration = 'Ativo';

  return {
    id: community.communityId,
    name: community.displayName,
    description: community.description || '',
    duration,
    participantsCount: community.membersCount || 0,
    image: imageUrl,
  };
};

export const mapCommunityToOtherCommunity = (
  community: Community,
  category?: CommunityCategory,
  files?: CommunityFile[],
): { id: string; title: string; badge: string; image: string; rating: number; price: string } => {
  const badge = category?.name || 'Community';

  const image =
    community.avatarFileId && files
      ? files.find((f) => f.fileId === community.avatarFileId)?.fileUrl
      : 'https://images.unsplash.com/photo-1494390248081-4e521a5940db?w=400';

  const rating = 5;
  const price = '$0.00';

  return {
    id: community.communityId,
    title: community.displayName,
    badge,
    image: image || 'https://images.unsplash.com/photo-1494390248081-4e521a5940db?w=400',
    rating,
    price,
  };
};
