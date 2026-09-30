import React, { ReactNode, useId } from 'react';
import { type ImageSourcePropType, StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { COLORS } from '@/constants';
import { BackgroundIcon } from '@/assets/ui';
import { styles } from './styles';

export type IconSilhouetteSize = 'xsmall' | 'small' | 'medium' | 'large';

export type IconSilhouetteProps = {
  tintColor?: string | readonly string[] | null;
  source?: ImageSourcePropType;
  size?: IconSilhouetteSize;
  style?: ViewStyle;
  children?: ReactNode;
  backgroundBlur?: boolean;
  innerBorderColor?: string;
};

const BLUR_INTENSITY = 10;
const INNER_BORDER_STROKE = 3;
const SILHOUETTE_VIEW_BOX = '8 4 62 56';

const SILHOUETTE_PATH =
  'M38.6352 59.6076C28.4234 59.6076 20.7646 57.4269 15.6587 53.0655C10.5528 48.4619 8 41.4352 8 31.9855C8 22.2936 10.5528 15.2669 15.6587 10.9055C20.7646 6.30184 28.4234 4 38.6352 4C49.0901 4 56.8706 6.30184 61.9765 10.9055C67.3255 15.2669 70 22.2936 70 31.9855C70 50.4003 59.545 59.6076 38.6352 59.6076Z';

const getSizeStyles = (size: IconSilhouetteSize) => {
  if (size === 'xsmall') return { container: styles.containerXsmall, image: styles.imageXsmall };
  if (size === 'small') return { container: styles.containerSmall, image: styles.imageSmall };
  if (size === 'medium') return { container: styles.containerMedium, image: styles.imageMedium };
  return { container: styles.containerLarge, image: styles.imageLarge };
};

const IconSilhouette: React.FC<IconSilhouetteProps> = ({
  tintColor,
  source,
  size = 'large',
  style,
  children,
  backgroundBlur = false,
  innerBorderColor,
}) => {
  const clipId = `icon-blob-${useId().replace(/:/g, '')}`;
  const { container: containerSize, image: imageSize } = getSizeStyles(size);
  const isGradient = Array.isArray(tintColor) && tintColor.length > 1;
  const singleTint =
    typeof tintColor === 'string'
      ? tintColor
      : Array.isArray(tintColor) && tintColor.length > 0
      ? tintColor[0]
      : undefined;

  const childrenOverlay =
    children != null ? (
      <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents='box-none'>
        {children}
      </View>
    ) : null;

  if (backgroundBlur) {
    const borderColor = innerBorderColor ?? COLORS.WHITE;
    const imageLayout = StyleSheet.flatten(imageSize);
    const blurWidth = Number(imageLayout.width);
    const blurHeight = Number(imageLayout.height);
    const blurFill = <BlurView intensity={BLUR_INTENSITY} tint='default' style={imageSize} />;
    const clippedBlur = (
      <MaskedView
        pointerEvents='none'
        style={imageSize}
        maskElement={
          <View style={[imageSize, styles.blurMask]}>
            <Svg width={blurWidth} height={blurHeight} viewBox={SILHOUETTE_VIEW_BOX}>
              <Path d={SILHOUETTE_PATH} fill={COLORS.BLACK} />
            </Svg>
          </View>
        }
      >
        {blurFill}
      </MaskedView>
    );

    return (
      <View style={[styles.container, containerSize, styles.blurFace, style]}>
        {clippedBlur}
        <Svg
          width={imageSize.width}
          height={imageSize.height}
          viewBox={SILHOUETTE_VIEW_BOX}
          style={styles.blurBorder}
          pointerEvents='none'
        >
          <Defs>
            <ClipPath id={clipId}>
              <Path d={SILHOUETTE_PATH} />
            </ClipPath>
          </Defs>
          <G clipPath={`url(#${clipId})`}>
            <Path d={SILHOUETTE_PATH} fill='none' stroke={borderColor} strokeWidth={INNER_BORDER_STROKE} />
          </G>
        </Svg>
        {childrenOverlay}
      </View>
    );
  }

  if (source != null) {
    return (
      <View style={[styles.container, containerSize, style]}>
        <CachedImage
          source={source}
          style={[styles.image, imageSize, StyleSheet.absoluteFill]}
          tintColor={singleTint}
        />
        {childrenOverlay}
      </View>
    );
  }

  if (isGradient) {
    const colors = tintColor as string[];
    return (
      <View style={[styles.container, containerSize, style]}>
        <Svg viewBox='8 4 62 56' width={imageSize.width} height={imageSize.height}>
          <Defs>
            <LinearGradient id='iconSilhouetteGradient' x1='0' y1='0' x2='0' y2='1'>
              {colors.map((c, i) => (
                <Stop key={i} offset={i / (colors.length - 1)} stopColor={c} />
              ))}
            </LinearGradient>
          </Defs>
          <Path d={SILHOUETTE_PATH} fill='url(#iconSilhouetteGradient)' />
        </Svg>
        {childrenOverlay}
      </View>
    );
  }

  return (
    <View style={[styles.container, containerSize, style]}>
      <BackgroundIcon width={imageSize.width} height={imageSize.height} color={singleTint} />
      {childrenOverlay}
    </View>
  );
};

export default IconSilhouette;
