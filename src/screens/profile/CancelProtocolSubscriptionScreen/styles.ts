import { StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, SPACING, TYPOGRAPHY } from '@/constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: SPACING.LG,
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.XXL,
    gap: SPACING.LG,
  },
  title: {
    ...TYPOGRAPHY.title3,
    color: COLORS.TEXT,
  },
  reasonSection: {
    width: '100%',
    gap: SPACING.MD_PLUS,
  },
  reasonTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: SPACING.XS,
  },
  reasonTitle: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.TEXT,
  },
  reasonOptional: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT_LIGHT,
  },
  reasonList: {
    width: '100%',
    gap: SPACING.SM,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MD_PLUS,
    padding: SPACING.MD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.SECONDARY.MEDIUM,
    backgroundColor: COLORS.WHITE,
  },
  reasonOptionSelected: {
    borderColor: COLORS.PRIMARY.PURE,
    backgroundColor: COLORS.SECONDARY.LIGHT,
  },
  reasonRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.TEXT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.WHITE,
  },
  reasonRadioSelected: {
    borderColor: COLORS.PRIMARY.PURE,
    padding: 4,
  },
  reasonRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.PRIMARY.PURE,
  },
  reasonLabel: {
    flex: 1,
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 32,
    padding: SPACING.MD,
    gap: SPACING.GAP_20,
  },
  cardTitle: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.TEXT,
  },
  consequenceList: {
    width: '100%',
    gap: SPACING.MD_PLUS,
  },
  consequenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
    width: '100%',
  },
  consequenceText: {
    flex: 1,
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
  },
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: COLORS.SECONDARY.MEDIUM,
  },
  fieldList: {
    width: '100%',
    gap: SPACING.MD_PLUS,
  },
  fieldBlock: {
    width: '100%',
    gap: SPACING.XS,
  },
  fieldLabel: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
  },
  fieldValue: {
    fontFamily: FONT_FAMILY.DM_SANS_REGULAR,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
    color: COLORS.TEXT_LIGHT,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: SPACING.MD,
    width: '100%',
  },
  actionPrimary: {
    flex: 1,
  },
  actionSecondary: {
    flexShrink: 0,
  },
});
