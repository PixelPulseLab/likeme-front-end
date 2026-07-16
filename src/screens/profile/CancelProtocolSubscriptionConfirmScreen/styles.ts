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
    gap: SPACING.GAP_20,
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    gap: SPACING.MD_PLUS,
    paddingHorizontal: SPACING.GAP_20,
  },
  heroTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.TEXT,
    textAlign: 'center',
  },
  heroDescription: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
    textAlign: 'center',
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
  noticeCard: {
    width: '100%',
    backgroundColor: COLORS.NEUTRAL.HIGH.DARK,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 24,
    padding: SPACING.LG,
  },
  noticeText: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
  },
  noticeTextBold: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.2,
    color: COLORS.TEXT,
  },
  emailCard: {
    width: '100%',
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 32,
    padding: SPACING.MD,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  emailTexts: {
    flex: 1,
    gap: SPACING.XS,
  },
  emailTitle: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
  },
  emailSubtitle: {
    fontFamily: FONT_FAMILY.DM_SANS_REGULAR,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
    color: COLORS.TEXT_LIGHT,
  },
});
