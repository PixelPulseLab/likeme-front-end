import { useState, type FC } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import LessonCheckIcon from '@/assets/course/lesson-check.svg';
import LessonStarIcon from '@/assets/course/lesson-star.svg';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { ScreenWithHeader } from '@/components/ui/layout';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { useAnalyticsScreen } from '@/analytics';
import { COLORS } from '@/constants';
import { useTranslation } from '@/hooks/i18n';
import type { ProtocolCourseFocus, RootStackParamList } from '@/types/navigation';
import { styles } from './styles';

type Props = StackScreenProps<RootStackParamList, 'CourseLessonCompletion'>;

const LESSON_RATING_SCORES = [1, 2, 3, 4, 5] as const;

function nextLessonOverline(
  moduleTitle: string,
  durationMinutes: number | null,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const title = moduleTitle.trim().toUpperCase();
  if (durationMinutes === 1) {
    const duration = t('profile.courseLesson.durationOne', { defaultValue: '1 minuto' });
    return `${title} • ${duration}`;
  }
  if (durationMinutes != null && durationMinutes > 1) {
    const duration = t('profile.courseLesson.durationMany', {
      count: durationMinutes,
      defaultValue: '{{count}} minutos',
    });
    return `${title} • ${duration}`;
  }
  return title;
}

const CourseLessonCompletionScreen: FC<Props> = ({ navigation, route }) => {
  useAnalyticsScreen({
    screenName: 'CourseLessonCompletion',
    screenClass: 'CourseLessonCompletionScreen',
  });
  const { t } = useTranslation();
  const { moduleTitle, coverUri, nextLesson } = route.params;
  const [score, setScore] = useState<number | null>(null);
  const congrats = t('profile.courseLesson.rateCongrats', {
    defaultValue: 'Parabéns! Você concluiu mais uma aula do seu programa.',
  });
  const rateHelp = t('profile.courseLesson.rateHelp', {
    defaultValue: 'Sua avaliação nos ajuda\na melhorar os conteúdos do programa.',
  });
  const nextOverline = nextLesson ? nextLessonOverline(nextLesson.moduleTitle, nextLesson.durationMinutes, t) : null;
  const nextCover = nextLesson?.coverUri ? (
    <CachedImage source={{ uri: nextLesson.coverUri }} style={styles.nextCover} />
  ) : (
    <View style={[styles.nextCover, { backgroundColor: COLORS.SECONDARY.MEDIUM }]} />
  );

  const focusProtocol = (courseFocus: ProtocolCourseFocus) => {
    const protocolRoute = navigation.getState().routes.find((item) => item.name === 'ProtocolDetail');
    const current = protocolRoute?.params as RootStackParamList['ProtocolDetail'] | undefined;
    if (!current) {
      navigation.goBack();
      return;
    }
    navigation.navigate('ProtocolDetail', { ...current, courseFocus });
  };

  const continueToNext = () => {
    if (!nextLesson) {
      focusProtocol({ token: Date.now(), kind: 'home' });
      return;
    }
    focusProtocol({
      token: Date.now(),
      kind: 'lesson',
      courseModuleId: nextLesson.courseModuleId,
      contentId: nextLesson.contentId,
    });
  };

  const backHome = () => {
    focusProtocol({ token: Date.now(), kind: 'home' });
  };

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        showBackButton: true,
        onBackPress: () => navigation.goBack(),
        customLogo: (
          <Text style={styles.headerTitle} numberOfLines={1}>
            {moduleTitle}
          </Text>
        ),
      }}
      contentContainerStyle={styles.container}
      contentBackgroundColor={COLORS.BACKGROUND}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {coverUri ? <CachedImage source={{ uri: coverUri }} style={styles.cover} /> : null}
        <View style={styles.status}>
          <LessonCheckIcon />
          <Text style={styles.statusTitle}>
            {t('profile.courseLesson.completed', { defaultValue: 'Aula concluída' })}
          </Text>
        </View>
        <Text style={styles.statusBody}>{congrats}</Text>
        <View style={styles.prompt}>
          <Text style={styles.promptTitle}>
            {t('profile.courseLesson.rateTitle', { defaultValue: 'Avalie sua aula' })}
          </Text>
          <Text style={styles.promptBody}>{rateHelp}</Text>
        </View>
        <View style={styles.scale}>
          {LESSON_RATING_SCORES.map((value) => {
            const isFilled = score != null && value <= score;
            const starColor = isFilled ? COLORS.NEUTRAL.LOW.PURE : 'transparent';
            return (
              <Pressable
                key={value}
                style={styles.score}
                onPress={() => setScore(value)}
                accessibilityRole='button'
                accessibilityLabel={String(value)}
              >
                <LessonStarIcon color={starColor} />
                <Text style={styles.scoreLabel}>{value}</Text>
              </Pressable>
            );
          })}
        </View>
        {nextLesson && nextOverline ? (
          <View style={styles.next}>
            <Text style={styles.nextLabel}>
              {t('profile.courseLesson.nextLesson', { defaultValue: 'Próxima aula' })}
            </Text>
            <Pressable style={styles.nextCard} onPress={continueToNext}>
              {nextCover}
              <View style={styles.nextCopy}>
                <Text style={styles.nextOverline}>{nextOverline}</Text>
                <Text style={styles.nextTitle}>{nextLesson.title}</Text>
                {nextLesson.summary ? <Text style={styles.nextSummary}>{nextLesson.summary}</Text> : null}
              </View>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.actions}>
          <PrimaryButton
            label={t('profile.courseLesson.rateAndNext', { defaultValue: 'Avaliar e ir para o próximo' })}
            size='large'
            onPress={continueToNext}
          />
          <SecondaryButton
            label={t('profile.courseLesson.backToHome', { defaultValue: 'Voltar para a home' })}
            size='large'
            onPress={backHome}
          />
        </View>
      </ScrollView>
    </ScreenWithHeader>
  );
};

export default CourseLessonCompletionScreen;
