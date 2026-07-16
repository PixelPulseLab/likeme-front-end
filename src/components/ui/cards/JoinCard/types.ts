export type JoinCardItem = {
  id: string;
  title: string;
  badges: string[];
  image: string;
  price?: number | null;
  desaturated?: boolean;
};

export type JoinCardProps = {
  title: string;
  badges: readonly string[];
  image: string;
  price?: number | null;
  desaturated?: boolean;
  onPress?: () => void;
  square?: boolean;
  fullWidth?: boolean;
  testID?: string;
};
