import React from 'react';
import { View, Text } from 'react-native';
import { TwoDotsLoading } from '../TwoDotsLoading';
import { styles } from './styles';

const TWO_DOTS_SIZE = {
  small: 20,
  large: 56,
} as const;

export interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
  color?: string;
  accessibilityLabel?: string;
}

const Loading: React.FC<LoadingProps> = ({ message, size = 'large', fullScreen = false, accessibilityLabel }) => {
  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.inlineContainer;
  const contentStyle = fullScreen ? styles.fullScreenContent : styles.inlineContent;

  return (
    <View style={containerStyle}>
      <View style={contentStyle}>
        <TwoDotsLoading size={TWO_DOTS_SIZE[size]} accessibilityLabel={accessibilityLabel ?? message} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );
};

export default Loading;
