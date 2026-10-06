import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { VideoPlayer } from '@/components/sections/course/VideoPlayer';
import { COLORS } from '@/constants';
import { useTranslation } from '@/hooks/i18n';
import { contentSummary, type CourseContent, type CourseModule } from '@/screens/course/course';
import { styles } from './styles';

type Props = {
  modules: CourseModule[];
  heroImageUri: string;
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

export function CourseArchive({ modules, heroImageUri, openModuleId, onOpenModule }: Props) {
  const { t } = useTranslation();
  const openModule = modules.find((courseModule) => courseModule.id === openModuleId) ?? null;

  if (openModule) {
    return (
      <View style={styles.root}>
        <View style={styles.intro}>
          <Text style={styles.kicker}>
            {t('profile.courseArchive.kicker', { defaultValue: 'Conteúdos exclusivos' })}
          </Text>
          {openModule.summary ? <Text style={styles.subtitle}>{openModule.summary}</Text> : null}
        </View>
        {openModule.contents.length === 0 ? (
          <Text style={styles.empty}>
            {t('profile.courseArchive.empty', { defaultValue: 'Nenhum conteúdo neste acervo.' })}
          </Text>
        ) : (
          <View style={styles.itemList}>
            {openModule.contents.map((content) => {
              const imageUri = contentCover(content, heroImageUri);
              const video = content.video;
              const canPlay = video?.playable === true;
              const photo = imageUri ? (
                <CachedImage source={{ uri: imageUri }} style={styles.itemPhoto} />
              ) : (
                <View style={styles.itemPhoto} />
              );
              const media =
                canPlay && video ? (
                  <VideoPlayer video={video} presentation='card' opensFullscreen title={content.title} />
                ) : (
                  <View style={styles.itemMedia}>{photo}</View>
                );
              const summary = contentSummary(content.body);
              const summaryLine = summary ? <Text style={styles.itemSummary}>{summary}</Text> : null;
              const unavailableLine =
                video && !canPlay ? (
                  <Text style={styles.unavailable}>
                    {t('profile.courseArchive.unavailable', {
                      defaultValue: 'Este vídeo ainda não está disponível.',
                    })}
                  </Text>
                ) : null;
              return (
                <View key={content.id} style={styles.itemCard}>
                  {media}
                  <View style={styles.itemCopy}>
                    <Text style={styles.itemTitle}>{content.title}</Text>
                    {summaryLine}
                    {unavailableLine}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.intro}>
        <Text style={styles.kicker}>{t('profile.courseArchive.kicker', { defaultValue: 'Conteúdos exclusivos' })}</Text>
        <Text style={styles.subtitle}>
          {t('profile.courseArchive.subtitle', {
            defaultValue: 'Reveja os encontros com a Betina quando quiser.',
          })}
        </Text>
      </View>
      {modules.length === 0 ? (
        <Text style={styles.empty}>
          {t('profile.courseArchive.empty', { defaultValue: 'Nenhum conteúdo neste acervo.' })}
        </Text>
      ) : (
        <View style={styles.typeList}>
          {modules.map((courseModule) => {
            const imageUri = moduleCover(courseModule, heroImageUri);
            const photo = imageUri ? <CachedImage source={{ uri: imageUri }} style={styles.typePhoto} /> : null;
            return (
              <Pressable
                key={courseModule.id}
                style={styles.typeCard}
                onPress={() => onOpenModule(courseModule.id)}
                accessibilityRole='button'
                accessibilityLabel={courseModule.title}
              >
                {photo}
                <LinearGradient
                  pointerEvents='none'
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.74)']}
                  style={styles.typeShade}
                />
                <View style={styles.typeRow}>
                  <Text style={styles.typeTitle}>{courseModule.title}</Text>
                  <View style={styles.typeChevron}>
                    <Icon name='chevron-right' size={22} color={COLORS.NEUTRAL.LOW.PURE} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
