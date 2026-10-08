import React from 'react';
import { View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useAnalyticsScreen } from '@/analytics';
import type { RootStackParamList } from '@/types/navigation';
import { useOnboardingRedirect } from '@/hooks';
import { styles } from './styles';

type Props = StackScreenProps<RootStackParamList, 'Authenticated'>;

const AuthenticatedScreen: React.FC<Props> = ({ navigation }) => {
  useAnalyticsScreen({ screenName: 'Authenticated', screenClass: 'AuthenticatedScreen' });
  useOnboardingRedirect(navigation);

  return <View style={styles.container} accessibilityLabel='Carregando' />;
};

export default AuthenticatedScreen;
