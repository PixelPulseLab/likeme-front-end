import apiClient from '@/services/infrastructure/apiClient';
import storageService from '@/services/auth/storageService';
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

jest.mock('@/services/auth/storageService', () => ({
  __esModule: true,
  default: {
    getPendingInvitationCode: jest.fn(),
    removePendingInvitationCode: jest.fn(),
    getUser: jest.fn(),
    setUser: jest.fn(),
  },
}));

const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
const mockGetPendingInvitationCode = storageService.getPendingInvitationCode as jest.Mock;
const mockRemovePendingInvitationCode = storageService.removePendingInvitationCode as jest.Mock;
const mockGetUser = storageService.getUser as jest.Mock;
const mockSetUser = storageService.setUser as jest.Mock;

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

describe('invitationService.activateCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('envia o código autenticado e devolve o contexto com displayName', async () => {
    mockPost.mockResolvedValue({
      success: true,
      message: 'Convite vinculado',
      data: { ...validContext, displayName: 'Camilla' },
    });

    await expect(invitationService.activateCode('7F3K9Q')).resolves.toEqual({
      ...validContext,
      displayName: 'Camilla',
    });
    expect(mockPost).toHaveBeenCalledWith('/api/invitations/activate', { code: '7F3K9Q' });
  });
});

describe('invitationService.activatePendingStoredCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ email: 'camilla@email.com' });
    mockSetUser.mockResolvedValue(undefined);
    mockRemovePendingInvitationCode.mockResolvedValue(undefined);
  });

  it('não chama a API quando não há código pendente', async () => {
    mockGetPendingInvitationCode.mockResolvedValue(null);

    await expect(invitationService.activatePendingStoredCode()).resolves.toEqual({ outcome: 'none' });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('vincula, limpa o código e preenche o nome vazio', async () => {
    mockGetPendingInvitationCode.mockResolvedValue('7F3K9Q');
    mockPost.mockResolvedValue({
      success: true,
      message: 'Convite vinculado',
      data: { ...validContext, displayName: 'Camilla' },
    });

    await expect(invitationService.activatePendingStoredCode()).resolves.toEqual({
      outcome: 'linked',
      context: { ...validContext, displayName: 'Camilla' },
    });
    expect(mockRemovePendingInvitationCode).toHaveBeenCalled();
    expect(mockSetUser).toHaveBeenCalledWith({ email: 'camilla@email.com', name: 'Camilla' });
  });

  it('trata mismatch de identidade sem deixar o código pendente', async () => {
    mockGetPendingInvitationCode.mockResolvedValue('7F3K9Q');
    mockPost.mockRejectedValue(new Error(INVITATION_CODE_VALIDATION_ERROR.IDENTITY));

    await expect(invitationService.activatePendingStoredCode()).resolves.toEqual({ outcome: 'mismatch' });
    expect(mockRemovePendingInvitationCode).toHaveBeenCalled();
  });

  it('mantém o código pendente quando a rede falha', async () => {
    mockGetPendingInvitationCode.mockResolvedValue('7F3K9Q');
    mockPost.mockRejectedValue(new Error('Network Error'));

    await expect(invitationService.activatePendingStoredCode()).resolves.toEqual({ outcome: 'failed' });
    expect(mockRemovePendingInvitationCode).not.toHaveBeenCalled();
  });
});
