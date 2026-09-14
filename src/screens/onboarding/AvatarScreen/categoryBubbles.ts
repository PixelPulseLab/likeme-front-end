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

export const CATEGORY_BUBBLE_LAYOUT: Record<CategoryName, { top: `${number}%`; left: `${number}%` }> = {
  stress: { top: '0%', left: '22%' },
  'self-esteem': { top: '14%', left: '-24%' },
  environment: { top: '16%', left: '64%' },
  connection: { top: '30%', left: '22%' },
  'purpose-vision': { top: '38%', left: '-20%' },
  spirituality: { top: '48%', left: '24%' },
  sleep: { top: '60%', left: '-18%' },
  nutrition: { top: '58%', left: '60%' },
  smile: { top: '72%', left: '18%' },
  activity: { top: '80%', left: '64%' },
};
