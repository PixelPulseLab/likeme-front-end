import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent, NativeSyntheticEvent, TextLayoutEventData } from 'react-native';
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Badge } from '@/components/ui';
import { CachedImage } from '@/components/ui/media/CachedImage';
import PollCard from '../PollCard';
import { usePost, usePostReplies, type PostLikeEngagement } from '@/hooks';
import { useTranslation } from '@/hooks/i18n';
import { styles as cardStyles } from './styles';
import { COLORS, COMMUNITY_POST_PREVIEW_MAX_LINES } from '@/constants';
import type { Post } from '@/types';
import {
  capitalizeWords,
  getContentPreviewFromPost,
  getPostContentTypeLabel,
  getPostTypeBadgeColor,
  getTitleFromPost,
} from '@/utils/community/postCardUtils';
import { isPollClosed } from '@/utils/community/pollClosure';
import PostAttachmentsSection from '../PostAttachments/PostAttachmentsSection';

type Props = {
  post: Post;
  onPress?: (post: Post) => void;
  onSharePress?: (post: Post) => void;
  category?: string;
  initialContentExpanded?: boolean;
  initialCommentsOpen?: boolean;
  onCommentsOpenChange?: (open: boolean) => void;
  styles?: StyleProp<ViewStyle>;
  forceContentExpanded?: boolean;
  /** Post fixado no topo da comunidade: mesmo layout do card normal com fundo e ícone de pin. */
  isPinned?: boolean;
  /** Quando definido (ex.: tela de detalhe com `usePostReplies`), evita segunda instância de likes. */
  postEngagement?: PostLikeEngagement;
};

type ViewProps = Props & { engagement: PostLikeEngagement };

const PostCardView: React.FC<ViewProps> = ({
  post,
  onPress,
  onSharePress,
  category: _category,
  initialContentExpanded = false,
  initialCommentsOpen = false,
  onCommentsOpenChange,
  styles: containerStyles,
  forceContentExpanded = false,
  isPinned = false,
  engagement,
}) => {
  const { t } = useTranslation();
  const [, setIsCommentsOpen] = useState(initialCommentsOpen);
  const [isContentExpanded, setIsContentExpanded] = useState(forceContentExpanded ? true : initialContentExpanded);
  const { activePoll, submitPollVote } = usePost(post);

  const { likeCount, isLiked, isLiking, togglePostLike } = engagement;

  const contentTypeLabel = getPostContentTypeLabel(post, t);
  const typeBadgeColor = getPostTypeBadgeColor(post);
  const postTitle = getTitleFromPost(post);
  const postPreviewContent = getContentPreviewFromPost(post);
  const commentsCount = post.commentsCount !== undefined ? post.commentsCount : post.comments?.length || 0;

  const [descriptionWidth, setDescriptionWidth] = useState<number | null>(null);
  const [textExceedsMaxLines, setTextExceedsMaxLines] = useState<boolean | null>(null);
  const previousDescriptionWidthRef = useRef<number | null>(null);

  useEffect(() => {
    setTextExceedsMaxLines(null);
    previousDescriptionWidthRef.current = null;
    setDescriptionWidth(null);
  }, [post.id, postPreviewContent]);

  useEffect(() => {
    if (descriptionWidth == null || descriptionWidth <= 0) {
      return;
    }
    const prev = previousDescriptionWidthRef.current;
    if (prev !== null && prev !== descriptionWidth) {
      setTextExceedsMaxLines(null);
    }
    previousDescriptionWidthRef.current = descriptionWidth;
  }, [descriptionWidth]);

  const handleDescriptionContainerLayout = (event: LayoutChangeEvent) => {
    const w = Math.round(event.nativeEvent.layout.width);
    if (w <= 0) return;
    setDescriptionWidth((prev) => (prev === w ? prev : w));
  };

  const handlePreviewMeasureLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
    const lineCount = event.nativeEvent.lines.length;
    setTextExceedsMaxLines(lineCount > COMMUNITY_POST_PREVIEW_MAX_LINES);
  };

  const collapsedPreviewNumberOfLines =
    isContentExpanded || forceContentExpanded
      ? undefined
      : textExceedsMaxLines === false
      ? undefined
      : COMMUNITY_POST_PREVIEW_MAX_LINES;

  const shouldMeasurePreviewLines =
    Boolean(postPreviewContent) &&
    !forceContentExpanded &&
    !isContentExpanded &&
    descriptionWidth != null &&
    descriptionWidth > 0 &&
    textExceedsMaxLines === null;

  const showPreviewExpandControl = Boolean(postPreviewContent) && !forceContentExpanded && textExceedsMaxLines === true;

  const handleCommentsPress = () => {
    setIsCommentsOpen((prev) => {
      const next = !prev;
      onCommentsOpenChange?.(next);
      return next;
    });
    onPress?.(post);
  };

  const handleSeeMorePress = () => {
    if (forceContentExpanded) return;
    setIsContentExpanded((prev) => !prev);
  };

  const handlePostPress = () => {
    onPress?.(post);
  };

  const hasPostDetailNavigation = onPress != null;
  const postHeaderPressableProps = hasPostDetailNavigation
    ? {
        onPress: handlePostPress,
        accessibilityRole: 'button' as const,
        accessibilityLabel: 'Ver detalhes do post',
      }
    : {};

  const descriptionBlock = postPreviewContent ? (
    <View
      style={{ position: 'relative' }}
      onLayout={handleDescriptionContainerLayout}
      testID='post-card-description-wrap'
    >
      <Text
        testID='post-card-description'
        style={cardStyles.description}
        {...(collapsedPreviewNumberOfLines != null ? { numberOfLines: collapsedPreviewNumberOfLines } : {})}
        ellipsizeMode='tail'
      >
        {postPreviewContent}
      </Text>
      {shouldMeasurePreviewLines ? (
        <Text
          testID='post-card-description-measure'
          style={[
            cardStyles.description,
            {
              position: 'absolute',
              opacity: 0,
              width: descriptionWidth ?? undefined,
              left: 0,
              top: 0,
              zIndex: -1,
            },
          ]}
          pointerEvents='none'
          accessible={false}
          importantForAccessibility='no-hide-descendants'
          onTextLayout={handlePreviewMeasureLayout}
        >
          {postPreviewContent}
        </Text>
      ) : null}
    </View>
  ) : null;

  const cardInner = (
    <>
      <View style={cardStyles.contentContainer}>
        <Pressable
          {...postHeaderPressableProps}
          style={({ pressed }) => [pressed && hasPostDetailNavigation ? { opacity: 0.92 } : undefined]}
        >
          <View style={cardStyles.badgeContainer}>
            <Badge label={contentTypeLabel} color={typeBadgeColor} />
          </View>

          <View style={[cardStyles.authorSection, isPinned && cardStyles.authorSectionPinned]}>
            <View style={cardStyles.authorRow}>
              {post.userAvatar ? (
                <CachedImage
                  source={{ uri: post.userAvatar }}
                  style={cardStyles.avatar}
                  recyclingKey={`post-${post.id}-avatar`}
                />
              ) : (
                <View style={cardStyles.avatarPlaceholder}>
                  <Icon name='person' size={12} color={COLORS.TEXT_LIGHT} />
                </View>
              )}
              {post.userName && <Text style={cardStyles.authorName}>{capitalizeWords(post.userName)}</Text>}
            </View>
            {isPinned ? (
              <Icon
                name='push-pin'
                size={24}
                color={COLORS.NEUTRAL.LOW.PURE}
                style={cardStyles.pinIcon}
                accessibilityLabel='Post fixado'
              />
            ) : null}
          </View>

          {postTitle ? (
            <View style={cardStyles.titleContainer}>
              <Text style={cardStyles.title}>{postTitle}</Text>
            </View>
          ) : null}
        </Pressable>

        {postPreviewContent || post.attachments?.length || post.image?.trim() || post.videoUrl?.trim() ? (
          <PostAttachmentsSection post={post} expanded={forceContentExpanded} mediaEnabled={!activePoll}>
            {descriptionBlock ? (
              <Pressable
                {...postHeaderPressableProps}
                style={({ pressed }) => [pressed && hasPostDetailNavigation ? { opacity: 0.92 } : undefined]}
              >
                {descriptionBlock}
              </Pressable>
            ) : null}
          </PostAttachmentsSection>
        ) : null}
      </View>

      {activePoll && (
        <PollCard
          poll={activePoll}
          onVote={submitPollVote}
          disabled={
            activePoll.isFinished || isPollClosed({ endedAt: activePoll.endedAt, isFinished: activePoll.isFinished })
          }
        />
      )}

      <View style={cardStyles.footer}>
        <View style={cardStyles.footerLeft}>
          {!activePoll && showPreviewExpandControl && (
            <Pressable
              testID='post-card-see-more'
              style={({ pressed }) => [cardStyles.seeMoreButton, pressed ? { opacity: 0.85 } : undefined]}
              onPress={(e) => {
                e?.stopPropagation?.();
                handleSeeMorePress();
              }}
              accessibilityRole='button'
              accessibilityLabel={isContentExpanded ? t('common.seeLess') : t('avatar.seeMore')}
            >
              <Text style={cardStyles.seeMoreButtonText}>
                {isContentExpanded ? t('common.seeLess') : t('avatar.seeMore')}
              </Text>
            </Pressable>
          )}
        </View>

        <View style={cardStyles.footerRight}>
          {!activePoll && (
            <Pressable
              style={({ pressed }) => [
                cardStyles.likeButton,
                isLiking && cardStyles.likeButtonDisabled,
                pressed && !isLiking ? { opacity: 0.85 } : undefined,
              ]}
              onPress={(e) => {
                e?.stopPropagation?.();
                togglePostLike();
              }}
              disabled={isLiking}
              accessibilityRole='button'
              accessibilityLabel='Like'
            >
              <Icon name={isLiked ? 'thumb-up' : 'thumb-up-off-alt'} size={18} color='#0154f8' />
              <Text style={cardStyles.likeCount}>{likeCount}</Text>
            </Pressable>
          )}

          {!activePoll && (
            <Pressable
              style={({ pressed }) => [cardStyles.commentsInfo, pressed ? { opacity: 0.85 } : undefined]}
              onPress={(e) => {
                e?.stopPropagation?.();
                handleCommentsPress();
              }}
              accessibilityRole='button'
              accessibilityLabel='Abrir comentários'
            >
              <Icon name='chat-bubble-outline' size={18} color='#0154f8' />
              <Text style={cardStyles.commentsCount}>{commentsCount}</Text>
            </Pressable>
          )}

          {!activePoll && onSharePress ? (
            <Pressable
              style={({ pressed }) => [cardStyles.shareButton, pressed ? { opacity: 0.85 } : undefined]}
              onPress={(e) => {
                e?.stopPropagation?.();
                onSharePress(post);
              }}
              accessibilityRole='button'
              accessibilityLabel='Compartilhar'
            >
              <Icon name='share' size={18} color='#0154f8' />
            </Pressable>
          ) : null}
        </View>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => onPress(post)}
        style={[cardStyles.container, isPinned && cardStyles.pinnedContainer, containerStyles]}
      >
        {cardInner}
      </Pressable>
    );
  }

  return (
    <View style={[cardStyles.container, isPinned && cardStyles.pinnedContainer, containerStyles]}>{cardInner}</View>
  );
};

const PostCardWithRepliesLikes: React.FC<Omit<Props, 'postEngagement'>> = (props) => {
  const { likeCount, isLiked, isLiking, togglePostLike } = usePostReplies({
    postId: props.post.id,
    enabled: false, // só queremos o estado do like, sem buscar comentários
    initialLikes: props.post.likes ?? 0,
    isLiked: props.post.isLiked ?? false,
    myReactions: props.post.myReactions,
  });

  return <PostCardView {...props} engagement={{ likeCount, isLiked, isLiking, togglePostLike }} />;
};

const PostCardInner: React.FC<Props> = (props) => {
  if (props.postEngagement) {
    return <PostCardView {...props} engagement={props.postEngagement} />;
  }
  return <PostCardWithRepliesLikes {...props} />;
};

/**
 * Memoizado para evitar re-renders em cascata ao rolar a lista do feed na
 * FlatList: enquanto o item do array `posts` mantém a mesma referencia (ou
 * `post.id`/contadores nao mudam), o card nao re-renderiza.
 *
 * Atencao: a comparacao default e shallow; estabilize `onPress` /
 * `onCommentsOpenChange` / `styles` no consumidor para preservar o ganho.
 */
const PostCard = React.memo(PostCardInner, (prev, next) => {
  if (prev.post !== next.post) {
    if (prev.post.id !== next.post.id) return false;
    if (prev.post.likes !== next.post.likes) return false;
    if (prev.post.isLiked !== next.post.isLiked) return false;
    if (prev.post.commentsCount !== next.post.commentsCount) return false;
    if (prev.post.comments?.length !== next.post.comments?.length) return false;
    if (prev.post.image !== next.post.image) return false;
    if (prev.post.videoUrl !== next.post.videoUrl) return false;
    if (prev.post.attachments?.length !== next.post.attachments?.length) return false;
    if (prev.post.userAvatar !== next.post.userAvatar) return false;
    if (prev.post.userName !== next.post.userName) return false;
  }
  return (
    prev.onPress === next.onPress &&
    prev.onSharePress === next.onSharePress &&
    prev.category === next.category &&
    prev.initialContentExpanded === next.initialContentExpanded &&
    prev.initialCommentsOpen === next.initialCommentsOpen &&
    prev.onCommentsOpenChange === next.onCommentsOpenChange &&
    prev.styles === next.styles &&
    prev.forceContentExpanded === next.forceContentExpanded &&
    prev.isPinned === next.isPinned &&
    prev.postEngagement === next.postEngagement
  );
});

PostCard.displayName = 'PostCard';

export default PostCard;
