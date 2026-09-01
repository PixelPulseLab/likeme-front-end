import { StyleSheet, ViewStyle, StyleProp, ImageStyle } from 'react-native';
import { SPACING } from '@/constants';

export const DEFAULT_BORDER_RADIUS = 22;

/**
 * O blur do footer vem do `blurRadius` nativo do `expo-image` sobre uma cópia da própria arte,
 * e não de `expo-blur`: no Android o BlurView cai para um overlay cinza opaco quando não resolve
 * o alvo do blur, o que pintava faixa acinzentada com emenda reta na base do card.
 */
export const FOOTER_BLUR_RADIUS = 16;

const FOOTER_HEIGHT_THRESHOLD = 2;

export const styles = StyleSheet.create({
  container: {
    borderRadius: DEFAULT_BORDER_RADIUS,
    overflow: 'hidden',
    minHeight: 100,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  desaturatedImageWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: SPACING.SM,
    paddingBottom: 0,
  },
  topSection: {
    paddingHorizontal: SPACING.SM,
  },
  footerSection: {
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.SM,
    paddingBottom: SPACING.SM,
    gap: SPACING.SM,
  },
  footerContent: {
    position: 'relative',
    zIndex: 1,
    gap: SPACING.SM,
  },
});

export { FOOTER_HEIGHT_THRESHOLD };

type BottomRadii = {
  bottomLeft: number;
  bottomRight: number;
};

export const extractBottomRadii = (style: StyleProp<ViewStyle>): BottomRadii => {
  if (!style) return { bottomLeft: DEFAULT_BORDER_RADIUS, bottomRight: DEFAULT_BORDER_RADIUS };

  const styleObj = Array.isArray(style)
    ? (Object.assign({}, ...style.filter(Boolean)) as ViewStyle)
    : (style as ViewStyle);

  const generic = typeof styleObj.borderRadius === 'number' ? styleObj.borderRadius : DEFAULT_BORDER_RADIUS;

  return {
    bottomLeft: typeof styleObj.borderBottomLeftRadius === 'number' ? styleObj.borderBottomLeftRadius : generic,
    bottomRight: typeof styleObj.borderBottomRightRadius === 'number' ? styleObj.borderBottomRightRadius : generic,
  };
};

export const getBlurStyle = (footerHeight: number, radii: BottomRadii): ViewStyle => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: footerHeight > 0 ? footerHeight + 20 : 60,
  borderBottomLeftRadius: radii.bottomLeft,
  borderBottomRightRadius: radii.bottomRight,
  overflow: 'hidden',
});

/**
 * A cópia desfocada precisa das dimensões do card inteiro, ancorada na base, para que o recorte
 * `cover` caia exatamente sobre o mesmo trecho da arte que aparece atrás da faixa.
 */
export const getFooterBlurImageStyle = (cardHeight: number): ImageStyle => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: cardHeight,
});

export const getFooterSectionStyle = (radii: BottomRadii): ViewStyle => ({
  borderBottomLeftRadius: radii.bottomLeft,
  borderBottomRightRadius: radii.bottomRight,
});
