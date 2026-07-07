import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  type ListRenderItem,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { KeyboardAwareList, ScreenWithHeader } from '@/components/ui/layout';
import { IconButton } from '@/components/ui/buttons';
import { MessageBubble } from '@/components/ui/chat';
import { COLORS, FEATURE_FLAGS } from '@/constants';
import { chatService, storageService } from '@/services';
import { useBlockedUser, useUserAvatar, useTranslation, useChat, useFeatureFlag } from '@/hooks';
import type { ChatStackParamList } from '@/types/navigation';
import { useAnalyticsScreen } from '@/analytics';
import { logger } from '@/utils/logger';
import { navigateToCommunity } from '@/utils/navigation/communityNavigation';
import { navigateRootStack } from '@/utils/navigation/rootStackNavigation';
import { styles } from './styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ChatMessage {
  id: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
}

type ChatNavigation = StackNavigationProp<ChatStackParamList, 'ChatConversation'>;

function mapRawMessage(msg: any, currentUserId: string): ChatMessage {
  return {
    id: msg.messageId || msg._id,
    text: msg.data?.text || '',
    timestamp: msg.createdAt || msg.editedAt || '',
    isOwn: msg.creatorId === currentUserId || msg.userId === currentUserId,
  };
}

function sortByTimestampAsc(a: ChatMessage, b: ChatMessage): number {
  return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
}

const ChatScreen: React.FC = () => {
  useAnalyticsScreen({ screenName: 'Chat', screenClass: 'ChatScreen' });
  const { t } = useTranslation();
  const navigation = useNavigation<ChatNavigation>();
  const { isEnabled: isChatEnabled, isLoading: isChatFlagLoading } = useFeatureFlag(FEATURE_FLAGS.CHAT_ENABLED);
  const route = useRoute<RouteProp<ChatStackParamList, 'ChatConversation'>>();
  const { channelId, channelName, channelAvatar, channelDescription, targetAdvertiserId, initialMessage } =
    route.params;

  const isComposeMode = !channelId && !!targetAdvertiserId;

  const { refresh: refreshChatList } = useChat();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const messagesListRef = useRef<FlatList<ChatMessage> | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(!isComposeMode);
  const [resolvingChannel, setResolvingChannel] = useState(isComposeMode);
  const [messageText, setMessageText] = useState(isComposeMode ? initialMessage ?? '' : '');
  const resolvingChannelRef = useRef(false);

  // Se entrou em modo "conversar com" (targetAdvertiserId), resolve o canal (existente ou novo) e carrega o chat
  useEffect(() => {
    if (!isComposeMode || !targetAdvertiserId || resolvingChannelRef.current) return;
    resolvingChannelRef.current = true;
    setResolvingChannel(true);
    chatService
      .createChannel(targetAdvertiserId)
      .then((result) => {
        if (result.success && result.data?.channelId) {
          resolvingChannelRef.current = false;
          refreshChatList();
          navigation.replace('ChatConversation', {
            channelId: result.data.channelId,
            channelName,
            channelAvatar,
            channelDescription,
            initialMessage: initialMessage ?? undefined,
          });
        }
        setResolvingChannel(false);
      })
      .catch(() => {
        resolvingChannelRef.current = false;
        setResolvingChannel(false);
      });
  }, [isComposeMode, targetAdvertiserId, channelName, channelAvatar, channelDescription, initialMessage, navigation]);

  const userAvatarUri = useUserAvatar();
  const { isBlocked, checkStatus: recheckBlocked } = useBlockedUser(channelId ?? '');

  useFocusEffect(
    useCallback(() => {
      recheckBlocked();
    }, [recheckBlocked]),
  );

  useEffect(() => {
    if (!isChatFlagLoading && !isChatEnabled) {
      Alert.alert('Chat indisponivel', 'Esta funcionalidade esta desativada no momento.');
      navigateToCommunity(navigation);
    }
  }, [isChatEnabled, isChatFlagLoading, navigation]);

  const loadMessages = useCallback(async () => {
    if (!channelId) return;
    try {
      setLoading(true);
      const response = await chatService.getChannelMessages(channelId);
      if (response.success && response.data) {
        const { messages: rawMessages, currentUserId: backendUserId } = response.data;
        if (rawMessages) {
          const mapped = rawMessages.map((msg: any) => mapRawMessage(msg, backendUserId));
          setMessages(mapped.sort(sortByTimestampAsc));
        }
      }
    } catch (err) {
      logger.error('[ChatScreen] Erro ao carregar mensagens', err);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    if (!isComposeMode) loadMessages();
  }, [loadMessages, isComposeMode]);

  // Pré-preenche a mensagem sugerida uma vez ao abrir um canal (ex.: após "Conversar com")
  const initialMessageSetRef = useRef(false);
  useEffect(() => {
    if (channelId && initialMessage && !initialMessageSetRef.current) {
      initialMessageSetRef.current = true;
      setMessageText(initialMessage);
    }
  }, [channelId, initialMessage]);

  useEffect(() => {
    if (messages.length > 0) {
      const handle = setTimeout(() => messagesListRef.current?.scrollToEnd({ animated: false }), 100);
      return () => clearTimeout(handle);
    }
    return undefined;
  }, [messages]);

  const handleMenuPress = () => {
    navigateRootStack(navigation, 'Profile');
  };

  const handleCartPress = () => {
    navigateRootStack(navigation, 'Cart');
  };

  const [sending, setSending] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');

  const isSendDisabled = useMemo(
    () => isBlocked || sending || resolvingChannel || messageText.trim().length === 0,
    [isBlocked, sending, resolvingChannel, messageText],
  );

  useEffect(() => {
    const loadCurrentUser = async () => {
      const user = await storageService.getUser();
      setCurrentUserName(user?.name?.trim() || user?.nickname?.trim() || '');
    };
    loadCurrentUser();
  }, []);

  const displayChannelName = useMemo(() => {
    if (!channelName) return '';
    const nameParts = channelName
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean);

    if (nameParts.length < 2) return channelName;

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
  }, [channelName, currentUserName]);

  const displayChannelDescription = useMemo(() => {
    if (channelDescription?.trim()) {
      return channelDescription.trim();
    }
    return t('community.specialistLabel');
  }, [channelDescription, t]);

  const handleSendMessage = useCallback(async () => {
    const trimmed = messageText.trim();
    if (trimmed.length === 0 || sending) return;

    if (isComposeMode && targetAdvertiserId) {
      setSending(true);
      try {
        const result = await chatService.createChannel(targetAdvertiserId, trimmed);
        if (result.success && result.data?.channelId) {
          setMessageText('');
          refreshChatList();
          navigation.replace('ChatConversation', {
            channelId: result.data.channelId,
            channelName,
            channelAvatar,
            channelDescription,
          });
        } else {
          Alert.alert(t('chat.errorTitle'), result.error || t('chat.sendError'));
        }
      } catch {
        Alert.alert(t('chat.errorTitle'), t('chat.sendError'));
      } finally {
        setSending(false);
      }
      return;
    }

    if (!channelId) return;

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      text: trimmed,
      timestamp: new Date().toISOString(),
      isOwn: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setMessageText('');
    setSending(true);

    try {
      const response = await chatService.sendMessage(channelId, trimmed);
      if (!response.success) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setMessageText(trimmed);
        Alert.alert(t('chat.errorTitle'), t('chat.sendError'));
      } else {
        refreshChatList();
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setMessageText(trimmed);
      Alert.alert(t('chat.errorTitle'), t('chat.sendError'));
    } finally {
      setSending(false);
    }
  }, [
    messageText,
    sending,
    channelId,
    isComposeMode,
    targetAdvertiserId,
    channelName,
    channelAvatar,
    channelDescription,
    navigation,
    t,
    refreshChatList,
  ]);

  const navigateToDetails = () => {
    if (!channelId) return;
    navigation.navigate('ChatDetails', { channelId, channelName, channelAvatar });
  };

  const renderMessage = useCallback<ListRenderItem<ChatMessage>>(
    ({ item }) => <MessageBubble text={item.text} timestamp={item.timestamp} isOwn={item.isOwn} />,
    [],
  );

  const messageKeyExtractor = useCallback((msg: ChatMessage) => msg.id, []);

  const listEmptyComponent = useMemo(() => {
    if (loading || resolvingChannel) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size='large' color={COLORS.PRIMARY.PURE} />
          {resolvingChannel ? (
            <Text style={[styles.emptyText, { marginTop: 12 }]}>{t('chat.loadingChannel')}</Text>
          ) : null}
        </View>
      );
    }
    return (
      <View style={styles.centerContainer}>
        <Icon name='chat-bubble-outline' size={48} color={COLORS.TEXT_LIGHT} />
        <Text style={styles.emptyText}>{t('chat.noMessages')}</Text>
      </View>
    );
  }, [loading, resolvingChannel, t]);

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
      <View style={styles.chatHeader}>
        <IconButton icon='chevron-left' onPress={() => navigation.goBack()} backgroundSize='medium' />
        <TouchableOpacity
          style={styles.headerInfo}
          activeOpacity={0.7}
          onPress={channelId ? navigateToDetails : undefined}
          disabled={!channelId}
        >
          {channelAvatar ? (
            <CachedImage source={{ uri: channelAvatar }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Icon name='person' size={28} color={COLORS.TEXT_LIGHT} />
            </View>
          )}
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerName} numberOfLines={1}>
              {displayChannelName}
            </Text>
            <Text style={styles.headerDescription} numberOfLines={1}>
              {displayChannelDescription}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <KeyboardAwareList<ChatMessage>
        listStyle={styles.messagesContainer}
        listContentContainerStyle={styles.messagesContent}
        includeBottomSafeAreaOnFooter={false}
        listRef={messagesListRef}
        data={resolvingChannel ? [] : messages}
        renderItem={renderMessage}
        keyExtractor={messageKeyExtractor}
        ListEmptyComponent={listEmptyComponent}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={11}
        removeClippedSubviews
        footer={
          <View
            style={[
              styles.inputContainer,
              bottomInset > 0 ? { paddingBottom: bottomInset } : null,
              isBlocked && styles.inputContainerDisabled,
            ]}
          >
            <IconButton
              icon='add'
              variant='dark'
              onPress={() => undefined}
              backgroundSize='medium'
              disabled={isBlocked}
            />
            <View style={[styles.textInputWrapper, isBlocked && styles.textInputWrapperDisabled]}>
              <TextInput
                style={styles.textInput}
                placeholder={isBlocked ? t('chat.blockedPlaceholder') : t('chat.messagePlaceholder')}
                placeholderTextColor={isBlocked ? 'rgba(110,106,106,0.6)' : 'rgba(253,251,238,0.8)'}
                value={messageText}
                onChangeText={setMessageText}
                multiline
                editable={!isBlocked}
              />
            </View>

            <IconButton
              icon='send'
              variant='dark'
              onPress={handleSendMessage}
              backgroundSize='medium'
              disabled={isSendDisabled}
            />
          </View>
        }
      />
    </ScreenWithHeader>
  );
};

export default ChatScreen;
