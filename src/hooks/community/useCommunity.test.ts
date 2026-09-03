import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useCommunity } from '@/hooks/community/useCommunity';
import { communityService } from '@/services';
import { logger } from '@/utils/logger';
import type { Community } from '@/types/community';

jest.mock('@/services', () => ({
  communityService: {
    getMyCommunityTermsAccepted: jest.fn(),
    updateMyCommunityTermsAccepted: jest.fn(),
    getCommunity: jest.fn(),
  },
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
    info: jest.fn(),
  },
}));

describe('useCommunity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('carrega aceite de termos ao receber communityId', async () => {
    (communityService.getMyCommunityTermsAccepted as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useCommunity({ communityId: 'community-1' }));

    expect(result.current.termsAccepted).toBeNull();

    await waitFor(() => {
      expect(result.current.termsAccepted).toBe(true);
    });
  });

  it('mantém false quando leitura de termos falha', async () => {
    (communityService.getMyCommunityTermsAccepted as jest.Mock).mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useCommunity({ communityId: 'community-2' }));

    await waitFor(() => {
      expect(result.current.termsAccepted).toBe(false);
    });
  });

  it('toggle persiste valor e mantém valor retornado pelo servidor', async () => {
    (communityService.getMyCommunityTermsAccepted as jest.Mock).mockResolvedValue(false);
    (communityService.updateMyCommunityTermsAccepted as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useCommunity({ communityId: 'community-3' }));

    await waitFor(() => {
      expect(result.current.termsAccepted).toBe(false);
    });

    act(() => {
      result.current.toggleTermsAccepted();
    });

    await waitFor(() => {
      expect(communityService.updateMyCommunityTermsAccepted).toHaveBeenCalledWith('community-3', true);
      expect(result.current.termsAccepted).toBe(true);
    });
  });

  it('toggle faz rollback quando persistência falha', async () => {
    (communityService.getMyCommunityTermsAccepted as jest.Mock).mockResolvedValue(true);
    (communityService.updateMyCommunityTermsAccepted as jest.Mock).mockRejectedValue(new Error('save-failed'));

    const { result } = renderHook(() => useCommunity({ communityId: 'community-4' }));

    await waitFor(() => {
      expect(result.current.termsAccepted).toBe(true);
    });

    act(() => {
      result.current.toggleTermsAccepted();
    });

    await waitFor(() => {
      expect(logger.error).toHaveBeenCalledWith(
        'Falha ao persistir aceite dos termos da comunidade',
        expect.objectContaining({
          communityId: 'community-4',
          attemptedValue: false,
        }),
      );
      expect(result.current.termsAccepted).toBe(true);
    });
  });
});

describe('useCommunity.byId', () => {
  const community: Community = {
    communityId: 'channel-1',
    displayName: 'O.Culto',
    isPublic: false,
    membersCount: 0,
    postsCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('não chama a API sem communityId', async () => {
    const { result } = renderHook(() => useCommunity.byId({ communityId: undefined }));

    expect(result.current.loading).toBe(false);
    expect(result.current.community).toBeNull();
    expect(communityService.getCommunity).not.toHaveBeenCalled();
  });

  it('carrega GET /api/communities/:id', async () => {
    (communityService.getCommunity as jest.Mock).mockResolvedValue(community);

    const { result } = renderHook(() => useCommunity.byId({ communityId: 'channel-1' }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.community).toEqual(community);
    });
    expect(communityService.getCommunity).toHaveBeenCalledWith('channel-1');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('expõe erro quando a comunidade não existe ou não há acesso', async () => {
    (communityService.getCommunity as jest.Mock).mockRejectedValue(new Error('Comunidade não encontrada'));

    const { result } = renderHook(() => useCommunity.byId({ communityId: 'missing' }));

    await waitFor(() => {
      expect(result.current.error).toBe('Comunidade não encontrada');
    });
    expect(result.current.community).toBeNull();
    expect(logger.warn).toHaveBeenCalled();
  });
});
