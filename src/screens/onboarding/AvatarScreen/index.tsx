import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { OnboardingBodyAvatar, OnboardingMindAvatar } from '@/assets/auth';
import { PrimaryButton } from '@/components/ui';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { ScreenWithHeader } from '@/components/ui/layout';
import { COLORS } from '@/constants';
import BubbleMap from '@/components/ui/BubbleMap';
import { E2E_TEST_IDS } from '@/constants/e2eTestIds';
import { INTEREST_CATEGORIES } from '@/hooks/interestCategories/useInterestCategories';
import { useAnalyticsScreen } from '@/analytics';
import { useAuthLogin } from '@/hooks';
import { useTranslation } from '@/hooks/i18n';
import type { RootStackParamList } from '@/types/navigation';
import { CATEGORY_BUBBLE_PILLAR, CATEGORY_BUBBLE_SOURCE, PACKED_CATEGORY_BUBBLES } from './categoryBubbles';
import { styles } from './styles';

const CATEGORY_BUBBLE_I18N_KEY = Object.fromEntries(
  INTEREST_CATEGORIES.map((category) => [category.id, category.i18nKey]),
);

type Props = StackScreenProps<RootStackParamList, 'OnboardingAvatar'>;

const AVATAR_FADE_DURATION_MS = 560;
const AVATAR_ENTER_SCALE = 0.78;

const AvatarScreen: React.FC<Props> = ({ navigation }) => {
  useAnalyticsScreen({ screenName: 'OnboardingAvatar', screenClass: 'AvatarScreen' });
  const { t } = useTranslation();
  const { handleLogin, isLoading: isLoginLoading } = useAuthLogin(navigation);
  const avatarsOpacity = useRef(new Animated.Value(0)).current;
  const avatarsScale = useRef(new Animated.Value(AVATAR_ENTER_SCALE)).current;
  const titlesOpacity = useRef(new Animated.Value(1)).current;
  const categoriesOpacity = useRef(new Animated.Value(0)).current;
  const categoriesScale = useRef(new Animated.Value(AVATAR_ENTER_SCALE)).current;
  const hasStartedAvatarsFade = useRef(false);
  const isOpeningCategories = useRef(false);
  const [showCategories, setShowCategories] = useState(false);
  const canGoBack = typeof navigation.canGoBack === 'function' && navigation.canGoBack();

  useEffect(() => {
    const startAvatarsFade = () => {
      if (hasStartedAvatarsFade.current) {
        return;
      }
      hasStartedAvatarsFade.current = true;
      const timing = (value: Animated.Value, toValue: number) =>
        Animated.timing(value, {
          toValue,
          duration: AVATAR_FADE_DURATION_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        });
      Animated.parallel([timing(avatarsOpacity, 1), timing(avatarsScale, 1)]).start();
    };

    const unsubscribe = navigation.addListener('transitionEnd', (event) => {
      if (event.data.closing) {
        return;
      }
      startAvatarsFade();
    });

    return unsubscribe;
  }, [avatarsOpacity, avatarsScale, navigation]);

  const openCategoryBubbles = () => {
    if (isOpeningCategories.current || showCategories) {
      return;
    }
    isOpeningCategories.current = true;
    const timing = (value: Animated.Value, toValue: number) =>
      Animated.timing(value, {
        toValue,
        duration: AVATAR_FADE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    Animated.parallel([
      timing(avatarsOpacity, 0),
      timing(avatarsScale, AVATAR_ENTER_SCALE),
      timing(titlesOpacity, 0),
    ]).start(({ finished }) => {
      if (!finished) {
        isOpeningCategories.current = false;
        return;
      }
      setShowCategories(true);
      Animated.parallel([timing(categoriesOpacity, 1), timing(categoriesScale, 1)]).start();
    });
  };

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        showBackButton: canGoBack,
        onBackPress: canGoBack ? () => navigation.goBack() : undefined,
        onLogoPress: () => undefined,
        backgroundColor: COLORS.BACKGROUND,
      }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.content} testID={E2E_TEST_IDS.ONBOARDING_AVATAR_ROOT}>
        <Animated.View
          style={[styles.titles, { opacity: titlesOpacity }]}
          pointerEvents={showCategories ? 'none' : 'auto'}
        >
          <Text style={styles.title}>{t('invitation.avatarTitle')}</Text>
          <Text style={styles.subtitle}>{t('invitation.avatarSubtitle')}</Text>
        </Animated.View>
        <Animated.View
          style={[styles.avatars, { opacity: avatarsOpacity, transform: [{ scale: avatarsScale }] }]}
          pointerEvents={showCategories ? 'none' : 'auto'}
        >
          <Pressable
            style={styles.avatarBlock}
            onPress={openCategoryBubbles}
            testID={E2E_TEST_IDS.ONBOARDING_AVATAR_MIND}
          >
            <Text style={styles.avatarLabel}>{t('invitation.avatarMind')}</Text>
            <CachedImage source={OnboardingMindAvatar} style={styles.mindAvatar} contentFit='contain' />
          </Pressable>
          <Pressable
            style={styles.avatarBlock}
            onPress={openCategoryBubbles}
            testID={E2E_TEST_IDS.ONBOARDING_AVATAR_BODY}
          >
            <CachedImage source={OnboardingBodyAvatar} style={styles.bodyAvatar} contentFit='contain' />
            <Text style={styles.avatarLabel}>{t('invitation.avatarBody')}</Text>
          </Pressable>
        </Animated.View>
        {showCategories ? (
          <Animated.View
            style={[styles.categoryCloud, { opacity: categoriesOpacity, transform: [{ scale: categoriesScale }] }]}
          >
            <BubbleMap
              testID={E2E_TEST_IDS.ONBOARDING_AVATAR_CATEGORIES}
              bubbles={PACKED_CATEGORY_BUBBLES.map((bubble) => ({
                id: bubble.id,
                x: bubble.x,
                y: bubble.y,
                radius: bubble.radius,
                source: CATEGORY_BUBBLE_SOURCE[CATEGORY_BUBBLE_PILLAR[bubble.id]],
                label: t(CATEGORY_BUBBLE_I18N_KEY[bubble.id]),
              }))}
            />
            <View style={styles.footer}>
              <PrimaryButton
                label={t('invitation.login')}
                onPress={() => {
                  void handleLogin();
                }}
                loading={isLoginLoading}
                disabled={isLoginLoading}
                size='large'
              />
            </View>
          </Animated.View>
        ) : null}
      </View>
    </ScreenWithHeader>
  );
};

export default AvatarScreen;
