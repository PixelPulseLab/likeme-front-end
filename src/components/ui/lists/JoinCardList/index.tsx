import { View, ScrollView } from 'react-native';
import { JoinCard } from '@/components/ui/cards/JoinCard';
import type { JoinCardItem } from '@/components/ui/cards/JoinCard/types';
import { styles } from './styles';

export type { JoinCardItem } from '@/components/ui/cards/JoinCard/types';

export type JoinCardListLayout = 'carousel' | 'list';

export type JoinCardListProps<T extends JoinCardItem = JoinCardItem> = {
  items: readonly T[];
  onItemPress?: (item: T) => void;
  layout?: JoinCardListLayout;
  square?: boolean;
};

export function JoinCardList<T extends JoinCardItem>({
  items,
  onItemPress,
  layout = 'carousel',
  square = false,
}: JoinCardListProps<T>) {
  if (!items || items.length === 0) {
    return null;
  }

  const renderItem = (item: T) => {
    const handlePress = () => onItemPress?.(item);

    return (
      <JoinCard
        key={item.id}
        title={item.title}
        badges={item.badges}
        image={item.image}
        price={item.price}
        desaturated={item.desaturated}
        onPress={handlePress}
        square={square}
        fullWidth={layout === 'list'}
        testID={`join-card-${item.id}`}
      />
    );
  };

  if (layout === 'list') {
    return <View style={styles.listContent}>{items.map(renderItem)}</View>;
  }

  if (items.length === 1) {
    return renderItem(items[0]);
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {items.map(renderItem)}
    </ScrollView>
  );
}

export default JoinCardList;
