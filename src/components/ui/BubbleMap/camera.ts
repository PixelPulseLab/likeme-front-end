export const BUBBLE_MAP_SCALE = {
  min: 0.72,
  max: 2.35,
  initial: 1.28,
} as const;

export const BUBBLE_MAP_FISHEYE = {
  innerRadius: 72,
  outerRadius: 240,
  maxScale: 1.28,
  minScale: 0.78,
} as const;

export type BubbleMapBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type BubbleMapCamera = {
  x: number;
  y: number;
  scale: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function boundsForBubbleMap(bubbles: { x: number; y: number; radius: number }[]): BubbleMapBounds {
  return bubbles.reduce(
    (bounds, bubble) => ({
      minX: Math.min(bounds.minX, bubble.x - bubble.radius),
      maxX: Math.max(bounds.maxX, bubble.x + bubble.radius),
      minY: Math.min(bounds.minY, bubble.y - bubble.radius),
      maxY: Math.max(bounds.maxY, bubble.y + bubble.radius),
    }),
    { minX: 0, maxX: 0, minY: 0, maxY: 0 },
  );
}

export function clampBubbleMapCamera(
  x: number,
  y: number,
  scale: number,
  viewport: { width: number; height: number },
  bounds: BubbleMapBounds,
): BubbleMapCamera {
  const nextScale = clamp(scale, BUBBLE_MAP_SCALE.min, BUBBLE_MAP_SCALE.max);
  if (viewport.width <= 0 || viewport.height <= 0) {
    return { x, y, scale: nextScale };
  }

  const packedWidth = (bounds.maxX - bounds.minX) * nextScale;
  const packedHeight = (bounds.maxY - bounds.minY) * nextScale;
  const limitX = Math.max(viewport.width * 0.2, packedWidth / 2 - viewport.width * 0.28);
  const limitY = Math.max(viewport.height * 0.2, packedHeight / 2 - viewport.height * 0.28);

  return {
    x: clamp(x, -limitX, limitX),
    y: clamp(y, -limitY, limitY),
    scale: nextScale,
  };
}

export function bubbleMapFisheyeScale(
  bubbleX: number,
  bubbleY: number,
  translateX: number,
  translateY: number,
  scale: number,
  viewportWidth: number,
  viewportHeight: number,
): number {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return 1;
  }

  const screenX = viewportWidth / 2 + translateX + bubbleX * scale;
  const screenY = viewportHeight / 2 + translateY + bubbleY * scale;
  const distance = Math.hypot(screenX - viewportWidth / 2, screenY - viewportHeight / 2);
  const { innerRadius, outerRadius, maxScale, minScale } = BUBBLE_MAP_FISHEYE;

  if (distance <= innerRadius) {
    return maxScale;
  }
  if (distance >= outerRadius) {
    return minScale;
  }

  const t = (distance - innerRadius) / (outerRadius - innerRadius);
  return maxScale + (minScale - maxScale) * t;
}
