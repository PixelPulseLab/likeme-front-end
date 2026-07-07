import { CommonActions } from '@react-navigation/native';

export type NavWithParent = {
  getParent?: () => NavWithParent | undefined;
  navigate?: (screen: string, params?: unknown) => void;
  dispatch?: (action: ReturnType<typeof CommonActions.navigate>) => void;
};

export function rootStackNavigationFrom(navigation: NavWithParent | undefined): NavWithParent | undefined {
  if (!navigation) {
    return undefined;
  }

  let root = navigation;
  while (root.getParent?.()) {
    root = root.getParent() as NavWithParent;
  }
  return root;
}

export function navigateRootStack(navigation: NavWithParent | undefined, name: string, params?: object): void {
  const root = rootStackNavigationFrom(navigation);
  if (!root) {
    return;
  }

  if (typeof root.dispatch === 'function') {
    root.dispatch(
      CommonActions.navigate({
        name,
        params,
      }),
    );
    return;
  }

  root.navigate?.(name, params);
}
