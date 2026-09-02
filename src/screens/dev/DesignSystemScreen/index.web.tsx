import React from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '@/components/ui/layout/GradientBackground';
import { SPACING } from '@/constants';
import { CatalogScroll } from './catalog';
import { styles } from './styles';

export default function DesignSystemScreen() {
  const insets = useSafeAreaInsets();
  const bottomInset = SPACING.SECTION + Math.max(insets.bottom, SPACING.MD);

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID='design-system-screen'>
      <GradientBackground />
      <View style={styles.catalogRoot}>
        <CatalogScroll bottomInset={bottomInset} />
      </View>
    </SafeAreaView>
  );
}
