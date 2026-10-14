import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  sheet: {
    backgroundColor: COLORS.SECONDARY.PURE,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: SPACING.SM,
    paddingBottom: SPACING.GAP_20,
    paddingHorizontal: SPACING.MD,
  },
  handle: {
    alignSelf: 'center',
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.SECONDARY.MEDIUM,
    marginBottom: SPACING.LG,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    paddingTop: SPACING.LG,
    paddingBottom: SPACING.MD,
  },
  optionLabel: {
    fontFamily: 'DM Sans',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    color: COLORS.TEXT,
    flex: 1,
  },
  optionLabelDanger: {
    color: COLORS.ERROR,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.SECONDARY.MEDIUM,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(251, 247, 229, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
});
