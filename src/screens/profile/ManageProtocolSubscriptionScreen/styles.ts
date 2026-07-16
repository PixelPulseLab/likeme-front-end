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
    paddingBottom: SPACING.XXL,
    gap: SPACING.LG,
  },
  title: {
    ...TYPOGRAPHY.title3,
    color: COLORS.TEXT,
    paddingHorizontal: SPACING.MD,
  },
  section: {
    width: '100%',
    backgroundColor: '#F0EEE1',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.GAP_20,
    gap: SPACING.GAP_20,
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
  benefitsCard: {
    backgroundColor: COLORS.PRIMARY.LIGHT,
  },
  cardTitle: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.TEXT,
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
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: COLORS.SECONDARY.MEDIUM,
  },
  benefitList: {
    width: '100%',
    gap: SPACING.SM,
    paddingLeft: SPACING.MD,
  },
  benefitItem: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT_LIGHT,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.XL,
  },
  errorText: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
    textAlign: 'center',
    paddingHorizontal: SPACING.MD,
  },
  actions: {
    width: '100%',
    gap: SPACING.MD_PLUS,
  },
  reactivateHint: {
    fontFamily: FONT_FAMILY.DM_SANS_MEDIUM,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.TEXT_LIGHT,
    textAlign: 'center',
    width: '100%',
  },
});
