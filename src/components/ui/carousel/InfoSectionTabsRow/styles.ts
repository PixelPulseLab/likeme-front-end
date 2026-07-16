import { StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, SPACING } from '@/constants';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  carouselWrap: {
    flex: 1,
    minWidth: 0,
  },
  carouselContent: {
    paddingRight: 0,
  },
  trailingAction: {
    flexShrink: 0,
  },
  menuBackdrop: {
    flex: 1,
  },
  menuDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  menuCard: {
    position: 'absolute',
    zIndex: 2,
    minWidth: 165,
    minHeight: 48,
    paddingHorizontal: SPACING.MD,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: COLORS.SECONDARY.LIGHT,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY.PURE,
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  menuOption: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  menuOptionLabel: {
    fontFamily: FONT_FAMILY.DM_SANS_MEDIUM,
    fontSize: 14,
    lineHeight: 18,
    color: COLORS.PRIMARY.PURE,
    textAlign: 'left',
  },
});
