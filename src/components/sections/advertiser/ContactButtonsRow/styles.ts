import { StyleSheet } from 'react-native';
import { SPACING } from '@/constants';

export const styles = StyleSheet.create({
  contactButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.XL,
  },
  contactButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  contactIconButtonContainer: {
    padding: 0,
  },
  shareButtonContainer: {
    flexShrink: 0,
    padding: 0,
  },
});
