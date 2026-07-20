import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { PrimaryButton, ButtonGroup } from '@/components/ui';
import { E2E_TEST_IDS } from '@/constants/e2eTestIds';
import { useTranslation } from '@/hooks/i18n';
import { GradientSplash2, PartialLogo, PartialLogo2 } from '@/assets/auth';
import { styles } from './UnauthenticatedStep1.styles';

interface UnauthenticatedStep1Props {
  onLogin: () => void;
  isLoading?: boolean;
  onE2eContinue?: () => void;
  e2eLoading?: boolean;
}

const UnauthenticatedStep1: React.FC<UnauthenticatedStep1Props> = ({
  onLogin,
  isLoading = false,
  onE2eContinue,
  e2eLoading = false,
}) => {
  const { t } = useTranslation();
  const { width } = Dimensions.get('window');
  const slideLeft = useRef(new Animated.Value(0)).current;
  const slideRight = useRef(new Animated.Value(width * 0.5)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideLeft, {
        toValue: -59,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(slideRight, {
        toValue: 89,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(bgOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: 420,
        delay: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideLeft, slideRight, bgOpacity, buttonsOpacity]);
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.background, { opacity: bgOpacity }]}>
        <CachedImage source={GradientSplash2} />
      </Animated.View>

      <Animated.View style={[styles.buttonContainer, { opacity: buttonsOpacity }]}>
        <ButtonGroup direction='vertical'>
          <PrimaryButton
            label={t('auth.login')}
            onPress={onLogin}
            loading={isLoading}
            disabled={isLoading || e2eLoading}
            size='large'
            testID={E2E_TEST_IDS.UNAUTH_LOGIN}
          />
          {onE2eContinue ? (
            <PrimaryButton
              label='Continuar E2E'
              onPress={onE2eContinue}
              loading={e2eLoading}
              disabled={isLoading || e2eLoading}
              size='large'
              variant='light'
              testID={E2E_TEST_IDS.UNAUTH_E2E_CONTINUE}
            />
          ) : null}
        </ButtonGroup>
      </Animated.View>

      <View style={styles.logoContainer}>
        <Animated.View style={[styles.logoOverlay, { transform: [{ translateX: slideLeft }] }]}>
          <PartialLogo width={170} height={54} />
        </Animated.View>
        <Animated.View style={[styles.logoOverlay, { transform: [{ translateX: slideRight }] }]}>
          <PartialLogo2 width={170} height={54} />
        </Animated.View>
      </View>

      <View style={styles.taglineContainer}>
        <Text style={styles.taglineText}>{t('auth.tagline')}</Text>
      </View>
    </View>
  );
};

export default UnauthenticatedStep1;
