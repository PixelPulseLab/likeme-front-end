import type { PostAttachment } from '@/types';

const FILE_KINDS = new Set<PostAttachment['type']>(['pdf', 'spreadsheet', 'document', 'generic']);

export type PostAttachmentPlacement = 'beforeText' | 'afterText' | 'endOfPost' | 'all';

/** Mídia de post/módulo: attachments como fonte; image/videoUrl só para feed legado. */
export type PostMediaFields = {
  id: string;
  attachments?: PostAttachment[] | null;
  image?: string | null;
  videoUrl?: string | null;
};

const VIDEO_URL_PATTERN = /\.(mp4|webm|mov|m3u8)(\?|$)/i;

function attachmentLooksLikeVideo(item: PostAttachment): boolean {
  if (item.type === 'video') {
    return true;
  }
  const mime = item.mimeType?.trim().toLowerCase() ?? '';
  if (mime.startsWith('video/')) {
    return true;
  }
  return VIDEO_URL_PATTERN.test(item.url);
}

function normalizeAttachmentKind(item: PostAttachment): PostAttachment {
  if (item.type !== 'generic' && item.type !== 'image') {
    return item;
  }
  if (!attachmentLooksLikeVideo(item)) {
    return item;
  }
  return { ...item, type: 'video' };
}

function legacyAttachmentsFromPost(post: PostMediaFields): PostAttachment[] {
  const out: PostAttachment[] = [];
  const imageUri = post.image?.trim();
  const videoUri = post.videoUrl?.trim();

  if (imageUri) {
    out.push({
      id: `${post.id}-legacy-image`,
      url: imageUri,
      type: 'image',
      fileName: 'Imagem',
      extension: '',
    });
  }

  if (videoUri) {
    out.push({
      id: `${post.id}-legacy-video`,
      url: videoUri,
      type: 'video',
      fileName: 'Vídeo',
      extension: '',
      posterUrl: imageUri,
    });
  }

  return out;
}

function attachmentsWithLegacyVideo(post: PostMediaFields): PostAttachment[] {
  const base = post.attachments?.length ? [...post.attachments] : legacyAttachmentsFromPost(post);
  const normalized = base.map(normalizeAttachmentKind);

  const videoUri = post.videoUrl?.trim();
  if (videoUri && !normalized.some((item) => item.type === 'video')) {
    const posterUrl = normalized.find((item) => item.type === 'image')?.url ?? post.image?.trim();
    normalized.push({
      id: `${post.id}-legacy-video`,
      url: videoUri,
      type: 'video',
      fileName: 'Vídeo',
      extension: '',
      posterUrl,
    });
  }

  return normalized;
}

export function postAttachmentsForPlacement(post: PostMediaFields) {
  const attachments = attachmentsWithLegacyVideo(post);
  const images = attachments.filter((item) => item.type === 'image');
  const videos = attachments.filter((item) => item.type === 'video');
  const files = attachments.filter((item) => FILE_KINDS.has(item.type));

  return {
    attachments,
    images,
    videos,
    files,
    hasVideo: videos.length > 0,
  };
}

export function postHasBeforeTextAttachments(post: PostMediaFields): boolean {
  return postAttachmentsForPlacement(post).images.length > 0;
}

export function postHasAfterTextAttachments(post: PostMediaFields): boolean {
  return postAttachmentsForPlacement(post).hasVideo;
}

export function postHasEndOfPostAttachments(post: PostMediaFields): boolean {
  return postAttachmentsForPlacement(post).files.length > 0;
}

export function placementHasAttachments(placement: PostAttachmentPlacement, post: PostMediaFields): boolean {
  if (placement === 'all') {
    return postHasBeforeTextAttachments(post) || postHasAfterTextAttachments(post) || postHasEndOfPostAttachments(post);
  }
  if (placement === 'beforeText') {
    return postHasBeforeTextAttachments(post);
  }
  if (placement === 'afterText') {
    return postHasAfterTextAttachments(post);
  }
  return postHasEndOfPostAttachments(post);
}
