import type { CommunityFile, CommunityPost } from '@/types/community';
import type { PostAttachment } from '@/types';
import {
  communityFileDisplayName,
  communityFileExtension,
  communityFileIsThumbnail,
  communityFileKind,
  communityFileMimeType,
} from '@/utils/community/communityFileKind';
import {
  collectChildPostsForParent,
  extractFileIdFromField,
  findThumbnailUrlForVideoBaseId,
  isVideoRow,
  lookupRowByFileId,
  mergeFeedFileSources,
  pickVideoPlaybackUrlFromFileRow,
  rowUrl,
} from '@/utils/community/resolvePostMedia';

type FeedFileRow = Record<string, unknown>;

function rowFileId(row: FeedFileRow): string | undefined {
  const candidates = [row.fileId, row._id, row.id].filter(
    (x): x is string => typeof x === 'string' && x.trim().length > 0,
  );
  return candidates[0]?.trim();
}

function fileIdsFromPostData(data: Record<string, unknown> | undefined): string[] {
  if (!data) return [];
  const ids: string[] = [];

  const single = extractFileIdFromField(data.fileId) ?? extractFileIdFromField(data.file);
  if (single) ids.push(single);

  const rawList = data.fileIds;
  if (Array.isArray(rawList)) {
    for (const item of rawList) {
      const id = extractFileIdFromField(item);
      if (id) ids.push(id);
    }
  }

  return ids;
}

function isPollPost(communityPost: Pick<CommunityPost, 'structureType' | 'dataType'>): boolean {
  return (
    communityPost.structureType === 'poll' ||
    (typeof communityPost.dataType === 'string' && communityPost.dataType.toLowerCase() === 'poll')
  );
}

function postHintsVideo(communityPost: Pick<CommunityPost, 'structureType' | 'dataType' | 'data'>): boolean {
  const dataObj = communityPost.data && typeof communityPost.data === 'object' ? communityPost.data : undefined;
  const typeHints = [communityPost.structureType, communityPost.dataType, dataObj?.type].filter(
    (v): v is string => typeof v === 'string',
  );
  return typeHints.some((s) => s.toLowerCase() === 'video');
}

function attachmentFromRow(row: FeedFileRow, hintsVideo: boolean, rows: FeedFileRow[]): PostAttachment | null {
  const id = rowFileId(row);
  const url = pickVideoPlaybackUrlFromFileRow(row) ?? rowUrl(row);
  if (!url) return null;

  const kind = communityFileKind(row as Parameters<typeof communityFileKind>[0], { hintsVideo });
  const extension = communityFileExtension(row as Parameters<typeof communityFileExtension>[0], url);
  const fileName = communityFileDisplayName(row as Parameters<typeof communityFileDisplayName>[0], url);
  const mimeType = communityFileMimeType(row as Parameters<typeof communityFileMimeType>[0]);

  let posterUrl: string | undefined;
  if (kind === 'video') {
    const baseId = id ?? '';
    posterUrl =
      findThumbnailUrlForVideoBaseId(baseId, rows) ||
      (communityFileIsThumbnail(row as Parameters<typeof communityFileIsThumbnail>[0]) ? url : undefined);
  }

  return {
    id: id ?? url,
    url,
    type: kind,
    fileName,
    extension: extension ? `.${extension.replace(/^\./, '')}` : '',
    mimeType,
    posterUrl,
  };
}

function orderedPostsForAttachments(
  communityPost: Pick<
    CommunityPost,
    'postId' | '_id' | 'path' | 'children' | 'childrenPosts' | 'data' | 'structureType' | 'dataType' | 'files'
  >,
  postChildren?: CommunityPost[],
  feedPosts?: CommunityPost[],
): CommunityPost[] {
  const parent = communityPost as CommunityPost;
  const children = collectChildPostsForParent(parent, postChildren, feedPosts).filter((child) => !isPollPost(child));
  return [parent, ...children];
}

export function resolveCommunityPostAttachmentsWithChildren(
  communityPost: Pick<
    CommunityPost,
    'data' | 'structureType' | 'dataType' | 'postId' | '_id' | 'path' | 'files' | 'children' | 'childrenPosts'
  >,
  files?: CommunityFile[],
  postChildren?: CommunityPost[],
  feedPosts?: CommunityPost[],
): PostAttachment[] {
  if (isPollPost(communityPost)) {
    return [];
  }

  const postsToScan = orderedPostsForAttachments(communityPost, postChildren, feedPosts);
  const fileRows = mergeFeedFileSources(files, communityPost);
  for (const child of postsToScan.slice(1)) {
    const childRows = mergeFeedFileSources(undefined, child);
    for (const row of childRows) {
      const id = rowFileId(row);
      if (!id) continue;
      const exists = fileRows.some((existing) => rowFileId(existing) === id);
      if (!exists) {
        fileRows.push(row);
      }
    }
  }

  const seen = new Set<string>();
  const attachments: PostAttachment[] = [];

  const pushAttachment = (attachment: PostAttachment | null) => {
    if (!attachment) return;
    const dedupeKey = `${attachment.id}::${attachment.url}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    attachments.push(attachment);
  };

  for (const post of postsToScan) {
    const dataObj =
      post.data && typeof post.data === 'object' && !Array.isArray(post.data)
        ? (post.data as Record<string, unknown>)
        : undefined;
    const hintsVideo = postHintsVideo(post);

    for (const fileId of fileIdsFromPostData(dataObj)) {
      const row = lookupRowByFileId(fileId, fileRows);
      if (!row) continue;
      if (communityFileIsThumbnail(row as Parameters<typeof communityFileIsThumbnail>[0]) && isVideoRow(row)) {
        continue;
      }
      pushAttachment(attachmentFromRow(row, hintsVideo || isVideoRow(row), fileRows));
    }

    for (const embedded of post.files ?? []) {
      if (embedded == null || typeof embedded !== 'object' || Array.isArray(embedded)) continue;
      const row = embedded as unknown as FeedFileRow;
      if (communityFileIsThumbnail(row as Parameters<typeof communityFileIsThumbnail>[0]) && !hintsVideo) {
        const baseId = rowFileId(row)?.replace(/_thumbnail.*/i, '');
        if (baseId && lookupRowByFileId(baseId, fileRows)) {
          continue;
        }
      }
      pushAttachment(attachmentFromRow(row, hintsVideo || isVideoRow(row), fileRows));
    }

    const directUrl =
      dataObj && typeof dataObj.fileUrl === 'string' && dataObj.fileUrl.trim().startsWith('http')
        ? dataObj.fileUrl.trim()
        : undefined;
    if (directUrl) {
      const syntheticRow: FeedFileRow = {
        fileId: extractFileIdFromField(dataObj?.fileId) ?? directUrl,
        fileUrl: directUrl,
        attributes: (dataObj.attributes as FeedFileRow['attributes']) ?? undefined,
      };
      pushAttachment(attachmentFromRow(syntheticRow, hintsVideo, fileRows));
    }
  }

  const videos = attachments.filter((item) => item.type === 'video');
  if (videos.length > 0) {
    const thumbnailUrls = new Set(videos.map((video) => video.posterUrl).filter((url): url is string => Boolean(url)));
    return attachments.filter((item) => {
      if (item.type !== 'image') return true;
      if (thumbnailUrls.has(item.url)) return false;
      if (communityFileIsThumbnail({ fileUrl: item.url } as Parameters<typeof communityFileIsThumbnail>[0])) {
        return false;
      }
      return true;
    });
  }

  return attachments;
}

export function firstImageAndVideoFromAttachments(attachments: PostAttachment[]): {
  imageUrl?: string;
  videoUrl?: string;
} {
  const video = attachments.find((item) => item.type === 'video');
  const image =
    attachments.find((item) => item.type === 'image') ?? (video?.posterUrl ? { url: video.posterUrl } : undefined);

  return {
    imageUrl: image?.url ?? video?.posterUrl,
    videoUrl: video?.url,
  };
}
