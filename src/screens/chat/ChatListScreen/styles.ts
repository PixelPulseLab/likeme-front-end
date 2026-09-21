import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  searchBarContainer: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.LG,
  },
  listWrap: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.XL,
  },
  sectionHeader: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '500',
    color: COLORS.TEXT,
    fontFamily: 'DM Sans',
  },
  conversationsContainer: {
    paddingHorizontal: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 0,
    paddingVertical: SPACING.MD,
    gap: SPACING.SM,
  },
  conversationItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#d9d9d9',
  },
  likemeAvatar: {
    width: 69,
    height: 64,
    borderRadius: 35,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  likemeAvatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
  },
  avatar: {
    width: 69,
    height: 64,
    borderRadius: 35,
  },
  avatarPlaceholder: {
    width: 69,
    height: 64,
    borderRadius: 35,
    backgroundColor: '#d8e4d6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationInfo: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  conversationNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.SM,
    minWidth: 0,
  },
  likemeLogoContainer: {
    marginRight: SPACING.XS,
  },
  conversationName: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '400',
    color: '#001137',
    fontFamily: 'DM Sans',
  },
  conversationTimestamp: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '500',
    color: '#6e6a6a',
    textAlign: 'right',
    minWidth: 40,
    fontFamily: 'DM Sans',
  },
  conversationMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    width: '100%',
  },
  conversationMessageContainer: {
    flex: 1,
    minWidth: 0,
  },
  conversationMessage: {
    fontSize: FONT_SIZES.XS,
    fontWeight: '500',
    color: '#6e6a6a',
    lineHeight: 18,
    fontFamily: 'DM Sans',
  },
  conversationMessageUnread: {
    color: '#0154f8',
    fontWeight: '500',
  },
  notificationBadge: {
    width: 18,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.ERROR,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 18,
  },
  notificationText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: '400',
    color: COLORS.WHITE,
    lineHeight: 20,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XL * 2,
    gap: SPACING.MD,
  },
  emptyText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_LIGHT,
    fontFamily: 'DM Sans',
    textAlign: 'center',
  },
});
