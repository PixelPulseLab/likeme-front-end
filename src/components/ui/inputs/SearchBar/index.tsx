import React from 'react';
import { View, TouchableOpacity, TextInput as RNTextInput, StyleSheet, type ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BackgroundIconButton } from '@/assets/ui';
import IconButton from '@/components/ui/buttons/IconButton';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { styles } from './styles';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSearchPress?: () => void;
  onFilterPress?: () => void;
  onFocus?: () => void;
  autoFocus?: boolean;
  showFilterButton?: boolean;
  containerStyle?: ViewStyle;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search',
  value,
  onChangeText,
  onSearchPress,
  onFilterPress,
  onFocus,
  autoFocus = false,
  showFilterButton = true,
  containerStyle,
}) => {
  const handleSearchPress = () => {
    onSearchPress?.();
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.searchBarContainer}>
        <RNTextInput
          placeholder={placeholder}
          placeholderTextColor='rgba(0,0,0,0.48)'
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          autoFocus={autoFocus}
          onSubmitEditing={handleSearchPress}
          returnKeyType='search'
          style={styles.searchInput}
        />
        <IconButton
          icon='search'
          iconSize={16}
          iconColor='#001137'
          onPress={handleSearchPress}
          backgroundSize='medium'
          containerStyle={styles.searchIconButton}
        />
      </View>
      {showFilterButton && (
        <TouchableOpacity style={styles.filterButton} activeOpacity={0.7} onPress={onFilterPress}>
          <View style={styles.filterButtonBackground}>
            <CachedImage source={BackgroundIconButton} style={StyleSheet.absoluteFill} />
            <Icon name='tune' size={15} color='#001137' />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SearchBar;
