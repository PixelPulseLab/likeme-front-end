import { SHARE_DEEP_LINK_HOME_SCREEN } from '@/constants/share';
import { goBackOrShareHome, navigateToShareHome } from '@/utils/navigation/shareHomeNavigation';

function createNav(options: { canGoBack?: boolean; parent?: { canGoBack?: boolean; navigate?: jest.Mock } }): {
  canGoBack: jest.Mock;
  goBack: jest.Mock;
  navigate: jest.Mock;
  getParent: jest.Mock;
} {
  const nav = {
    canGoBack: jest.fn(() => options.canGoBack ?? false),
    goBack: jest.fn(),
    navigate: jest.fn(),
    getParent: jest.fn(() => options.parent ?? undefined),
  };
  return nav;
}

describe('navigateToShareHome', () => {
  it('navega para Summary no root', () => {
    const rootNavigate = jest.fn();
    const child = { getParent: () => ({ navigate: rootNavigate, getParent: () => undefined }) };

    navigateToShareHome(child);

    expect(rootNavigate).toHaveBeenCalledWith(SHARE_DEEP_LINK_HOME_SCREEN);
  });
});

describe('goBackOrShareHome', () => {
  it('volta na pilha atual quando canGoBack é true', () => {
    const navigation = createNav({ canGoBack: true });

    goBackOrShareHome(navigation);

    expect(navigation.goBack).toHaveBeenCalled();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('volta no root quando pilha aninhada não tem histórico', () => {
    const root = {
      canGoBack: jest.fn(() => true),
      goBack: jest.fn(),
      navigate: jest.fn(),
      getParent: () => undefined,
    };
    const navigation = {
      canGoBack: jest.fn(() => false),
      goBack: jest.fn(),
      navigate: jest.fn(),
      getParent: () => root,
    };

    goBackOrShareHome(navigation);

    expect(navigation.goBack).not.toHaveBeenCalled();
    expect(root.goBack).toHaveBeenCalled();
    expect(root.navigate).not.toHaveBeenCalled();
  });

  it('vai para home quando não há histórico em nenhum nível', () => {
    const rootNavigate = jest.fn();
    const root = {
      canGoBack: jest.fn(() => false),
      goBack: jest.fn(),
      navigate: rootNavigate,
      getParent: () => undefined,
    };
    const navigation = {
      canGoBack: jest.fn(() => false),
      goBack: jest.fn(),
      navigate: jest.fn(),
      getParent: () => root,
    };

    goBackOrShareHome(navigation);

    expect(navigation.goBack).not.toHaveBeenCalled();
    expect(root.goBack).not.toHaveBeenCalled();
    expect(rootNavigate).toHaveBeenCalledWith(SHARE_DEEP_LINK_HOME_SCREEN);
  });
});
