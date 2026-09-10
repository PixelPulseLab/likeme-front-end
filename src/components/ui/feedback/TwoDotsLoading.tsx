import React, { useEffect, useId, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { COLORS } from '@/constants';

const VIEWBOX = 32;
const DEFAULT_SIZE = 56;
const CYCLE_MS = 1240;
const SCALE_MIN = 0.82;
const SCALE_MAX = 1.22;
const WAVE_INPUT = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];

function cosineScaleRange(phase: 1 | -1): number[] {
  const mid = (SCALE_MAX + SCALE_MIN) / 2;
  const amp = ((SCALE_MAX - SCALE_MIN) / 2) * phase;
  return WAVE_INPUT.map((t) => mid + amp * Math.cos(2 * Math.PI * t));
}

const TOP_SCALE_RANGE = cosineScaleRange(1);
const BOTTOM_SCALE_RANGE = cosineScaleRange(-1);

const TOP_DOT_CENTER = { x: 15.9026, y: 10.328 };
const BOTTOM_DOT_CENTER = { x: 16.017, y: 22.132 };

const TOP_DOT_PATH =
  'M15.9026 14.6561C14.2691 14.6561 13.044 14.3167 12.2273 13.6377C11.4105 12.9211 11.0022 11.8273 11.0022 10.3563C11.0022 8.84765 11.4105 7.75385 12.2273 7.07494C13.044 6.35831 14.2692 6 15.9026 6C17.575 6 18.8196 6.35831 19.6363 7.07494C20.492 7.75385 20.9198 8.84766 20.9198 10.3563C20.9198 13.2229 19.2474 14.6561 15.9026 14.6561Z';

const BOTTOM_DOT_PATH =
  'M16.017 17.804C17.6505 17.804 18.8756 18.1434 19.6924 18.8223C20.5091 19.539 20.9175 20.6328 20.9175 22.1037C20.9175 23.6124 20.5091 24.7062 19.6924 25.3851C18.8756 26.1018 17.6505 26.4601 16.017 26.4601C14.3447 26.4601 13.1001 26.1018 12.2833 25.3851C11.4277 24.7062 10.9999 23.6124 10.9999 22.1037C10.9999 19.2372 12.6723 17.804 16.017 17.804Z';

type Props = {
  size?: number;
  accessibilityLabel?: string;
};

function scaleAroundDot(scale: Animated.AnimatedInterpolation<number>, center: { x: number; y: number }, size: number) {
  return {
    transformOrigin: [(center.x / VIEWBOX) * size, (center.y / VIEWBOX) * size, 0],
    transform: [{ scale }],
  };
}

export const TwoDotsLoading = React.memo(({ size = DEFAULT_SIZE, accessibilityLabel }: Props) => {
  const gradientId = useId().replace(/:/g, '');
  const progress = useRef(new Animated.Value(0)).current;
  const topScale = useRef(progress.interpolate({ inputRange: WAVE_INPUT, outputRange: TOP_SCALE_RANGE })).current;
  const bottomScale = useRef(progress.interpolate({ inputRange: WAVE_INPUT, outputRange: BOTTOM_SCALE_RANGE })).current;
  const topGradientId = `twoDotsTop_${gradientId}`;
  const bottomGradientId = `twoDotsBottom_${gradientId}`;

  useEffect(() => {
    progress.setValue(0);
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: CYCLE_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => {
      loop.stop();
      progress.stopAnimation();
    };
  }, [progress]);

  return (
    <View style={{ width: size, height: size }} accessibilityRole='progressbar' accessibilityLabel={accessibilityLabel}>
      <Animated.View
        style={[StyleSheet.absoluteFill, scaleAroundDot(topScale, TOP_DOT_CENTER, size)]}
        pointerEvents='none'
      >
        <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
          <Defs>
            <RadialGradient
              id={topGradientId}
              cx='0'
              cy='0'
              r='1'
              gradientUnits='userSpaceOnUse'
              gradientTransform='translate(15.961 15.4093) rotate(-90) scale(10.3142 8.98164)'
            >
              <Stop offset='0.0961538' stopColor={COLORS.PRIMARY.LIGHT} />
              <Stop offset='0.807692' stopColor='#EB7DC6' />
              <Stop offset='0.966346' stopColor='#B14D8F' />
            </RadialGradient>
          </Defs>
          <Path d={TOP_DOT_PATH} fill={`url(#${topGradientId})`} />
        </Svg>
      </Animated.View>
      <Animated.View
        style={[StyleSheet.absoluteFill, scaleAroundDot(bottomScale, BOTTOM_DOT_CENTER, size)]}
        pointerEvents='none'
      >
        <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
          <Defs>
            <RadialGradient
              id={bottomGradientId}
              cx='0'
              cy='0'
              r='1'
              gradientUnits='userSpaceOnUse'
              gradientTransform='translate(15.9587 17.0507) rotate(90) scale(10.3142 8.98164)'
            >
              <Stop stopColor={COLORS.PRIMARY.LIGHT} />
              <Stop offset='0.807692' stopColor={COLORS.PRIMARY.PURE} />
              <Stop offset='0.966346' stopColor='#00297B' />
            </RadialGradient>
          </Defs>
          <Path d={BOTTOM_DOT_PATH} fill={`url(#${bottomGradientId})`} />
        </Svg>
      </Animated.View>
    </View>
  );
});
