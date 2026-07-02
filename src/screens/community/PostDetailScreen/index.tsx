import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
  type ListRenderItem,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShareContentUnavailable } from '@/components/ui/feedback';
import { GradientBackground, KeyboardAwareList, ScreenWithHeader } from '@/components/ui/layout';
import { SHARE_CONTENT_TYPES } from '@/constants/share';
import { PostCard } from '@/components/sections/community';
import { CommentCard } from '@/components/ui';
import ReplyInput from '@/components/ui/inputs/ReplyInput';
import { styles } from './styles';
import type { CommunityStackParamList } from '@/types/navigation';
import { COLORS, SPACING } from '@/constants';
import type { Post } from '@/types';
import { usePostReplies, useTranslation } from '@/hooks';
import type { PostReplyCardComment } from '@/hooks/community/usePostReplies';
import { communityService } from '@/services';
import { mapCommunityPostToPost } from '@/utils';
import { navigateToShareHome } from '@/utils/navigation/shareHomeNavigation';
import { logger } from '@/utils/logger';
import { shareContent } from '@/utils/share/shareContent';

type Props = {
  navigation: any;
  route: {
    params: CommunityStackParamList['PostDetail'];
  };
};

function postIdFromRouteParams(params: CommunityStackParamList['PostDetail']): string | null {
  if ('postId' in params) {
    const postId = params.postId?.trim();
    return postId || null;
  }
  const postId = params.post?.id?.trim();
  return postId || null;
}

const PostDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const routeParams = route.params;
  const initialPost = 'post' in routeParams ? routeParams.post : undefined;
  const routePostId = postIdFromRouteParams(routeParams);

  const [resolvedPost, setResolvedPost] = useState<Post | null>(initialPost ?? null);
  const [postLoadState, setPostLoadState] = useState<'idle' | 'loading' | 'error'>(initialPost ? 'idle' : 'loading');

  const post = resolvedPost;
  const [messageText, setMessageText] = useState('');
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();

  useEffect(() => {
    if (initialPost) {
      setResolvedPost(initialPost);
      setPostLoadState('idle');
      return;
    }

    if (!routePostId) {
      setResolvedPost(null);
      setPostLoadState('error');
      return;
    }

    let cancelled = false;
    setPostLoadState('loading');

    (async () => {
      try {
        const feed = await communityService.getCommunityPostSnapshot(routePostId);
        const raw = feed.posts?.[0];
        if (cancelled) {
          return;
        }
        if (!raw) {
          setResolvedPost(null);
          setPostLoadState('error');
          return;
        }
        const mapped = mapCommunityPostToPost(
          raw,
          feed.files,
          feed.users,
          feed.comments,
          feed.postChildren,
          feed.posts,
        );
        if (cancelled) {
          return;
        }
        if (!mapped) {
          setResolvedPost(null);
          setPostLoadState('error');
          return;
        }
        setResolvedPost(mapped);
        setPostLoadState('idle');
      } catch (error) {
        logger.warn('[PostDetailScreen] Falha ao carregar post compartilhado', {
          postId: routePostId,
          cause: error,
        });
        if (!cancelled) {
          setResolvedPost(null);
          setPostLoadState('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialPost, routePostId]);

  const handleBackPress = useCallback(() => {
    navigation?.goBack?.();
  }, [navigation]);

  const handleGoHome = useCallback(() => {
    navigateToShareHome(navigation);
  }, [navigation]);

  const handleSharePress = useCallback(async () => {
    const postId = post?.id ?? routePostId;
    if (!postId) {
      return;
    }
    await shareContent({ contentType: SHARE_CONTENT_TYPES.COMMUNITY_POST, postId }, { screenName: 'post_details' });
  }, [post?.id, routePostId]);

  const [likeBootstrap, setLikeBootstrap] = useState({
    initialLikes: post?.likes ?? 0,
    isLiked: post?.isLiked ?? false,
    myReactions: post?.myReactions,
  });
  const [snapshotMedia, setSnapshotMedia] = useState<Pick<Post, 'image' | 'videoUrl' | 'attachments'> | null>(null);

  useEffect(() => {
    if (!post) {
      return;
    }
    setLikeBootstrap({
      initialLikes: post.likes ?? 0,
      isLiked: post.isLiked ?? false,
      myReactions: post.myReactions,
    });
    setSnapshotMedia(null);
  }, [post?.id]);

  useEffect(() => {
    if (!post || post.poll) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const feed = await communityService.getCommunityPostSnapshot(post.id);
        const raw = feed.posts?.[0];
        if (cancelled || !raw) return;
        const mapped = mapCommunityPostToPost(
          raw,
          feed.files,
          feed.users,
          feed.comments,
          feed.postChildren,
          feed.posts,
        );
        if (cancelled || !mapped) return;
        setLikeBootstrap({
          initialLikes: mapped.likes ?? 0,
          isLiked: mapped.isLiked ?? false,
          myReactions: mapped.myReactions,
        });
        setSnapshotMedia({
          image: mapped.image,
          videoUrl: mapped.videoUrl,
          attachments: mapped.attachments,
        });
      } catch (error) {
        logger.warn('Sincronização do like no detalhe do post falhou:', { postId: post.id, cause: error });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [post?.id, post?.poll]);

  const {
    replyCardComments,
    addPostComment,
    isAddingPostComment,
    likeCount,
    isLiked,
    isLiking,
    togglePostLike,
    isLoadingComments,
    commentsError,
    retryComments,
  } = usePostReplies({
    postId: post?.id ?? routePostId ?? '',
    enabled: Boolean(post) && !post?.poll,
    initialLikes: likeBootstrap.initialLikes,
    isLiked: likeBootstrap.isLiked,
    myReactions: likeBootstrap.myReactions,
  });

  const listRef = useRef<FlatList<PostReplyCardComment>>(null);
  const commentInputRef = useRef<TextInput>(null);

  const pinListToTop = useCallback((animated = false) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated });
      });
    });
  }, []);

  const deactivateComposer = useCallback(() => {
    commentInputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  const postWithMedia = useMemo(() => {
    if (!post) {
      return null;
    }
    return {
      ...post,
      image: snapshotMedia?.image ?? post.image,
      videoUrl: snapshotMedia?.videoUrl ?? post.videoUrl,
      attachments: snapshotMedia?.attachments ?? post.attachments,
    };
  }, [post, snapshotMedia]);

  const postForRendering = useMemo(() => {
    if (!postWithMedia) {
      return null;
    }
    return {
      ...postWithMedia,
      comments: [] as Post['comments'],
      commentsCount: replyCardComments.length,
    };
  }, [postWithMedia, replyCardComments.length]);

  const isSendDisabled = isAddingPostComment || messageText.trim().length === 0;

  const handleSendComment = async () => {
    if (isSendDisabled) return;

    try {
      const ok = await addPostComment(messageText);
      if (ok) {
        setMessageText('');
      }
    } catch {
      // Mantém o texto caso falhe.
    }
  };

  const dismissKeyboard = deactivateComposer;

  useFocusEffect(
    useCallback(() => {
      deactivateComposer();
      pinListToTop(false);
    }, [deactivateComposer, pinListToTop, post?.id]),
  );

  const renderComment = useCallback<ListRenderItem<PostReplyCardComment>>(
    ({ item }) => (
      <Pressable onPress={dismissKeyboard} style={styles.commentRow}>
        <CommentCard comment={item} showReplies />
      </Pressable>
    ),
    [dismissKeyboard],
  );

  const commentKeyExtractor = useCallback((item: PostReplyCardComment) => item.id, []);

  const listHeader = useMemo(() => {
    if (!postForRendering) {
      return null;
    }
    return (
      <PostCard
        post={postForRendering}
        postEngagement={{ likeCount, isLiked, isLiking, togglePostLike }}
        forceContentExpanded
        styles={{
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      />
    );
  }, [postForRendering, likeCount, isLiked, isLiking, togglePostLike]);

  const listEmptyComponent = useMemo(() => {
    if (isLoadingComments) {
      return (
        <View style={styles.commentsStateContainer} accessibilityLabel={t('community.loadingComments')}>
          <ActivityIndicator size='small' color={COLORS.PRIMARY.PURE} />
          <Text style={styles.commentsStateLabel}>{t('community.loadingComments')}</Text>
        </View>
      );
    }

    if (commentsError) {
      return (
        <View style={styles.commentsStateContainer}>
          <Text style={styles.commentsStateLabel}>{t('community.commentsLoadError')}</Text>
          <Pressable
            style={({ pressed }) => [styles.retryButton, pressed ? { opacity: 0.85 } : undefined]}
            onPress={retryComments}
            accessibilityRole='button'
            accessibilityLabel={t('community.retryComments')}
          >
            <Text style={styles.retryButtonLabel}>{t('community.retryComments')}</Text>
          </Pressable>
        </View>
      );
    }

    return null;
  }, [commentsError, isLoadingComments, retryComments, t]);

  const commentComposer =
    post && !post.poll ? (
      <View style={[styles.composerFooter, bottomInset > 0 ? { paddingBottom: bottomInset } : null]}>
        <ReplyInput
          ref={commentInputRef}
          value={messageText}
          onChangeText={setMessageText}
          onSend={handleSendComment}
          sendDisabled={isSendDisabled}
          placeholder={t('chat.messagePlaceholder')}
          rowStyle={styles.composerInputRow}
        />
      </View>
    ) : undefined;

  if (postLoadState === 'loading') {
    return (
      <ScreenWithHeader
        navigation={navigation}
        headerProps={{
          showBackButton: true,
          onBackPress: handleBackPress,
        }}
        contentContainerStyle={styles.screenContent}
        contentBackgroundColor={COLORS.BACKGROUND_SECONDARY}
      >
        <View style={styles.commentsStateContainer}>
          <ActivityIndicator size='large' color={COLORS.PRIMARY.PURE} />
          <Text style={styles.commentsStateLabel}>{t('common.loading')}</Text>
        </View>
      </ScreenWithHeader>
    );
  }

  if (postLoadState === 'error') {
    return (
      <ScreenWithHeader
        navigation={navigation}
        headerProps={{
          showBackButton: true,
          onBackPress: handleBackPress,
        }}
        contentContainerStyle={styles.screenContent}
        contentBackgroundColor={COLORS.BACKGROUND_SECONDARY}
      >
        <ShareContentUnavailable
          contentType={SHARE_CONTENT_TYPES.COMMUNITY_POST}
          itemId={routePostId ?? undefined}
          screenName='post_details'
          onGoHome={handleGoHome}
        />
      </ScreenWithHeader>
    );
  }

  if (!post || !postForRendering) {
    return null;
  }

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        showBackButton: true,
        onBackPress: handleBackPress,
        showShareButton: true,
        onSharePress: handleSharePress,
      }}
      contentContainerStyle={styles.screenContent}
      contentBackgroundColor={COLORS.BACKGROUND_SECONDARY}
    >
      <View pointerEvents='none' style={styles.gradientBackground}>
        <GradientBackground />
      </View>

      <KeyboardAwareList<PostReplyCardComment>
        listRef={listRef}
        listStyle={styles.list}
        listContentContainerStyle={styles.listContent}
        includeBottomSafeAreaOnFooter={false}
        onScrollBeginDrag={dismissKeyboard}
        data={replyCardComments}
        renderItem={renderComment}
        keyExtractor={commentKeyExtractor}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmptyComponent}
        footer={commentComposer}
      />
    </ScreenWithHeader>
  );
};

export default PostDetailScreen;
