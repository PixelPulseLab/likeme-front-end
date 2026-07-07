import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SearchBar } from '@/components/ui';
import { GradientBackground, ScreenWithHeader } from '@/components/ui/layout';
import { useTranslation } from '@/hooks/i18n';
import { useChat, useFeatureFlag, useMenuItems } from '@/hooks';
import { useFloatingMenuActions } from '@/contexts/FloatingMenuContext';
import type { ChatConversation } from '@/hooks';
import { LogoMini } from '@/assets/ui';
import { COLORS, FEATURE_FLAGS } from '@/constants';
import { storageService } from '@/services';
import type { ChatStackParamList } from '@/types/navigation';
import { useAnalyticsScreen } from '@/analytics';
import { navigateToCommunity } from '@/utils/navigation/communityNavigation';
import { navigateRootStack, rootStackNavigationFrom } from '@/utils/navigation/rootStackNavigation';
import { styles } from './styles';

type ChatListNavigationProp = StackNavigationProp<ChatStackParamList, 'ChatList'>;

type Props = {
  navigation: ChatListNavigationProp;
};

const ChatListScreen: React.FC<Props> = () => {
  useAnalyticsScreen({ screenName: 'ChatList', screenClass: 'ChatListScreen' });
  const { t } = useTranslation();
  const navigation = useNavigation<ChatListNavigationProp>();
  const rootNavigation = rootStackNavigationFrom(navigation) ?? navigation;
  const { isEnabled: isChatEnabled, isLoading: isChatFlagLoading } = useFeatureFlag(FEATURE_FLAGS.CHAT_ENABLED);
  const [searchQuery, setSearchQuery] = useState('');
  const [userAvatarUri, setUserAvatarUri] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState('');

  const { conversations, loading, refresh } = useChat({ searchQuery });
  const menuItems = useMenuItems(navigation);
  const { setMenu } = useFloatingMenuActions();

  useFocusEffect(
    useCallback(() => {
      setMenu(menuItems, 'chat');
    }, [menuItems, setMenu]),
  );

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!isChatFlagLoading && !isChatEnabled) {
      Alert.alert('Chat indisponivel', 'Esta funcionalidade esta desativada no momento.');
      navigateToCommunity(rootNavigation);
    }
  }, [isChatEnabled, isChatFlagLoading, rootNavigation]);

  useEffect(() => {
    const loadUser = async () => {
      const user = await storageService.getUser();
      setUserAvatarUri(user?.picture ?? null);
      setCurrentUserName(user?.name?.trim() || user?.nickname?.trim() || '');
    };
    loadUser();
  }, []);

  const getConversationDisplayName = (conversationName: string) => {
    const nameParts = conversationName
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean);

    if (nameParts.length < 2) return conversationName;

    const normalizedCurrentUserName = currentUserName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    const otherParticipant = nameParts.find((namePart) => {
      const normalizedNamePart = namePart
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      return normalizedNamePart !== normalizedCurrentUserName;
    });

    return otherParticipant || nameParts[0];
  };

  const handleCartPress = () => {
    navigateRootStack(rootNavigation, 'Cart');
  };

  const handleMenuPress = () => {
    navigateRootStack(rootNavigation, 'Profile');
  };

  const handleConversationPress = (conversation: ChatConversation) => {
    navigation.navigate('ChatConversation', {
      channelId: conversation.id,
      channelName: conversation.name,
      channelAvatar: conversation.avatar,
    });
  };

  const renderAvatar = (conversation: ChatConversation) => {
    if (conversation.showLogo && !conversation.avatar) {
      return (
        <View style={styles.likemeAvatar}>
          <LinearGradient
            colors={['#FF6B6B', '#4ECDC4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.likemeAvatarGradient}
          />
        </View>
      );
    }

    if (conversation.avatar) {
      return <CachedImage source={{ uri: conversation.avatar }} style={styles.avatar} />;
    }

    return (
      <View style={styles.avatarPlaceholder}>
        <Icon name='person' size={32} color={COLORS.TEXT_LIGHT} />
      </View>
    );
  };

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
      <View style={styles.searchBarContainer}>
        <SearchBar
          placeholder='Search'
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSearchPress={() => {
            /* noop */
          }}
          showFilterButton={false}
        />
      </View>

      {/* Conversations List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('chat.yourConversations')}</Text>
        </View>

        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size='large' color={COLORS.PRIMARY.PURE} />
          </View>
        )}

        {!loading && conversations.length === 0 && (
          <View style={styles.centerContainer}>
            <Icon name='chat-bubble-outline' size={48} color={COLORS.TEXT_LIGHT} />
            <Text style={styles.emptyText}>{t('chat.noConversations')}</Text>
          </View>
        )}

        {conversations.length > 0 && (
          <View style={styles.conversationsContainer}>
            {conversations.map((conversation, index) => (
              <TouchableOpacity
                key={conversation.id}
                style={[styles.conversationItem, index < conversations.length - 1 && styles.conversationItemBorder]}
                onPress={() => handleConversationPress(conversation)}
                activeOpacity={0.7}
              >
                {renderAvatar(conversation)}

                <View style={styles.conversationInfo}>
                  <View style={styles.conversationHeader}>
                    <View style={styles.conversationNameContainer}>
                      {conversation.showLogo && (
                        <View style={styles.likemeLogoContainer}>
                          <LogoMini width={83} height={15} />
                        </View>
                      )}
                      <Text style={styles.conversationName} numberOfLines={1}>
                        {getConversationDisplayName(conversation.name)}
                      </Text>
                    </View>
                    <Text style={styles.conversationTimestamp}>{conversation.timestamp}</Text>
                  </View>

                  <View style={styles.conversationMessageRow}>
                    <View style={styles.conversationMessageContainer}>
                      <Text
                        style={[
                          styles.conversationMessage,
                          conversation.unreadCount > 0 && styles.conversationMessageUnread,
                        ]}
                        numberOfLines={2}
                      >
                        {conversation.lastMessage}
                      </Text>
                    </View>
                    {conversation.unreadCount > 0 && (
                      <View style={styles.notificationBadge}>
                        <Text style={styles.notificationText}>{conversation.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenWithHeader>
  );
};

export default ChatListScreen;
