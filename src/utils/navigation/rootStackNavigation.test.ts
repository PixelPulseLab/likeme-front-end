import { CommonActions } from '@react-navigation/native';
import { navigateRootStack, rootStackNavigationFrom } from '@/utils/navigation/rootStackNavigation';

function createNav(parent?: ReturnType<typeof createNav>) {
  const dispatch = jest.fn();
  const navigate = jest.fn();
  return {
    dispatch,
    navigate,
    getParent: jest.fn(() => parent),
  };
}

describe('rootStackNavigationFrom', () => {
  it('sobe até o navigator raiz', () => {
    const root = createNav();
    const communityStack = createNav(root);
    const communityList = createNav(communityStack);

    expect(rootStackNavigationFrom(communityList)).toBe(root);
  });

  it('retorna o próprio navigation quando já é raiz', () => {
    const root = createNav();

    expect(rootStackNavigationFrom(root)).toBe(root);
  });
});

describe('navigateRootStack', () => {
  it('usa dispatch com CommonActions.navigate no root', () => {
    const root = createNav();
    const child = createNav(root);

    navigateRootStack(child, 'Activities');

    expect(root.dispatch).toHaveBeenCalledWith(
      CommonActions.navigate({
        name: 'Activities',
        params: undefined,
      }),
    );
    expect(root.navigate).not.toHaveBeenCalled();
  });

  it('faz fallback para navigate quando dispatch não existe', () => {
    const root = {
      navigate: jest.fn(),
      getParent: () => undefined,
    };

    navigateRootStack(root, 'Marketplace', { initialSolutionTab: 'all' });

    expect(root.navigate).toHaveBeenCalledWith('Marketplace', { initialSolutionTab: 'all' });
  });
});
