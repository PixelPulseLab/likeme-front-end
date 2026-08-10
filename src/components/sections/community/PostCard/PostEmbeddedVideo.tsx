import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Video, { type OnLoadData, type OnVideoErrorData, type VideoRef } from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialIcons';

type Props = {
  videoUri: string;
  fillContainer?: boolean;
  onCollapse: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  onPlaybackError?: (error: OnVideoErrorData) => void;
};

function videoSourceFromUri(videoUri: string): { uri: string; type?: 'm3u8' } {
  if (/\.m3u8(\?|$)/i.test(videoUri)) {
    return { uri: videoUri, type: 'm3u8' };
  }
  return { uri: videoUri };
}

const PostEmbeddedVideoInner: React.FC<Props> = ({
  videoUri,
  fillContainer = false,
  onCollapse,
  containerStyle,
  onPlaybackError,
}) => {
  const videoRef = useRef<VideoRef>(null);
  const onCollapseRef = useRef(onCollapse);
  const onPlaybackErrorRef = useRef(onPlaybackError);

  onCollapseRef.current = onCollapse;
  onPlaybackErrorRef.current = onPlaybackError;

  const collapse = useCallback(() => {
    videoRef.current?.pause();
    onCollapseRef.current();
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        videoRef.current?.pause();
        onCollapseRef.current();
      };
    }, []),
  );

  const onVideoLoad = useCallback((_data: OnLoadData) => {
    videoRef.current?.resume();
  }, []);

  const onVideoError = useCallback((error: OnVideoErrorData) => {
    onPlaybackErrorRef.current?.(error);
  }, []);

  return (
    <View style={[fillContainer ? styles.fillContainer : styles.container, containerStyle]}>
      <Video
        ref={videoRef}
        source={videoSourceFromUri(videoUri)}
        style={styles.video}
        controls
        paused={false}
        resizeMode='contain'
        repeat={false}
        ignoreSilentSwitch='ignore'
        playInBackground={false}
        onLoad={onVideoLoad}
        onError={onVideoError}
      />
      <Pressable
        style={styles.collapseTouch}
        onPress={(e) => {
          e?.stopPropagation?.();
          collapse();
        }}
        accessibilityRole='button'
        accessibilityLabel='Voltar à capa do vídeo'
      >
        <View style={styles.collapseInner}>
          <Icon name='keyboard-arrow-down' size={26} color='rgba(255,255,255,0.95)' />
        </View>
      </Pressable>
    </View>
  );
};

export const PostEmbeddedVideo: React.FC<Props> = (props) => <PostEmbeddedVideoInner key={props.videoUri} {...props} />;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  fillContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  collapseTouch: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
  collapseInner: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    padding: 4,
  },
});
