import { useState, type ReactNode } from 'react';
import { Image, Linking, Modal, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { IconButton, SecondaryButton } from '@/components/ui/buttons';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { MarkdownText } from '@/components/ui/text/MarkdownText';
import PostImageFullscreenModal from '@/components/sections/community/PostAttachments/PostImageFullscreenModal';
import { VideoPlayer } from '@/components/sections/program/VideoPlayer';
import { COLORS } from '@/constants';
import { useTranslation } from '@/hooks/i18n';
import type { Attachment } from '@/types/attachment';
import { communityFileKindIconSource } from '@/utils/community/communityFileKindIconSource';
import { logger } from '@/utils/logger';
import {
  COURSE_MODULE_STATUS,
  type Course,
  type CourseContent,
  type CourseModule,
  type CourseSubmodule,
} from './course';
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

function materialSizeLabel(sizeBytes: number | undefined): string | null {
  if (sizeBytes == null || !Number.isFinite(sizeBytes) || sizeBytes < 0) {
    return null;
  }
  if (sizeBytes < 1024) {
    return `${Math.round(sizeBytes)} B`;
  }
  const kilobytes = sizeBytes / 1024;
  if (kilobytes < 1024) {
    return `${Math.max(1, Math.round(kilobytes))}kb`;
  }
  const megabytes = kilobytes / 1024;
  const rounded = megabytes >= 10 ? Math.round(megabytes) : Math.round(megabytes * 10) / 10;
  return `${rounded}mb`;
}

function lessonMaterials(content: CourseContent): Attachment[] {
  return content.attachments.filter((attachment) => attachment.type !== 'video' || !content.video);
}

function contentCountLabel(count: number, t: (key: string, options?: Record<string, unknown>) => string): string {
  if (count === 1) {
    return t('profile.courseHome.lessonCountOne', { defaultValue: '1 aula' });
  }
  return t('profile.courseHome.lessonCountOther', { count, defaultValue: '{{count}} aulas' });
}

function moduleContents(courseModule: CourseModule): CourseContent[] {
  return courseModule.submodules.flatMap((submodule) => submodule.contents);
}

function submoduleProgressLabel(
  courseModule: CourseModule,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const contents = moduleContents(courseModule);
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

function submoduleCoverUri(submodule: CourseSubmodule): string | null {
  return submodule.contents.find((content) => content.coverUri)?.coverUri ?? null;
}

function openSubmoduleLesson(submodule: CourseSubmodule, onOpenContent: (contentId: string) => void): void {
  const onlyContent = submodule.contents[0];
  if (submodule.contents.length === 1 && onlyContent) {
    onOpenContent(onlyContent.id);
  }
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
  const coverUri = submoduleCoverUri(submodule);
  const canOpen = submodule.contents.length === 1;
  const showPlayIcon = !locked && canOpen;
  const openLesson = () => openSubmoduleLesson(submodule, onOpenContent);
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
  let seeMoreButton: ReactNode = null;
  if (locked) {
    seeMoreButton = lockedSeeMore;
  } else if (canOpen) {
    seeMoreButton = openSeeMore;
  }

  return (
    <View style={styles.lessonCard}>
      <View style={styles.lessonCover}>
        {coverUri ? (
          <CachedImage
            source={{ uri: coverUri }}
            style={[styles.lessonCoverImage, locked && styles.lessonCoverLocked]}
          />
        ) : (
          <View style={[styles.lessonCoverImage, styles.lessonCoverFallback]} />
        )}
        {playIcon}
      </View>
      <View style={styles.lessonCopy}>
        <View>
          <View style={styles.lessonHeadingRow}>
            <Text style={headingStyle}>{submodule.title}</Text>
            {locked ? <Icon name='lock' size={24} color={COLORS.NEUTRAL.LOW.MEDIUM} /> : null}
          </View>
          {submodule.summary ? <Text style={summaryStyle}>{submodule.summary}</Text> : null}
        </View>
        {seeMoreButton}
      </View>
    </View>
  );
}

function CourseContent({ content, onShare }: { content: CourseContent; onShare?: () => void }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<ContentTab>(CONTENT_TAB.ABOUT);
  const [openImageUrl, setOpenImageUrl] = useState<string | null>(null);
  const materialAttachments = lessonMaterials(content);

  const openMaterial = (attachment: Attachment) => {
    const target = attachment.url.trim();
    if (!target) {
      return;
    }
    if (attachment.type === 'image') {
      setOpenImageUrl(target);
      return;
    }
    void Linking.openURL(target).catch((cause) => {
      logger.error('[CourseContent] Falha ao abrir material', { fileName: attachment.fileName, url: target, cause });
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
            <LessonMaterialCard key={attachment.id} attachment={attachment} onOpen={openMaterial} />
          ))
        : null}
      {tab === CONTENT_TAB.COMMENTS ? (
        <Text style={styles.lessonBody}>
          {t('profile.courseLesson.commentsEmpty', { defaultValue: 'Nenhum comentário nesta aula.' })}
        </Text>
      ) : null}
      <PostImageFullscreenModal
        uris={openImageUrl ? [openImageUrl] : []}
        initialIndex={0}
        visible={openImageUrl != null}
        onClose={() => setOpenImageUrl(null)}
      />
    </View>
  );
}

function LessonMaterialCard({
  attachment,
  onOpen,
}: {
  attachment: Attachment;
  onOpen: (attachment: Attachment) => void;
}) {
  const sizeLabel = materialSizeLabel(attachment.sizeBytes);
  const isImage = attachment.type === 'image' && Boolean(attachment.url.trim());
  const thumb = isImage ? (
    <CachedImage source={{ uri: attachment.url }} style={styles.materialThumb} />
  ) : (
    <View style={styles.materialIconWrap}>
      <Image source={communityFileKindIconSource(attachment.type)} style={styles.materialIcon} />
    </View>
  );

  return (
    <Pressable
      style={styles.materialCard}
      onPress={() => onOpen(attachment)}
      accessibilityRole='button'
      accessibilityLabel={attachment.fileName}
    >
      {thumb}
      <View style={styles.materialCopy}>
        <Text style={styles.materialName}>{attachment.fileName}</Text>
        {sizeLabel && <Text style={styles.materialSize}>{sizeLabel}</Text>}
      </View>
    </Pressable>
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

function contentLesson(content: CourseContent, position: number): CourseSubmodule {
  return {
    id: content.id,
    position,
    title: content.title,
    summary: null,
    completed: content.completed,
    contents: [content],
  };
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
        {courseModule.submodules.map((submodule, submoduleIndex) => {
          const previousSubmoduleIncomplete = courseModule.submodules
            .slice(0, submoduleIndex)
            .some((item) => item.contents.length > 0 && !item.completed);
          const submoduleLocked =
            courseModule.status === COURSE_MODULE_STATUS.LOCKED ||
            (previousSubmoduleIncomplete && !submodule.completed);
          const lessons =
            submodule.contents.length > 1
              ? submodule.contents.map((content, contentIndex) => contentLesson(content, contentIndex + 1))
              : [submodule];

          return lessons.map((lesson, lessonIndex) => {
            const previousContentIncomplete = submodule.contents
              .slice(0, lessonIndex)
              .some((content) => !content.completed);
            const isLocked = submoduleLocked || (lessonIndex > 0 && previousContentIncomplete && !lesson.completed);
            const showSeparator = submoduleIndex > 0 || lessonIndex > 0;
            return (
              <View key={lesson.id}>
                {showSeparator ? <View style={styles.lessonSeparator} /> : null}
                <CourseSubmoduleCard
                  submodule={lesson}
                  locked={isLocked}
                  onOpenContent={onOpenContent}
                  onLockedPress={() => setLockedNoticeOpen(true)}
                />
              </View>
            );
          });
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
  const openContent =
    openCourseModule?.submodules
      .flatMap((submodule) => submodule.contents)
      .find((content) => content.id === openContentId) ?? null;
  const welcomeTitle = t('profile.courseHome.welcomeTitle', {
    name: welcomeName,
    defaultValue: 'Bem-vinda ao\n{{name}}',
  });

  if (openCourseModule && openContent) {
    return (
      <View style={styles.root}>
        <CourseContent content={openContent} onShare={onShareContent} />
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
