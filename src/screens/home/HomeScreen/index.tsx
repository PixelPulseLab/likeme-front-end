import React, { useLayoutEffect } from 'react';
import { View } from 'react-native';
import { useAnalyticsScreen } from '@/analytics';
import { styles } from './styles';

type Props = {
  navigation: any;
  route: any;
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  useAnalyticsScreen({ screenName: 'Home', screenClass: 'HomeScreen' });
  useLayoutEffect(() => {
    navigation.replace('Summary' as never);
  }, [navigation]);

  return <View style={styles.container} />;
};

export default HomeScreen;
