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
    paddingHorizontal: SPACING.GAP_20,
    paddingBottom: SPACING.GAP_20,
    gap: SPACING.MD,
  },
  title: {
    ...TYPOGRAPHY.title3,
    color: COLORS.TEXT,
  },
  overviewBody: {
    flexGrow: 1,
    gap: SPACING.XL,
    width: '100%',
  },
  description: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
  },
  removedList: {
    flexGrow: 1,
    width: '100%',
  },
  removedItemBlock: {
    gap: SPACING.MD_PLUS,
    width: '100%',
  },
  removedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.MD_PLUS,
    width: '100%',
  },
  removedItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MD_PLUS,
    flexShrink: 1,
  },
  removedItemLabel: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
    flexShrink: 1,
  },
  removedItemStatus: {
    ...TYPOGRAPHY.bodySm,
    lineHeight: 16,
    color: COLORS.TEXT_LIGHT,
  },
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: COLORS.SECONDARY.MEDIUM,
  },
  disclaimerBox: {
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    borderRadius: 12,
    padding: SPACING.MD,
    gap: SPACING.SM,
  },
  disclaimerText: {
    fontFamily: FONT_FAMILY.DM_SANS_SEMIBOLD,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.TEXT,
  },
  recoveryText: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT_LIGHT,
  },
  reasonTitle: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.TEXT,
  },
  reasonList: {
    gap: SPACING.SM,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    paddingVertical: SPACING.SM,
  },
  reasonOptionSelected: {
    opacity: 1,
  },
  reasonRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.TEXT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.TEXT,
  },
  reasonLabel: {
    flex: 1,
    fontFamily: FONT_FAMILY.DM_SANS_MEDIUM,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.TEXT,
  },
  actions: {
    gap: SPACING.SM,
    marginTop: 'auto',
    width: '100%',
  },
  confirmInput: {
    borderWidth: 1,
    borderColor: COLORS.SECONDARY.MEDIUM,
    borderRadius: 12,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    fontFamily: FONT_FAMILY.DM_SANS_REGULAR,
    fontSize: 16,
    color: COLORS.TEXT,
    backgroundColor: COLORS.WHITE,
  },
  modalInstruction: {
    ...TYPOGRAPHY.bodyMd,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.TEXT,
    marginBottom: SPACING.MD,
  },
});
