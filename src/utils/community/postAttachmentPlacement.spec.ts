import {
  postHasAfterTextAttachments,
  postHasBeforeTextAttachments,
  postHasEndOfPostAttachments,
} from './postAttachmentPlacement';

describe('postAttachmentPlacement', () => {
  const basePost = { id: 'p1' };

  it('imagem fica antes do texto', () => {
    expect(postHasBeforeTextAttachments({ ...basePost, image: 'https://cdn/img.jpg' })).toBe(true);
    expect(postHasAfterTextAttachments({ ...basePost, image: 'https://cdn/img.jpg' })).toBe(false);
    expect(postHasEndOfPostAttachments({ ...basePost, image: 'https://cdn/img.jpg' })).toBe(false);
  });

  it('vídeo fica após o texto', () => {
    expect(postHasBeforeTextAttachments({ ...basePost, videoUrl: 'https://cdn/v.mp4' })).toBe(false);
    expect(postHasAfterTextAttachments({ ...basePost, videoUrl: 'https://cdn/v.mp4' })).toBe(true);
    expect(postHasEndOfPostAttachments({ ...basePost, videoUrl: 'https://cdn/v.mp4' })).toBe(false);
  });

  it('arquivos ficam no final do post', () => {
    const post = {
      ...basePost,
      attachments: [
        {
          id: 'f1',
          url: 'https://cdn/doc.pdf',
          type: 'pdf' as const,
          fileName: 'doc.pdf',
          extension: '.pdf',
        },
      ],
    };
    expect(postHasBeforeTextAttachments(post)).toBe(false);
    expect(postHasAfterTextAttachments(post)).toBe(false);
    expect(postHasEndOfPostAttachments(post)).toBe(true);
  });

  it('detecta vídeo via videoUrl mesmo com várias imagens nos anexos', () => {
    const post = {
      ...basePost,
      videoUrl: 'https://cdn.example.com/clip.mp4',
      attachments: [
        {
          id: 'i1',
          url: 'https://cdn.example.com/a.jpg',
          type: 'image' as const,
          fileName: 'a.jpg',
          extension: '.jpg',
        },
        {
          id: 'i2',
          url: 'https://cdn.example.com/b.jpg',
          type: 'image' as const,
          fileName: 'b.jpg',
          extension: '.jpg',
        },
      ],
    };

    expect(postHasBeforeTextAttachments(post)).toBe(true);
    expect(postHasAfterTextAttachments(post)).toBe(true);
  });

  it('imagem e arquivo se separam: imagem antes, arquivo no final', () => {
    const post = {
      ...basePost,
      attachments: [
        {
          id: 'i1',
          url: 'https://cdn/img.jpg',
          type: 'image' as const,
          fileName: 'img.jpg',
          extension: '.jpg',
        },
        {
          id: 'f1',
          url: 'https://cdn/doc.pdf',
          type: 'pdf' as const,
          fileName: 'doc.pdf',
          extension: '.pdf',
        },
      ],
    };
    expect(postHasBeforeTextAttachments(post)).toBe(true);
    expect(postHasAfterTextAttachments(post)).toBe(false);
    expect(postHasEndOfPostAttachments(post)).toBe(true);
  });
});
