import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { StackScreenProps } from '@react-navigation/stack';
import { InvitationContextBackground } from '@/assets/auth';
import { PrimaryButton } from '@/components/ui';
import { KeyboardAwareScreen, ScreenWithHeader } from '@/components/ui/layout';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { E2E_TEST_IDS } from '@/constants/e2eTestIds';
import { invitationCodeValidationI18nKey } from '@/constants/invitation/invitationCodeValidation';
import { useAnalyticsScreen, logButtonClick, logNavigation } from '@/analytics';
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

function InvitationProgramCard({
  title,
  imageUrl,
  badge,
}: {
  title: string;
  imageUrl: string | null;
  badge: string | null;
}) {
  return (
    <View style={styles.card}>
      {imageUrl ? (
        <CachedImage source={{ uri: imageUrl }} style={styles.cardImage} />
      ) : (
        <View style={styles.cardImageFallback} />
      )}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,17,55,0.7)']}
        locations={[0.3, 1]}
        style={styles.cardGradient}
      />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {title}
        </Text>
      </View>
    </View>
  );
}

const InvitationContextScreen: React.FC<Props> = ({ navigation, route }) => {
  useAnalyticsScreen({ screenName: 'InvitationContext', screenClass: 'InvitationContextScreen' });
  const { t } = useTranslation();
  const [isContinuing, setIsContinuing] = useState(false);
  const invitation = hasInvitationContext(route.params) ? route.params : null;
  const communityBadge = invitation?.community?.displayName?.trim() || null;

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
        destination_screen: 'unauthenticated',
        action_name: 'continue',
      });
      navigation.navigate('Unauthenticated', { startLogin: true });
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
      <CachedImage
        source={InvitationContextBackground}
        style={styles.background}
        contentFit='cover'
        pointerEvents='none'
      />
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
                  loading={isContinuing}
                  disabled={isContinuing}
                  size='large'
                  testID={E2E_TEST_IDS.INVITATION_CONTEXT_CONTINUE}
                />
              </View>
            }
          >
            <View style={styles.titles}>
              <Text style={styles.congratulations}>{t('invitation.congratulations')}</Text>
              <Text style={styles.accessGranted}>{t('invitation.accessGranted')}</Text>
            </View>
            <Text style={styles.body}>
              {t('invitation.contextBodyPrefix')}
              <Text style={styles.bodyEmphasis}>{invitation.program.name}</Text>
              {t('invitation.contextBodyWith')}
              <Text style={styles.bodyEmphasis}>{invitation.provider.name}</Text>
              {t('invitation.contextBodySuffix')}
            </Text>
            <Text style={styles.enjoy}>{t('invitation.contextEnjoy')}</Text>
            <InvitationProgramCard
              title={invitation.program.name}
              imageUrl={invitation.program.imageUrl}
              badge={communityBadge}
            />
            <Text style={styles.recommendedBy}>{t('invitation.recommendedBy')}</Text>
            <View style={styles.providerRow}>
              {invitation.provider.logoUrl ? (
                <CachedImage source={{ uri: invitation.provider.logoUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{invitation.provider.name.trim().charAt(0)}</Text>
                </View>
              )}
              <Text style={styles.providerName} numberOfLines={2}>
                {invitation.provider.name}
              </Text>
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
