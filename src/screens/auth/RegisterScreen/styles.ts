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
    backgroundColor: COLORS.SECONDARY.PURE,
    borderBottomLeftRadius: 64,
    borderBottomRightRadius: 64,
    overflow: 'hidden',
  },
  headerContent: {
    width: '100%',
    position: 'relative',
    paddingBottom: SPACING.LG,
    gap: SPACING.LG,
    marginTop: 31,
    paddingHorizontal: SPACING.MD,
  },
  titleAdornment: {
    position: 'absolute',
    zIndex: 1,
  } as ImageStyle,
  invitationSection: {
    width: '100%',
    alignItems: 'flex-start',
    gap: SPACING.MD,
  },
  invitationQuestion: {
    maxWidth: 236,
    color: COLORS.NEUTRAL.LOW.PURE,
    fontFamily: 'DM Sans',
    fontSize: 20,
    fontWeight: '400',
    lineHeight: 24,
    textAlign: 'left',
  },
  affiliateCodeField: {
    width: '100%',
    alignSelf: 'stretch',
    paddingBottom: SPACING.LG,
  },
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
});
