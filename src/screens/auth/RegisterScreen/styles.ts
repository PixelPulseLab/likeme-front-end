import { ImageStyle, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingBottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  topSection: {
    width: '100%',
  },
  headerContent: {
    width: '100%',
    paddingBottom: SPACING.XL,
    gap: 24,
    marginTop: 31,
    paddingHorizontal: SPACING.MD,
  },
  invitationQuestion: {
    color: COLORS.NEUTRAL.LOW.PURE,
    fontFamily: 'DM Sans',
    fontSize: 20,
    fontWeight: '400',
    lineHeight: 24,
    textAlign: 'left',
  },
  titleAdornment: {
    position: 'absolute',
  } as ImageStyle,
  content: {
    alignItems: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
    width: '100%',
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.XL,
    paddingBottom: SPACING.LG,
  },
  footer: {
    width: '100%',
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: SPACING.MD,
  },
  buttonGroup: {
    position: 'relative',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 0,
    paddingTop: 0,
  },
  scrollContentInner: {
    flexGrow: 1,
    width: '100%',
  },
  affiliateCodeField: {
    width: '100%',
    alignSelf: 'stretch',
  },
});
