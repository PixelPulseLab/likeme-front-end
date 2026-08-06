import type { CommunityFile, CommunityPost } from '@/types/community';
import { resolveCommunityPostAttachmentsWithChildren } from '@/utils/community/resolvePostAttachments';

describe('resolveCommunityPostAttachmentsWithChildren', () => {
  it('retorna PDF como anexo de arquivo, não imagem', () => {
    const communityPost: CommunityPost = {
      postId: 'p-pdf',
      createdAt: '2026-01-01T00:00:00.000Z',
      data: { text: 'Material', fileId: 'doc-1' },
    } as CommunityPost;

    const files: CommunityFile[] = [
      {
        fileId: 'doc-1',
        fileUrl: 'https://cdn.example.com/material.pdf',
        attributes: { mimeType: 'application/pdf', name: 'material.pdf' },
      } as CommunityFile,
    ];

    const attachments = resolveCommunityPostAttachmentsWithChildren(communityPost, files);

    expect(attachments).toHaveLength(1);
    expect(attachments[0]?.type).toBe('pdf');
    expect(attachments[0]?.fileName).toBe('material.pdf');
  });

  it('agrega múltiplos anexos de posts filhos', () => {
    const parent: CommunityPost = {
      postId: 'p-parent',
      createdAt: '2026-01-01T00:00:00.000Z',
      data: { text: 'Combo' },
      childrenPosts: [
        {
          postId: 'p-image',
          sequenceNumber: 1,
          createdAt: '2026-01-01T00:00:00.000Z',
          data: { fileId: 'img-1' },
        } as CommunityPost,
        {
          postId: 'p-doc',
          sequenceNumber: 2,
          createdAt: '2026-01-01T00:00:00.000Z',
          data: { fileId: 'doc-1' },
        } as CommunityPost,
      ],
    } as CommunityPost;

    const files: CommunityFile[] = [
      {
        fileId: 'img-1',
        fileUrl: 'https://cdn.example.com/photo.png',
        attributes: { mimeType: 'image/png' },
      } as CommunityFile,
      {
        fileId: 'doc-1',
        fileUrl: 'https://cdn.example.com/plano.xlsx',
        attributes: {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          name: 'plano.xlsx',
        },
      } as CommunityFile,
    ];

    const attachments = resolveCommunityPostAttachmentsWithChildren(parent, files);

    expect(attachments.map((item) => item.type)).toEqual(['image', 'spreadsheet']);
  });

  it('mantém vídeo quando há várias imagens em posts filhos', () => {
    const parent: CommunityPost = {
      postId: 'p-parent',
      createdAt: '2026-01-01T00:00:00.000Z',
      data: { text: 'Combo mídia' },
      childrenPosts: [
        {
          postId: 'p-img-1',
          sequenceNumber: 1,
          createdAt: '2026-01-01T00:00:00.000Z',
          data: { fileId: 'img-1' },
        } as CommunityPost,
        {
          postId: 'p-img-2',
          sequenceNumber: 2,
          createdAt: '2026-01-01T00:00:00.000Z',
          data: { fileId: 'img-2' },
        } as CommunityPost,
        {
          postId: 'p-video',
          sequenceNumber: 3,
          structureType: 'video',
          createdAt: '2026-01-01T00:00:00.000Z',
          data: { fileId: 'vid-1' },
        } as CommunityPost,
      ],
    } as CommunityPost;

    const files: CommunityFile[] = [
      {
        fileId: 'img-1',
        fileUrl: 'https://cdn.example.com/a.png',
        attributes: { mimeType: 'image/png' },
      } as CommunityFile,
      {
        fileId: 'img-2',
        fileUrl: 'https://cdn.example.com/b.png',
        attributes: { mimeType: 'image/png' },
      } as CommunityFile,
      {
        fileId: 'vid-1',
        fileUrl: 'https://cdn.example.com/clip.mp4',
        attributes: { mimeType: 'video/mp4' },
      } as CommunityFile,
      {
        fileId: 'vid-1_thumbnail_1',
        fileUrl: 'https://cdn.example.com/clip_thumb.jpg',
        attributes: { mimeType: 'image/jpeg', metadata: { thumbnail: true } },
      } as CommunityFile,
    ];

    const attachments = resolveCommunityPostAttachmentsWithChildren(parent, files);

    expect(attachments.filter((item) => item.type === 'image')).toHaveLength(2);
    expect(attachments.find((item) => item.type === 'video')?.url).toBe('https://cdn.example.com/clip.mp4');
  });

  it('mantém vídeo quando o pai tem vários fileIds', () => {
    const communityPost: CommunityPost = {
      postId: 'p-multi',
      createdAt: '2026-01-01T00:00:00.000Z',
      data: { text: 'Várias mídias', fileIds: ['img-1', 'img-2', 'vid-1'] },
    } as CommunityPost;

    const files: CommunityFile[] = [
      {
        fileId: 'img-1',
        fileUrl: 'https://cdn.example.com/a.png',
        attributes: { mimeType: 'image/png' },
      } as CommunityFile,
      {
        fileId: 'img-2',
        fileUrl: 'https://cdn.example.com/b.png',
        attributes: { mimeType: 'image/png' },
      } as CommunityFile,
      {
        fileId: 'vid-1',
        fileUrl: 'https://cdn.example.com/clip.mp4',
        attributes: { mimeType: 'video/mp4' },
      } as CommunityFile,
    ];

    const attachments = resolveCommunityPostAttachmentsWithChildren(communityPost, files);

    expect(attachments.filter((item) => item.type === 'image')).toHaveLength(2);
    expect(attachments.some((item) => item.type === 'video')).toBe(true);
  });

  it('não duplica thumbnail de vídeo como imagem separada', () => {
    const videoId = 'vid-1';
    const communityPost: CommunityPost = {
      postId: 'p-video',
      createdAt: '2026-01-01T00:00:00.000Z',
      data: { text: 'Vídeo', fileId: videoId },
    } as CommunityPost;

    const files: CommunityFile[] = [
      {
        fileId: videoId,
        fileUrl: 'https://cdn.example.com/clip.mp4',
        attributes: { mimeType: 'video/mp4' },
      } as CommunityFile,
      {
        fileId: `${videoId}_thumbnail_1`,
        fileUrl: 'https://cdn.example.com/clip_thumb.jpg',
        attributes: { mimeType: 'image/jpeg', metadata: { thumbnail: true } },
      } as CommunityFile,
    ];

    const attachments = resolveCommunityPostAttachmentsWithChildren(communityPost, files);

    expect(attachments).toHaveLength(1);
    expect(attachments[0]?.type).toBe('video');
    expect(attachments[0]?.posterUrl).toBe('https://cdn.example.com/clip_thumb.jpg');
  });
});
