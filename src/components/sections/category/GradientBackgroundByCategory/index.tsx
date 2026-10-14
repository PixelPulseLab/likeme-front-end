import React from 'react';
import { View, StyleSheet } from 'react-native';
import { getCategoryGradient } from '@/constants/categoryColors';
import { COLORS } from '@/constants';
import { GradientBackground } from '@/components/ui/layout';
import { CategoryName } from '@/types';

type Props = {
  category: CategoryName | null;
};

const OPACITY = 0.6;

const GradientBackgroundByCategory: React.FC<Props> = ({ category }) => {
  const raw = getCategoryGradient(category) ?? null;
  const colors: readonly [string, string, ...string[]] | null =
    raw != null
      ? ([...[...raw].reverse(), COLORS.NEUTRAL.HIGH.PURE] as unknown as readonly [string, string, ...string[]])
      : null;

  return (
    <View style={[styles.container, { opacity: OPACITY }]}>
      <GradientBackground colors={colors} {...{ start: { x: 0, y: -0.2 }, end: { x: 0, y: 0.5 } }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
  },
});

export default GradientBackgroundByCategory;
