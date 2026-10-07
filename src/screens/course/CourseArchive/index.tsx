import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PlayerFullscreenIcon from '@/assets/course/player-fullscreen.svg';
import PlayerPlayIcon from '@/assets/course/player-play.svg';
import PlayerVolumeIcon from '@/assets/course/player-volume.svg';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { JoinCard } from '@/components/ui/cards/JoinCard';
import { VideoPlayer } from '@/components/sections/course/VideoPlayer';
import { COLORS } from '@/constants';
import { useTranslation } from '@/hooks/i18n';
import { contentSummary, type CourseContent, type CourseModule } from '@/screens/course/course';
import { styles } from './styles';

const ARCHIVE_CONTENT_SORT = {
  RECENT: 'recent',
  LIKED: 'liked',
} as const;

type ArchiveContentSort = (typeof ARCHIVE_CONTENT_SORT)[keyof typeof ARCHIVE_CONTENT_SORT];

type Props = {
  modules: CourseModule[];
  heroImageUri: string;
  subtitle: string;
  openModuleId: string | null;
  onOpenModule: (moduleId: string) => void;
};

function moduleCover(courseModule: CourseModule, fallback: string): string {
  const cover = courseModule.contents.find((content) => content.coverUri)?.coverUri?.trim();
  return cover || fallback;
}

function contentCover(content: CourseContent, fallback: string): string {
  return content.coverUri?.trim() || content.video?.posterUrl?.trim() || fallback;
}

function contentTime(content: CourseContent): number {
  const time = content.createdAt ? Date.parse(content.createdAt) : Number.NaN;
  return Number.isNaN(time) ? 0 : time;
}

function archiveContentDate(createdAt: string | null): string | null {
  if (!createdAt) {
    return null;
  }
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', '').toUpperCase();
  return `${date.getDate()} ${month} ${date.getFullYear()}`;
}

function contentsInSort(contents: CourseContent[], sort: ArchiveContentSort): CourseContent[] {
  if (sort === ARCHIVE_CONTENT_SORT.LIKED) {
    return contents;
  }
  return [...contents].sort((left, right) => contentTime(right) - contentTime(left));
}

export function CourseArchive({ modules, heroImageUri, subtitle, openModuleId, onOpenModule }: Props) {
  const { t } = useTranslation();
  const [sort, setSort] = useState<ArchiveContentSort>(ARCHIVE_CONTENT_SORT.RECENT);
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);
  const [playingContentId, setPlayingContentId] = useState<string | null>(null);
  const openModule = modules.find((courseModule) => courseModule.id === openModuleId) ?? null;
  const isRecentSort = sort === ARCHIVE_CONTENT_SORT.RECENT;

  useEffect(() => {
    setPlayingContentId(null);
    setModuleMenuOpen(false);
  }, [openModuleId]);

  if (openModule) {
    const orderedContents = contentsInSort(openModule.contents, sort);
    const playingContent = orderedContents.find((content) => content.id === playingContentId) ?? null;
    const playingVideo = playingContent?.video?.playable ? playingContent.video : null;
    const recentChipStyle = isRecentSort ? styles.sortChipSelected : styles.sortChip;
    const likedChipStyle = isRecentSort ? styles.sortChip : styles.sortChipSelected;
    const recentLabelStyle = isRecentSort ? styles.sortChipLabelSelected : styles.sortChipLabel;
    const likedLabelStyle = isRecentSort ? styles.sortChipLabel : styles.sortChipLabelSelected;
    const contentList =
      orderedContents.length === 0 ? (
        <Text style={styles.empty}>
          {t('profile.courseArchive.empty', { defaultValue: 'Nenhum conteúdo neste acervo.' })}
        </Text>
      ) : (
        <View style={styles.typeList}>
          {orderedContents.map((content) => {
            const imageUri = contentCover(content, heroImageUri);
            const video = content.video;
            const canPlay = video?.playable === true;
            const photo = imageUri ? <CachedImage source={{ uri: imageUri }} style={styles.typePhoto} /> : null;
            const dateLabel = archiveContentDate(content.createdAt);
            const dateLine = dateLabel ? <Text style={styles.contentDate}>{dateLabel}</Text> : <View />;
            let durationText: string | null = null;
            if (content.durationMinutes === 1) {
              durationText = t('profile.courseLesson.durationOne', { defaultValue: '1 minuto' });
            } else if (content.durationMinutes != null && content.durationMinutes > 1) {
              durationText = t('profile.courseLesson.durationMany', {
                count: content.durationMinutes,
                defaultValue: '{{count}} minutos',
              });
            }
            const durationBadge = durationText ? (
              <View style={styles.contentBadge}>
                <Text style={styles.contentBadgeText}>{durationText}</Text>
              </View>
            ) : null;
            const summary = contentSummary(content.body);
            const summaryLine = summary ? <Text style={styles.contentSummary}>{summary}</Text> : null;
            const unavailableLine =
              video && !canPlay ? (
                <Text style={styles.contentSummary}>
                  {t('profile.courseArchive.unavailable', {
                    defaultValue: 'Este vídeo ainda não está disponível.',
                  })}
                </Text>
              ) : null;
            const playButton = canPlay ? (
              <Pressable
                style={styles.contentPlay}
                onPress={() => setPlayingContentId(content.id)}
                accessibilityRole='button'
                accessibilityLabel={t('course.video.play', { defaultValue: 'Reproduzir vídeo' })}
              >
                <View style={styles.contentPlayIcon}>
                  <PlayerPlayIcon />
                </View>
              </Pressable>
            ) : null;
            return (
              <View key={content.id} style={styles.contentCard}>
                <View style={styles.contentMedia} pointerEvents='none'>
                  {photo}
                  <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.74)']} style={styles.typeShade} />
                </View>
                <View style={styles.contentTop} pointerEvents='none'>
                  <PlayerVolumeIcon />
                  <PlayerFullscreenIcon />
                </View>
                {playButton}
                <View style={styles.contentFooter}>
                  <View style={styles.contentMeta}>
                    {dateLine}
                    {durationBadge}
                  </View>
                  <Text style={styles.contentTitle}>{content.title}</Text>
                  {summaryLine}
                  {unavailableLine}
                </View>
              </View>
            );
          })}
        </View>
      );
    const moduleMenu = moduleMenuOpen ? (
      <View style={styles.moduleMenu}>
        {modules.map((courseModule) => {
          const isCurrent = courseModule.id === openModule.id;
          const itemStyle = isCurrent ? styles.moduleMenuItemSelected : styles.moduleMenuItem;
          const labelStyle = isCurrent ? styles.moduleMenuLabelSelected : styles.moduleMenuLabel;
          return (
            <Pressable
              key={courseModule.id}
              style={itemStyle}
              onPress={() => {
                setModuleMenuOpen(false);
                onOpenModule(courseModule.id);
              }}
              accessibilityRole='button'
              accessibilityLabel={courseModule.title}
            >
              <Text style={labelStyle}>{courseModule.title}</Text>
            </Pressable>
          );
        })}
      </View>
    ) : null;
    const player = playingVideo ? (
      <VideoPlayer
        video={playingVideo}
        opensFullscreen
        startOpen
        title={playingContent?.title}
        onClose={() => setPlayingContentId(null)}
      />
    ) : null;

    return (
      <View style={styles.listRoot}>
        <View style={styles.listIntro}>
          <Text style={styles.listTitle}>{openModule.title}</Text>
          <Text style={styles.listSubtitle}>{subtitle}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <Pressable
            style={styles.moduleChip}
            onPress={() => setModuleMenuOpen((open) => !open)}
            accessibilityRole='button'
            accessibilityLabel={openModule.title}
          >
            <Text style={styles.moduleChipLabel}>{openModule.title}</Text>
            <Icon name='keyboard-arrow-down' size={18} color={COLORS.PRIMARY.PURE} />
          </Pressable>
          <Pressable
            style={recentChipStyle}
            onPress={() => setSort(ARCHIVE_CONTENT_SORT.RECENT)}
            accessibilityRole='button'
            accessibilityState={{ selected: isRecentSort }}
          >
            <Text style={recentLabelStyle}>
              {t('profile.courseArchive.sortRecent', { defaultValue: 'Mais recentes' })}
            </Text>
          </Pressable>
          <Pressable
            style={likedChipStyle}
            onPress={() => setSort(ARCHIVE_CONTENT_SORT.LIKED)}
            accessibilityRole='button'
            accessibilityState={{ selected: !isRecentSort }}
          >
            <Text style={likedLabelStyle}>
              {t('profile.courseArchive.sortLiked', { defaultValue: 'Mais curtidas' })}
            </Text>
          </Pressable>
        </ScrollView>
        {moduleMenu}
        {contentList}
        {player}
      </View>
    );
  }

  const emptyList =
    modules.length === 0 ? (
      <Text style={styles.empty}>
        {t('profile.courseArchive.empty', { defaultValue: 'Nenhum conteúdo neste acervo.' })}
      </Text>
    ) : (
      <View style={styles.typeList}>
        {modules.map((courseModule) => (
          <JoinCard
            key={courseModule.id}
            title={courseModule.title}
            badges={[]}
            image={moduleCover(courseModule, heroImageUri)}
            onPress={() => onOpenModule(courseModule.id)}
            blur={false}
          />
        ))}
      </View>
    );

  return (
    <View style={styles.listRoot}>
      <View style={styles.listIntro}>
        <Text style={styles.listTitle}>
          {t('profile.courseArchive.kicker', { defaultValue: 'Conteúdos exclusivos' })}
        </Text>
        <Text style={styles.listSubtitle}>{subtitle}</Text>
      </View>
      {emptyList}
    </View>
  );
}
