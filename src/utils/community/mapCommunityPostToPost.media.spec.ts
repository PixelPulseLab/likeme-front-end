import type { CommunityFile, CommunityPost } from '@/types/community';
import { mapCommunityPostToPost } from '@/utils/community/mappers';

describe('mapCommunityPostToPost (mídia)', () => {
  it('preenche image a partir de data.fileId + files[].fileUrl', () => {
    const communityPost: CommunityPost = {
      postId: 'p1',
      createdAt: '2026-01-01T00:00:00.000Z',
      data: { text: 'Olá', fileId: 'img-1' },
    } as CommunityPost;

    const files: CommunityFile[] = [{ fileId: 'img-1', fileUrl: 'https://cdn.example.com/photo.png' } as CommunityFile];

    const post = mapCommunityPostToPost(communityPost, files);

    expect(post).not.toBeNull();
    expect(post!.image).toBe('https://cdn.example.com/photo.png');
    expect(post!.videoUrl).toBeUndefined();
  });

  it('preenche image a partir de childrenPosts embutidos no post pai', () => {
    const parent: CommunityPost = {
      postId: 'p-mixed',
      createdAt: '2026-01-01T00:00:00.000Z',
      data: { text: 'Pai' },
      childrenPosts: [
        {
          postId: 'p-nested',
          createdAt: '2026-01-01T00:00:00.000Z',
          data: { text: '', fileId: 'img-nested' },
        } as CommunityPost,
      ],
    } as CommunityPost;

    const files: CommunityFile[] = [
      { fileId: 'img-nested', fileUrl: 'https://cdn.example.com/nested.png' } as CommunityFile,
    ];

    const post = mapCommunityPostToPost(parent, files);

    expect(post?.image).toBe('https://cdn.example.com/nested.png');
  });

  it('preenche image quando children é lista de ids e o post filho está no mesmo array do feed', () => {
    const parent: CommunityPost = {
      postId: 'p-parent',
      createdAt: '2026-01-01T00:00:00.000Z',
      data: { text: 'Pai' },
      children: ['p-child'],
    } as CommunityPost;

    const child: CommunityPost = {
      postId: 'p-child',
      parentPostId: 'p-parent',
      createdAt: '2026-01-01T00:00:00.000Z',
      data: { text: '', fileId: 'img-feed-child' },
    } as CommunityPost;

    const files: CommunityFile[] = [
      { fileId: 'img-feed-child', fileUrl: 'https://cdn.example.com/from-feed-child.png' } as CommunityFile,
    ];

    const feedPosts = [parent, child];
    const post = mapCommunityPostToPost(parent, files, undefined, undefined, [], feedPosts);

    expect(post?.image).toBe('https://cdn.example.com/from-feed-child.png');
  });

  it('preenche image e videoUrl quando fileId aponta para vídeo e existe thumbnail nos files', () => {
    const videoId = 'vid-base-1';
    const thumbId = `${videoId}_thumbnail_1`;

    const communityPost: CommunityPost = {
      postId: 'p-video',
      createdAt: '2026-01-02T00:00:00.000Z',
      data: { text: 'Vídeo', fileId: videoId },
    } as CommunityPost;

    const files: CommunityFile[] = [
      {
        fileId: videoId,
        fileUrl: 'https://cdn.example.com/clip.mp4',
        attributes: { mimeType: 'video/mp4' },
      } as CommunityFile,
      {
        fileId: thumbId,
        fileUrl: 'https://cdn.example.com/clip_thumb.jpg',
        attributes: { mimeType: 'image/jpeg' },
      } as CommunityFile,
    ];

    const post = mapCommunityPostToPost(communityPost, files);

    expect(post).not.toBeNull();
    expect(post!.videoUrl).toBe('https://cdn.example.com/clip.mp4');
    expect(post!.image).toBe('https://cdn.example.com/clip_thumb.jpg');
    expect(post!.attachments?.some((item) => item.type === 'video')).toBe(true);
  });

  it('preenche videoUrl quando há várias imagens e um vídeo nos anexos', () => {
    const parent: CommunityPost = {
      postId: 'p-parent',
      createdAt: '2026-01-01T00:00:00.000Z',
      data: { text: 'Combo' },
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
    ];

    const post = mapCommunityPostToPost(parent, files);

    expect(post?.attachments?.filter((item) => item.type === 'image')).toHaveLength(2);
    expect(post?.videoUrl).toBe('https://cdn.example.com/clip.mp4');
  });

  it('mapeia PDF como anexo de arquivo', () => {
    const communityPost: CommunityPost = {
      postId: 'p-pdf',
      createdAt: '2026-01-02T00:00:00.000Z',
      data: { text: 'PDF', fileId: 'doc-1' },
    } as CommunityPost;

    const files: CommunityFile[] = [
      {
        fileId: 'doc-1',
        fileUrl: 'https://cdn.example.com/guide.pdf',
        attributes: { mimeType: 'application/pdf', name: 'guide.pdf' },
      } as CommunityFile,
    ];

    const post = mapCommunityPostToPost(communityPost, files);

    expect(post?.attachments?.[0]?.type).toBe('pdf');
    expect(post?.image).toBeUndefined();
  });
});
