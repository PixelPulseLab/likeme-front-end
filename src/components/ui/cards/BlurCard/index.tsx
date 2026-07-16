import React, { useCallback, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { PlatformBlurView } from '@/components/ui/PlatformBlurView';
import {
  styles,
  BLUR_INTENSITY,
  extractBottomRadii,
  getBlurStyle,
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

const BlurCard: React.FC<BlurCardProps> = ({
  backgroundImage,
  topSection,
  footerSection,
  onPress,
  style,
  desaturated = false,
}) => {
  const [footerHeight, setFooterHeight] = useState(0);
  const lastFooterHeight = useRef(0);

  const radii = extractBottomRadii(style);

  const handleFooterLayout = useCallback((e: LayoutChangeEvent) => {
    const newHeight = e.nativeEvent.layout.height;
    if (Math.abs(newHeight - lastFooterHeight.current) > FOOTER_HEIGHT_THRESHOLD) {
      lastFooterHeight.current = newHeight;
      setFooterHeight(newHeight);
    }
  }, []);

  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { activeOpacity: 0.9, onPress } : {};

  return (
    <Wrapper {...wrapperProps} style={[styles.container, style]}>
      {desaturated ? (
        <View style={styles.desaturatedImageWrap}>
          <CachedImage source={{ uri: backgroundImage }} style={styles.backgroundImage} />
        </View>
      ) : (
        <CachedImage source={{ uri: backgroundImage }} style={styles.backgroundImage} />
      )}

      <View style={styles.content}>
        {topSection && <View style={styles.topSection}>{topSection}</View>}

        <View style={[styles.footerSection, getFooterSectionStyle(radii)]}>
          <PlatformBlurView intensity={BLUR_INTENSITY} style={getBlurStyle(footerHeight, radii)} />
          <View style={styles.footerContent} onLayout={handleFooterLayout}>
            {footerSection}
          </View>
        </View>
      </View>
    </Wrapper>
  );
};

export default BlurCard;
