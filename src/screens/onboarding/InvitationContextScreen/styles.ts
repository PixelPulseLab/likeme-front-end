import { StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, SPACING, TYPOGRAPHY } from '@/constants';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: COLORS.BACKGROUND,
  },
  backgroundClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.6 }],
  },
  screenContent: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingBottom: 0,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.LG,
    paddingBottom: SPACING.LG,
  },
  content: {
    width: '100%',
    gap: SPACING.LG,
  },
  titles: {
    width: '100%',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  congratulations: {
    ...TYPOGRAPHY.displayMd,
    color: COLORS.TEXT,
    textAlign: 'center',
  },
  accessGranted: {
    ...TYPOGRAPHY.displaySm,
    color: COLORS.TEXT,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  bodyBlock: {
    width: '100%',
    gap: SPACING.SM,
  },
  body: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
    textAlign: 'center',
  },
  bodyEmphasis: {
    ...TYPOGRAPHY.bodyMd,
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    color: COLORS.TEXT,
  },
  enjoy: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
    textAlign: 'center',
  },
  error: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
    textAlign: 'center',
    paddingHorizontal: SPACING.XL,
    paddingTop: SPACING.XL,
  },
  footer: {
    width: '100%',
    paddingHorizontal: SPACING.MD,
  },
});
