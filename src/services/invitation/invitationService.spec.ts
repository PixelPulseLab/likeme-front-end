import apiClient from '@/services/infrastructure/apiClient';
import storageService from '@/services/auth/storageService';
import { invitationProgramRouteInsteadOfHome, invitationService } from '@/services/invitation/invitationService';
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
    setPendingInvitationProgramDestination: jest.fn(),
    takePendingInvitationProgramDestination: jest.fn(),
  },
}));

const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
const mockGetPendingInvitationCode = storageService.getPendingInvitationCode as jest.Mock;
const mockRemovePendingInvitationCode = storageService.removePendingInvitationCode as jest.Mock;
const mockGetUser = storageService.getUser as jest.Mock;
const mockSetUser = storageService.setUser as jest.Mock;
const mockSetPendingInvitationProgramDestination = storageService.setPendingInvitationProgramDestination as jest.Mock;
const mockTakePendingInvitationProgramDestination = storageService.takePendingInvitationProgramDestination as jest.Mock;

const validContext = {
  code: '7F3K9Q',
  program: {
    id: 'program-1',
    name: 'Protocolo',
    imageUrl: 'https://cdn.example/program.png',
    programType: 'course',
  },
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

  it('assume programType course quando o backend omite o campo', async () => {
    mockPost.mockResolvedValue({
      success: true,
      message: 'Convite válido',
      data: {
        ...validContext,
        program: { id: 'program-1', name: 'Protocolo', imageUrl: 'https://cdn.example/program.png' },
      },
    });

    await expect(invitationService.validateCode('7F3K9Q')).resolves.toEqual(validContext);
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
      alreadyParticipating: false,
    });
    expect(mockPost).toHaveBeenCalledWith('/api/invitations/activate', { code: '7F3K9Q' });
  });

  it('propaga alreadyParticipating quando o usuário já está no programa', async () => {
    mockPost.mockResolvedValue({
      success: true,
      message: 'Convite vinculado',
      data: { ...validContext, displayName: 'Camilla', alreadyParticipating: true },
    });

    await expect(invitationService.activateCode('7F3K9Q')).resolves.toEqual({
      ...validContext,
      displayName: 'Camilla',
      alreadyParticipating: true,
    });
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
      context: { ...validContext, displayName: 'Camilla', alreadyParticipating: false },
    });
    expect(mockRemovePendingInvitationCode).toHaveBeenCalled();
    expect(mockSetPendingInvitationProgramDestination).toHaveBeenCalledWith({
      productId: 'program-1',
      programType: 'course',
      communityId: 'community-1',
    });
    expect(mockSetUser).toHaveBeenCalledWith({ email: 'camilla@email.com', name: 'Camilla' });
  });

  it('trata mismatch de identidade sem deixar o código pendente', async () => {
    mockGetPendingInvitationCode.mockResolvedValue('7F3K9Q');
    mockPost.mockRejectedValue(new Error(INVITATION_CODE_VALIDATION_ERROR.IDENTITY));

    await expect(invitationService.activatePendingStoredCode()).resolves.toEqual({ outcome: 'mismatch' });
    expect(mockRemovePendingInvitationCode).toHaveBeenCalled();
    expect(mockSetPendingInvitationProgramDestination).not.toHaveBeenCalled();
  });

  it('mantém o código pendente quando a rede falha', async () => {
    mockGetPendingInvitationCode.mockResolvedValue('7F3K9Q');
    mockPost.mockRejectedValue(new Error('Network Error'));

    await expect(invitationService.activatePendingStoredCode()).resolves.toEqual({ outcome: 'failed' });
    expect(mockRemovePendingInvitationCode).not.toHaveBeenCalled();
  });
});

describe('invitationProgramRouteInsteadOfHome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mantém a tela quando não há destino de convite pendente', async () => {
    mockTakePendingInvitationProgramDestination.mockResolvedValue(null);

    await expect(invitationProgramRouteInsteadOfHome('InterestCategories', { firstName: 'Camilla' })).resolves.toEqual({
      screen: 'InterestCategories',
      params: { firstName: 'Camilla' },
    });
    expect(mockTakePendingInvitationProgramDestination).toHaveBeenCalled();
  });

  it('vai ao programa mesmo quando o destino seria onboarding', async () => {
    mockTakePendingInvitationProgramDestination.mockResolvedValue({
      productId: 'program-1',
      programType: 'course',
      communityId: null,
    });

    await expect(invitationProgramRouteInsteadOfHome('Register', { userName: 'Camilla' })).resolves.toEqual({
      screen: 'ProtocolDetail',
      params: { productId: 'program-1' },
    });
  });

  it('vai ao ProtocolDetail do convite quando o destino seria Home', async () => {
    mockTakePendingInvitationProgramDestination.mockResolvedValue({
      productId: 'program-1',
      programType: 'course',
      communityId: 'community-1',
    });

    await expect(invitationProgramRouteInsteadOfHome('Home')).resolves.toEqual({
      screen: 'ProtocolDetail',
      params: { productId: 'program-1' },
    });
  });

  it('vai ao feed da comunidade quando o programa é community', async () => {
    mockTakePendingInvitationProgramDestination.mockResolvedValue({
      productId: 'program-1',
      programType: 'community',
      communityId: 'community-1',
    });

    await expect(invitationProgramRouteInsteadOfHome('Home')).resolves.toEqual({
      screen: 'Community',
      params: {
        screen: 'CommunityList',
        params: { focusCommunityId: 'community-1', programType: 'community' },
      },
    });
  });
});
