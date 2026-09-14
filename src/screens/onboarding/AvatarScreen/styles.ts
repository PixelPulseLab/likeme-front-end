import { StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants';

export const MIND_AVATAR_SIZE = { width: 202, height: 181 } as const;
export const BODY_AVATAR_SIZE = { width: 200, height: 182 } as const;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
  titles: {
    width: '100%',
    gap: SPACING.SM,
    marginBottom: SPACING.SECTION,
    paddingHorizontal: SPACING.XL,
    paddingTop: SPACING.XL,
  },
  title: {
    ...TYPOGRAPHY.displayMd,
    color: COLORS.TEXT,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
  },
  avatars: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.LG,
    paddingHorizontal: SPACING.XL,
  },
  avatarBlock: {
    alignItems: 'center',
    gap: SPACING.MD,
  },
  avatarLabel: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.NEUTRAL.HIGH.DARK,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  mindAvatar: {
    width: MIND_AVATAR_SIZE.width,
    height: MIND_AVATAR_SIZE.height,
  },
  bodyAvatar: {
    width: BODY_AVATAR_SIZE.width,
    height: BODY_AVATAR_SIZE.height,
  },
  categoryCloud: {
    ...StyleSheet.absoluteFillObject,
  },
});
