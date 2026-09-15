import {
  CATEGORY_BUBBLE_PACK_GAP,
  CATEGORY_BUBBLE_RADIUS,
  PACKED_CATEGORY_BUBBLES,
  packCategoryBubbles,
} from './categoryBubbles';

describe('packCategoryBubbles', () => {
  it('empacota as 10 categorias sem sobreposição', () => {
    const packed = packCategoryBubbles();
    expect(packed).toHaveLength(Object.keys(CATEGORY_BUBBLE_RADIUS).length);

    for (let i = 0; i < packed.length; i += 1) {
      for (let j = i + 1; j < packed.length; j += 1) {
        const dx = packed[i].x - packed[j].x;
        const dy = packed[i].y - packed[j].y;
        const minDistance = packed[i].radius + packed[j].radius + CATEGORY_BUBBLE_PACK_GAP;
        expect(dx * dx + dy * dy).toBeGreaterThanOrEqual(minDistance * minDistance - 0.5);
      }
    }
  });

  it('usa raios diferentes e coloca o maior no centro', () => {
    const radii = new Set(PACKED_CATEGORY_BUBBLES.map((bubble) => bubble.radius));
    expect(radii.size).toBeGreaterThan(1);

    const largest = [...PACKED_CATEGORY_BUBBLES].sort((left, right) => right.radius - left.radius)[0];
    expect(largest.x).toBe(0);
    expect(largest.y).toBe(0);
  });
});
