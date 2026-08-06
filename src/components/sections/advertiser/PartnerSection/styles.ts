import { StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, FONT_FAMILY } from '@/constants';

/** Medidas do frame Figma `recomendacao` (node 121918:1347). */
const STACKED_AVATAR_WIDTH = 39;
const STACKED_AVATAR_HEIGHT = 36;
/** Distância entre bordas esquerdas dos avatares no Figma (0, 25, 50…). */
const STACKED_AVATAR_STEP = 25;
const SINGLE_AVATAR_SIZE = 40;

export const styles = StyleSheet.create({
  container: {
    gap: SPACING.MD_PLUS,
    width: '100%',
  },
  recommendedByLabel: {
    fontFamily: FONT_FAMILY.DM_SANS_MEDIUM,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  rowWithRecommendedByLabel: {
    paddingHorizontal: SPACING.MD,
  },
  multiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: SINGLE_AVATAR_SIZE,
    height: SINGLE_AVATAR_SIZE,
    borderRadius: SINGLE_AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.NEUTRAL.LOW.LIGHT,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackedAvatarRing: {
    width: STACKED_AVATAR_WIDTH,
    height: STACKED_AVATAR_HEIGHT,
    borderRadius: STACKED_AVATAR_HEIGHT / 2,
    overflow: 'hidden',
    backgroundColor: COLORS.NEUTRAL.LOW.LIGHT,
  },
  stackedAvatarOverlap: {
    marginLeft: -(STACKED_AVATAR_WIDTH - STACKED_AVATAR_STEP),
  },
  stackedAvatarImage: {
    width: '100%',
    height: '100%',
  },
  recommendationsCount: {
    fontFamily: FONT_FAMILY.DM_SANS_MEDIUM,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    color: COLORS.NEUTRAL.LOW.DARK,
    flexShrink: 1,
  },
  info: {
    flex: 1,
    marginLeft: 6,
  },
  name: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  role: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.NEUTRAL.LOW.DARK,
  },
  profileButton: {
    width: '100%',
    borderColor: COLORS.NEUTRAL.LOW.PURE,
  },
});
