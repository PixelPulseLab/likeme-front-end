import { useState } from 'react';
import { Linking, Modal, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { IconButton, SecondaryButton } from '@/components/ui/buttons';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { MarkdownText } from '@/components/ui/text/MarkdownText';
import { VideoPlayer } from '@/components/sections/program/VideoPlayer';
import { COLORS } from '@/constants';
import { useTranslation } from '@/hooks/i18n';
import { logger } from '@/utils/logger';
import { COURSE_MODULE_STATUS, type Course, type CourseModule, type CourseSubmodule } from './course';
import { styles } from './styles';

export type CourseLiveCard = {
  imageUri: string;
  message: string;
  whenLabel: string;
  actionLabel: string;
  onAction: () => void;
};

type Props = {
  welcomeName: string;
  description: string | null;
  course: Course;
  live: CourseLiveCard | null;
  openCourseModuleId: string | null;
  openContentId: string | null;
  onOpenCourseModule: (courseModuleId: string) => void;
  onOpenContent: (contentId: string) => void;
  onShareContent?: () => void;
};

const CONTENT_TAB = {
  ABOUT: 'about',
  MATERIALS: 'materials',
  COMMENTS: 'comments',
} as const;

type ContentTab = (typeof CONTENT_TAB)[keyof typeof CONTENT_TAB];

function contentCountLabel(count: number, t: (key: string, options?: Record<string, unknown>) => string): string {
  if (count === 1) {
    return t('profile.courseHome.lessonCountOne', { defaultValue: '1 aula' });
  }
  return t('profile.courseHome.lessonCountOther', { count, defaultValue: '{{count}} aulas' });
}

function submoduleProgressLabel(
  courseModule: CourseModule,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const completedInModule = courseModule.submodules.filter((submodule) => submodule.completed).length;
  const showsFraction = courseModule.status !== COURSE_MODULE_STATUS.LOCKED;
  if (!showsFraction) {
    return contentCountLabel(courseModule.submodules.length, t);
  }
  return t('profile.courseHome.lessonProgress', {
    completed: completedInModule,
    total: courseModule.submodules.length,
    defaultValue: '{{completed}} de {{total}}',
  });
}

function CourseProgress({ completed, total, title }: { completed: number; total: number; title?: string }) {
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

function CourseModuleCard({
  courseModule,
  onOpenCourseModule,
}: {
  courseModule: CourseModule;
  onOpenCourseModule: (courseModuleId: string) => void;
}) {
  const { t } = useTranslation();
  const isLocked = courseModule.status === COURSE_MODULE_STATUS.LOCKED;
  const orderLabel = String(courseModule.position).padStart(2, '0');
  const cardStyle = isLocked ? [styles.stageCard, styles.stageCardLocked] : styles.stageCard;

  return (
    <Pressable
      style={cardStyle}
      disabled={isLocked}
      onPress={() => onOpenCourseModule(courseModule.id)}
      accessibilityState={{ disabled: isLocked }}
    >
      <View style={styles.stageHeader}>
        <Text style={styles.stageTitle}>{courseModule.title}</Text>
        {isLocked ? <Icon name='lock' size={24} color={COLORS.NEUTRAL.LOW.PURE} /> : null}
      </View>
      <View style={styles.stageBody}>
        <View style={styles.stageOrder}>
          <Text style={styles.stageOrderNumber}>{orderLabel}</Text>
          <Text style={styles.stageOrderMeta}>{submoduleProgressLabel(courseModule, t)}</Text>
        </View>
        {courseModule.summary ? (
          <Text style={styles.stageSummary}>{courseModule.summary}</Text>
        ) : (
          <View style={styles.stageSummary} />
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

function CourseSubmoduleCard({
  submodule,
  locked,
  onOpenContent,
  onLockedPress,
}: {
  submodule: CourseSubmodule;
  locked: boolean;
  onOpenContent: (contentId: string) => void;
  onLockedPress: () => void;
}) {
  const { t } = useTranslation();
  const headingStyle = locked ? [styles.lessonHeading, styles.lessonHeadingLocked] : styles.lessonHeading;
  const summaryStyle = locked ? [styles.continueSummary, styles.lessonSummaryLocked] : styles.continueSummary;

  return (
    <View style={styles.lessonCard}>
      <View style={styles.lessonCover}>
        {submodule.content.coverUri ? (
          <CachedImage
            source={{ uri: submodule.content.coverUri }}
            style={[styles.lessonCoverImage, locked && styles.lessonCoverLocked]}
          />
        ) : (
          <View style={[styles.lessonCoverImage, styles.lessonCoverFallback]} />
        )}
        {locked ? null : <Icon name='play-arrow' size={32} color={COLORS.WHITE} />}
      </View>
      <View style={styles.lessonCopy}>
        <View>
          <View style={styles.lessonHeadingRow}>
            <Text style={headingStyle}>{submodule.title}</Text>
            {locked ? <Icon name='lock' size={24} color={COLORS.NEUTRAL.LOW.MEDIUM} /> : null}
          </View>
          {submodule.summary ? <Text style={summaryStyle}>{submodule.summary}</Text> : null}
        </View>
        {locked ? (
          <Pressable onPress={onLockedPress} accessibilityRole='button'>
            <View pointerEvents='none'>
              <SecondaryButton
                label={t('profile.courseHome.seeMore', { defaultValue: 'Ver mais' })}
                icon='chevron-right'
                disabled
                style={styles.seeMoreButton}
                onPress={() => undefined}
              />
            </View>
          </Pressable>
        ) : (
          <SecondaryButton
            label={t('profile.courseHome.seeMore', { defaultValue: 'Ver mais' })}
            icon='chevron-right'
            style={styles.seeMoreButton}
            onPress={() => onOpenContent(submodule.content.id)}
          />
        )}
      </View>
    </View>
  );
}

function CourseContent({ submodule, onShare }: { submodule: CourseSubmodule; onShare?: () => void }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<ContentTab>(CONTENT_TAB.ABOUT);
  const { content } = submodule;
  const materialAttachments = content.attachments.filter((attachment) => attachment.type !== 'video' || !content.video);

  const openMaterial = (url: string, fileName: string) => {
    const target = url.trim();
    if (!target) {
      return;
    }
    void Linking.openURL(target).catch((cause) => {
      logger.error('[CourseContent] Falha ao abrir material', { fileName, url: target, cause });
    });
  };

  return (
    <View style={styles.lessonScreen}>
      <View style={styles.lessonVideo}>
        {content.video ? (
          <VideoPlayer video={content.video} opensFullscreen />
        ) : content.coverUri ? (
          <CachedImage source={{ uri: content.coverUri }} style={styles.lessonPoster} />
        ) : null}
      </View>
      <View style={styles.lessonTitleRow}>
        <Text style={styles.lessonScreenTitle}>{content.title}</Text>
        {onShare ? <IconButton icon='share' variant='light' backgroundSize='medium' onPress={onShare} /> : null}
      </View>
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
      {tab === CONTENT_TAB.ABOUT && content.body ? (
        <MarkdownText style={styles.lessonBody} text={content.body} />
      ) : null}
      {tab === CONTENT_TAB.ABOUT && !content.body ? (
        <Text style={styles.lessonBody}>
          {t('profile.courseLesson.aboutEmpty', { defaultValue: 'Esta aula ainda não tem descrição.' })}
        </Text>
      ) : null}
      {tab === CONTENT_TAB.MATERIALS && materialAttachments.length === 0 ? (
        <Text style={styles.lessonBody}>
          {t('profile.courseLesson.materialsEmpty', { defaultValue: 'Esta aula não tem materiais.' })}
        </Text>
      ) : null}
      {tab === CONTENT_TAB.MATERIALS
        ? materialAttachments.map((attachment) => (
            <Pressable
              key={attachment.id}
              style={styles.materialRow}
              onPress={() => openMaterial(attachment.url, attachment.fileName)}
            >
              <Text style={styles.materialName}>{attachment.fileName}</Text>
            </Pressable>
          ))
        : null}
      {tab === CONTENT_TAB.COMMENTS ? (
        <Text style={styles.lessonBody}>
          {t('profile.courseLesson.commentsEmpty', { defaultValue: 'Nenhum comentário nesta aula.' })}
        </Text>
      ) : null}
    </View>
  );
}

function LockedContentNotice({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const closeLabel = t('profile.courseLesson.lockedClose', { defaultValue: 'Fechar' });

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <Pressable style={styles.lockedBackdrop} onPress={onClose} accessibilityLabel={closeLabel}>
        <Pressable style={styles.lockedCard} onPress={() => undefined}>
          <Icon name='lock-outline' size={40} color={COLORS.TEXT} />
          <Text style={styles.lockedTitle}>
            {t('profile.courseLesson.lockedTitle', { defaultValue: 'Esta aula ainda está bloqueada.' })}
          </Text>
          <Text style={styles.lockedBody}>
            {t('profile.courseLesson.lockedBody', {
              defaultValue: 'Conclua a aula anterior para continuar sua jornada.',
            })}
          </Text>
          <Pressable
            style={styles.lockedClose}
            onPress={onClose}
            accessibilityRole='button'
            accessibilityLabel={closeLabel}
          >
            <Icon name='close' size={22} color={COLORS.TEXT} />
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CourseSubmodules({
  courseModule,
  course,
  onOpenContent,
}: {
  courseModule: CourseModule;
  course: Course;
  onOpenContent: (contentId: string) => void;
}) {
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
        {courseModule.submodules.map((submodule, index) => {
          const previousIncomplete = courseModule.submodules.slice(0, index).some((item) => !item.completed);
          const isLocked =
            courseModule.status === COURSE_MODULE_STATUS.LOCKED || (previousIncomplete && !submodule.completed);
          return (
            <View key={submodule.id}>
              {index > 0 ? <View style={styles.lessonSeparator} /> : null}
              <CourseSubmoduleCard
                submodule={submodule}
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

export function CourseHome({
  welcomeName,
  description,
  course,
  live,
  openCourseModuleId,
  openContentId,
  onOpenCourseModule,
  onOpenContent,
  onShareContent,
}: Props) {
  const { t } = useTranslation();
  const openCourseModule = course.modules.find((courseModule) => courseModule.id === openCourseModuleId) ?? null;
  const openSubmodule =
    openCourseModule?.submodules.find((submodule) => submodule.content.id === openContentId) ?? null;
  const welcomeTitle = t('profile.courseHome.welcomeTitle', {
    name: welcomeName,
    defaultValue: 'Bem-vinda ao\n{{name}}',
  });

  if (openCourseModule && openSubmodule) {
    return (
      <View style={styles.root}>
        <CourseContent submodule={openSubmodule} onShare={onShareContent} />
      </View>
    );
  }

  if (openCourseModule) {
    return <CourseSubmodules courseModule={openCourseModule} course={course} onOpenContent={onOpenContent} />;
  }

  const continueContent = course.continueContent;
  const showCourseModuleTitle =
    continueContent != null && continueContent.courseModuleTitle.trim() !== continueContent.contentTitle.trim();

  return (
    <View style={styles.root}>
      <View style={styles.welcomeBlock}>
        <Text style={styles.displayTitle}>{welcomeTitle}</Text>
        {description ? <Text style={styles.welcomeBody}>{description}</Text> : null}
      </View>

      {continueContent ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {t('profile.courseHome.continueTitle', { defaultValue: 'Continue a sua jornada' })}
          </Text>
          <Pressable style={styles.continueCard} onPress={() => onOpenCourseModule(continueContent.courseModuleId)}>
            {continueContent.coverUri ? (
              <CachedImage source={{ uri: continueContent.coverUri }} style={styles.continueCover} />
            ) : (
              <View style={[styles.continueCover, { backgroundColor: COLORS.SECONDARY.MEDIUM }]} />
            )}
            <View style={styles.continueCopy}>
              <View>
                {showCourseModuleTitle ? (
                  <Text style={styles.overline}>{continueContent.courseModuleTitle}</Text>
                ) : null}
                <Text style={styles.continueTitle}>{continueContent.contentTitle}</Text>
                {continueContent.summary ? <Text style={styles.continueSummary}>{continueContent.summary}</Text> : null}
              </View>
              <SecondaryButton
                label={t('profile.courseHome.continueAction', { defaultValue: 'Continuar' })}
                icon='chevron-right'
                onPress={() => onOpenCourseModule(continueContent.courseModuleId)}
              />
            </View>
          </Pressable>
        </View>
      ) : null}

      {live ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('profile.courseHome.nextLive', { defaultValue: 'Próxima live' })}</Text>
          <View style={styles.liveRow}>
            <View style={styles.liveCoverWrap}>
              <CachedImage source={{ uri: live.imageUri }} style={styles.liveCover} />
              <SecondaryButton label={live.actionLabel} onPress={live.onAction} />
            </View>
            <View style={styles.livePanel}>
              <Icon name='videocam' size={24} color={COLORS.NEUTRAL.LOW.PURE} />
              <Text style={styles.liveMessage}>{live.message}</Text>
              {live.whenLabel ? <Text style={styles.liveWhen}>{live.whenLabel}</Text> : null}
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.journeyHeader}>
        <Text style={styles.displayTitle}>{t('profile.courseHome.journeyTitle', { defaultValue: 'Sua jornada' })}</Text>
        <Text style={styles.journeyHint}>
          {t('profile.courseHome.journeyHint', { defaultValue: 'Conclua cada etapa para liberar a próxima.' })}
        </Text>
      </View>
      <CourseProgress completed={course.completedContents} total={course.totalContents} />

      {course.modules.length > 0 ? (
        <View style={styles.stageList}>
          {course.modules.map((courseModule) => (
            <CourseModuleCard
              key={courseModule.id}
              courseModule={courseModule}
              onOpenCourseModule={onOpenCourseModule}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.journeyHint}>
          {t('profile.protocolDetail.noCourseSteps', { defaultValue: 'Nenhuma aula disponível no momento.' })}
        </Text>
      )}
    </View>
  );
}
