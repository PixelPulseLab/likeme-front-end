import React, { type ReactNode } from 'react';
import {
  Text,
  Pressable,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
  Platform,
  type ImageSourcePropType,
  type ImageStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { COLORS } from '@/constants';
import { styles } from './styles';

type Size = 'medium' | 'large';

type Props = {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  style?: ViewStyle | ViewStyle[];
  labelStyle?: TextStyle | TextStyle[];
  loading?: boolean;
  disabled?: boolean;
  size?: Size;
  icon?: string;
  iconElement?: ReactNode;
  iconImage?: ImageSourcePropType;
  iconImageStyle?: ImageStyle;
  iconSize?: number;
  iconColor?: string;
  iconPosition?: 'left' | 'right';
  variant?: 'dark';
  testID?: string;
};

const SecondaryButton: React.FC<Props> = ({
  label,
  onPress,
  style,
  labelStyle,
  loading = false,
  disabled = false,
  size = 'medium',
  icon,
  iconElement,
  iconImage,
  iconImageStyle,
  iconSize = 16,
  iconColor,
  iconPosition = 'right',
  variant,
  testID,
}) => {
  const isDisabled = loading || disabled;

  const getIconColor = () => {
    if (iconColor) return iconColor;
    return variant === 'dark' ? COLORS.TEXT_LIGHT : COLORS.TEXT;
  };

  const getTextColor = () => {
    return variant === 'dark' ? COLORS.TEXT_LIGHT : COLORS.TEXT;
  };

  const getSizeStyle = () => {
    return size === 'medium' ? styles.buttonSmall : styles.buttonMedium;
  };

  const renderIcon = () => {
    if (iconElement != null) {
      return <View style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}>{iconElement}</View>;
    }
    if (iconImage != null) {
      return (
        <CachedImage
          source={iconImage}
          style={[
            iconPosition === 'left' ? styles.iconLeft : styles.iconRight,
            { width: iconSize, height: iconSize },
            iconImageStyle,
          ]}
          contentFit='contain'
        />
      );
    }
    if (!icon) return null;

    return (
      <Icon
        name={icon}
        size={iconSize}
        color={getIconColor()}
        style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
      />
    );
  };

  return (
    <Pressable
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        variant === 'dark' && styles.buttonDark,
        getSizeStyle(),
        style,
        isDisabled && styles.buttonDisabled,
        pressed && !isDisabled ? { opacity: 0.7 } : undefined,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      android_ripple={Platform.OS === 'android' ? { color: 'rgba(0, 17, 55, 0.08)', borderless: false } : undefined}
    >
      {loading ? (
        <ActivityIndicator size='small' color={getTextColor()} />
      ) : (
        <View style={styles.buttonContent}>
          {iconPosition === 'left' && renderIcon()}
          <Text style={[styles.label, variant === 'dark' && styles.labelDark, labelStyle]}>{label}</Text>
          {iconPosition === 'right' && renderIcon()}
        </View>
      )}
    </Pressable>
  );
};

export default SecondaryButton;
