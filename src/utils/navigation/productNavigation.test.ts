import { PROGRAM_TYPE } from '@/types/product/programType';
import { navigateToSubscribedProgram } from './productNavigation';
import { navigateToCommunity } from './communityNavigation';

jest.mock('./communityNavigation', () => ({
  navigateToCommunity: jest.fn(),
}));

const navigateToCommunityMock = navigateToCommunity as jest.MockedFunction<typeof navigateToCommunity>;

const protocolDetailParams = {
  protocol: {
    id: 'product-1',
    productId: 'product-1',
    name: 'Programa',
  },
} as const;

function createNavigation() {
  return {
    navigate: jest.fn(),
    replace: jest.fn(),
  };
}

describe('navigateToSubscribedProgram', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('abre feed da comunidade quando assinatura community tem acesso', () => {
    const navigation = createNavigation();

    navigateToSubscribedProgram(navigation, {
      programType: PROGRAM_TYPE.COMMUNITY,
      communityId: ' community-1 ',
      subscriptionStatus: 'ACTIVE',
      protocolDetailParams,
    });

    expect(navigateToCommunityMock).toHaveBeenCalledWith(navigation, { focusCommunityId: 'community-1' });
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('mantem assinatura community inadimplente no detalhe do protocolo', () => {
    const navigation = createNavigation();

    navigateToSubscribedProgram(navigation, {
      programType: PROGRAM_TYPE.COMMUNITY,
      communityId: 'community-1',
      subscriptionStatus: 'UNPAID',
      protocolDetailParams,
    });

    expect(navigateToCommunityMock).not.toHaveBeenCalled();
    expect(navigation.navigate).toHaveBeenCalledWith('ProtocolDetail', protocolDetailParams);
  });

  it('preserva redirecionamento legado quando status da assinatura nao veio na rota', () => {
    const navigation = createNavigation();

    navigateToSubscribedProgram(navigation, {
      programType: PROGRAM_TYPE.COMMUNITY,
      communityId: 'community-1',
      protocolDetailParams,
    });

    expect(navigateToCommunityMock).toHaveBeenCalledWith(navigation, { focusCommunityId: 'community-1' });
    expect(navigation.navigate).not.toHaveBeenCalled();
  });
});
