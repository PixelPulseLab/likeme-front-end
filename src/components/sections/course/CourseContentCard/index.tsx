import { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SecondaryButton } from '@/components/ui/buttons';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { COLORS } from '@/constants';
import { useTranslation } from '@/hooks/i18n';
import { contentSummary, type CourseContent } from '@/screens/course/course';
import { styles } from './styles';

type Props = {
  content: CourseContent;
  locked: boolean;
  onOpenContent: (contentId: string) => void;
  onLockedPress: () => void;
};

export function CourseContentCard({ content, locked, onOpenContent, onLockedPress }: Props) {
  const { t } = useTranslation();
  const headingStyle = locked ? [styles.heading, styles.headingLocked] : styles.heading;
  const summaryStyle = locked ? [styles.summary, styles.summaryLocked] : styles.summary;
  const summary = contentSummary(content.body);
  const showPlayIcon = !locked;
  const openLesson = () => onOpenContent(content.id);
  const seeMoreLabel = t('profile.courseHome.seeMore', { defaultValue: 'Ver mais' });
  const playIcon = showPlayIcon ? <Icon name='play-arrow' size={32} color={COLORS.WHITE} /> : null;
  const lockedSeeMore = (
    <Pressable onPress={onLockedPress} accessibilityRole='button'>
      <View pointerEvents='none'>
        <SecondaryButton
          label={seeMoreLabel}
          icon='chevron-right'
          disabled
          style={styles.seeMoreButton}
          onPress={() => undefined}
        />
      </View>
    </Pressable>
  );
  const openSeeMore = (
    <SecondaryButton label={seeMoreLabel} icon='chevron-right' style={styles.seeMoreButton} onPress={openLesson} />
  );
  const seeMoreButton: ReactNode = locked ? lockedSeeMore : openSeeMore;

  return (
    <View style={styles.card}>
      <View style={styles.cover}>
        {content.coverUri ? (
          <CachedImage source={{ uri: content.coverUri }} style={[styles.coverImage, locked && styles.coverLocked]} />
        ) : (
          <View style={[styles.coverImage, styles.coverFallback]} />
        )}
        {playIcon}
      </View>
      <View style={styles.copy}>
        <View>
          <View style={styles.headingRow}>
            <Text style={headingStyle}>{content.title}</Text>
            {locked ? <Icon name='lock' size={24} color={COLORS.NEUTRAL.LOW.MEDIUM} /> : null}
          </View>
          {summary ? <Text style={summaryStyle}>{summary}</Text> : null}
        </View>
        {seeMoreButton}
      </View>
    </View>
  );
}
