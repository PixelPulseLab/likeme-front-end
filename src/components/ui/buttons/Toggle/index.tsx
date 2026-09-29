import { TouchableOpacity, Text, View } from 'react-native';
import { styles } from './styles';

export type ToggleVariant = 'default' | 'primary';

type Props<T extends string> = {
  options: readonly T[];
  selected: T;
  onSelect: (option: T) => void;
  fixedWidth?: boolean;
  variant?: ToggleVariant;
};

const Toggle = <T extends string>({
  options,
  selected,
  onSelect,
  fixedWidth = true,
  variant = 'default',
}: Props<T>) => {
  return (
    <View style={[styles.container, variant === 'primary' && styles.containerPrimaryCompact]}>
      {options.map((option) => {
        const isSelected = selected === option;
        const selectedOptionStyle = variant === 'primary' ? styles.optionSelectedPrimary : styles.optionSelected;
        const selectedTextStyle = variant === 'primary' ? styles.optionTextSelectedPrimary : styles.optionTextSelected;
        return (
          <TouchableOpacity
            key={option}
            style={[fixedWidth ? styles.option : styles.optionVariableWidth, isSelected && selectedOptionStyle]}
            onPress={() => onSelect(option)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.optionText, isSelected && selectedTextStyle]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default Toggle;
