import { Text, View } from 'react-native';
import { useTranslation } from '@/hooks/i18n';
import { styles } from './styles';

export function CourseProgress({ completed, total, title }: { completed: number; total: number; title?: string }) {
  const { t } = useTranslation();
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const fillStyle = { width: `${percent}%` as `${number}%` };
  const isComplete = total > 0 && completed >= total;
  const progressTitle =
    title ??
    (isComplete
      ? t('profile.courseHome.progressComplete', { defaultValue: 'Concluído' })
      : t('profile.courseHome.progressInProgress', { defaultValue: 'Em andamento' }));
  const countLabel = t('profile.courseHome.courseProgressCount', {
    completed,
    total,
    defaultValue: '{{completed}} de {{total}} aulas',
  });

  return (
    <View style={styles.progressBlock}>
      <Text style={styles.progressTitle}>{progressTitle}</Text>
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, fillStyle]} />
        </View>
        <Text style={styles.progressPercent}>{`${percent}%`}</Text>
      </View>
      <Text style={styles.progressCount}>{countLabel}</Text>
    </View>
  );
}
