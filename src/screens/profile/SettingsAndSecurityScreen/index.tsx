import React, { useCallback, useState } from 'react';
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { SvgProps } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PROFILE_HOME_MENU_ICONS } from '@/assets/profile';
import { GradientBackground, ScreenWithHeader } from '@/components/ui/layout';
import { useTranslation } from '@/hooks/i18n';
import { useAnalyticsScreen } from '@/analytics';
import { AuthService, userService } from '@/services';
import type { RootStackParamList } from '@/types/navigation';
import { COLORS, SPACING } from '@/constants';
import { ACCOUNT_CONFIG } from '@/config/environment';
import { logger } from '@/utils/logger';
import { rootStackNavigationFrom } from '@/utils/navigation/rootStackNavigation';
import { styles } from './styles';

const TERMS_OF_USE_URL = 'https://www.likeme.global/terms';

type Props = StackScreenProps<RootStackParamList, 'SettingsAndSecurity'>;

type SettingsMenuItem = {
  key: string;
  labelKey: string;
  labelDefault: string;
  IconComponent: React.FC<SvgProps>;
  onPress: () => void;
};

const SettingsAndSecurityScreen: React.FC<Props> = ({ navigation }) => {
  useAnalyticsScreen({ screenName: 'SettingsAndSecurity', screenClass: 'SettingsAndSecurityScreen' });
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const rootNavigation = rootStackNavigationFrom(navigation) ?? navigation;
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handlePrivacyPolicyPress = useCallback(() => {
    navigation.navigate('PrivacyPolicies');
  }, [navigation]);

  const handleTermsOfUsePress = useCallback(async () => {
    try {
      await Linking.openURL(TERMS_OF_USE_URL);
    } catch (error) {
      logger.error('[SettingsAndSecurity] Falha ao abrir Termos e Condições de Uso', {
        url: TERMS_OF_USE_URL,
        cause: error,
      });
      Alert.alert(t('common.error'), t('profile.settingsAndSecurity.termsOpenError'));
    }
  }, [t]);

  const runDeleteAccount = useCallback(async () => {
    setDeletingAccount(true);
    try {
      await userService.deleteMyAccount();
      await AuthService.logout();
      rootNavigation.reset({
        index: 0,
        routes: [{ name: 'Unauthenticated' as never }],
      });
    } catch (error) {
      logger.error('[SettingsAndSecurity] Falha ao excluir conta', { cause: error });
      const message = error instanceof Error ? error.message : t('profile.deleteAccountError');
      Alert.alert(t('profile.deleteAccountConfirmTitle'), message);
    } finally {
      setDeletingAccount(false);
    }
  }, [rootNavigation, t]);

  const handleDeleteAccountPress = useCallback(() => {
    if (deletingAccount) return;
    Alert.alert(t('profile.deleteAccountConfirmTitle'), t('profile.deleteAccountConfirmMessage'), [
      { text: t('profile.deleteAccountCancel'), style: 'cancel' },
      {
        text: t('profile.deleteAccountConfirmButton'),
        style: 'destructive',
        onPress: () => {
          void runDeleteAccount();
        },
      },
    ]);
  }, [deletingAccount, runDeleteAccount, t]);

  const handleOpenDeletionWebUrl = useCallback(async () => {
    const url = ACCOUNT_CONFIG.deletionWebUrl;
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (error) {
      logger.error('[SettingsAndSecurity] Falha ao abrir URL de exclusão de conta', { url, cause: error });
      Alert.alert(t('profile.deleteAccountConfirmTitle'), t('profile.deleteAccountError'));
    }
  }, [t]);

  const menuItems: SettingsMenuItem[] = [
    {
      key: 'privacy-policy',
      labelKey: 'profile.settingsAndSecurity.privacyPolicy',
      labelDefault: 'Política de Privacidade de Dados',
      IconComponent: PROFILE_HOME_MENU_ICONS.dataUsagePolicy,
      onPress: handlePrivacyPolicyPress,
    },
    {
      key: 'terms-of-use',
      labelKey: 'profile.settingsAndSecurity.termsOfUse',
      labelDefault: 'Termos e Condições de Uso',
      IconComponent: PROFILE_HOME_MENU_ICONS.termsOfUse,
      onPress: () => {
        void handleTermsOfUsePress();
      },
    },
    {
      key: 'delete-account',
      labelKey: 'profile.settingsAndSecurity.deleteAccount',
      labelDefault: 'Excluir Conta',
      IconComponent: PROFILE_HOME_MENU_ICONS.deleteAccount,
      onPress: handleDeleteAccountPress,
    },
  ];

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        onBackPress: handleBack,
        showBackButton: true,
        backgroundColor: COLORS.SECONDARY.LIGHT,
      }}
      contentBackgroundColor={COLORS.BACKGROUND}
      contentContainerStyle={styles.container}
    >
      <GradientBackground colors={['#958AAA', '#D8E4D6', '#F4F3EC']} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: SPACING.GAP_20 + Math.max(insets.bottom, SPACING.MD) },
        ]}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('profile.settingsAndSecurity.title', { defaultValue: 'Configurações e segurança' })}
          </Text>
          <View style={styles.menuList}>
            {menuItems.map((item) => {
              const MenuIcon = item.IconComponent;
              const isDeleting = item.key === 'delete-account' && deletingAccount;
              return (
                <View key={item.key} style={styles.menuItemBlock}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                    disabled={isDeleting}
                  >
                    <View style={styles.menuItemLeft}>
                      <MenuIcon width={30} height={26} />
                      <Text style={styles.menuItemLabel}>
                        {isDeleting ? t('profile.loading') : t(item.labelKey, { defaultValue: item.labelDefault })}
                      </Text>
                    </View>
                    <PROFILE_HOME_MENU_ICONS.chevronRight width={28} height={28} />
                  </TouchableOpacity>
                  <View style={styles.separator} />
                </View>
              );
            })}
          </View>
        </View>

        {ACCOUNT_CONFIG.deletionWebUrl ? (
          <Text onPress={() => void handleOpenDeletionWebUrl()} accessibilityRole='link' style={styles.webDeletionLink}>
            {t('profile.deleteAccountWebLinkLabel')}
          </Text>
        ) : null}
      </ScrollView>
    </ScreenWithHeader>
  );
};

export default SettingsAndSecurityScreen;
