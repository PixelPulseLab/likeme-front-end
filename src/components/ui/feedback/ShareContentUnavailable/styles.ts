import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    gap: 48,
  },
  messageBlock: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SPACING.MD,
    maxWidth: 361,
  },
  title: {
    fontSize: 20,
    fontFamily: 'DM Sans',
    fontWeight: '700',
    color: COLORS.NEUTRAL.LOW.PURE,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    fontFamily: 'DM Sans',
    fontWeight: '400',
    color: COLORS.NEUTRAL.LOW.PURE,
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.2,
    maxWidth: 275,
  },
  actions: {
    width: '100%',
    gap: SPACING.SM,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 24,
  },
  secondaryButton: {
    width: '100%',
    borderRadius: 24,
  },
});
