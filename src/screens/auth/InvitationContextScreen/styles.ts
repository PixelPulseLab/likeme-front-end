import { StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, SPACING, TYPOGRAPHY } from '@/constants';

const CARD_HEIGHT = 130;
const AVATAR_SIZE = 40;
const BADGE_TEXT = '#F6DEA9';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  screenContent: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingBottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.XL,
    paddingTop: SPACING.LG,
    paddingBottom: SPACING.LG,
    alignItems: 'center',
  },
  titles: {
    width: '100%',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  congratulations: {
    ...TYPOGRAPHY.displayMd,
    color: COLORS.TEXT,
    textAlign: 'center',
  },
  accessGranted: {
    ...TYPOGRAPHY.displaySm,
    color: COLORS.TEXT,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  body: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
    marginTop: SPACING.LG,
    width: '100%',
  },
  bodyEmphasis: {
    ...TYPOGRAPHY.bodyMd,
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    color: COLORS.TEXT,
  },
  enjoy: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
    marginTop: SPACING.SM,
    width: '100%',
  },
  card: {
    width: 286,
    maxWidth: '100%',
    height: CARD_HEIGHT,
    marginTop: SPACING.XL,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  cardImageFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.NEUTRAL.LOW.PURE,
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: SPACING.MD,
  },
  badge: {
    position: 'absolute',
    top: SPACING.MD,
    left: SPACING.MD,
    backgroundColor: 'rgba(0, 17, 55, 0.64)',
    paddingHorizontal: 14,
    minHeight: 24,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 11,
    borderBottomRightRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    ...TYPOGRAPHY.badge,
    color: BADGE_TEXT,
    lineHeight: 22,
  },
  cardTitle: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: 20,
    lineHeight: 22,
    letterSpacing: 0.2,
    color: COLORS.WHITE,
  },
  recommendedBy: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.TEXT,
    marginTop: SPACING.LG,
    width: '100%',
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MD,
    marginTop: SPACING.SM,
    width: '100%',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: COLORS.NEUTRAL.LOW.LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    ...TYPOGRAPHY.title3,
    color: COLORS.TEXT,
  },
  providerName: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
    flex: 1,
  },
  error: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
    textAlign: 'center',
    paddingHorizontal: SPACING.XL,
    paddingTop: SPACING.XL,
  },
  footer: {
    width: '100%',
    paddingHorizontal: SPACING.MD,
  },
});
