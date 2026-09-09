import apiClient from '@/services/infrastructure/apiClient';
import { invitationService } from '@/services/invitation/invitationService';
import { INVITATION_CODE_VALIDATION_ERROR } from '@/constants/invitation/invitationCodeValidation';

jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/services/infrastructure/apiClient', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

const validContext = {
  code: '7F3K9Q',
  program: { id: 'program-1', name: 'Protocolo', imageUrl: 'https://cdn.example/program.png' },
  provider: { id: 'provider-1', name: 'Clínica', logoUrl: null },
  community: { id: 'community-1', displayName: 'Comunidade', imageUrl: null },
};

describe('invitationService.validateCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('envia o código sem auth e devolve o contexto seguro', async () => {
    mockPost.mockResolvedValue({
      success: true,
      message: 'Convite válido',
      data: validContext,
    });

    await expect(invitationService.validateCode('7F3K9Q')).resolves.toEqual(validContext);
    expect(mockPost).toHaveBeenCalledWith('/api/invitations/validate', { code: '7F3K9Q' }, false);
  });

  it('propaga a mensagem do backend quando a validação recusa o código', async () => {
    mockPost.mockRejectedValue(new Error(INVITATION_CODE_VALIDATION_ERROR.EXPIRED));

    await expect(invitationService.validateCode('7F3K9Q')).rejects.toThrow(INVITATION_CODE_VALIDATION_ERROR.EXPIRED);
  });
});
