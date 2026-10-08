import { Modal, Pressable, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '@/constants';
import { useTranslation } from '@/hooks/i18n';
import { styles } from './styles';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function LockedContentNotice({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const closeLabel = t('profile.courseLesson.lockedClose', { defaultValue: 'Fechar' });

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={closeLabel}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <Icon name='lock-outline' size={40} color={COLORS.TEXT} />
          <Text style={styles.title}>
            {t('profile.courseLesson.lockedTitle', { defaultValue: 'Esta aula ainda está bloqueada.' })}
          </Text>
          <Text style={styles.body}>
            {t('profile.courseLesson.lockedBody', {
              defaultValue: 'Conclua a aula anterior para continuar sua jornada.',
            })}
          </Text>
          <Pressable style={styles.close} onPress={onClose} accessibilityRole='button' accessibilityLabel={closeLabel}>
            <Icon name='close' size={22} color={COLORS.TEXT} />
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
