import { SHARE_DEEP_LINK_HOME_SCREEN } from '@/constants/share';
import { navigateRootStack, rootStackNavigationFrom, type NavWithParent } from '@/utils/navigation/rootStackNavigation';

type ShareNav = NavWithParent & {
  canGoBack?: () => boolean;
  goBack?: () => void;
};

export function navigateToShareHome(navigation: ShareNav | undefined): void {
  if (!navigation) {
    return;
  }

  navigateRootStack(navigation, SHARE_DEEP_LINK_HOME_SCREEN);
}

/** Volta na pilha quando houver histórico; senão abre a home (entrada via deep link). */
export function goBackOrShareHome(navigation: ShareNav | undefined): void {
  if (!navigation) {
    return;
  }

  if (navigation.canGoBack?.()) {
    navigation.goBack?.();
    return;
  }

  const root = rootStackNavigationFrom(navigation);
  if (root !== navigation && root.canGoBack?.()) {
    root.goBack?.();
    return;
  }

  navigateToShareHome(navigation);
}
