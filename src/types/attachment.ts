export type AttachmentType = 'image' | 'video' | 'pdf' | 'spreadsheet' | 'document' | 'generic';

export type Attachment = {
  id: string;
  url: string;
  type: AttachmentType;
  fileName: string;
  extension: string;
  mimeType?: string;
  posterUrl?: string;
  streamUrl?: string | null;
  playerUrl?: string | null;
  playable?: boolean;
  status?: string | null;
};
