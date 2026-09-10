import React from 'react';
import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LandingPhotosBottom, LandingPhotosTop, LogoFullSvg } from '@/assets/auth';
import { PrimaryButton } from '@/components/ui';
import { E2E_TEST_IDS } from '@/constants/e2eTestIds';
import { useTranslation } from '@/hooks/i18n';
import { LANDING_LOGO_HEIGHT, LANDING_LOGO_WIDTH, styles } from './UnauthenticatedStep1.styles';

interface UnauthenticatedStep1Props {
  onStart: () => void;
  isLoading?: boolean;
  isStartDisabled?: boolean;
  onE2eContinue?: () => void;
  e2eLoading?: boolean;
}

const UnauthenticatedStep1: React.FC<UnauthenticatedStep1Props> = ({
  onStart,
  isLoading = false,
  isStartDisabled = false,
  onE2eContinue,
  e2eLoading = false,
}) => {
  const { t } = useTranslation();
  const startBusy = isLoading || e2eLoading || isStartDisabled;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.root}>
        <Image source={LandingPhotosTop} style={styles.photosTop} resizeMode='cover' accessible={false} />
        <View style={styles.copy}>
          <View style={styles.logoWrap} accessible accessibilityRole='image' accessibilityLabel='LIKE:ME'>
            <LogoFullSvg width={LANDING_LOGO_WIDTH} height={LANDING_LOGO_HEIGHT} />
          </View>
          <View style={styles.texts}>
            <Text style={styles.title}>{t('auth.landingTitle')}</Text>
            <Text style={styles.body}>{t('auth.landingBody')}</Text>
          </View>
        </View>
        <Image source={LandingPhotosBottom} style={styles.photosBottom} resizeMode='cover' accessible={false} />
        <View style={styles.footer}>
          <PrimaryButton
            label={t('invitation.start')}
            onPress={onStart}
            loading={isLoading}
            disabled={startBusy}
            size='large'
            testID={E2E_TEST_IDS.UNAUTH_LOGIN}
          />
          {onE2eContinue ? (
            <PrimaryButton
              label='Continuar E2E'
              onPress={onE2eContinue}
              loading={e2eLoading}
              disabled={startBusy}
              size='large'
              variant='light'
              testID={E2E_TEST_IDS.UNAUTH_E2E_CONTINUE}
            />
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default UnauthenticatedStep1;
