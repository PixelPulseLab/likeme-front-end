import * as FileSystem from 'expo-file-system/legacy';
import { Linking, Platform, Share } from 'react-native';
import type { PostAttachment } from '@/types';
import { logger } from '@/utils/logger';

type AttachmentContext = Pick<PostAttachment, 'id' | 'url' | 'fileName' | 'type'>;

function safeAttachmentFileName(attachment: AttachmentContext): string {
  const raw = attachment.fileName?.trim() || `arquivo-${attachment.id}`;
  return raw.replace(/[/\\?%*:|"<>]/g, '_');
}

export async function openCommunityAttachmentUrl(
  url: string,
  context: { attachmentId: string; type: string },
): Promise<void> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      logger.warn('Não foi possível abrir anexo do post', { ...context, url });
      return;
    }
    await Linking.openURL(url);
  } catch (error) {
    logger.warn('Falha ao abrir anexo do post', { ...context, url, cause: error });
  }
}

async function shareDownloadedFile(localUri: string, fileName: string): Promise<void> {
  const shareUrl = Platform.OS === 'android' ? await FileSystem.getContentUriAsync(localUri) : localUri;

  await Share.share({
    url: shareUrl,
    message: Platform.OS === 'android' ? fileName : undefined,
    title: fileName,
  });
}

export async function downloadCommunityAttachment(attachment: AttachmentContext): Promise<void> {
  const url = attachment.url?.trim();
  if (!url) {
    logger.warn('Download de anexo ignorado: URL vazia', { attachmentId: attachment.id, type: attachment.type });
    return;
  }

  const fileName = safeAttachmentFileName(attachment);
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    await openCommunityAttachmentUrl(url, { attachmentId: attachment.id, type: attachment.type });
    return;
  }

  const destination = `${cacheDir}community-${attachment.id}-${fileName}`;

  try {
    const result = await FileSystem.downloadAsync(url, destination);
    await shareDownloadedFile(result.uri, fileName);
  } catch (error) {
    logger.warn('Falha ao baixar anexo do post; abrindo URL', {
      attachmentId: attachment.id,
      type: attachment.type,
      url,
      cause: error,
    });
    await openCommunityAttachmentUrl(url, { attachmentId: attachment.id, type: attachment.type });
  }
}

export async function downloadCommunityAttachmentsSequentially(attachments: AttachmentContext[]): Promise<void> {
  for (const attachment of attachments) {
    await downloadCommunityAttachment(attachment);
  }
}
