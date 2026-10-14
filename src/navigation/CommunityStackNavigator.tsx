import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CommunityScreen } from '@/screens/community';
import { PostDetailScreen } from '@/screens/community';
import type { CommunityStackParamList } from '@/types/navigation';
import { STACK_GESTURE_ENABLED, fastFadeTransition, forSimpleFade } from '@/navigation/stackTransitions';

const Stack = createStackNavigator<CommunityStackParamList>();

const CommunityStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      id='likeme-community-stack'
      screenOptions={{
        headerShown: false,
        gestureEnabled: STACK_GESTURE_ENABLED,
        cardStyleInterpolator: forSimpleFade,
        transitionSpec: fastFadeTransition,
      }}
    >
      <Stack.Screen name='CommunityList' component={CommunityScreen} />
      <Stack.Screen name='PostDetail' component={PostDetailScreen} />
    </Stack.Navigator>
  );
};

export default CommunityStackNavigator;
