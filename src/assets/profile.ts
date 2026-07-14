import type { FC } from 'react';
import type { SvgProps } from 'react-native-svg';

import MindAvatarDisabledPng from '../../assets/avatar/DisableMindAvatar.png';
import BodyAvatarDisabledPng from '../../assets/avatar/DisableBodyAvatar.png';
import MindAvatarActivePng from '../../assets/avatar/MindAvatar.png';
import BodyAvatarActivePng from '../../assets/avatar/BodyAvatar.png';
import MenuAccountSettingsIcon from '../../assets/profile/menu-account-settings.svg';
import MenuChevronRightIconSvg from '../../assets/profile/menu-chevron-right.svg';
import MenuDataUsagePolicyIcon from '../../assets/profile/menu-data-usage-policy.svg';
import MenuDeleteAccountIcon from '../../assets/profile/menu-delete-account.svg';
import MenuInterestCategoriesIcon from '../../assets/profile/menu-interest-categories.svg';
import MenuNotificationsIcon from '../../assets/profile/menu-notifications.svg';
import MenuPersonalDataIcon from '../../assets/profile/menu-personal-data.svg';
import FloatingMenuCloseIcon from '../../assets/profile/floating-menu-close.svg';
import FloatingMenuMyActivitiesIcon from '../../assets/profile/floating-menu-my-activities.svg';
import FloatingMenuMyOrdersIcon from '../../assets/profile/floating-menu-my-orders.svg';
import FloatingMenuMyProtocolsIcon from '../../assets/profile/floating-menu-my-protocols.svg';

export const PROFILE_MENU_ICON_SIZE = { width: 30, height: 26 } as const;
export const PROFILE_MENU_CHEVRON_SIZE = 28;

export const MindAvatar = MindAvatarDisabledPng;
export const BodyAvatar = BodyAvatarDisabledPng;
export const MindAvatarActive = MindAvatarActivePng;
export const BodyAvatarActive = BodyAvatarActivePng;

export const MenuChevronRightIcon = MenuChevronRightIconSvg;

export const PROFILE_HOME_MENU_ICONS = {
  personalData: MenuPersonalDataIcon,
  interestCategories: MenuInterestCategoriesIcon,
  notifications: MenuNotificationsIcon,
  settingsAndSecurity: MenuAccountSettingsIcon,
  dataUsagePolicy: MenuDataUsagePolicyIcon,
  termsOfUse: MenuDataUsagePolicyIcon,
  deleteAccount: MenuDeleteAccountIcon,
  chevronRight: MenuChevronRightIconSvg,
} as const satisfies Record<string, FC<SvgProps>>;

export const PROFILE_FLOATING_MENU_ICONS = {
  myProfile: MenuPersonalDataIcon,
  myOrders: FloatingMenuMyOrdersIcon,
  myProtocols: FloatingMenuMyProtocolsIcon,
  myActivities: FloatingMenuMyActivitiesIcon,
  close: FloatingMenuCloseIcon,
  chevronRight: MenuChevronRightIconSvg,
} as const satisfies Record<string, FC<SvgProps>>;
