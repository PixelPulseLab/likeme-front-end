import React from 'react';
import {
  Text,
  TouchableOpacity,
  GestureResponderEvent,
  ViewStyle,
  ActivityIndicator,
  TextStyle,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '@/constants';
import { styles } from './styles';

type Variant = 'dark' | 'light';
type Size = 'medium' | 'large';

type Props = {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  style?: ViewStyle | ViewStyle[];
  labelStyle?: TextStyle | TextStyle[];
  loading?: boolean;
  disabled?: boolean;
  solidDisabled?: boolean;
  variant?: Variant;
  size?: Size;
  icon?: string;
  iconSize?: number;
  iconColor?: string;
  iconPosition?: 'left' | 'right';
  testID?: string;
};

const PrimaryButton: React.FC<Props> = ({
  label,
  onPress,
  style,
  labelStyle: customLabelStyle,
  loading = false,
  disabled = false,
  solidDisabled = false,
  variant = 'dark',
  size = 'medium',
  icon,
  iconSize = 16,
  iconColor,
  iconPosition = 'right',
  testID,
}) => {
  const isDisabled = loading || disabled;
  const baseButtonStyle = variant === 'light' ? styles.buttonLight : styles.button;
  const sizeStyle = size === 'medium' ? styles.buttonMedium : styles.buttonLarge;
  const buttonStyle = [baseButtonStyle, sizeStyle];
  const defaultLabelStyle = variant === 'light' ? styles.labelLight : styles.label;
  const labelStyle = [defaultLabelStyle, customLabelStyle, isDisabled && solidDisabled && styles.labelSolidDisabled];
  const indicatorColor = variant === 'light' ? COLORS.TEXT : COLORS.WHITE;
  const finalIconColor = iconColor || (variant === 'light' ? COLORS.TEXT : COLORS.WHITE);

  const renderIcon = () => {
    if (!icon) return null;

    return (
      <Icon
        name={icon}
        size={iconSize}
        color={finalIconColor}
        style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
      />
    );
  };

  return (
    <TouchableOpacity
      style={[
        buttonStyle,
        style,
        isDisabled && solidDisabled && styles.buttonSolidDisabled,
        isDisabled && !solidDisabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator size='small' color={indicatorColor} />
      ) : (
        <View style={styles.buttonContent}>
          {iconPosition === 'left' && renderIcon()}
          <Text style={labelStyle}>{label}</Text>
          {iconPosition === 'right' && renderIcon()}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default PrimaryButton;
