import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_FAMILY, SPACING, TYPOGRAPHY } from '@/constants';

const CONTROL_SIZE = 20;
const RADIO_INNER_SIZE = 12;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingBottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.GAP_20,
  },
  content: {
    paddingTop: SPACING.LG,
    width: '100%',
    gap: SPACING.LG,
  },
  headerBlock: {
    width: '100%',
    gap: SPACING.LG,
  },
  title: {
    ...TYPOGRAPHY.title3,
    color: COLORS.TEXT,
  },
  introTexts: {
    width: '100%',
    gap: SPACING.SM,
  },
  lead: {
    fontFamily: FONT_FAMILY.DM_SANS_SEMIBOLD,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: COLORS.TEXT,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
  },
  section: {
    width: '100%',
    gap: SPACING.MD_PLUS,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: 16,
    lineHeight: 20,
    color: COLORS.TEXT,
  },
  categoryList: {
    width: '100%',
    gap: SPACING.SM,
  },
  categoryCard: {
    width: '100%',
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: COLORS.SECONDARY.MEDIUM,
    padding: SPACING.MD,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  categoryTitle: {
    flex: 1,
    paddingRight: SPACING.SM,
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.2,
    color: COLORS.TEXT,
  },
  categorySummary: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: SPACING.SM,
    gap: SPACING.SM,
  },
  categoryDescription: {
    flex: 1,
    fontFamily: FONT_FAMILY.DM_SANS_REGULAR,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.2,
    color: COLORS.TEXT,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  seeMoreLabel: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.TEXT,
  },
  categoryBody: {
    width: '100%',
    marginTop: SPACING.MD,
    gap: SPACING.MD,
  },
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: COLORS.SECONDARY.MEDIUM,
  },
  optionBlock: {
    width: '100%',
    gap: SPACING.MD_PLUS,
  },
  optionLabel: {
    fontFamily: FONT_FAMILY.DM_SANS_REGULAR,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: COLORS.TEXT,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.MD_PLUS,
    width: '100%',
  },
  optionName: {
    fontFamily: FONT_FAMILY.DM_SANS_SEMIBOLD,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.2,
    color: COLORS.TEXT,
  },
  optionHint: {
    fontFamily: FONT_FAMILY.DM_SANS_REGULAR,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.2,
    color: COLORS.TEXT,
  },
  checkbox: {
    width: CONTROL_SIZE,
    height: CONTROL_SIZE,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.TEXT,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.SECONDARY.LIGHT,
    borderColor: COLORS.PRIMARY.PURE,
  },
  checkboxLocked: {
    backgroundColor: COLORS.SECONDARY.LIGHT,
    borderColor: COLORS.NEUTRAL.LOW.MEDIUM,
  },
  radio: {
    width: CONTROL_SIZE,
    height: CONTROL_SIZE,
    borderRadius: CONTROL_SIZE / 2,
    borderWidth: 1,
    borderColor: COLORS.TEXT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: COLORS.PRIMARY.PURE,
    backgroundColor: COLORS.SECONDARY.LIGHT,
  },
  radioInner: {
    width: RADIO_INNER_SIZE,
    height: RADIO_INNER_SIZE,
    borderRadius: RADIO_INNER_SIZE / 2,
    backgroundColor: COLORS.PRIMARY.PURE,
  },
  loadErrorBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.LG,
    gap: SPACING.MD,
  },
  loadErrorText: {
    ...TYPOGRAPHY.bodyLg,
    color: COLORS.TEXT,
    textAlign: 'center',
  },
});
