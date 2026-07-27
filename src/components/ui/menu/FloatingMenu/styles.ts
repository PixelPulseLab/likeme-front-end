import { COLORS, FONT_SIZES, SPACING } from '@/constants';
import { StyleSheet } from 'react-native';

const ACCENT_BLUE = '#0154F8';
const MENU_BACKGROUND = 'rgba(253, 251, 238, 0.6)';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: SPACING.XS,
    paddingTop: SPACING.XS,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: MENU_BACKGROUND,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pill: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.XS,
    backgroundColor: 'transparent',
    borderRadius: 20,
    minWidth: 44,
  },
  pillSelected: {
    backgroundColor: COLORS.WHITE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  pillLabel: {
    fontFamily: 'DM Sans',
    fontSize: FONT_SIZES.XS,
    fontWeight: '500',
    lineHeight: 22,
    letterSpacing: 0.2,
    textAlign: 'center',
    color: COLORS.TEXT,
  },
  pillLabelSelected: {
    color: ACCENT_BLUE,
  },
  menuIconImage: {
    width: 24,
    height: 24,
    backgroundColor: 'transparent',
  },
});
