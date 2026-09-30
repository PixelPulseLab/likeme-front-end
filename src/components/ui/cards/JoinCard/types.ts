export const JOIN_CARD_VARIANT = {
  DEFAULT: 'default',
  SQUARE: 'square',
  COMPACT: 'compact',
  HERO: 'hero',
} as const;

export type JoinCardVariant = (typeof JOIN_CARD_VARIANT)[keyof typeof JOIN_CARD_VARIANT];

export type JoinCardItem = {
  id: string;
  title: string;
  badges: string[];
  image: string;
  price?: number | null;
  desaturated?: boolean;
  testID?: string;
};

export type JoinCardProps = {
  title: string;
  badges: readonly string[];
  image: string;
  price?: number | null;
  detail?: string | null;
  caption?: string | null;
  desaturated?: boolean;
  onPress?: () => void;
  onAddToCalendar?: () => void;
  blur?: boolean;
  variant?: JoinCardVariant;
  fullWidth?: boolean;
  testID?: string;
};
