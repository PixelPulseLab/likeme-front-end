import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

export const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.BACKGROUND,
  },
  inlineContainer: {
    flex: 1,
    width: '100%',
  },
  fullScreenContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    gap: 16,
  },
  inlineContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    gap: 12,
  },
  message: {
    color: 'rgba(0, 17, 55, 1)',
    fontFamily: 'DM Sans',
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 8,
  },
});
