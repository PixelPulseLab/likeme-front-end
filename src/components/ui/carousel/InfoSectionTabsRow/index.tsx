import React, { useCallback } from 'react';
import { ActionSheetIOS, Alert, Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { IconButton } from '@/components/ui/buttons';
import ButtonCarousel, { type ButtonCarouselOption } from '@/components/ui/carousel/ButtonCarousel';
import { useTranslation } from '@/hooks/i18n';
import { styles } from './styles';

export type InfoSectionMenuOption = {
  label: string;
  onPress: () => void;
};

type Props<T extends string | number = string> = {
  options: ButtonCarouselOption<T>[];
  selectedId?: T | null;
  onSelect: (optionId: T) => void;
  onSharePress?: () => void;
  menuOptions?: InfoSectionMenuOption[];
  style?: StyleProp<ViewStyle>;
  carouselStyle?: StyleProp<ViewStyle>;
};

function InfoSectionTabsRow<T extends string | number = string>({
  options,
  selectedId,
  onSelect,
  onSharePress,
  menuOptions,
  style,
  carouselStyle,
}: Props<T>) {
  const { t } = useTranslation();

  const openMenu = useCallback(() => {
    if (!menuOptions?.length) {
      return;
    }

    const labels = menuOptions.map((option) => option.label);
    const cancelLabel = t('common.cancel');

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...labels, cancelLabel],
          cancelButtonIndex: labels.length,
        },
        (buttonIndex) => {
          if (buttonIndex == null || buttonIndex >= labels.length) {
            return;
          }
          menuOptions[buttonIndex]?.onPress();
        },
      );
      return;
    }

    Alert.alert(
      t('community.informationTitle', { defaultValue: 'Informações' }),
      undefined,
      [
        ...menuOptions.map((option) => ({
          text: option.label,
          onPress: option.onPress,
        })),
        { text: cancelLabel, style: 'cancel' as const },
      ],
      { cancelable: true },
    );
  }, [menuOptions, t]);

  const showShare = Boolean(onSharePress);
  const showMenu = Boolean(menuOptions?.length);

  return (
    <View style={[styles.row, style]}>
      <View style={styles.carouselWrap}>
        <ButtonCarousel
          options={options}
          selectedId={selectedId}
          onSelect={onSelect}
          style={carouselStyle}
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
        <IconButton
          icon='more-vert'
          onPress={openMenu}
          variant='dark'
          backgroundSize='medium'
          containerStyle={styles.trailingAction}
        />
      ) : null}
    </View>
  );
}

export default InfoSectionTabsRow;
