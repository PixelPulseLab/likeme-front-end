import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { COLORS } from '@/constants';
import { BlurView } from 'expo-blur';
import IconButton from '../IconButton';
import { styles } from './styles';

const DEFAULT_BLUR_INTENSITY = 24;

export type PillButtonWithIconProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: string;
  iconSize?: number;
  testID?: string;
  pillStyle?: ViewStyle | ViewStyle[];
  /** Envolucro externo (ex.: largura no layout da tela). */
  wrapperStyle?: ViewStyle | ViewStyle[];
  blurBackground?: boolean;
  blurIntensity?: number;
  /** Sobrescreve ou estende props do `IconButton` à direita (o toque permanece no pill). */
  trailingIconButtonProps?: Partial<Omit<React.ComponentProps<typeof IconButton>, 'onPress' | 'label'>>;
};

const PillButtonWithIcon: React.FC<PillButtonWithIconProps> = ({
  label,
  onPress,
  disabled = false,
  icon = 'shopping-cart',
  iconSize = 18,
  testID,
  pillStyle,
  wrapperStyle,
  blurBackground = true,
  blurIntensity = DEFAULT_BLUR_INTENSITY,
  trailingIconButtonProps,
}) => {
  const { containerStyle: trailingContainerOverride, ...restTrailing } = trailingIconButtonProps ?? {};

  const pill = (
    <TouchableOpacity
      style={[styles.pill, pillStyle]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
      testID={testID}
      accessibilityRole='button'
      accessibilityLabel={label}
    >
      <Text style={styles.label}>{label}</Text>
      <View pointerEvents='none' style={styles.trailingIconWrap}>
        <IconButton
          icon={icon}
          iconSize={iconSize}
          onPress={() => undefined}
          variant='light'
          backgroundTintColor={COLORS.NEUTRAL.LOW.PURE}
          iconColor={COLORS.NEUTRAL.HIGH.LIGHT}
          backgroundSize='large'
          containerStyle={StyleSheet.flatten([styles.trailingIconContainer, trailingContainerOverride])}
          {...restTrailing}
          disabled={disabled}
        />
      </View>
    </TouchableOpacity>
  );

  if (!blurBackground) {
    return pill;
  }

  return (
    <View style={[styles.blurRoot, wrapperStyle]}>
      <BlurView intensity={blurIntensity} tint='light' style={styles.blur} />
      <View style={styles.blurOverlay} />
      {pill}
    </View>
  );
};

export default PillButtonWithIcon;
