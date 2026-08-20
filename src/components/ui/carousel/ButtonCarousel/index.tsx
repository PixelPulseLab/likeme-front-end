import { type StyleProp, type ViewStyle } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { PrimaryButton } from '@/components/ui/buttons';
import { styles } from './styles';

export interface ButtonCarouselOption<T = string> {
  id: T;
  label: string;
}

type Props<T = string> = {
  options: ButtonCarouselOption<T>[];
  selectedId?: T | null;
  onSelect: (optionId: T) => void;
  style?: ViewStyle;
  contentContainerStyle?: StyleProp<ViewStyle>;
  optionTestIdPrefix?: string;
};

const ButtonCarousel = <T extends string | number = string>({
  options = [],
  selectedId,
  onSelect,
  style,
  contentContainerStyle,
  optionTestIdPrefix,
}: Props<T>) => {
  if (!options || options.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      style={[styles.container, style]}
    >
      {options.map((option) => {
        const isSelected = option.id === selectedId;
        return (
          <PrimaryButton
            key={String(option.id)}
            label={option.label}
            onPress={() => onSelect(option.id)}
            variant='light'
            style={isSelected ? styles.buttonSelected : styles.buttonUnselected}
            labelStyle={isSelected ? styles.buttonSelectedText : undefined}
            testID={optionTestIdPrefix ? `${optionTestIdPrefix}${option.id}` : undefined}
          />
        );
      })}
    </ScrollView>
  );
};

export default ButtonCarousel;
