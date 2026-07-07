import { SHARE_DEEP_LINK_HOME_SCREEN } from '@/constants/share';

type NavWithParent = {
  getParent?: () => NavWithParent | undefined;
  navigate?: (screen: string) => void;
  canGoBack?: () => boolean;
  goBack?: () => void;
};

function rootNavigationFrom(navigation: NavWithParent): NavWithParent {
  let root = navigation;
  while (root.getParent?.()) {
    root = root.getParent() as NavWithParent;
  }
  return root;
}

export function navigateToShareHome(navigation: NavWithParent | undefined): void {
  if (!navigation) {
    return;
  }

  rootNavigationFrom(navigation).navigate?.(SHARE_DEEP_LINK_HOME_SCREEN);
}

/** Volta na pilha quando houver histórico; senão abre a home (entrada via deep link). */
export function goBackOrShareHome(navigation: NavWithParent | undefined): void {
  if (!navigation) {
    return;
  }

  if (navigation.canGoBack?.()) {
    navigation.goBack?.();
    return;
  }

  const root = rootNavigationFrom(navigation);
  if (root !== navigation && root.canGoBack?.()) {
    root.goBack?.();
    return;
  }

  navigateToShareHome(navigation);
}
