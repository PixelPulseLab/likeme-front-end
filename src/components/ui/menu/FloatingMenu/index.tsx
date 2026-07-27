import React from 'react';
import { View, TouchableOpacity, Text, type ImageSourcePropType } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { navigateRootStack } from '@/utils/navigation/rootStackNavigation';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ColoredTwoDotsIcon } from '@/assets/ui';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { PlatformBlurView } from '@/components/ui/PlatformBlurView';
import { E2E_TEST_IDS, floatingMenuTestId } from '@/constants/e2eTestIds';
import { styles } from './styles';

type MenuItem = {
  id: string;
  icon?: string;
  iconImage?: ImageSourcePropType;
  label: string;
  fullLabel?: string;
  onPress: () => void;
};

type Props = {
  items: MenuItem[];
  selectedId?: string;
};

const MENU_ICON_SIZE = 24;
const BLUR_INTENSITY = 24;
const MINIMUM_BOTTOM_PADDING = 4;

const FloatingMenu: React.FC<Props> = ({ items, selectedId }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleHomePress = () => {
    navigateRootStack(navigation, 'Home');
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, MINIMUM_BOTTOM_PADDING) }]}>
      <PlatformBlurView intensity={BLUR_INTENSITY} tint='light' style={styles.blur} />
      <View style={styles.overlay} />

      <View style={styles.row}>
        <TouchableOpacity
          onPress={handleHomePress}
          activeOpacity={0.8}
          style={[styles.pill, selectedId === 'home' && styles.pillSelected]}
          accessibilityRole='button'
          accessibilityLabel='Início'
          testID={E2E_TEST_IDS.FLOATING_MENU_HOME}
        >
          <ColoredTwoDotsIcon width={MENU_ICON_SIZE} height={MENU_ICON_SIZE} />
          <Text
            style={[styles.pillLabel, selectedId === 'home' && styles.pillLabelSelected]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            Início
          </Text>
        </TouchableOpacity>

        {items.map((item) => {
          const isSelected = item.id === selectedId;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.pill, isSelected && styles.pillSelected]}
              onPress={item.onPress}
              activeOpacity={0.8}
              accessibilityRole='button'
              accessibilityLabel={item.fullLabel || item.label}
              testID={floatingMenuTestId(item.id)}
            >
              {item.iconImage != null ? (
                <CachedImage source={item.iconImage} style={styles.menuIconImage} contentFit='contain' />
              ) : (
                <Icon
                  name={item.icon ?? 'help-outline'}
                  size={MENU_ICON_SIZE}
                  color={isSelected ? '#0154F8' : '#001137'}
                />
              )}
              <Text
                style={[styles.pillLabel, isSelected && styles.pillLabelSelected]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {item.fullLabel || item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default FloatingMenu;
