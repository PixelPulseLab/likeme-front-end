import { StyleSheet } from 'react-native';

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
});
