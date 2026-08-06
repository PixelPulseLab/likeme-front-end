import { fireEvent, render } from '@testing-library/react-native';
import PostCard from './index';
import type { Post } from '@/types';
import { COMMUNITY_ATTACHMENT_DOWNLOAD_MATERIAL_I18N_KEY } from '@/constants/community/communityAttachmentI18n';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((effect: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => {
      const cleanup = effect();
      return typeof cleanup === 'function' ? cleanup : undefined;
    }, [effect]);
  }),
}));

jest.mock('@/hooks', () => ({
  usePost: () => ({ activePoll: undefined, submitPollVote: jest.fn() }),
  usePostReplies: () => ({
    likeCount: 0,
    isLiked: false,
    isLiking: false,
    togglePostLike: jest.fn(),
  }),
}));

jest.mock('@/hooks/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/components/ui', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Badge: ({ label }: { label: string }) => React.createElement(Text, { testID: 'badge' }, label),
  };
});

const basePost = (): Post => ({
  id: 'post-1',
  userId: 'u1',
  content: 'Conteúdo do post',
  comments: [],
  createdAt: new Date('2026-01-01'),
  likes: 0,
});

describe('PostCard', () => {
  it('renderiza card de arquivo quando há anexo PDF', () => {
    const { getByLabelText, getByText } = render(
      <PostCard
        post={{
          ...basePost(),
          attachments: [
            {
              id: 'doc-1',
              url: 'https://cdn.example.com/guide.pdf',
              type: 'pdf',
              fileName: 'guide.pdf',
              extension: '.pdf',
            },
          ],
        }}
        postEngagement={{ likeCount: 0, isLiked: false, isLiking: false, togglePostLike: jest.fn() }}
      />,
    );

    expect(getByLabelText(COMMUNITY_ATTACHMENT_DOWNLOAD_MATERIAL_I18N_KEY)).toBeTruthy();
    expect(getByText('community.attachments.accessMaterials')).toBeTruthy();
    expect(getByText(COMMUNITY_ATTACHMENT_DOWNLOAD_MATERIAL_I18N_KEY)).toBeTruthy();
  });

  it('lista arquivos após o texto, um por linha, com imagem e PDF', () => {
    const { getByTestId, queryByTestId } = render(
      <PostCard
        post={{
          ...basePost(),
          image: 'https://cdn.example.com/cover.jpg',
          attachments: [
            {
              id: 'img-1',
              url: 'https://cdn.example.com/cover.jpg',
              type: 'image',
              fileName: 'cover.jpg',
              extension: '.jpg',
            },
            {
              id: 'doc-1',
              url: 'https://cdn.example.com/guide.pdf',
              type: 'pdf',
              fileName: 'guide.pdf',
              extension: '.pdf',
            },
          ],
        }}
        postEngagement={{ likeCount: 0, isLiked: false, isLiking: false, togglePostLike: jest.fn() }}
      />,
    );

    expect(getByTestId('post-attachment-file-list')).toBeTruthy();
    expect(queryByTestId('post-attachment-mixed-row-image')).toBeNull();
  });

  it('renderiza Image com URI quando há imagem (sem vídeo)', () => {
    const uri = 'https://cdn.example.com/post-photo.png';
    const { getByTestId } = render(
      <PostCard
        post={{ ...basePost(), image: uri }}
        postEngagement={{ likeCount: 0, isLiked: false, isLiking: false, togglePostLike: jest.fn() }}
      />,
    );

    const img = getByTestId('post-card-image-only');
    expect(img.props.source).toEqual({ uri });
  });

  it('não exibe bloco de mídia quando image é só espaços', () => {
    const { queryByTestId } = render(
      <PostCard
        post={{ ...basePost(), image: '   \t  ' }}
        postEngagement={{ likeCount: 0, isLiked: false, isLiking: false, togglePostLike: jest.fn() }}
      />,
    );

    expect(queryByTestId('post-card-image-only')).toBeNull();
    expect(queryByTestId('post-card-video-poster')).toBeNull();
  });

  it('usa poster com imagem quando há vídeo e thumbnail', () => {
    const poster = 'https://cdn.example.com/thumb.jpg';
    const video = 'https://cdn.example.com/video.mp4';
    const { getByTestId } = render(
      <PostCard
        post={{ ...basePost(), image: poster, videoUrl: video }}
        postEngagement={{ likeCount: 0, isLiked: false, isLiking: false, togglePostLike: jest.fn() }}
      />,
    );

    const img = getByTestId('post-card-video-poster');
    expect(img.props.source).toEqual({ uri: poster });
  });

  it('ao tocar no poster, abre player de vídeo embutido', () => {
    const poster = 'https://cdn.example.com/thumb.jpg';
    const video = 'https://cdn.example.com/video.mp4';
    const { getByLabelText, getByTestId } = render(
      <PostCard
        post={{ ...basePost(), image: poster, videoUrl: video }}
        postEngagement={{ likeCount: 0, isLiked: false, isLiking: false, togglePostLike: jest.fn() }}
      />,
    );

    fireEvent.press(getByLabelText('community.attachments.playVideo'));
    expect(getByTestId('post-card-embedded-video')).toBeTruthy();
  });

  it('exibe play de vídeo quando há várias imagens e um vídeo', () => {
    const { getByLabelText, queryByTestId } = render(
      <PostCard
        post={{
          ...basePost(),
          attachments: [
            {
              id: 'i1',
              url: 'https://cdn.example.com/a.png',
              type: 'image',
              fileName: 'a.png',
              extension: '.png',
            },
            {
              id: 'i2',
              url: 'https://cdn.example.com/b.png',
              type: 'image',
              fileName: 'b.png',
              extension: '.png',
            },
            {
              id: 'v1',
              url: 'https://cdn.example.com/clip.mp4',
              type: 'video',
              fileName: 'clip.mp4',
              extension: '.mp4',
              posterUrl: 'https://cdn.example.com/thumb.jpg',
            },
          ],
        }}
        postEngagement={{ likeCount: 0, isLiked: false, isLiking: false, togglePostLike: jest.fn() }}
      />,
    );

    expect(queryByTestId('post-card-image-only')).toBeNull();
    expect(getByLabelText('community.attachments.playVideo')).toBeTruthy();
  });

  it('ao tocar no poster do vídeo, não dispara onPress do card', () => {
    const poster = 'https://cdn.example.com/thumb.jpg';
    const video = 'https://cdn.example.com/video.mp4';
    const onPress = jest.fn();
    const { getByLabelText, getByTestId } = render(
      <PostCard
        post={{ ...basePost(), image: poster, videoUrl: video }}
        onPress={onPress}
        postEngagement={{ likeCount: 0, isLiked: false, isLiking: false, togglePostLike: jest.fn() }}
      />,
    );

    fireEvent.press(getByLabelText('community.attachments.playVideo'));

    expect(onPress).not.toHaveBeenCalled();
    expect(getByTestId('post-card-embedded-video')).toBeTruthy();
  });

  const linesLayoutEvent = (lineCount: number) => ({
    nativeEvent: {
      lines: Array.from({ length: lineCount }, () => ({ text: 'x', width: 300, height: 20 })),
    },
  });

  it('não exibe “Ver mais” quando o corpo do post cabe em até 5 linhas (medição)', () => {
    const title = 'Título do post';
    const body = 'Texto curto.';
    const { getByTestId, queryByTestId } = render(
      <PostCard
        post={{
          ...basePost(),
          title,
          content: `${title}\n\n${body}`,
        }}
        postEngagement={{ likeCount: 0, isLiked: false, isLiking: false, togglePostLike: jest.fn() }}
      />,
    );

    fireEvent(getByTestId('post-card-description-wrap'), 'layout', {
      nativeEvent: { layout: { width: 320, height: 40, x: 0, y: 0 } },
    });
    fireEvent(
      getByTestId('post-card-description-measure', { includeHiddenElements: true }),
      'textLayout',
      linesLayoutEvent(3),
    );

    expect(queryByTestId('post-card-see-more')).toBeNull();
  });

  it('exibe “Ver mais” quando o corpo ultrapassa 5 linhas e expande ao tocar', () => {
    const title = 'Título';
    const body = Array(40).fill('palavra').join(' ');
    const { getByTestId, queryByTestId } = render(
      <PostCard
        post={{
          ...basePost(),
          title,
          content: `${title}\n\n${body}`,
        }}
        postEngagement={{ likeCount: 0, isLiked: false, isLiking: false, togglePostLike: jest.fn() }}
      />,
    );

    fireEvent(getByTestId('post-card-description-wrap'), 'layout', {
      nativeEvent: { layout: { width: 320, height: 200, x: 0, y: 0 } },
    });
    fireEvent(
      getByTestId('post-card-description-measure', { includeHiddenElements: true }),
      'textLayout',
      linesLayoutEvent(6),
    );

    const seeMore = getByTestId('post-card-see-more');
    expect(seeMore).toBeTruthy();

    fireEvent.press(seeMore);
    expect(queryByTestId('post-card-description-measure', { includeHiddenElements: true })).toBeNull();
  });

  it('renderiza ícone de pin quando isPinned', () => {
    const { getByLabelText } = render(
      <PostCard
        post={{ ...basePost(), userName: 'Autor' }}
        isPinned
        postEngagement={{ likeCount: 0, isLiked: false, isLiking: false, togglePostLike: jest.fn() }}
      />,
    );

    expect(getByLabelText('Post fixado')).toBeTruthy();
  });
});
