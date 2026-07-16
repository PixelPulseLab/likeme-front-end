import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { IconButton } from '@/components/ui/buttons';
import ButtonCarousel, { type ButtonCarouselOption } from '@/components/ui/carousel/ButtonCarousel';
import { styles } from './styles';

export type InfoSectionMenuOption = {
  label: string;
  onPress: () => void;
};

type MenuAnchor = {
  top: number;
  right: number;
};

type Props<T extends string | number = string> = {
  options: ButtonCarouselOption<T>[];
  selectedId?: T | null;
  onSelect: (optionId: T) => void;
  onSharePress?: () => void;
  menuOptions?: InfoSectionMenuOption[];
  style?: StyleProp<ViewStyle>;
};

function InfoSectionTabsRow<T extends string | number = string>({
  options,
  selectedId,
  onSelect,
  onSharePress,
  menuOptions,
  style,
}: Props<T>) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor>({ top: 0, right: 16 });
  const menuButtonRef = useRef<View>(null);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!menuOptions?.length && isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [isMenuOpen, menuOptions]);

  const openMenu = useCallback(() => {
    if (!menuOptions?.length) {
      return;
    }

    menuButtonRef.current?.measureInWindow((x, y, width, height) => {
      const windowWidth = Dimensions.get('window').width;
      setMenuAnchor({
        top: y + height + 4,
        right: Math.max(16, windowWidth - (x + width)),
      });
      setIsMenuOpen(true);
    });
  }, [menuOptions]);

  const handleMenuOptionPress = useCallback(
    (option: InfoSectionMenuOption) => {
      closeMenu();
      option.onPress();
    },
    [closeMenu],
  );

  const showShare = Boolean(onSharePress);
  const showMenu = Boolean(menuOptions?.length);

  return (
    <View style={[styles.row, style]}>
      <View style={styles.carouselWrap}>
        <ButtonCarousel
          options={options}
          selectedId={selectedId}
          onSelect={onSelect}
          contentContainerStyle={styles.carouselContent}
        />
      </View>
      {showShare ? (
        <IconButton
          icon='share'
          onPress={onSharePress!}
          backgroundSize='medium'
          containerStyle={styles.trailingAction}
        />
      ) : null}
      {showMenu ? (
        <View ref={menuButtonRef} collapsable={false} style={styles.trailingAction}>
          <IconButton icon='more-vert' onPress={openMenu} variant='dark' backgroundSize='medium' />
        </View>
      ) : null}

      <Modal visible={isMenuOpen} transparent animationType='fade' onRequestClose={closeMenu}>
        <View style={styles.menuBackdrop}>
          <Pressable style={styles.menuDismissArea} onPress={closeMenu} accessibilityRole='button' />
          <View style={[styles.menuCard, { top: menuAnchor.top, right: menuAnchor.right }]}>
            {menuOptions?.map((option) => (
              <Pressable
                key={option.label}
                style={styles.menuOption}
                onPress={() => handleMenuOptionPress(option)}
                accessibilityRole='button'
                accessibilityLabel={option.label}
              >
                <Text style={styles.menuOptionLabel}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default InfoSectionTabsRow;
