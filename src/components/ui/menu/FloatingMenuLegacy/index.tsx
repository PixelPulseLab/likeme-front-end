import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { navigateRootStack } from '@/utils/navigation/rootStackNavigation';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { IconButton } from '@/components/ui/buttons';
import { TwoDotsIcon } from '@/assets/ui';
import { styles } from './styles';

type MenuItem = {
  id: string;
  icon: string;
  label: string;
  fullLabel?: string;
  onPress: () => void;
};

type Props = {
  items: MenuItem[];
  selectedId?: string;
};

const FloatingMenuLegacy: React.FC<Props> = ({ items, selectedId }) => {
  const navigation = useNavigation();

  const handleHomePress = () => {
    navigateRootStack(navigation, 'Home');
  };

  const isHomeSelected = selectedId === 'home';

  return (
    <View style={styles.container}>
      <View style={styles.menuWrapper}>
        <View style={[styles.selectedPill, isHomeSelected && styles.selectedPillWithLabel]}>
          <IconButton
            onPress={handleHomePress}
            showBackground
            backgroundTintColor='#0154F8CC'
            iconImageSource={TwoDotsIcon}
            iconImageStyle={styles.menuHomeIconImage}
            containerStyle={styles.menuHomeButtonContainer}
          />
          {isHomeSelected && (
            <TouchableOpacity onPress={handleHomePress} activeOpacity={0.8} style={styles.selectedPillLabelTouchable}>
              <Text style={styles.selectedPillLabel}>Home</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.actionsPill}>
          {items.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.iconButton, isSelected && styles.iconButtonSelected]}
                onPress={item.onPress}
                activeOpacity={0.8}
                accessibilityRole='button'
                accessibilityLabel={item.fullLabel || item.label}
              >
                <Icon name={item.icon} size={20} color={isSelected ? '#0154F8' : '#001137'} />
                {isSelected && <Text style={styles.selectedLabel}>{item.fullLabel || item.label}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default FloatingMenuLegacy;
