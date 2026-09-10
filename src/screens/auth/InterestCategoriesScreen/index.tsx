import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { View, Text, ScrollView, useWindowDimensions, Alert } from 'react-native';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { IconSilhouette, PrimaryButton, SelectionButtonQuiz } from '@/components/ui';
import { ScreenWithHeader } from '@/components/ui/layout';
import { CTACard } from '@/components/ui/cards';
import { COLORS, SPACING } from '@/constants';
import { GradientSplash6 } from '@/assets/auth';
import { AuthService, personCategoryService } from '@/services';
import { invitationProgramRouteInsteadOfHome } from '@/services/invitation/invitationService';
import { useTranslation } from '@/hooks/i18n';
import { useAnalyticsScreen, logEvent } from '@/analytics';
import { CUSTOM_EVENTS, ANALYTICS_PARAMS } from '@/analytics/constants';
import type { RootStackParamList } from '@/types/navigation';
import type { CategoryName } from '@/types/category';
import { getNextOnboardingScreen } from '@/utils';
import { logger } from '@/utils/logger';
import { useInterestCategories } from '@/hooks/interestCategories/useInterestCategories';
import { styles } from './styles';
import { getMarkerGradient } from '@/constants/markers';

type Props = StackScreenProps<RootStackParamList, 'InterestCategories'>;

const InterestCategoriesScreen: React.FC<Props> = ({ navigation, route }) => {
  useAnalyticsScreen({ screenName: 'InterestCategories', screenClass: 'InterestCategoriesScreen' });
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const firstName = route.params?.firstName || 'Usuário';
  const { categories } = useInterestCategories();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<CategoryName>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [welcomeHighlightVisible, setWelcomeHighlightVisible] = useState(true);
  const { width: windowWidth } = useWindowDimensions();

  const adornmentStyle = useMemo(() => {
    const size = windowWidth * 0.5;
    return {
      width: size,
      height: size,
      top: -size * 0.25,
    };
  }, [windowWidth]);

  useEffect(() => {
    const loadSelection = async () => {
      try {
        const categoryIds = await personCategoryService.getMySelectedCategoryIds();
        if (categoryIds.length > 0) {
          setSelectedCategoryIds(new Set(categoryIds));
        }
      } catch (error) {
        logger.error('[InterestCategoriesScreen] Falha ao carregar categorias do backend.', error);
      }
    };
    loadSelection();
  }, []);

  const toggleCategory = useCallback((categoryId: CategoryName) => {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (selectedCategoryIds.size === 0) {
      Alert.alert(t('auth.requiredField'), t('auth.objectivesSelectAtLeastOne'));
      return;
    }
    try {
      setIsSubmitting(true);
      const categoryIds = Array.from(selectedCategoryIds);
      await personCategoryService.saveMyCategories(categoryIds);
      await AuthService.refreshBackendSessionFromStoredCredentials();
      logEvent(CUSTOM_EVENTS.OBJECTIVES_SUBMITTED, {
        [ANALYTICS_PARAMS.SCREEN_NAME]: 'personal_objectives',
        [ANALYTICS_PARAMS.VALUE]: selectedCategoryIds.size,
      });
      const nextScreen = getNextOnboardingScreen('InterestCategories');
      const destination = await invitationProgramRouteInsteadOfHome(nextScreen);
      if (destination.screen === 'Home') {
        navigation.navigate(destination.screen);
        return;
      }
      navigation.replace(destination.screen as never, destination.params as never);
    } catch (error) {
      logger.error('[InterestCategoriesScreen] Falha ao salvar categorias no backend.', error);
      Alert.alert(t('common.error'), t('auth.objectivesSaveError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedCategoryIds, navigation, t]);

  const handleSkip = useCallback(async () => {
    const nextScreen = getNextOnboardingScreen('InterestCategories');
    const destination = await invitationProgramRouteInsteadOfHome(nextScreen);
    if (destination.screen === 'Home') {
      navigation.navigate(destination.screen);
      return;
    }
    navigation.replace(destination.screen as never, destination.params as never);
  }, [navigation]);

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{ onBackPress: () => navigation.goBack(), rightLabel: t('common.skip'), onRightPress: handleSkip }}
      contentContainerStyle={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent]}
      >
        <View style={styles.content}>
          <CachedImage source={GradientSplash6} style={[styles.titleAdornment, adornmentStyle]} contentFit='contain' />
          <Text style={styles.greeting}>{firstName},</Text>
          {welcomeHighlightVisible && (
            <CTACard
              title={t('auth.personalObjectivesCardTitle')}
              titleStyle={styles.highlightCardTitle}
              highlightText={t('auth.personalObjectivesCardHighlightText')}
              description={t('auth.personalObjectivesCardDescription')}
              backgroundColor={COLORS.HIGHLIGHT.LIGHT}
              style={styles.ctaCard}
              onClose={() => setWelcomeHighlightVisible(false)}
            />
          )}
          <View style={styles.instructionBlock}>
            <Text style={styles.question}>{t('auth.personalObjectivesQuestion')}</Text>
            <Text style={styles.description}>{t('auth.personalObjectivesQuestioDescription')}</Text>
          </View>

          <View style={styles.categoriesList}>
            {categories.map((category) => {
              const label = t(category.i18nKey);
              const selected = selectedCategoryIds.has(category.id);
              const gradient = getMarkerGradient(category.id);
              return (
                <SelectionButtonQuiz
                  key={category.id}
                  label={label}
                  selected={selected}
                  size='small'
                  onPress={() => toggleCategory(category.id)}
                  style={styles.categoryButton}
                  iconRight={<IconSilhouette tintColor={gradient} size='xsmall' />}
                />
              );
            })}
          </View>

          <PrimaryButton
            label={t('auth.personalObjectivesStart')}
            onPress={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
            style={styles.saveButton}
            size='large'
          />
        </View>
      </ScrollView>
    </ScreenWithHeader>
  );
};

export default InterestCategoriesScreen;
