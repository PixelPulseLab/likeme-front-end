import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_FAMILY, SPACING, TYPOGRAPHY } from '@/constants';

export const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD_PLUS,
    backgroundColor: 'rgba(240, 238, 225, 0.16)',
    borderWidth: 1,
    borderColor: COLORS.NEUTRAL.LOW.MEDIUM,
    borderTopLeftRadius: BORDER_RADIUS.BUTTON_TOP,
    borderTopRightRadius: BORDER_RADIUS.BUTTON_TOP,
    borderBottomLeftRadius: BORDER_RADIUS.BUTTON_BOTTOM,
    borderBottomRightRadius: BORDER_RADIUS.BUTTON_BOTTOM,
  },
  identity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  iconWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontFamily: FONT_FAMILY.DM_SANS_MEDIUM,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.NEUTRAL.LOW.DARK,
  },
  download: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.XS,
    maxHeight: 48,
  },
  downloadLabel: {
    ...TYPOGRAPHY.labelMd,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
});
