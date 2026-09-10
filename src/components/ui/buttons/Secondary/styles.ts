import { Platform, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '@/constants';

const androidFlatSurface = Platform.select({
  android: {
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  default: {},
});

export const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.TEXT,
    display: 'flex',
    gap: 2,
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    shadowOpacity: 0,
    shadowRadius: 0,
    ...androidFlatSurface,
  },
  buttonSmall: {
    minHeight: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  buttonMedium: {
    minHeight: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  buttonDark: {
    backgroundColor: COLORS.SECONDARY.LIGHT,
    borderColor: COLORS.SECONDARY.LIGHT,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.BLACK,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 0,
      },
      default: {},
    }),
  },
  buttonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    justifyContent: 'center',
    overflow: 'visible',
  },
  label: {
    ...TYPOGRAPHY.labelMd,
    color: COLORS.TEXT,
    flexShrink: 0,
    textAlign: 'center',
  },
  labelDark: {
    color: COLORS.TEXT_LIGHT,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
