import { StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, SPACING, TYPOGRAPHY } from '@/constants';

/** Espaço entre header e título — Figma `View_recomendados` (title y=153, header h=112). */
const TITLE_MARGIN_TOP = 40;
const AVATAR_WIDTH = 39;
const AVATAR_HEIGHT = 36;

export const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.MD,
    paddingTop: TITLE_MARGIN_TOP,
    paddingBottom: SPACING.XXL,
  },
  title: {
    fontFamily: FONT_FAMILY.DM_SANS_MEDIUM,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    color: COLORS.NEUTRAL.LOW.PURE,
    marginBottom: SPACING.MD,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.SM,
    paddingVertical: 10,
    paddingHorizontal: SPACING.MD,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  avatar: {
    width: AVATAR_WIDTH,
    height: AVATAR_HEIGHT,
    borderRadius: AVATAR_HEIGHT / 2,
    overflow: 'hidden',
    backgroundColor: COLORS.NEUTRAL.LOW.LIGHT,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.NEUTRAL.LOW.LIGHT,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  specialty: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.NEUTRAL.LOW.DARK,
  },
  profileButton: {
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  itemSeparator: {
    height: SPACING.SM,
  },
  empty: {
    paddingVertical: SPACING.XL,
  },
  emptyText: {
    fontFamily: FONT_FAMILY.DM_SANS_REGULAR,
    fontSize: 14,
    color: COLORS.NEUTRAL.LOW.DARK,
  },
  loading: {
    paddingVertical: SPACING.XL,
    alignItems: 'center',
  },
});
