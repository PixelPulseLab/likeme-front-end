/* eslint-disable @typescript-eslint/no-var-requires -- TTF do MaterialIcons para a web; o loader de fonte do Expo espera require. */
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '@/constants';
import { LIKEME_FONT_LOADER_MAP } from '@/constants/fontLoader';
import DesignSystemScreen from '@/screens/dev/DesignSystemScreen';

const MATERIAL_ICONS = require('react-native-vector-icons/Fonts/MaterialIcons.ttf');

export default function DesignSystemWebApp() {
  const [fontsLoaded] = useFonts({
    ...LIKEME_FONT_LOADER_MAP,
    MaterialIcons: MATERIAL_ICONS,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={COLORS.PRIMARY.PURE} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <DesignSystemScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
});
