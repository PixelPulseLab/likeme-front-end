import type { ImageSourcePropType } from 'react-native';
import { OnboardingBodyAvatar, OnboardingLikeMeAvatar, OnboardingMindAvatar } from '@/assets/auth';
import type { CategoryName } from '@/types/category';

export type CategoryBubblePillar = 'mind' | 'middle' | 'body';

export const CATEGORY_BUBBLE_PILLAR: Record<CategoryName, CategoryBubblePillar> = {
  stress: 'mind',
  'self-esteem': 'mind',
  environment: 'mind',
  'purpose-vision': 'mind',
  connection: 'middle',
  spirituality: 'middle',
  sleep: 'body',
  activity: 'body',
  nutrition: 'body',
  smile: 'body',
};

export const CATEGORY_BUBBLE_SOURCE: Record<CategoryBubblePillar, ImageSourcePropType> = {
  mind: OnboardingMindAvatar,
  middle: OnboardingLikeMeAvatar,
  body: OnboardingBodyAvatar,
};

export const CATEGORY_BUBBLE_RADIUS: Record<CategoryName, number> = {
  connection: 102,
  nutrition: 94,
  stress: 90,
  sleep: 86,
  spirituality: 82,
  'purpose-vision': 80,
  'self-esteem': 76,
  environment: 72,
  activity: 70,
  smile: 64,
};

export const CATEGORY_BUBBLE_PACK_GAP = 6;

export type PackedCategoryBubble = {
  id: CategoryName;
  x: number;
  y: number;
  radius: number;
};

type PackedCircle = {
  x: number;
  y: number;
  radius: number;
};

const PACK_ANGLE_STEP = Math.PI / 12;

function circlesOverlap(first: PackedCircle, second: PackedCircle, gap: number): boolean {
  const dx = first.x - second.x;
  const dy = first.y - second.y;
  const minDistance = first.radius + second.radius + gap;
  return dx * dx + dy * dy < minDistance * minDistance - 0.5;
}

export function packCategoryBubbles(
  radii: Record<CategoryName, number> = CATEGORY_BUBBLE_RADIUS,
  gap: number = CATEGORY_BUBBLE_PACK_GAP,
): PackedCategoryBubble[] {
  const items = (Object.entries(radii) as [CategoryName, number][])
    .map(([id, radius]) => ({ id, radius }))
    .sort((left, right) => right.radius - left.radius || left.id.localeCompare(right.id));

  const packed: PackedCategoryBubble[] = [];

  for (const item of items) {
    if (packed.length === 0) {
      packed.push({ id: item.id, x: 0, y: 0, radius: item.radius });
      continue;
    }

    let best: { x: number; y: number; dist2: number } | null = null;
    for (const placed of packed) {
      const distance = placed.radius + item.radius + gap;
      for (let angle = 0; angle < Math.PI * 2; angle += PACK_ANGLE_STEP) {
        const x = placed.x + Math.cos(angle) * distance;
        const y = placed.y + Math.sin(angle) * distance;
        const candidate = { x, y, radius: item.radius };
        if (packed.some((circle) => circlesOverlap(candidate, circle, gap))) {
          continue;
        }
        const dist2 = x * x + y * y;
        if (best == null || dist2 < best.dist2) {
          best = { x, y, dist2 };
        }
      }
    }

    if (best == null) {
      const last = packed[packed.length - 1];
      packed.push({
        id: item.id,
        x: last.x + last.radius + item.radius + gap,
        y: last.y,
        radius: item.radius,
      });
      continue;
    }

    packed.push({ id: item.id, x: best.x, y: best.y, radius: item.radius });
  }

  return packed;
}

export const PACKED_CATEGORY_BUBBLES = packCategoryBubbles();
