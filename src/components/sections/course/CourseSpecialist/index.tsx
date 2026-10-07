import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SecondaryButton } from '@/components/ui/buttons';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { useTranslation } from '@/hooks/i18n';
import { styles } from './styles';

const MALE_GENDER = 'male';

type CourseSpecialistProps = {
  name: string;
  role: string | null;
  imageUri: string | null;
  gender: string | null;
  onVisitProfile: () => void;
  onTalk: () => void;
};

function specialistFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name.trim();
}

export function CourseSpecialist({ name, role, imageUri, gender, onVisitProfile, onTalk }: CourseSpecialistProps) {
  const { t } = useTranslation();
  const displayName = name.trim();
  if (!displayName) {
    return null;
  }

  const isMasculine = gender?.trim().toLowerCase() === MALE_GENDER;
  const firstName = specialistFirstName(displayName);
  const title = isMasculine
    ? t('profile.courseHome.specialistTitleMasculine', { defaultValue: 'Seu especialista' })
    : t('profile.courseHome.specialistTitleFeminine', { defaultValue: 'Sua especialista' });
  const trajectory = isMasculine
    ? t('profile.courseHome.specialistTrajectoryMasculine', {
        name: firstName,
        defaultValue: 'Conheça a trajetória do {{name}}, seus conteúdos e outros programas disponíveis no Like:Me.',
      })
    : t('profile.courseHome.specialistTrajectoryFeminine', {
        name: firstName,
        defaultValue: 'Conheça a trajetória da {{name}}, seus conteúdos e outros programas disponíveis no Like:Me.',
      });
  const talkLabel = isMasculine
    ? t('profile.courseHome.specialistTalkMasculine', {
        name: firstName,
        defaultValue: 'Fale com o {{name}}.',
      })
    : t('profile.courseHome.specialistTalkFeminine', {
        name: firstName,
        defaultValue: 'Fale com a {{name}}.',
      });
  const visitLabel = t('profile.courseHome.specialistVisitProfile', { defaultValue: 'Visitar perfil' });
  const question = t('profile.courseHome.specialistQuestion', {
    defaultValue: 'Tem alguma dúvida sobre o programa?',
  });
  const roleLabel = role?.trim() || null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.identity}>
            <Text style={styles.name}>{displayName}</Text>
            {roleLabel ? <Text style={styles.role}>{roleLabel}</Text> : null}
          </View>
          <SecondaryButton label={visitLabel} onPress={onVisitProfile} style={styles.profileButton} />
        </View>
        <View style={styles.photo}>
          {imageUri ? (
            <CachedImage source={{ uri: imageUri }} style={styles.photoImage} />
          ) : (
            <View style={[styles.photoImage, styles.photoFallback]} />
          )}
          <LinearGradient
            pointerEvents='none'
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.74)']}
            style={styles.photoShade}
          />
          <Text style={styles.photoCaption}>{trajectory}</Text>
        </View>
        <Text style={styles.talk}>
          {question}{' '}
          <Text style={styles.talkLink} onPress={onTalk} accessibilityRole='link'>
            {talkLabel}
          </Text>
        </Text>
      </View>
    </View>
  );
}
