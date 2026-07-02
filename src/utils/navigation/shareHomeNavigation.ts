import { SHARE_DEEP_LINK_HOME_SCREEN } from '@/constants/share';

type NavWithParent = {
  getParent?: () => NavWithParent | undefined;
  navigate?: (screen: string) => void;
};

export function navigateToShareHome(navigation: NavWithParent | undefined): void {
  if (!navigation) {
    return;
  }

  let root: NavWithParent = navigation;
  while (root.getParent?.()) {
    root = root.getParent() as NavWithParent;
  }

  root.navigate?.(SHARE_DEEP_LINK_HOME_SCREEN);
}
