import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GradientBackground, ScreenWithHeader } from '@/components/ui/layout';
import { IconButton } from '@/components/ui/buttons';
import { COLORS } from '@/constants';
import { chatService } from '@/services';
import { useBlockedUser, useUserAvatar, useTranslation } from '@/hooks';
import type { ChatStackParamList } from '@/types/navigation';
import { useAnalyticsScreen } from '@/analytics';
import { navigateRootStack } from '@/utils/navigation/rootStackNavigation';
import { styles } from './styles';

type DetailsNavigation = StackNavigationProp<ChatStackParamList, 'ChatDetails'>;

const ContactAvatar: React.FC<{ uri?: string }> = ({ uri }) => {
  if (uri) {
    return <CachedImage source={{ uri }} style={styles.avatar} />;
  }
  return (
    <View style={styles.avatarPlaceholder}>
      <Icon name='person' size={56} color={COLORS.TEXT_LIGHT} />
    </View>
  );
};

const ChatDetailsScreen: React.FC = () => {
  useAnalyticsScreen({ screenName: 'ChatDetails', screenClass: 'ChatDetailsScreen' });
  const { t } = useTranslation();
  const navigation = useNavigation<DetailsNavigation>();
  const route = useRoute<RouteProp<ChatStackParamList, 'ChatDetails'>>();
  const { channelId, channelName, channelAvatar } = route.params;

  const userAvatarUri = useUserAvatar();
  const { isBlocked, loading: checkingBlock, toggle: toggleBlock } = useBlockedUser(channelId);
  const [actionLoading, setActionLoading] = useState<'block' | 'leave' | null>(null);

  const handleMenuPress = () => {
    navigateRootStack(navigation, 'Profile');
  };

  const handleCartPress = () => {
    navigateRootStack(navigation, 'Cart');
  };

  const confirmAndExecute = (
    title: string,
    message: string,
    confirmLabel: string,
    destructive: boolean,
    action: () => Promise<void>,
    errorMessage: string,
  ) => {
    Alert.alert(title, message, [
      { text: t('chat.details.cancel'), style: 'cancel' },
      {
        text: confirmLabel,
        style: destructive ? 'destructive' : 'default',
        onPress: async () => {
          try {
            await action();
          } catch {
            Alert.alert(t('chat.details.error'), errorMessage);
          }
        },
      },
    ]);
  };

  const handleToggleBlock = () => {
    const title = isBlocked ? t('chat.details.unblockContact') : t('chat.details.blockContact');
    const message = isBlocked
      ? t('chat.details.confirmUnblock', { name: channelName })
      : t('chat.details.confirmBlock', { name: channelName });
    const errorMsg = isBlocked ? t('chat.details.errorUnblock') : t('chat.details.errorBlock');

    confirmAndExecute(
      title,
      message,
      t('chat.details.confirm'),
      !isBlocked,
      async () => {
        setActionLoading('block');
        try {
          await toggleBlock();
        } finally {
          setActionLoading(null);
        }
      },
      errorMsg,
    );
  };

  const handleLeaveChannel = () => {
    confirmAndExecute(
      t('chat.details.deleteConversation'),
      t('chat.details.confirmDelete', { name: channelName }),
      t('chat.details.delete'),
      true,
      async () => {
        setActionLoading('leave');
        try {
          await chatService.leaveChannel(channelId);
          navigation.popToTop();
        } catch (err) {
          setActionLoading(null);
          throw err;
        }
      },
      t('chat.details.errorDelete'),
    );
  };

  const isBlockActionBusy = actionLoading === 'block' || checkingBlock;
  const isLeaveActionBusy = actionLoading === 'leave';

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        showBackButton: false,
        showMenuWithAvatar: true,
        onMenuPress: handleMenuPress,
        userAvatarUri,
        showCartButton: true,
        onCartPress: handleCartPress,
      }}
      contentContainerStyle={styles.container}
    >
      <View pointerEvents='none' style={styles.gradientBackground}>
        <GradientBackground />
      </View>
      <View style={styles.subHeader}>
        <IconButton icon='chevron-left' onPress={() => navigation.goBack()} backgroundSize='medium' />
        <Text style={styles.title}>{t('chat.details.title')}</Text>
      </View>

      <View style={styles.content}>
        <ContactAvatar uri={channelAvatar} />
        <Text style={styles.contactName}>{channelName}</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.deleteButton}
          activeOpacity={0.8}
          onPress={handleLeaveChannel}
          disabled={isLeaveActionBusy}
        >
          {isLeaveActionBusy ? (
            <ActivityIndicator size='small' color={COLORS.WHITE} />
          ) : (
            <Text style={styles.deleteButtonText}>{t('chat.details.deleteConversation')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.blockButton}
          activeOpacity={0.8}
          onPress={handleToggleBlock}
          disabled={isBlockActionBusy}
        >
          {isBlockActionBusy ? (
            <ActivityIndicator size='small' color={COLORS.NEUTRAL.LOW.PURE} />
          ) : (
            <Text style={styles.blockButtonText}>
              {isBlocked ? t('chat.details.unblockContact') : t('chat.details.blockContact')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScreenWithHeader>
  );
};

export default ChatDetailsScreen;
