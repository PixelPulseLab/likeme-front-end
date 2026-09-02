import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LogoFullSvg } from '@/assets/auth';
import { COLORS } from '@/constants';

const LOGO_ASPECT_RATIO = 285 / 54;
const TOTAL_MS = 2000;
const REVEAL_MS = 500;
const EXIT_MS = 500;
const EXIT_SCALE = 0.72;

export type AppOpenLogoAnimationHandle = {
  dismiss: () => Promise<void>;
};

export const AppOpenLogoAnimation = forwardRef<AppOpenLogoAnimationHandle>((_props, ref) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  const startedAtRef = useRef(0);
  const revealFinishedRef = useRef(Promise.resolve());
  const dismissedRef = useRef(false);
  const exitAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let settleReveal: (() => void) | null = null;
    revealFinishedRef.current = new Promise<void>((resolve) => {
      settleReveal = resolve;
    });
    startedAtRef.current = Date.now();

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
    animation.start(() => settleReveal?.());

    return () => {
      animation.stop();
      exitAnimationRef.current?.stop();
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
      settleReveal?.();
    };
  }, [opacity, scale]);

  useImperativeHandle(ref, () => ({
    dismiss: async () => {
      if (dismissedRef.current) {
        return;
      }
      dismissedRef.current = true;
      await revealFinishedRef.current;

      const remainingHoldMs = Math.max(0, TOTAL_MS - EXIT_MS - (Date.now() - startedAtRef.current));
      if (remainingHoldMs > 0) {
        await new Promise<void>((resolve) => {
          holdTimeoutRef.current = setTimeout(resolve, remainingHoldMs);
        });
      }

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
