import { StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, SPACING, TYPOGRAPHY } from '@/constants';

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
  header: {
    width: '100%',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.SM,
    paddingBottom: SPACING.MD,
  },
  haveAccount: {
    fontFamily: FONT_FAMILY.DM_SANS_MEDIUM,
    fontSize: 14,
    lineHeight: 18,
    color: COLORS.TEXT,
    textDecorationLine: 'underline',
  },
  photosTop: {
    width: '100%',
    aspectRatio: 393 / 99,
    marginTop: SPACING.SM,
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
    fontFamily: FONT_FAMILY.BRICOLAGE_BOLD,
    fontSize: 20.1,
    lineHeight: 24,
    color: COLORS.TEXT,
    textTransform: 'uppercase',
    fontWeight: 700,
    letterSpacing: -1,
  },
  body: {
    fontFamily: FONT_FAMILY.DM_SANS_REGULAR,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
    color: COLORS.TEXT,
  },
  footer: {
    width: '100%',
    paddingHorizontal: SPACING.MD,
    gap: SPACING.SM,
  },
});
