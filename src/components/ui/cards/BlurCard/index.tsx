import React, { useCallback, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { DesaturatedImage } from '@/components/ui/media/DesaturatedImage';
import { IMAGE_CONTENT_POSITION_ABOVE_CENTER } from '@/constants';
import {
  styles,
  FOOTER_BLUR_RADIUS,
  extractBottomRadii,
  getBlurStyle,
  getFooterBlurImageStyle,
  getFooterSectionStyle,
  FOOTER_HEIGHT_THRESHOLD,
} from './styles';

export type BlurCardProps = {
  backgroundImage: string;
  topSection?: React.ReactNode;
  footerSection?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  desaturated?: boolean;
};

const useMeasuredHeight = () => {
  const [height, setHeight] = useState(0);
  const lastHeight = useRef(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    if (Math.abs(nextHeight - lastHeight.current) > FOOTER_HEIGHT_THRESHOLD) {
      lastHeight.current = nextHeight;
      setHeight(nextHeight);
    }
  }, []);

  return { height, onLayout };
};

const BlurCard: React.FC<BlurCardProps> = ({
  backgroundImage,
  topSection,
  footerSection,
  onPress,
  style,
  desaturated = false,
}) => {
  const card = useMeasuredHeight();
  const footer = useMeasuredHeight();

  const radii = extractBottomRadii(style);

  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { activeOpacity: 0.9, onPress } : {};

  return (
    <Wrapper {...wrapperProps} style={[styles.container, style]} onLayout={card.onLayout}>
      {desaturated ? (
        <DesaturatedImage uri={backgroundImage} style={styles.desaturatedImageWrap} />
      ) : (
        <CachedImage
          source={{ uri: backgroundImage }}
          style={styles.backgroundImage}
          contentPosition={IMAGE_CONTENT_POSITION_ABOVE_CENTER}
        />
      )}

      <View style={styles.content}>
        {topSection && <View style={styles.topSection}>{topSection}</View>}

        <View style={[styles.footerSection, getFooterSectionStyle(radii)]}>
          {!desaturated && card.height > 0 && (
            <View style={getBlurStyle(footer.height, radii)}>
              <CachedImage
                source={{ uri: backgroundImage }}
                style={getFooterBlurImageStyle(card.height)}
                contentPosition={IMAGE_CONTENT_POSITION_ABOVE_CENTER}
                blurRadius={FOOTER_BLUR_RADIUS}
              />
            </View>
          )}
          <View style={styles.footerContent} onLayout={footer.onLayout}>
            {footerSection}
          </View>
        </View>
      </View>
    </Wrapper>
  );
};

export default BlurCard;
