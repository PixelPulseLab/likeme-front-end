import { CommonActions } from '@react-navigation/native';
import { navigateRootStack, resetRootStack, rootStackNavigationFrom } from '@/utils/navigation/rootStackNavigation';

type MockNav = {
  dispatch: jest.Mock;
  navigate: jest.Mock;
  getParent: jest.Mock;
};

function createNav(parent?: MockNav): MockNav {
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

describe('resetRootStack', () => {
  it('usa dispatch com CommonActions.reset no root', () => {
    const root = createNav();
    const child = createNav(root);

    resetRootStack(child, 'Summary');

    expect(root.dispatch).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Summary' }],
      }),
    );
  });

  it('faz fallback para reset quando dispatch não existe', () => {
    const reset = jest.fn();
    const root = {
      reset,
      getParent: () => undefined,
    };

    resetRootStack(root, 'Home', { tab: 'feed' });

    expect(reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Home', params: { tab: 'feed' } }],
    });
  });
});
