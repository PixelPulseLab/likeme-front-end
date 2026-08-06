import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TouchableOpacity, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { useTranslation } from '@/hooks/i18n';
import type { PostAttachment } from '@/types';
import { logger } from '@/utils/logger';
import { postImageGridLayout, postImageGridMoreCount } from '@/utils/community/postAttachmentImageLayout';
import {
  placementHasAttachments,
  postAttachmentsForPlacement,
  postHasAfterTextAttachments,
  postHasBeforeTextAttachments,
  postHasEndOfPostAttachments,
  type PostAttachmentPlacement,
  type PostMediaFields,
} from '@/utils/community/postAttachmentPlacement';
import PostAttachmentDownloadButton from './PostAttachmentDownloadButton';
import PostImageFullscreenModal from './PostImageFullscreenModal';
import { PostEmbeddedVideo } from '../PostCard/PostEmbeddedVideo';
import { attachmentStyles as styles } from './styles';

export type PostMediaSource = PostMediaFields;

type Props = {
  post: PostMediaSource;
  expanded?: boolean;
  compact?: boolean;
  placement?: PostAttachmentPlacement;
  mediaEnabled?: boolean;
  children?: React.ReactNode;
  onVideoPlaybackChange?: (open: boolean) => void;
};

const PostAttachmentsSection: React.FC<Props> = ({
  post,
  expanded = false,
  compact = false,
  placement = 'all',
  mediaEnabled = true,
  children,
  onVideoPlaybackChange,
}) => {
  const { t } = useTranslation();
  const mediaBundle = useMemo(() => postAttachmentsForPlacement(post), [post]);
  const { images, files, hasVideo } = mediaBundle;
  const primaryVideo = mediaBundle.videos[0];
  const imageUris = images.map((item) => item.url);

  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [videoPlaybackOpen, setVideoPlaybackOpen] = useState(false);
  const collapseVideoPlayback = useCallback(() => setVideoPlaybackOpen(false), []);

  const hasMedia =
    mediaEnabled &&
    (postHasBeforeTextAttachments(post) || postHasAfterTextAttachments(post) || postHasEndOfPostAttachments(post));

  const showBeforeText = mediaEnabled && (placement === 'all' || placement === 'beforeText');
  const showAfterText = mediaEnabled && (placement === 'all' || placement === 'afterText');
  const showEndOfPost = mediaEnabled && (placement === 'all' || placement === 'endOfPost');

  useEffect(() => {
    setVideoPlaybackOpen(false);
    setFullscreenIndex(null);
  }, [post.id, primaryVideo?.url]);

  useEffect(() => {
    onVideoPlaybackChange?.(videoPlaybackOpen);
  }, [onVideoPlaybackChange, videoPlaybackOpen]);

  if (!hasMedia) {
    return children ?? null;
  }

  if (!placementHasAttachments(placement, post)) {
    return null;
  }

  const imageContainerStyle = compact ? styles.mediaContainerCompact : styles.mediaContainer;
  const videoBlockContainerStyle = compact
    ? styles.mediaContainerCompact
    : [styles.mediaContainerVideo, styles.mediaContainer];

  const onPostImageError = (uri: string) => {
    logger.warn('Falha ao carregar imagem do post', { postId: post.id, uri });
  };

  const openImageAtIndex = (index: number) => {
    setFullscreenIndex(index);
  };

  const renderPostAttachmentImage = (params: {
    uri: string;
    recyclingKey: string;
    testID?: string;
    accessibilityLabel?: string;
    onAspectRatioResolved?: (aspectRatio: number) => void;
    placeholderStyle?: StyleProp<ImageStyle>;
  }) => (
    <PostAttachmentImage
      testID={params.testID}
      accessibilityLabel={params.accessibilityLabel}
      uri={params.uri}
      recyclingKey={params.recyclingKey}
      onError={() => onPostImageError(params.uri)}
      onAspectRatioResolved={params.onAspectRatioResolved}
      placeholderStyle={params.placeholderStyle}
    />
  );

  const renderImageCell = (
    image: PostAttachment,
    index: number,
    cellStyle: StyleProp<ViewStyle>,
    overlayCount?: number,
  ) => (
    <Pressable
      key={image.id}
      style={[styles.imageGridCell, cellStyle]}
      onPress={(event) => {
        event?.stopPropagation?.();
        openImageAtIndex(index);
      }}
      accessibilityRole='button'
      accessibilityLabel={
        overlayCount != null
          ? t('community.attachments.moreImages', { count: overlayCount })
          : t('community.attachments.openImageFullscreen')
      }
    >
      <CachedImage
        source={{ uri: image.url }}
        style={{ width: '100%', height: '100%' }}
        recyclingKey={`post-${post.id}-grid-${index}`}
        onError={() => onPostImageError(image.url)}
      />
      {overlayCount != null ? (
        <View style={styles.imageGridOverlay} pointerEvents='none'>
          <Text style={styles.imageGridOverlayText}>+{overlayCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );

  const renderImageGrid = () => {
    if (images.length === 0) return null;

    const layout = postImageGridLayout(images.length);
    const moreCount = postImageGridMoreCount(images.length);

    if (layout === 'single') {
      const image = images[0];
      return (
        <Pressable
          onPress={(event) => {
            event?.stopPropagation?.();
            openImageAtIndex(0);
          }}
          accessibilityRole='button'
          accessibilityLabel={t('community.attachments.openImageFullscreen')}
        >
          {renderPostAttachmentImage({
            testID: 'post-card-image-only',
            accessibilityLabel: t('community.attachments.postImage'),
            uri: image.url,
            recyclingKey: `post-${post.id}-media-0`,
          })}
        </Pressable>
      );
    }

    if (layout === 'pair') {
      return (
        <View style={styles.imageGrid}>
          {images.slice(0, 2).map((image, index) => renderImageCell(image, index, styles.imageGridPair))}
        </View>
      );
    }

    if (layout === 'triple') {
      return (
        <View style={styles.imageGrid}>
          {renderImageCell(images[0], 0, styles.imageGridTripleMain)}
          <View style={styles.imageGridTripleSide}>
            {images
              .slice(1, 3)
              .map((image, offset) => renderImageCell(image, offset + 1, styles.imageGridTripleSideCell))}
          </View>
        </View>
      );
    }

    const visible = images.slice(0, 4);
    return (
      <View style={styles.imageGrid}>
        {visible.map((image, index) => {
          const overlay = moreCount != null && index === 3 ? moreCount : undefined;
          return renderImageCell(image, index, styles.imageGridQuad, overlay);
        })}
      </View>
    );
  };

  const renderVideoBlock = () => {
    if (!primaryVideo || !showAfterText) return null;

    const posterUri = primaryVideo.posterUrl ?? (images.length <= 1 ? images[0]?.url : undefined);

    return (
      <View style={videoBlockContainerStyle}>
        <View style={styles.videoPosterInner}>
          {posterUri ? (
            renderPostAttachmentImage({
              testID: 'post-card-video-poster',
              accessibilityLabel: t('community.attachments.postImage'),
              uri: posterUri,
              recyclingKey: `post-${post.id}-video-poster`,
              placeholderStyle: styles.videoPosterPlaceholder,
            })
          ) : (
            <View style={styles.videoPlaceholder} />
          )}

          {!videoPlaybackOpen || compact ? (
            <TouchableOpacity
              style={styles.playOverlay}
              activeOpacity={0.9}
              onPress={(event) => {
                event?.stopPropagation?.();
                if (!compact) {
                  setVideoPlaybackOpen(true);
                }
              }}
              accessibilityRole='button'
              accessibilityLabel={t('community.attachments.playVideo')}
            >
              <Icon
                name='play-circle-outline'
                size={compact ? 28 : expanded ? 56 : 44}
                color='rgba(255,255,255,0.95)'
              />
            </TouchableOpacity>
          ) : null}

          {videoPlaybackOpen && !compact ? (
            <View style={styles.videoPlayerOverlay}>
              <PostEmbeddedVideo videoUri={primaryVideo.url} fillContainer onCollapse={collapseVideoPlayback} />
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  const renderBeforeTextBlock = () => {
    if (!showBeforeText || images.length === 0) return null;

    return (
      <View style={[styles.mediaImageBlock, images.length === 1 ? imageContainerStyle : undefined]}>
        {renderImageGrid()}
      </View>
    );
  };

  const renderAfterTextBlock = () => {
    if (!showAfterText || !hasVideo) return null;
    return renderVideoBlock();
  };

  const renderEndOfPostBlock = () => {
    if (!showEndOfPost || files.length === 0) return null;

    return (
      <View testID='post-attachment-file-list'>
        <Text style={styles.fileListSectionTitle}>{t('community.attachments.accessMaterials')}</Text>
        <PostAttachmentDownloadButton attachments={files} />
      </View>
    );
  };

  const ownsFullscreenGallery = placement === 'beforeText' || placement === 'all';

  return (
    <>
      <View style={compact ? undefined : styles.container} testID='post-attachments-section'>
        {renderBeforeTextBlock()}
        {children}
        {renderAfterTextBlock()}
        {renderEndOfPostBlock()}
      </View>

      {ownsFullscreenGallery ? (
        <PostImageFullscreenModal
          uris={imageUris}
          initialIndex={fullscreenIndex ?? 0}
          visible={fullscreenIndex != null}
          onClose={() => setFullscreenIndex(null)}
        />
      ) : null}
    </>
  );
};

type PostAttachmentImageProps = {
  uri: string;
  recyclingKey: string;
  testID?: string;
  accessibilityLabel?: string;
  onError?: () => void;
  onAspectRatioResolved?: (aspectRatio: number) => void;
  placeholderStyle?: StyleProp<ImageStyle>;
};

const PostAttachmentImage: React.FC<PostAttachmentImageProps> = ({
  uri,
  recyclingKey,
  testID,
  accessibilityLabel,
  onError,
  onAspectRatioResolved,
  placeholderStyle,
}) => {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  return (
    <CachedImage
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      source={{ uri }}
      style={[
        styles.postAttachmentImage,
        aspectRatio != null ? { aspectRatio } : placeholderStyle ?? styles.postAttachmentImageLoading,
      ]}
      contentFit='contain'
      recyclingKey={recyclingKey}
      onLoad={(event) => {
        const { width, height } = event.source;
        if (width > 0 && height > 0) {
          const resolvedAspectRatio = width / height;
          setAspectRatio(resolvedAspectRatio);
          onAspectRatioResolved?.(resolvedAspectRatio);
        }
      }}
      onError={onError}
    />
  );
};

export default PostAttachmentsSection;
