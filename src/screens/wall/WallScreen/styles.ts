import { StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, SPACING } from '@/constants';

export const WALL_BACKGROUND = '#F6DEA9';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WALL_BACKGROUND,
    paddingBottom: 0,
  },
  content: {
    flex: 1,
  },
  photo: {
    position: 'absolute',
    left: 0,
    top: SPACING.MD,
    height: '86%',
    aspectRatio: 227 / 659,
  },
  title: {
    position: 'absolute',
    top: 88,
    left: '37%',
    width: 220,
    height: 206,
    fontFamily: FONT_FAMILY.BRICOLAGE_BOLD,
    fontSize: 26,
    lineHeight: 30.5,
    color: COLORS.TEXT,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  body: {
    position: 'absolute',
    top: 299,
    left: '58%',
    width: 129,
    fontFamily: FONT_FAMILY.DM_SANS_MEDIUM,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.TEXT,
  },
  links: {
    position: 'absolute',
    top: 437,
    left: '58%',
    gap: 6,
  },
  instagramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  link: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: 12,
    lineHeight: 22,
    letterSpacing: 0.2,
    color: COLORS.TEXT,
  },
  accessCode: {
    position: 'absolute',
    top: 604,
    left: '64%',
    width: 90,
    fontFamily: FONT_FAMILY.DM_SANS_MEDIUM,
    fontSize: 14,
    lineHeight: 18,
    color: COLORS.TEXT,
    textDecorationLine: 'underline',
  },
});
