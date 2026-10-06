import { Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { IconButton } from '@/components/ui/buttons';
import { COLORS } from '@/constants';
import { useTranslation } from '@/hooks/i18n';
import { COURSE_MODULE_STATUS, type CourseModule } from '@/screens/course/course';
import { styles } from './styles';

type Props = {
  courseModule: CourseModule;
  onOpenCourseModule: (courseModuleId: string) => void;
};

function contentCountLabel(count: number, t: (key: string, options?: Record<string, unknown>) => string): string {
  if (count === 1) {
    return t('profile.courseHome.lessonCountOne', { defaultValue: '1 aula' });
  }
  return t('profile.courseHome.lessonCountOther', { count, defaultValue: '{{count}} aulas' });
}

function lessonProgressLabel(
  courseModule: CourseModule,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const contents = courseModule.contents;
  const completedInModule = contents.filter((content) => content.completed).length;
  const showsFraction = courseModule.status !== COURSE_MODULE_STATUS.LOCKED;
  if (!showsFraction) {
    return contentCountLabel(contents.length, t);
  }
  return t('profile.courseHome.lessonProgress', {
    completed: completedInModule,
    total: contents.length,
    defaultValue: '{{completed}} de {{total}}',
  });
}

export function CourseModuleCard({ courseModule, onOpenCourseModule }: Props) {
  const { t } = useTranslation();
  const isLocked = courseModule.status === COURSE_MODULE_STATUS.LOCKED;
  const orderLabel = String(courseModule.position).padStart(2, '0');
  const cardStyle = isLocked ? [styles.card, styles.cardLocked] : styles.card;

  return (
    <Pressable
      style={cardStyle}
      disabled={isLocked}
      onPress={() => onOpenCourseModule(courseModule.id)}
      accessibilityState={{ disabled: isLocked }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{courseModule.title}</Text>
        {isLocked ? <Icon name='lock' size={24} color={COLORS.NEUTRAL.LOW.PURE} /> : null}
      </View>
      <View style={styles.body}>
        <View style={styles.order}>
          <Text style={styles.orderNumber}>{orderLabel}</Text>
          <Text style={styles.orderMeta}>{lessonProgressLabel(courseModule, t)}</Text>
        </View>
        {courseModule.summary ? (
          <Text style={styles.summary}>{courseModule.summary}</Text>
        ) : (
          <View style={styles.summary} />
        )}
        <IconButton
          icon={courseModule.status === COURSE_MODULE_STATUS.COMPLETED ? 'check' : 'play-arrow'}
          variant={isLocked ? 'light' : 'dark'}
          backgroundSize='medium'
          disabled={isLocked}
          onPress={() => onOpenCourseModule(courseModule.id)}
        />
      </View>
    </Pressable>
  );
}
