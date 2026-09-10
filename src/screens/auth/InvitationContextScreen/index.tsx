import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { InvitationContextBackground } from '@/assets/auth';
import { PartnerSection } from '@/components/sections/advertiser/PartnerSection';
import { PrimaryButton } from '@/components/ui';
import { JoinCard } from '@/components/ui/cards/JoinCard';
import { KeyboardAwareScreen, ScreenWithHeader } from '@/components/ui/layout';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { MARKETPLACE_PRODUCT_PLACEHOLDER_IMAGE_URI } from '@/constants';
import { PRODUCT_CATALOG_TYPE, catalogTypeTranslatedBadgeLabels } from '@/types/product';
import { E2E_TEST_IDS } from '@/constants/e2eTestIds';
import { invitationCodeValidationI18nKey } from '@/constants/invitation/invitationCodeValidation';
import { useAnalyticsScreen, logButtonClick, logNavigation } from '@/analytics';
import { useAuthLogin } from '@/hooks';
import { useTranslation } from '@/hooks/i18n';
import { storageService } from '@/services';
import { invitationService } from '@/services/invitation/invitationService';
import type { InvitationCodeValidationContext } from '@/types/invitation/invitation';
import type { RootStackParamList } from '@/types/navigation';
import { logger } from '@/utils/logger';
import { styles } from './styles';

type Props = StackScreenProps<RootStackParamList, 'InvitationContext'>;

function hasInvitationContext(
  params: InvitationCodeValidationContext | undefined,
): params is InvitationCodeValidationContext {
  return Boolean(
    params?.code?.trim() &&
      params.program?.id &&
      params.program.name?.trim() &&
      params.provider?.id &&
      params.provider.name?.trim(),
  );
}

const InvitationContextScreen: React.FC<Props> = ({ navigation, route }) => {
  useAnalyticsScreen({ screenName: 'InvitationContext', screenClass: 'InvitationContextScreen' });
  const { t } = useTranslation();
  const { handleLogin, isLoading: isLoginLoading } = useAuthLogin(navigation);
  const [isContinuing, setIsContinuing] = useState(false);
  const isBusy = isContinuing || isLoginLoading;
  const invitation = hasInvitationContext(route.params) ? route.params : null;
  const programImage = invitation?.program.imageUrl?.trim() || MARKETPLACE_PRODUCT_PLACEHOLDER_IMAGE_URI;
  const programTags = invitation ? catalogTypeTranslatedBadgeLabels(PRODUCT_CATALOG_TYPE.PROGRAM, t) : [];

  const goToInvitationCode = (code?: string) => {
    navigation.navigate('InvitationCode', code ? { code } : undefined);
  };

  const handleBack = () => {
    logButtonClick({
      screen_name: 'invitation_context',
      button_label: 'back',
      action_name: 'go_back',
    });
    logNavigation({
      source_screen: 'invitation_context',
      destination_screen: 'invitation_code',
      action_name: 'go_back',
    });
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    goToInvitationCode(invitation?.code);
  };

  const handleContinue = async () => {
    if (isContinuing) {
      return;
    }
    if (!invitation) {
      Alert.alert(t('invitation.contextUnavailable'));
      return;
    }

    setIsContinuing(true);
    try {
      await invitationService.validateCode(invitation.code);
      await storageService.setPendingInvitationCode(invitation.code);
      logButtonClick({
        screen_name: 'invitation_context',
        button_label: 'login',
        action_name: 'continue',
      });
      logNavigation({
        source_screen: 'invitation_context',
        destination_screen: 'authenticated',
        action_name: 'continue',
      });
      await handleLogin();
    } catch (error) {
      logger.error('[InvitationContextScreen] Falha ao revalidar código de convite', error);
      Alert.alert(t(invitationCodeValidationI18nKey(error)));
      goToInvitationCode(invitation.code);
    } finally {
      setIsContinuing(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.backgroundClip} pointerEvents='none'>
        <CachedImage
          source={InvitationContextBackground}
          style={styles.background}
          contentFit='cover'
          contentPosition={{ top: '50%', left: '50%' }}
        />
      </View>
      <ScreenWithHeader
        navigation={navigation}
        contentBackgroundColor='transparent'
        headerProps={{
          backgroundColor: 'transparent',
          onBackPress: handleBack,
          onLogoPress: () => undefined,
        }}
        contentContainerStyle={styles.screenContent}
      >
        {invitation ? (
          <KeyboardAwareScreen
            scrollContentContainerStyle={styles.scrollContent}
            includeBottomSafeAreaOnFooter
            footer={
              <View style={styles.footer}>
                <PrimaryButton
                  label={t('invitation.login')}
                  onPress={() => {
                    void handleContinue();
                  }}
                  loading={isBusy}
                  disabled={isBusy}
                  size='large'
                  testID={E2E_TEST_IDS.INVITATION_CONTEXT_CONTINUE}
                />
              </View>
            }
          >
            <View style={styles.content}>
              <View style={styles.titles}>
                <Text style={styles.congratulations}>{t('invitation.congratulations')}</Text>
                <Text style={styles.accessGranted}>{t('invitation.accessGranted')}</Text>
              </View>
              <View style={styles.bodyBlock}>
                <Text style={styles.body}>
                  {t('invitation.contextBodyPrefix')}
                  <Text style={styles.bodyEmphasis}>{invitation.program.name}</Text>
                  {t('invitation.contextBodyWith')}
                  <Text style={styles.bodyEmphasis}>{invitation.provider.name}</Text>
                  {t('invitation.contextBodySuffix')}
                </Text>
                <Text style={styles.enjoy}>{t('invitation.contextEnjoy')}</Text>
              </View>
              <JoinCard title={invitation.program.name} image={programImage} badges={programTags} />
              <PartnerSection
                recommendedByLabel={t('invitation.recommendedBy')}
                recommenders={[
                  {
                    id: invitation.provider.id,
                    name: invitation.provider.name,
                    avatar: invitation.provider.logoUrl ?? undefined,
                  },
                ]}
              />
            </View>
          </KeyboardAwareScreen>
        ) : (
          <Text style={styles.error}>{t('invitation.contextUnavailable')}</Text>
        )}
      </ScreenWithHeader>
    </View>
  );
};

export default InvitationContextScreen;
