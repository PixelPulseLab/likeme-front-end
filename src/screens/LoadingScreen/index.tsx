import React, { useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Loading } from '@/components/ui';
import { useTranslation } from '@/hooks/i18n';
import { useAnalyticsScreen } from '@/analytics';
import { preloadAppLoadingTarget } from '@/utils/navigation/appLoadingNavigation';
import type { RootStackParamList } from '@/types/navigation';
import type { StackNavigationProp } from '@react-navigation/stack';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'AppLoading'>;
  route: { params: RootStackParamList['AppLoading'] };
};

const LoadingScreen: React.FC<Props> = ({ navigation, route }) => {
  useAnalyticsScreen({ screenName: 'AppLoading', screenClass: 'LoadingScreen' });
  const { t } = useTranslation();
  const loadingMessage = route.params?.loadingMessage;
  const target = route.params?.target;

  useEffect(() => {
    if (!target?.name) {
      navigation.goBack();
      return undefined;
    }

    preloadAppLoadingTarget(target.name);

    const task = InteractionManager.runAfterInteractions(() => {
      if (target.name === 'Marketplace') {
        navigation.replace('Marketplace', target.params as never);
        return;
      }
      if (!('params' in target)) {
        navigation.replace(target.name);
        return;
      }
      navigation.replace(target.name, target.params as never);
    });

    return () => task.cancel();
  }, [navigation, target]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Loading message={loadingMessage} accessibilityLabel={loadingMessage ?? t('common.loading')} fullScreen />
    </SafeAreaView>
  );
};

export default LoadingScreen;
