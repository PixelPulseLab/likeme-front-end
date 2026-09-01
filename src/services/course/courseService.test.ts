import apiClient from '@/services/infrastructure/apiClient';
import { courseService } from '@/services/course/courseService';

jest.mock('@/services/infrastructure/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

const mockedGet = apiClient.get as jest.Mock;

describe('courseService.getProgramCourseByCommunityId', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('normaliza video legado de postAttachment.video quando step.video não vem populado', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      data: {
        type: 'program',
        communityId: 'community-1',
        steps: [
          {
            stepNumber: 1,
            title: 'Aula 1',
            postId: 'post-1',
            body: 'Conteúdo',
            attachments: undefined,
            video: null,
            postAttachment: {
              video: {
                id: 'video-legacy',
                title: 'Vídeo legado',
                streamUrl: 'https://cdn.example.com/video.m3u8',
                playerUrl: 'https://player.example.com/video',
                thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
                playable: true,
                status: 'ready',
              },
            },
            createdAt: '2026-08-20T10:00:00.000Z',
            updatedAt: '2026-08-20T10:00:00.000Z',
          },
        ],
      },
    });

    const response = await courseService.getProgramCourseByCommunityId(' community-1 ');

    expect(mockedGet).toHaveBeenCalledWith('/api/courses/program/communities/community-1', undefined, true);
    expect(response.data?.steps[0]).toEqual(
      expect.objectContaining({
        attachments: [],
        video: {
          id: 'video-legacy',
          url: 'https://cdn.example.com/video.m3u8',
          type: 'video',
          fileName: 'Vídeo legado',
          extension: '',
          posterUrl: 'https://cdn.example.com/thumb.jpg',
          streamUrl: 'https://cdn.example.com/video.m3u8',
          playerUrl: 'https://player.example.com/video',
          playable: true,
          status: 'ready',
        },
      }),
    );
  });

  it('mantém step.video quando o contrato novo já vem populado', async () => {
    const currentVideo = {
      id: 'video-current',
      url: 'https://cdn.example.com/current.m3u8',
      type: 'video' as const,
      fileName: 'Vídeo atual',
      extension: '',
      streamUrl: 'https://cdn.example.com/current.m3u8',
      playerUrl: null,
    };

    mockedGet.mockResolvedValue({
      success: true,
      data: {
        type: 'program',
        communityId: 'community-1',
        steps: [
          {
            stepNumber: 1,
            title: 'Aula 1',
            postId: 'post-1',
            body: null,
            attachments: [],
            video: currentVideo,
            postAttachment: {
              video: {
                id: 'video-legacy',
                streamUrl: 'https://cdn.example.com/legacy.m3u8',
              },
            },
            createdAt: null,
            updatedAt: null,
          },
        ],
      },
    });

    const response = await courseService.getProgramCourseByCommunityId('community-1');

    expect(response.data?.steps[0]?.video).toBe(currentVideo);
  });
});
