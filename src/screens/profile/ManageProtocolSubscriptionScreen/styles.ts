import { Platform, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, SPACING, TYPOGRAPHY } from '@/constants';

const SECTION_BACKGROUND = '#F0EEE1';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 0,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: SPACING.LG,
    paddingBottom: SPACING.XXL,
    gap: SPACING.LG,
  },
  title: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: 20,
    lineHeight: 24,
    color: COLORS.TEXT,
    paddingHorizontal: SPACING.MD,
  },
  section: {
    width: '100%',
    backgroundColor: SECTION_BACKGROUND,
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
    lineHeight: 20,
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
    fontFamily: FONT_FAMILY.DM_SANS_REGULAR,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.2,
    color: COLORS.TEXT,
  },
  fieldValue: {
    fontFamily: FONT_FAMILY.DM_SANS_REGULAR,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: COLORS.TEXT_LIGHT,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    backgroundColor: COLORS.SECONDARY.MEDIUM,
  },
  benefitList: {
    width: '100%',
    gap: SPACING.XS,
    paddingLeft: SPACING.XS,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.SM,
    paddingLeft: SPACING.XS,
  },
  benefitBullet: {
    fontFamily: FONT_FAMILY.DM_SANS_REGULAR,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: COLORS.TEXT_LIGHT,
    width: 14,
  },
  benefitItem: {
    flex: 1,
    fontFamily: FONT_FAMILY.DM_SANS_REGULAR,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.2,
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
  cancelButton: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(240, 238, 225, 0.16)',
    borderColor: COLORS.TEXT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    minHeight: 48,
    paddingVertical: 12,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
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
