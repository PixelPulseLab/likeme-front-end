import React, { useRef, useState } from 'react';
import { Animated, Text, type ImageSourcePropType, type LayoutChangeEvent } from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  State,
  type PanGestureHandlerGestureEvent,
  type PanGestureHandlerStateChangeEvent,
  type PinchGestureHandlerGestureEvent,
  type PinchGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { BUBBLE_MAP_SCALE, boundsForBubbleMap, bubbleMapFisheyeScale, clampBubbleMapCamera } from './camera';
import { styles } from './styles';

export type BubbleMapItem = {
  id: string;
  x: number;
  y: number;
  radius: number;
  source: ImageSourcePropType;
  label: string;
};

type Props = {
  bubbles: BubbleMapItem[];
  testID?: string;
};

const BubbleMap: React.FC<Props> = ({ bubbles, testID }) => {
  const pinchRef = useRef<PinchGestureHandler>(null);
  const panRef = useRef<PanGestureHandler>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const viewport = useRef(viewportSize);
  const camera = useRef({ x: 0, y: 0, scale: BUBBLE_MAP_SCALE.initial });
  const panOrigin = useRef({ x: 0, y: 0 });
  const pinchOrigin = useRef({ x: 0, y: 0, scale: BUBBLE_MAP_SCALE.initial });
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(BUBBLE_MAP_SCALE.initial)).current;
  const fisheyeById = useRef<Record<string, Animated.Value>>({}).current;
  const bounds = boundsForBubbleMap(bubbles);

  const fisheyeFor = (id: string) => {
    if (fisheyeById[id] == null) {
      fisheyeById[id] = new Animated.Value(1);
    }
    return fisheyeById[id];
  };

  const applyCamera = (x: number, y: number, nextScale: number) => {
    const clamped = clampBubbleMapCamera(x, y, nextScale, viewport.current, bounds);
    camera.current = clamped;
    translateX.setValue(clamped.x);
    translateY.setValue(clamped.y);
    scale.setValue(clamped.scale);
    for (const bubble of bubbles) {
      fisheyeFor(bubble.id).setValue(
        bubbleMapFisheyeScale(
          bubble.x,
          bubble.y,
          clamped.x,
          clamped.y,
          clamped.scale,
          viewport.current.width,
          viewport.current.height,
        ),
      );
    }
  };

  const onMapLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width === viewport.current.width && height === viewport.current.height) {
      return;
    }
    viewport.current = { width, height };
    setViewportSize({ width, height });
    applyCamera(camera.current.x, camera.current.y, camera.current.scale);
  };

  const onPanHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    const { state, oldState, translationX, translationY } = event.nativeEvent;
    if (state === State.BEGAN || (state === State.ACTIVE && oldState !== State.ACTIVE)) {
      panOrigin.current = { x: camera.current.x, y: camera.current.y };
    }
    if (oldState === State.ACTIVE && (state === State.END || state === State.CANCELLED || state === State.FAILED)) {
      applyCamera(panOrigin.current.x + translationX, panOrigin.current.y + translationY, camera.current.scale);
    }
  };

  const onPanGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    applyCamera(
      panOrigin.current.x + event.nativeEvent.translationX,
      panOrigin.current.y + event.nativeEvent.translationY,
      camera.current.scale,
    );
  };

  const applyPinchCamera = (eventScale: number, focalX: number, focalY: number) => {
    const nextScale = pinchOrigin.current.scale * eventScale;
    const ratio = nextScale / pinchOrigin.current.scale;
    const focalOffsetX = focalX - viewport.current.width / 2;
    const focalOffsetY = focalY - viewport.current.height / 2;
    applyCamera(
      pinchOrigin.current.x * ratio + focalOffsetX * (1 - ratio),
      pinchOrigin.current.y * ratio + focalOffsetY * (1 - ratio),
      nextScale,
    );
  };

  const onPinchHandlerStateChange = (event: PinchGestureHandlerStateChangeEvent) => {
    const { state, oldState, scale: eventScale, focalX, focalY } = event.nativeEvent;
    if (state === State.BEGAN || (state === State.ACTIVE && oldState !== State.ACTIVE)) {
      pinchOrigin.current = { x: camera.current.x, y: camera.current.y, scale: camera.current.scale };
    }
    if (oldState === State.ACTIVE && (state === State.END || state === State.CANCELLED || state === State.FAILED)) {
      applyPinchCamera(eventScale, focalX, focalY);
    }
  };

  const onPinchGestureEvent = (event: PinchGestureHandlerGestureEvent) => {
    const { scale: eventScale, focalX, focalY } = event.nativeEvent;
    applyPinchCamera(eventScale, focalX, focalY);
  };

  return (
    <PinchGestureHandler
      ref={pinchRef}
      simultaneousHandlers={panRef}
      onGestureEvent={onPinchGestureEvent}
      onHandlerStateChange={onPinchHandlerStateChange}
    >
      <Animated.View style={styles.map} testID={testID} onLayout={onMapLayout}>
        <PanGestureHandler
          ref={panRef}
          simultaneousHandlers={pinchRef}
          minPointers={1}
          maxPointers={1}
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanHandlerStateChange}
        >
          <Animated.View style={styles.canvas}>
            <Animated.View style={[styles.canvas, { transform: [{ translateX }, { translateY }, { scale }] }]}>
              {bubbles.map((bubble) => {
                const diameter = bubble.radius * 2;
                return (
                  <Animated.View
                    key={bubble.id}
                    style={[
                      styles.bubble,
                      {
                        left: viewportSize.width / 2 + bubble.x - bubble.radius,
                        top: viewportSize.height / 2 + bubble.y - bubble.radius,
                        width: diameter,
                        height: diameter,
                        transform: [{ scale: fisheyeFor(bubble.id) }],
                      },
                    ]}
                  >
                    <CachedImage source={bubble.source} style={styles.bubbleImage} contentFit='contain' />
                    <Text style={styles.bubbleLabel}>{bubble.label}</Text>
                  </Animated.View>
                );
              })}
            </Animated.View>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </PinchGestureHandler>
  );
};

export default BubbleMap;
