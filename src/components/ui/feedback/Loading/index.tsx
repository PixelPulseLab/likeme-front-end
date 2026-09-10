import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Animated, Easing, Text } from 'react-native';
import { TwoDotsLoading } from '../TwoDotsLoading';
import { styles } from './styles';

const TWO_DOTS_SIZE = {
  small: 20,
  large: 56,
} as const;

const EXIT_MS = 420;
const EXIT_SCALE = 0.72;

export type LoadingHandle = {
  dismiss: () => Promise<void>;
};

export interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
  color?: string;
  accessibilityLabel?: string;
}

const Loading = forwardRef<LoadingHandle, LoadingProps>(
  ({ message, size = 'large', fullScreen = false, accessibilityLabel }, ref) => {
    const containerStyle = fullScreen ? styles.fullScreenContainer : styles.inlineContainer;
    const contentStyle = fullScreen ? styles.fullScreenContent : styles.inlineContent;
    const opacity = useRef(new Animated.Value(1)).current;
    const scale = useRef(new Animated.Value(1)).current;
    const dismissedRef = useRef(false);
    const exitAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
      return () => {
        exitAnimationRef.current?.stop();
      };
    }, []);

    useImperativeHandle(ref, () => ({
      dismiss: () => {
        if (dismissedRef.current) {
          return Promise.resolve();
        }
        dismissedRef.current = true;

        return new Promise<void>((resolve) => {
          const exit = Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0,
              duration: EXIT_MS,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: EXIT_SCALE,
              duration: EXIT_MS,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
          ]);
          exitAnimationRef.current = exit;
          exit.start(() => resolve());
        });
      },
    }));

    return (
      <Animated.View style={[containerStyle, { opacity }]}>
        <Animated.View style={[contentStyle, { transform: [{ scale }] }]}>
          <TwoDotsLoading size={TWO_DOTS_SIZE[size]} accessibilityLabel={accessibilityLabel ?? message} />
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </Animated.View>
      </Animated.View>
    );
  },
);

export default Loading;
