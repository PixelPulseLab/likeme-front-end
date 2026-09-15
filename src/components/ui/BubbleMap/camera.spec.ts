import { BUBBLE_MAP_FISHEYE, BUBBLE_MAP_SCALE, bubbleMapFisheyeScale, clampBubbleMapCamera } from './camera';

const VIEWPORT = { width: 390, height: 720 };
const BOUNDS = { minX: -200, maxX: 200, minY: -200, maxY: 200 };

describe('bubbleMapFisheyeScale', () => {
  it('aumenta a bolinha no centro da viewport e reduz nas bordas', () => {
    const center = bubbleMapFisheyeScale(0, 0, 0, 0, 1, VIEWPORT.width, VIEWPORT.height);
    const edge = bubbleMapFisheyeScale(400, 400, 0, 0, 1, VIEWPORT.width, VIEWPORT.height);

    expect(center).toBe(BUBBLE_MAP_FISHEYE.maxScale);
    expect(edge).toBe(BUBBLE_MAP_FISHEYE.minScale);
    expect(center).toBeGreaterThan(edge);
  });
});

describe('clampBubbleMapCamera', () => {
  it('limita o zoom ao intervalo do mapa', () => {
    const zoomedIn = clampBubbleMapCamera(0, 0, 8, VIEWPORT, BOUNDS);
    const zoomedOut = clampBubbleMapCamera(0, 0, 0.1, VIEWPORT, BOUNDS);

    expect(zoomedIn.scale).toBe(BUBBLE_MAP_SCALE.max);
    expect(zoomedOut.scale).toBe(BUBBLE_MAP_SCALE.min);
  });
});
