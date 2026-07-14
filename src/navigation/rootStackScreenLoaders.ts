/* eslint-disable @typescript-eslint/no-var-requires -- `require` estático por rota: Metro inclui o chunk e só avalia na primeira navegação à tela. */
import type { ComponentType } from 'react';
import { logger } from '@/utils/logger';
import { loadingBootstrapFallbackScreen } from '@/navigation/LoadingBootstrapFallback';

type RootStackScreen = ComponentType<Record<string, unknown>>;

const asScreen = (mod: { default: RootStackScreen }): RootStackScreen => mod.default;

export const getForcedUpdateScreen = (): RootStackScreen =>
  asScreen(require('../screens/auth/ForcedUpdateScreen') as { default: RootStackScreen });

export const getLoadingScreen = (): RootStackScreen => {
  try {
    return asScreen(require('../screens/auth/LoadingScreen') as { default: RootStackScreen });
  } catch (error) {
    logger.error('[bootstrap] Falha ao carregar modulo LoadingScreen', { cause: error });
    return loadingBootstrapFallbackScreen;
  }
};
export const getUnauthenticatedScreen = (): RootStackScreen =>
  asScreen(require('../screens/auth/UnauthenticatedScreen') as { default: RootStackScreen });
export const getAuthenticatedScreen = (): RootStackScreen =>
  asScreen(require('../screens/auth/AuthenticatedScreen') as { default: RootStackScreen });
export const getWelcomeScreen = (): RootStackScreen =>
  asScreen(require('../screens/auth/WelcomeScreen') as { default: RootStackScreen });
export const getAppPresentationScreen = (): RootStackScreen =>
  asScreen(require('../screens/auth/AppPresentationScreen') as { default: RootStackScreen });
export const getRegisterScreen = (): RootStackScreen =>
  asScreen(require('../screens/auth/RegisterScreen') as { default: RootStackScreen });
export const getPlansScreen = (): RootStackScreen =>
  asScreen(require('../screens/plans/PlansScreen') as { default: RootStackScreen });
export const getAnamnesisStartScreen = (): RootStackScreen =>
  asScreen(require('../screens/anamnesis/AnamnesisStartScreen') as { default: RootStackScreen });
export const getAnamnesisHomeScreen = (): RootStackScreen =>
  asScreen(require('../screens/anamnesis/AnamnesisHomeScreen') as { default: RootStackScreen });
export const getAnamnesisBodyScreen = (): RootStackScreen =>
  asScreen(require('../screens/anamnesis/AnamnesisBodyScreen') as { default: RootStackScreen });
export const getAnamnesisMindScreen = (): RootStackScreen =>
  asScreen(require('../screens/anamnesis/AnamnesisMindScreen') as { default: RootStackScreen });
export const getAnamnesisHabitsScreen = (): RootStackScreen =>
  asScreen(require('../screens/anamnesis/AnamnesisHabitsScreen') as { default: RootStackScreen });
export const getAnamnesisCompletionScreen = (): RootStackScreen =>
  asScreen(require('../screens/anamnesis/AnamnesisCompletionScreen') as { default: RootStackScreen });
export const getInterestCategoriesScreen = (): RootStackScreen =>
  asScreen(require('../screens/auth/InterestCategoriesScreen') as { default: RootStackScreen });
export const getErrorScreen = (): RootStackScreen =>
  asScreen(require('../screens/ErrorScreen') as { default: RootStackScreen });
export const getAppLoadingScreen = (): RootStackScreen =>
  asScreen(require('../screens/LoadingScreen') as { default: RootStackScreen });
export const getCommunityStackNavigator = (): RootStackScreen =>
  asScreen(require('./CommunityStackNavigator') as { default: RootStackScreen });
export const getChatStackNavigator = (): RootStackScreen =>
  asScreen(require('./ChatStackNavigator') as { default: RootStackScreen });
export const getActivitiesScreen = (): RootStackScreen =>
  asScreen(require('../screens/activities/ActivitiesScreen') as { default: RootStackScreen });
export const getOrderDetailScreen = (): RootStackScreen =>
  asScreen(require('../screens/activities/OrderDetailScreen') as { default: RootStackScreen });
export const getMarketplaceScreen = (): RootStackScreen =>
  asScreen(require('../screens/marketplace/MarketplaceScreen') as { default: RootStackScreen });
export const getProductDetailsScreen = (): RootStackScreen =>
  asScreen(require('../screens/marketplace/ProductDetailsScreen') as { default: RootStackScreen });
export const getAffiliateProductScreen = (): RootStackScreen =>
  asScreen(require('../screens/marketplace/AffiliateProductScreen') as { default: RootStackScreen });
export const getCartScreen = (): RootStackScreen =>
  asScreen(require('../screens/marketplace/CartScreen') as { default: RootStackScreen });
export const getCheckoutScreen = (): RootStackScreen =>
  asScreen(require('../screens/marketplace/CheckoutScreen') as { default: RootStackScreen });
export const getProviderProfileScreen = (): RootStackScreen =>
  asScreen(require('../screens/marketplace/ProviderProfileScreen') as { default: RootStackScreen });
export const getProfileScreen = (): RootStackScreen =>
  asScreen(require('../screens/profile/ProfileScreen') as { default: RootStackScreen });
export const getUserProfileHomeScreen = (): RootStackScreen =>
  asScreen(require('../screens/profile/UserProfileHomeScreen') as { default: RootStackScreen });
export const getInterestCategoriesEditScreen = (): RootStackScreen =>
  asScreen(require('../screens/profile/InterestCategoriesEditScreen') as { default: RootStackScreen });
export const getPersonalDataEditScreen = (): RootStackScreen =>
  asScreen(require('../screens/profile/PersonalDataEditScreen') as { default: RootStackScreen });
export const getSettingsAndSecurityScreen = (): RootStackScreen =>
  asScreen(require('../screens/profile/SettingsAndSecurityScreen') as { default: RootStackScreen });
export const getProtocolDetailScreen = (): RootStackScreen =>
  asScreen(require('../screens/profile/ProtocolDetailScreen') as { default: RootStackScreen });
export const getSubscriptionListScreen = (): RootStackScreen =>
  asScreen(require('../screens/profile/SubscriptionListScreen') as { default: RootStackScreen });
export const getPrivacyPoliciesScreen = (): RootStackScreen =>
  asScreen(require('../screens/policies/PrivacyPoliciesScreen') as { default: RootStackScreen });
export const getHomeScreen = (): RootStackScreen =>
  asScreen(require('../screens/home/HomeScreen') as { default: RootStackScreen });
export const getSummaryScreen = (): RootStackScreen =>
  asScreen(require('../screens/home/SummaryScreen') as { default: RootStackScreen });
export const getAvatarProgressScreen = (): RootStackScreen =>
  asScreen(require('../screens/avatar/AvatarProgressScreen') as { default: RootStackScreen });
export const getMarkerDetailsScreen = (): RootStackScreen =>
  asScreen(require('../screens/avatar/MarkerDetailsScreen') as { default: RootStackScreen });
