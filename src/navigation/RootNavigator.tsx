import React, { lazy, Suspense, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { DefaultTheme, NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '@/types/navigation';
import { createStackNavigator } from '@react-navigation/stack';
import { FloatingMenuProvider } from '@/contexts/FloatingMenuContext';
import { AdvertisersCacheProvider } from '@/contexts/AdvertisersCacheContext';
import { CommunitiesCacheProvider } from '@/contexts/CommunitiesCacheContext';
import { FeedCacheProvider } from '@/contexts/FeedCacheContext';
import { MarketplaceListingsCacheProvider } from '@/contexts/MarketplaceListingsCacheContext';
import { STACK_GESTURE_ENABLED, fastFadeTransition, forSimpleFade } from '@/navigation/stackTransitions';
import PushNotificationsRoot from '@/components/infrastructure/PushNotificationsRoot';
import DeepLinkRoot from '@/components/infrastructure/DeepLinkRoot';
import { COLORS } from '@/constants';
import { useTranslation } from '@/hooks/i18n';
import {
  getLoadingScreen,
  getForcedUpdateScreen,
  getUnauthenticatedScreen,
  getAuthenticatedScreen,
  getWelcomeScreen,
  getAppPresentationScreen,
  getRegisterScreen,
  getPlansScreen,
  getAnamnesisStartScreen,
  getAnamnesisHomeScreen,
  getAnamnesisBodyScreen,
  getAnamnesisMindScreen,
  getAnamnesisHabitsScreen,
  getAnamnesisCompletionScreen,
  getInterestCategoriesScreen,
  getErrorScreen,
  getAppLoadingScreen,
  getCommunityStackNavigator,
  getChatStackNavigator,
  getActivitiesScreen,
  getOrderDetailScreen,
  getMarketplaceScreen,
  getProductDetailsScreen,
  getAffiliateProductScreen,
  getCartScreen,
  getCheckoutScreen,
  getProviderProfileScreen,
  getProfileScreen,
  getUserProfileHomeScreen,
  getInterestCategoriesEditScreen,
  getPersonalDataEditScreen,
  getSettingsAndSecurityScreen,
  getDeleteAccountScreen,
  getProtocolDetailScreen,
  getSubscriptionListScreen,
  getManageProtocolSubscriptionScreen,
  getCancelProtocolSubscriptionScreen,
  getCancelProtocolSubscriptionConfirmScreen,
  getPrivacyPoliciesScreen,
  getHomeScreen,
  getSummaryScreen,
  getAvatarProgressScreen,
  getMarkerDetailsScreen,
} from '@/navigation/rootStackScreenLoaders';

const SupportFloatingButtonLazy = lazy(() => import('@/components/ui/buttons/SupportFloatingButton'));

const Stack = createStackNavigator();

const rootNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.BACKGROUND,
    card: COLORS.BACKGROUND,
  },
};

const styles = StyleSheet.create({
  stackWrapper: {
    flex: 1,
  },
});

const RootNavigator: React.FC = () => {
  const { t } = useTranslation();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const [activeRouteName, setActiveRouteName] = useState<string | undefined>(undefined);

  const syncActiveRouteName = useCallback(() => {
    const name = navigationRef.getCurrentRoute()?.name;
    setActiveRouteName(typeof name === 'string' ? name : undefined);
  }, [navigationRef]);

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={rootNavigationTheme}
      onReady={syncActiveRouteName}
      onStateChange={syncActiveRouteName}
    >
      <View style={styles.stackWrapper}>
        <FeedCacheProvider>
          <CommunitiesCacheProvider>
            <MarketplaceListingsCacheProvider>
              <AdvertisersCacheProvider>
                <FloatingMenuProvider>
                  <PushNotificationsRoot activeRouteName={activeRouteName} navigationRef={navigationRef} />
                  <DeepLinkRoot activeRouteName={activeRouteName} navigationRef={navigationRef} />
                  <Stack.Navigator
                    initialRouteName='Loading'
                    screenOptions={{
                      headerShown: false,
                      animationEnabled: true,
                      gestureEnabled: STACK_GESTURE_ENABLED,
                      cardStyle: { flex: 1, backgroundColor: COLORS.BACKGROUND },
                      cardStyleInterpolator: forSimpleFade,
                      transitionSpec: fastFadeTransition,
                    }}
                  >
                    <Stack.Screen name='Loading' getComponent={getLoadingScreen} options={{ title: 'Carregando' }} />
                    <Stack.Screen
                      name='ForcedUpdate'
                      getComponent={getForcedUpdateScreen}
                      options={{ title: 'Atualização obrigatória', gestureEnabled: false }}
                    />
                    <Stack.Screen
                      name='Unauthenticated'
                      getComponent={getUnauthenticatedScreen}
                      options={{ title: 'Tela Deslogada' }}
                    />
                    <Stack.Screen
                      name='Authenticated'
                      getComponent={getAuthenticatedScreen}
                      options={{ title: 'Tela Autenticada' }}
                    />
                    <Stack.Screen name='Welcome' getComponent={getWelcomeScreen} options={{ title: 'Boas-vindas' }} />
                    <Stack.Screen
                      name='AppPresentation'
                      getComponent={getAppPresentationScreen}
                      options={{ title: 'Apresentação' }}
                    />
                    <Stack.Screen name='Register' getComponent={getRegisterScreen} options={{ title: 'Cadastro' }} />
                    <Stack.Screen name='Plans' getComponent={getPlansScreen} options={{ title: 'Planos' }} />
                    <Stack.Screen
                      name='Anamnesis'
                      getComponent={getAnamnesisStartScreen}
                      options={{ title: 'Anamnesis' }}
                    />
                    <Stack.Screen
                      name='AnamnesisHome'
                      getComponent={getAnamnesisHomeScreen}
                      options={{ title: 'Anamnesis Home' }}
                    />
                    <Stack.Screen
                      name='AnamnesisBody'
                      getComponent={getAnamnesisBodyScreen}
                      options={{ title: 'Anamnesis Body' }}
                    />
                    <Stack.Screen
                      name='AnamnesisMind'
                      getComponent={getAnamnesisMindScreen}
                      options={{ title: 'Anamnesis Mind' }}
                    />
                    <Stack.Screen
                      name='AnamnesisHabits'
                      getComponent={getAnamnesisHabitsScreen}
                      options={{ title: 'Anamnesis Habits' }}
                    />
                    <Stack.Screen
                      name='AnamnesisCompletion'
                      getComponent={getAnamnesisCompletionScreen}
                      options={{ title: 'Anamnesis Conclusão' }}
                    />
                    <Stack.Screen
                      name='InterestCategories'
                      getComponent={getInterestCategoriesScreen}
                      options={{ title: 'Categorias de Interesse' }}
                    />
                    <Stack.Screen name='Error' getComponent={getErrorScreen} options={{ title: 'Erro' }} />
                    <Stack.Screen
                      name='AppLoading'
                      getComponent={getAppLoadingScreen}
                      options={{ title: 'Carregando' }}
                    />
                    <Stack.Screen
                      name='Community'
                      getComponent={getCommunityStackNavigator}
                      options={{ title: 'Comunidade' }}
                    />
                    <Stack.Screen name='Chat' getComponent={getChatStackNavigator} options={{ title: 'Chat' }} />
                    <Stack.Screen
                      name='Activities'
                      getComponent={getActivitiesScreen}
                      options={{ title: 'Atividades' }}
                    />
                    <Stack.Screen
                      name='OrderDetail'
                      getComponent={getOrderDetailScreen}
                      options={{ title: 'Pedido' }}
                    />
                    <Stack.Screen
                      name='Marketplace'
                      getComponent={getMarketplaceScreen}
                      options={{ title: 'Marketplace' }}
                    />
                    <Stack.Screen
                      name='ProductDetails'
                      getComponent={getProductDetailsScreen}
                      options={{ title: 'Detalhes do Produto' }}
                    />
                    <Stack.Screen
                      name='AffiliateProduct'
                      getComponent={getAffiliateProductScreen}
                      options={{ title: 'Produto Afiliado' }}
                    />
                    <Stack.Screen name='Cart' getComponent={getCartScreen} options={{ title: 'Carrinho' }} />
                    <Stack.Screen name='Checkout' getComponent={getCheckoutScreen} options={{ title: 'Checkout' }} />
                    <Stack.Screen
                      name='ProviderProfile'
                      getComponent={getProviderProfileScreen}
                      options={{ title: 'Provider Profile' }}
                    />
                    <Stack.Screen name='Profile' getComponent={getProfileScreen} options={{ title: 'Perfil' }} />
                    <Stack.Screen
                      name='UserProfileHome'
                      getComponent={getUserProfileHomeScreen}
                      options={{
                        title: t('profile.floatingMenu.myProfile', { defaultValue: 'Meu Perfil' }),
                      }}
                    />
                    <Stack.Screen
                      name='InterestCategoriesEdit'
                      getComponent={getInterestCategoriesEditScreen}
                      options={{ title: 'Categorias de Interesse' }}
                    />
                    <Stack.Screen
                      name='PersonalDataEdit'
                      getComponent={getPersonalDataEditScreen}
                      options={{ title: 'Dados Pessoais' }}
                    />
                    <Stack.Screen
                      name='SettingsAndSecurity'
                      getComponent={getSettingsAndSecurityScreen}
                      options={{
                        title: t('profile.settingsAndSecurity.title', {
                          defaultValue: 'Configurações e segurança',
                        }),
                      }}
                    />
                    <Stack.Screen
                      name='DeleteAccount'
                      getComponent={getDeleteAccountScreen}
                      options={{
                        title: t('profile.deleteAccountFlow.title', { defaultValue: 'Excluir conta' }),
                      }}
                    />
                    <Stack.Screen
                      name='ProtocolDetail'
                      getComponent={getProtocolDetailScreen}
                      options={{ title: 'Protocolo' }}
                    />
                    <Stack.Screen
                      name='SubscriptionList'
                      getComponent={getSubscriptionListScreen}
                      options={{
                        title: t('profile.acquisitionList.title', { defaultValue: 'Meus Programas e Serviços' }),
                      }}
                    />
                    <Stack.Screen
                      name='ManageProtocolSubscription'
                      getComponent={getManageProtocolSubscriptionScreen}
                      options={{
                        title: t('profile.subscriptionManage.title', { defaultValue: 'Sobre o programa' }),
                      }}
                    />
                    <Stack.Screen
                      name='CancelProtocolSubscription'
                      getComponent={getCancelProtocolSubscriptionScreen}
                      options={{
                        title: t('profile.subscriptionCancel.title', { defaultValue: 'Cancelar o programa' }),
                      }}
                    />
                    <Stack.Screen
                      name='CancelProtocolSubscriptionConfirm'
                      getComponent={getCancelProtocolSubscriptionConfirmScreen}
                      options={{
                        title: t('profile.subscriptionCancelConfirm.title', {
                          defaultValue: 'Assinatura cancelada',
                        }),
                      }}
                    />
                    <Stack.Screen
                      name='PrivacyPolicies'
                      getComponent={getPrivacyPoliciesScreen}
                      options={{ title: 'Política de Privacidade' }}
                    />
                    <Stack.Screen name='Home' getComponent={getHomeScreen} options={{ title: 'Home' }} />
                    <Stack.Screen name='Summary' getComponent={getSummaryScreen} options={{ title: 'Resumo' }} />
                    <Stack.Screen
                      name='AvatarProgress'
                      getComponent={getAvatarProgressScreen}
                      options={{ title: 'Seu Progresso' }}
                    />
                    <Stack.Screen
                      name='MarkerDetails'
                      getComponent={getMarkerDetailsScreen}
                      options={{ title: 'Detalhes do Marker' }}
                    />
                  </Stack.Navigator>
                  <Suspense fallback={null}>
                    <SupportFloatingButtonLazy />
                  </Suspense>
                </FloatingMenuProvider>
              </AdvertisersCacheProvider>
            </MarketplaceListingsCacheProvider>
          </CommunitiesCacheProvider>
        </FeedCacheProvider>
      </View>
    </NavigationContainer>
  );
};

export default RootNavigator;
