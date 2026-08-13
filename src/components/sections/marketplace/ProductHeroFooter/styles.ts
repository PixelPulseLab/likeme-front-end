import { Platform, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, SPACING } from '@/constants';

const PRICE_LINE_HEIGHT = 28;
const ON_CONSULTATION_TAG_BG = '#F6DEA9';

const textVerticalAlign: { includeFontPadding?: boolean; textAlignVertical?: 'center' } =
  Platform.OS === 'android' ? { includeFontPadding: false, textAlignVertical: 'center' } : {};

export const styles = StyleSheet.create({
  heroPrice: {
    fontSize: 24,
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    color: COLORS.WHITE,
    lineHeight: PRICE_LINE_HEIGHT,
    marginTop: 0,
    paddingVertical: 0,
    ...textVerticalAlign,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: PRICE_LINE_HEIGHT,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  heroPriceSuffix: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.DM_SANS_MEDIUM,
    color: COLORS.WHITE,
    lineHeight: PRICE_LINE_HEIGHT,
    marginLeft: 8,
    paddingVertical: 0,
    ...textVerticalAlign,
  },
  onConsultationTag: {
    backgroundColor: ON_CONSULTATION_TAG_BG,
    minHeight: 36,
    paddingHorizontal: SPACING.MD,
    paddingVertical: 9,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  onConsultationTagText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.DM_SANS_MEDIUM,
    color: COLORS.TEXT,
    textAlign: 'center',
    ...textVerticalAlign,
  },
  heroFooter: {
    width: '100%',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.MD,
  },
});
