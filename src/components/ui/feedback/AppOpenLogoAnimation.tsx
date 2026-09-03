import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LogoFullSvg } from '@/assets/auth';
import { COLORS } from '@/constants';

const LOGO_ASPECT_RATIO = 285 / 54;
const REVEAL_MS = 500;
const EXIT_MS = 500;
const EXIT_SCALE = 0.72;

export type AppOpenLogoAnimationHandle = {
  dismiss: () => Promise<void>;
};

export const AppOpenLogoAnimation = forwardRef<AppOpenLogoAnimationHandle>((_props, ref) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  const revealFinishedRef = useRef(Promise.resolve());
  const holdFinishedRef = useRef(Promise.resolve());
  const dismissedRef = useRef(false);
  const exitAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    let settleReveal: (() => void) | null = null;
    let settleHold: (() => void) | null = null;
    revealFinishedRef.current = new Promise<void>((resolve) => {
      settleReveal = resolve;
    });
    holdFinishedRef.current = new Promise<void>((resolve) => {
      settleHold = resolve;
    });

    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: REVEAL_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: REVEAL_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start(() => {
      settleReveal?.();
      settleHold?.();
    });

    return () => {
      animation.stop();
      exitAnimationRef.current?.stop();
      settleReveal?.();
      settleHold?.();
    };
  }, [opacity, scale]);

  useImperativeHandle(ref, () => ({
    dismiss: async () => {
      if (dismissedRef.current) {
        return;
      }
      dismissedRef.current = true;
      await holdFinishedRef.current;

      await new Promise<void>((resolve) => {
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
    <View style={styles.container} accessibilityLabel='Carregando'>
      <Animated.View style={[styles.logoBox, { opacity, transform: [{ scale }] }]}>
        <LogoFullSvg width='100%' height='100%' />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.BACKGROUND,
    pointerEvents: 'none',
  },
  logoBox: {
    width: '72%',
    maxWidth: 285,
    aspectRatio: LOGO_ASPECT_RATIO,
  },
});
