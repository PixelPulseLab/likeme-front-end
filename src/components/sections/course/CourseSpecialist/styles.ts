import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_FAMILY, FONT_SIZES, SPACING, TYPOGRAPHY } from '@/constants';

const cardRadius = {
  borderTopLeftRadius: BORDER_RADIUS.XL,
  borderTopRightRadius: 28,
  borderBottomRightRadius: SPACING.XL,
  borderBottomLeftRadius: BORDER_RADIUS.MD,
};

export const styles = StyleSheet.create({
  section: {
    gap: SPACING.MD,
  },
  title: {
    ...TYPOGRAPHY.displaySm,
    color: COLORS.NEUTRAL.LOW.PURE,
    textTransform: 'uppercase',
  },
  card: {
    ...cardRadius,
    backgroundColor: COLORS.NEUTRAL.LOW.LIGHT,
    padding: SPACING.MD,
    gap: SPACING.MD,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  identity: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: FONT_SIZES.MD,
    lineHeight: 24,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  role: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.NEUTRAL.LOW.DARK,
  },
  profileButton: {
    alignSelf: 'flex-start',
  },
  photo: {
    height: 176,
    borderRadius: BORDER_RADIUS.XL,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: SPACING.MD,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  photoImage: {
    ...StyleSheet.absoluteFillObject,
  },
  photoFallback: {
    backgroundColor: COLORS.NEUTRAL.LOW.MEDIUM,
  },
  photoShade: {
    ...StyleSheet.absoluteFillObject,
  },
  photoCaption: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.WHITE,
  },
  talk: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.NEUTRAL.LOW.DARK,
  },
  talkLink: {
    textDecorationLine: 'underline',
  },
});
