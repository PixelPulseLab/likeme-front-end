import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import LessonAwardIcon from '@/assets/course/lesson-award.svg';
import LessonBookIcon from '@/assets/course/lesson-book.svg';
import LessonCrownIcon from '@/assets/course/lesson-crown.svg';
import LessonTimerIcon from '@/assets/course/lesson-timer.svg';
import { IconButton, SecondaryButton } from '@/components/ui/buttons';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { MarkdownText } from '@/components/ui/text/MarkdownText';
import { LessonFact } from '@/components/sections/course/LessonFact';
import { LessonMaterialCard } from '@/components/sections/course/LessonMaterialCard';
import { VideoPlayer } from '@/components/sections/course/VideoPlayer';
import { useTranslation } from '@/hooks/i18n';
import type { CourseLessonCompletionParams } from '@/types/navigation';
import type { Attachment } from '@/types/attachment';
import { logger } from '@/utils/logger';
import {
  contentSummary,
  type Course,
  type CourseContent as CourseContentRecord,
  type CourseModule,
} from '@/screens/course/course';
import { styles } from './styles';

type Props = {
  course: Course;
  courseModule: CourseModule;
  content: CourseContentRecord;
  onShare?: () => void;
  onCompleteContent?: (contentId: string) => Promise<void>;
  onOpenLessonRating?: (params: CourseLessonCompletionParams) => void;
};

const CONTENT_TAB = {
  ABOUT: 'about',
  MATERIALS: 'materials',
  COMMENTS: 'comments',
} as const;

type ContentTab = (typeof CONTENT_TAB)[keyof typeof CONTENT_TAB];

function courseLessonsInOrder(course: Course): { module: CourseModule; content: CourseContentRecord }[] {
  return course.modules.flatMap((courseModule) =>
    courseModule.contents.map((content) => ({ module: courseModule, content })),
  );
}

function nextCourseLesson(
  course: Course,
  contentId: string,
): { module: CourseModule; content: CourseContentRecord } | null {
  const lessons = courseLessonsInOrder(course);
  const index = lessons.findIndex((lesson) => lesson.content.id === contentId);
  if (index < 0) {
    return null;
  }
  return lessons[index + 1] ?? null;
}

function lessonMaterials(content: CourseContentRecord): Attachment[] {
  return content.attachments.filter((attachment) => attachment.type !== 'video' || !content.video);
}

function LessonMedia({ content }: { content: CourseContentRecord }) {
  if (content.video) {
    return (
      <VideoPlayer
        video={content.video}
        presentation='lesson'
        title={content.title}
        durationMinutes={content.durationMinutes}
      />
    );
  }
  if (!content.coverUri) {
    return null;
  }
  return <CachedImage source={{ uri: content.coverUri }} style={styles.lessonPoster} />;
}

export function CourseContent({
  course,
  courseModule,
  content,
  onShare,
  onCompleteContent,
  onOpenLessonRating,
}: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<ContentTab>(CONTENT_TAB.ABOUT);
  const [completing, setCompleting] = useState(false);
  const materialAttachments = lessonMaterials(content);
  let durationLabel: string | null = null;
  if (content.durationMinutes === 1) {
    durationLabel = t('profile.courseLesson.durationOne', { defaultValue: '1 minuto' });
  } else if (content.durationMinutes != null && content.durationMinutes > 1) {
    durationLabel = t('profile.courseLesson.durationMany', {
      count: content.durationMinutes,
      defaultValue: '{{count}} minutos',
    });
  }
  const hasLessonFacts =
    durationLabel != null || Boolean(content.level) || content.learningOutcomes.length > 0 || content.tips.length > 0;

  const openLessonRating = async () => {
    if (onCompleteContent && !content.completed) {
      setCompleting(true);
      try {
        await onCompleteContent(content.id);
      } catch (cause) {
        logger.error('[CourseContent] Falha ao concluir a aula', { contentId: content.id, cause });
        return;
      } finally {
        setCompleting(false);
      }
    }
    const following = nextCourseLesson(course, content.id);
    const nextLesson = following
      ? {
          courseModuleId: following.module.id,
          contentId: following.content.id,
          moduleTitle: following.module.title,
          title: following.content.title,
          summary: contentSummary(following.content.body),
          coverUri: following.content.coverUri,
          durationMinutes: following.content.durationMinutes,
        }
      : null;
    onOpenLessonRating?.({
      moduleTitle: courseModule.title,
      coverUri: content.coverUri,
      nextLesson,
    });
  };

  return (
    <View style={styles.root}>
      <View style={styles.lessonScreen}>
        <View style={styles.lessonVideo}>
          <LessonMedia content={content} />
        </View>
        <View style={styles.lessonTitleRow}>
          <Text style={styles.lessonScreenTitle}>{content.title}</Text>
          {onShare ? <IconButton icon='share' variant='light' backgroundSize='medium' onPress={onShare} /> : null}
        </View>
        {content.body ? <MarkdownText style={styles.lessonBody} text={content.body} /> : null}
        <View style={styles.tabRow}>
          {(
            [
              [CONTENT_TAB.ABOUT, t('profile.courseLesson.about', { defaultValue: 'Sobre' })],
              [CONTENT_TAB.MATERIALS, t('profile.courseLesson.materials', { defaultValue: 'Materiais' })],
              [CONTENT_TAB.COMMENTS, t('profile.courseLesson.comments', { defaultValue: 'Comentários' })],
            ] as const
          ).map(([id, label]) => {
            const selected = tab === id;
            return (
              <Pressable key={id} style={[styles.tab, selected && styles.tabSelected]} onPress={() => setTab(id)}>
                <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        {tab === CONTENT_TAB.ABOUT && hasLessonFacts ? (
          <View style={styles.lessonFacts}>
            {durationLabel ? (
              <LessonFact
                icon={LessonTimerIcon}
                title={t('profile.courseLesson.durationTitle', { defaultValue: 'Duração' })}
                value={durationLabel}
              />
            ) : null}
            {content.level ? (
              <LessonFact
                icon={LessonAwardIcon}
                title={t('profile.courseLesson.levelTitle', { defaultValue: 'Nível' })}
                value={content.level}
              />
            ) : null}
            {content.learningOutcomes.length > 0 ? (
              <LessonFact
                icon={LessonBookIcon}
                title={t('profile.courseLesson.learningTitle', { defaultValue: 'O que você vai aprender' })}
                lines={content.learningOutcomes}
              />
            ) : null}
            {content.tips.length > 0 ? (
              <LessonFact
                icon={LessonCrownIcon}
                title={t('profile.courseLesson.tipTitle', { defaultValue: 'Dica da Betina' })}
                lines={content.tips}
              />
            ) : null}
          </View>
        ) : null}
        {tab === CONTENT_TAB.ABOUT && !content.body && !hasLessonFacts ? (
          <Text style={styles.lessonBody}>
            {t('profile.courseLesson.aboutEmpty', { defaultValue: 'Esta aula ainda não tem descrição.' })}
          </Text>
        ) : null}
        {tab === CONTENT_TAB.MATERIALS && materialAttachments.length === 0 ? (
          <Text style={styles.lessonBody}>
            {t('profile.courseLesson.materialsEmpty', { defaultValue: 'Esta aula não tem materiais.' })}
          </Text>
        ) : null}
        {tab === CONTENT_TAB.MATERIALS && materialAttachments.length > 0 ? (
          <Text style={styles.materialSectionTitle}>
            {t('community.attachments.accessMaterials', { defaultValue: 'Acesse os materiais' })}
          </Text>
        ) : null}
        {tab === CONTENT_TAB.MATERIALS
          ? materialAttachments.map((attachment) => <LessonMaterialCard key={attachment.id} attachment={attachment} />)
          : null}
        {tab === CONTENT_TAB.COMMENTS ? (
          <Text style={styles.lessonBody}>
            {t('profile.courseLesson.commentsEmpty', { defaultValue: 'Nenhum comentário nesta aula.' })}
          </Text>
        ) : null}
        {onCompleteContent ? (
          <View style={styles.lessonComplete}>
            <SecondaryButton
              label={t('profile.courseLesson.rateAction', { defaultValue: 'Avaliar aula' })}
              loading={completing}
              onPress={() => {
                void openLessonRating();
              }}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
