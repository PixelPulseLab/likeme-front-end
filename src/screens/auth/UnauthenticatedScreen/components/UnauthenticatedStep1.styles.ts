import { StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants';

export const LANDING_LOGO_WIDTH = 220;
export const LANDING_LOGO_HEIGHT = Math.round((LANDING_LOGO_WIDTH * 54) / 285);

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  photosTop: {
    width: '100%',
    aspectRatio: 393 / 99,
    marginTop: SPACING.XL,
  },
  photosBottom: {
    width: '100%',
    aspectRatio: 393 / 188,
    marginBottom: SPACING.LG,
  },
  copy: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.LG,
  },
  logoWrap: {
    width: LANDING_LOGO_WIDTH,
    alignItems: 'center',
  },
  texts: {
    width: LANDING_LOGO_WIDTH + 5,
    gap: SPACING.MD,
  },
  title: {
    ...TYPOGRAPHY.displaySm,
    color: COLORS.TEXT,
    textTransform: 'uppercase',
  },
  body: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
  },
  footer: {
    width: '100%',
    paddingHorizontal: SPACING.MD,
    gap: SPACING.SM,
  },
});
