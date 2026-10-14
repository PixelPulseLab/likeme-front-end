import { StyleSheet } from 'react-native';
import { COLORS, KEYBOARD_AWARE_SCROLL, SPACING } from '@/constants';

export const COMMENTS_LIST_END_INSET = KEYBOARD_AWARE_SCROLL.CONTENT_FALLBACK_PADDING_BOTTOM * 2;

export const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    paddingBottom: 0,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  list: {
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 1,
    paddingTop: SPACING.MD,
  },
  listContent: {
    paddingBottom: COMMENTS_LIST_END_INSET,
  },
  commentRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: COLORS.SECONDARY.PURE,
  },
  commentsStateContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: COLORS.SECONDARY.PURE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 12,
  },
  commentsStateLabel: {
    fontSize: 14,
    color: COLORS.TEXT_LIGHT,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY.LIGHT,
  },
  retryButtonLabel: {
    fontSize: 14,
    color: COLORS.PRIMARY.PURE,
    fontWeight: '600',
  },
  composerFooter: {
    width: '100%',
    backgroundColor: COLORS.PRIMARY.LIGHT,
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.MD,
    paddingBottom: SPACING.MD,
  },
  composerInputRow: {
    paddingVertical: 0,
  },
  header: {
    marginBottom: SPACING.MD,
    backgroundColor: 'rgba(251, 247, 229, 0.92)',
    borderRadius: 22,
    padding: SPACING.MD,
    shadowColor: COLORS.BLACK,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
    marginBottom: SPACING.XS,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_LIGHT,
    letterSpacing: 0.2,
    lineHeight: 20,
  },
  overline: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: COLORS.TEXT_LIGHT,
    letterSpacing: 0.5,
    marginBottom: SPACING.XS,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '400',
    color: COLORS.TEXT,
    lineHeight: 26,
  },
});
