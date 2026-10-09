import React, { useLayoutEffect } from 'react';
import { View } from 'react-native';
import { StackActions } from '@react-navigation/native';
import { useAnalyticsScreen } from '@/analytics';
import { styles } from './styles';

type Props = {
  navigation: any;
  route: any;
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  useAnalyticsScreen({ screenName: 'Home', screenClass: 'HomeScreen' });
  useLayoutEffect(() => {
    const navigatorKey = navigation.getState?.()?.key;
    if (typeof navigatorKey === 'string' && navigatorKey.length > 0) {
      // REPLACE sem target troca a rota focada. A Home fica sob a PDP do convite.
      navigation.dispatch({
        ...StackActions.replace('Summary'),
        target: navigatorKey,
      });
      return;
    }
    navigation.replace('Summary');
  }, [navigation]);

  return <View style={styles.container} />;
};

export default HomeScreen;
