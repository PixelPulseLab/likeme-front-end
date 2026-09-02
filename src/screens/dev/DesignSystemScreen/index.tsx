import React from 'react';
import type { StackScreenProps } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '@/components/ui/layout/GradientBackground';
import ScreenWithHeader from '@/components/ui/layout/ScreenWithHeader';
import { COLORS, SPACING } from '@/constants';
import type { RootStackParamList } from '@/types/navigation';
import { CatalogScroll } from './catalog';
import { styles } from './styles';

type Props = {
  navigation?: StackScreenProps<RootStackParamList, 'DesignSystem'>['navigation'];
};

const DesignSystemScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const bottomInset = SPACING.SECTION + Math.max(insets.bottom, SPACING.MD);

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        onBackPress: () => navigation?.goBack(),
        showBackButton: true,
        backgroundColor: COLORS.SECONDARY.LIGHT,
      }}
      contentBackgroundColor={COLORS.BACKGROUND}
      contentContainerStyle={styles.container}
      testID='design-system-screen'
    >
      <GradientBackground />
      <CatalogScroll bottomInset={bottomInset} />
    </ScreenWithHeader>
  );
};

export default DesignSystemScreen;
