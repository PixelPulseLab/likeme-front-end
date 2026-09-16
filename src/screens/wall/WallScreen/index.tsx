import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { WallInstagram, WallPortrait } from '@/assets/wall';
import { ScreenWithHeader } from '@/components/ui/layout';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { E2E_TEST_IDS } from '@/constants/e2eTestIds';
import { useAnalyticsScreen } from '@/analytics';
import { useTranslation } from '@/hooks/i18n';
import type { RootStackParamList } from '@/types/navigation';
import { logger } from '@/utils/logger';
import { styles, WALL_BACKGROUND } from './styles';

type Props = StackScreenProps<RootStackParamList, 'Wall'>;

const INSTAGRAM_URL = 'https://www.instagram.com/likeme.global';
const WEBSITE_URL = 'https://www.likeme.global';

const WallScreen: React.FC<Props> = ({ navigation }) => {
  useAnalyticsScreen({ screenName: 'Wall', screenClass: 'WallScreen' });
  const { t } = useTranslation();

  const openUrl = (url: string) => {
    void Linking.openURL(url).catch((cause) => {
      logger.error('[WallScreen] Falha ao abrir link', { url, cause });
    });
  };

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        showBackButton: false,
        onLogoPress: () => undefined,
        backgroundColor: WALL_BACKGROUND,
      }}
      contentBackgroundColor={WALL_BACKGROUND}
      contentContainerStyle={styles.container}
    >
      <View style={styles.content} testID={E2E_TEST_IDS.WALL_ROOT}>
        <CachedImage source={WallPortrait} style={styles.photo} contentFit='contain' />
        <Text style={styles.title}>{t('wall.title')}</Text>
        <Text style={styles.body}>{t('wall.body')}</Text>
        <View style={styles.links}>
          <Pressable style={styles.instagramRow} onPress={() => openUrl(INSTAGRAM_URL)}>
            <WallInstagram width={17} height={16} />
            <Text style={styles.link}>likeme.global</Text>
          </Pressable>
          <Pressable onPress={() => openUrl(WEBSITE_URL)}>
            <Text style={styles.link}>www.likeme.global</Text>
          </Pressable>
        </View>
        <Pressable style={styles.accessCode} onPress={() => navigation.navigate('InvitationCode')}>
          <Text style={styles.accessCodeLabel}>{t('wall.accessCode')}</Text>
        </Pressable>
      </View>
    </ScreenWithHeader>
  );
};

export default WallScreen;
