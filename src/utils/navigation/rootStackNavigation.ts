import { CommonActions } from '@react-navigation/native';

type RootStackAction = ReturnType<typeof CommonActions.navigate> | ReturnType<typeof CommonActions.reset>;

export type NavWithParent = {
  getParent?: () => NavWithParent | undefined;
  getState?: () => { index: number; routes: Array<{ name: string }> } | undefined;
  navigate?: (screen: string, params?: unknown) => void;
  dispatch?: (action: RootStackAction) => void;
  canGoBack?: () => boolean;
  goBack?: () => void;
};

type NavWithReset = NavWithParent & {
  reset?: (state: { index: number; routes: Array<{ name: string; params?: object }> }) => void;
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

export function resetRootStack(navigation: NavWithParent | undefined, name: string, params?: object): void {
  const root = rootStackNavigationFrom(navigation);
  if (!root) {
    return;
  }

  const routes = [params != null ? { name, params } : { name }];
  if (typeof root.dispatch === 'function') {
    root.dispatch(
      CommonActions.reset({
        index: 0,
        routes,
      }),
    );
    return;
  }

  (root as NavWithReset).reset?.({ index: 0, routes });
}
