import { useState } from 'react';
import { Text, View } from 'react-native';
import { CourseContentCard } from '@/components/sections/course/CourseContentCard';
import { CourseProgress } from '@/components/sections/course/CourseProgress';
import { LockedContentNotice } from '@/components/sections/course/LockedContentNotice';
import { useTranslation } from '@/hooks/i18n';
import { COURSE_MODULE_STATUS, type Course, type CourseModule } from '@/screens/course/course';
import { styles } from './styles';

type Props = {
  course: Course;
  courseModule: CourseModule;
  onOpenContent: (contentId: string) => void;
};

export function CourseModule({ course, courseModule, onOpenContent }: Props) {
  const { t } = useTranslation();
  const [lockedNoticeOpen, setLockedNoticeOpen] = useState(false);
  const orderLabel = String(courseModule.position).padStart(2, '0');
  const courseModuleTitle = `${orderLabel} - ${courseModule.title}`;

  return (
    <View style={styles.root}>
      <View style={styles.welcomeBlock}>
        <Text style={styles.displayTitle}>{courseModuleTitle}</Text>
        {courseModule.summary ? <Text style={styles.continueSummary}>{courseModule.summary}</Text> : null}
      </View>
      <CourseProgress
        completed={course.completedContents}
        total={course.totalContents}
        title={t('profile.courseHome.trackProgress', { defaultValue: 'Acompanhe sua evolução' })}
      />
      <View style={styles.lessonList}>
        {courseModule.contents.map((content, contentIndex) => {
          const previousContentIncomplete = courseModule.contents
            .slice(0, contentIndex)
            .some((item) => !item.completed);
          const isLocked =
            courseModule.status === COURSE_MODULE_STATUS.LOCKED || (previousContentIncomplete && !content.completed);
          return (
            <View key={content.id}>
              {contentIndex > 0 ? <View style={styles.lessonSeparator} /> : null}
              <CourseContentCard
                content={content}
                locked={isLocked}
                onOpenContent={onOpenContent}
                onLockedPress={() => setLockedNoticeOpen(true)}
              />
            </View>
          );
        })}
      </View>
      <LockedContentNotice visible={lockedNoticeOpen} onClose={() => setLockedNoticeOpen(false)} />
    </View>
  );
}
