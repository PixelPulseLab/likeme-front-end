import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ChatListScreen, ChatScreen, ChatDetailsScreen } from '@/screens/chat';
import type { ChatStackParamList } from '@/types/navigation';
import { STACK_GESTURE_ENABLED, fastFadeTransition, forSimpleFade } from '@/navigation/stackTransitions';

const Stack = createStackNavigator<ChatStackParamList>();

const ChatStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      id='likeme-chat-stack'
      screenOptions={{
        headerShown: false,
        gestureEnabled: STACK_GESTURE_ENABLED,
        cardStyleInterpolator: forSimpleFade,
        transitionSpec: fastFadeTransition,
      }}
    >
      <Stack.Screen name='ChatList' component={ChatListScreen} />
      <Stack.Screen name='ChatConversation' component={ChatScreen} />
      <Stack.Screen name='ChatDetails' component={ChatDetailsScreen} />
    </Stack.Navigator>
  );
};

export default ChatStackNavigator;
