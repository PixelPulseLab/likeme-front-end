import React from 'react';
import { View, Text, TouchableOpacity, ImageSourcePropType, ImageStyle, ViewStyle } from 'react-native';
import { COLORS } from '@/constants';
import Icon from '@/components/ui/layout/Icon';
import IconSilhouette from '@/components/ui/layout/IconSilhouette';
import type { IconSilhouetteSize } from '@/components/ui/layout/IconSilhouette';
import { styles } from './styles';

type IconButtonVariant = 'light' | 'dark';
type SizeDefaults = { iconSize: number };

const SIZE_DEFAULTS: Partial<Record<IconSilhouetteSize, SizeDefaults>> = {
  medium: { iconSize: 18 },
};

const VARIANT_CONFIG: Record<IconButtonVariant, { tintColor: string; iconColor: string }> = {
  light: { tintColor: COLORS.NEUTRAL.HIGH.PURE, iconColor: '#0F1B33' },
  dark: { tintColor: COLORS.NEUTRAL.LOW.PURE, iconColor: COLORS.WHITE },
};

type Props = {
  icon?: string;
  iconElement?: React.ReactNode;
  iconSize?: number;
  iconColor?: string;
  iconImageSource?: ImageSourcePropType;
  iconImageStyle?: ImageStyle;
  onPress: () => void;
  disabled?: boolean;
  label?: string;
  variant?: IconButtonVariant;
  showBackground?: boolean;
  backgroundSize?: IconSilhouetteSize;
  backgroundSource?: ImageSourcePropType;
  /** `null` desativa o tint no fundo (ex.: PNG do Figma já colorido). */
  backgroundTintColor?: string | readonly string[] | null;
  containerStyle?: ViewStyle;
  iconContainerStyle?: ViewStyle;
};

const IconButton: React.FC<Props> = (props) => {
  const {
    icon,
    iconElement,
    iconImageSource,
    iconImageStyle,
    onPress,
    disabled = false,
    label,
    variant = 'light',
    showBackground = true,
    backgroundSize = 'large',
    backgroundSource,
    containerStyle,
    iconContainerStyle,
  } = props;

  const variantConfig = VARIANT_CONFIG[variant];
  const defaults = SIZE_DEFAULTS[backgroundSize];
  const iconSize = props.iconSize ?? defaults?.iconSize;
  const iconColor = props.iconColor ?? variantConfig.iconColor;

  const silhouetteTint =
    props.backgroundTintColor === null ? null : props.backgroundTintColor ?? variantConfig.tintColor;

  const renderedIcon = iconElement ?? (
    <Icon name={icon} size={iconSize} color={iconColor} imageSource={iconImageSource} imageStyle={iconImageStyle} />
  );

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle, disabled && styles.disabled]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      {showBackground ? (
        <IconSilhouette
          source={backgroundSource}
          tintColor={silhouetteTint}
          size={backgroundSize}
          style={iconContainerStyle}
        >
          {renderedIcon}
        </IconSilhouette>
      ) : (
        <View style={[styles.iconContainer, iconContainerStyle]}>{renderedIcon}</View>
      )}
      {label && <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
};

export default IconButton;
