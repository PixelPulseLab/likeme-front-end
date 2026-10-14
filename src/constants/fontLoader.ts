import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { BricolageGrotesque_400Regular, BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- TTF do MaterialIcons; expo-font espera require.
const materialIconsFont = require('react-native-vector-icons/Fonts/MaterialIcons.ttf');

/** Mapa passado para `useFonts` no App — mantém DM Sans + Bricolage alinhados ao Figma. */
export const LIKEME_FONT_LOADER_MAP = {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  BricolageGrotesque_400Regular,
  BricolageGrotesque_700Bold,
  'Material Icons': materialIconsFont,
} as const;
