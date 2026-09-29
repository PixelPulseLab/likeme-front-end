import { useMemo, type ReactNode } from 'react';
import { View, type ImageSourcePropType, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { HOME_MVP_ASSETS } from '@/assets/homeMvp';
import { FilterButton } from '@/components/ui/buttons';
import { ButtonCarousel, type ButtonCarouselOption } from '@/components/ui/carousel';
import { COLORS } from '@/constants';
import { styles } from './styles';

type ModalContentRender = (api: { close: () => void; visible: boolean }) => ReactNode;

type Props<T = string> = {
  filterButtonLabel?: string;
  filterButtonIcon?: string;
  filterButtonIconImage?: ImageSourcePropType;
  filterButtonIconImageStyle?: ImageStyle;
  filterButtonSelected?: boolean;
  filterModalTitle?: string;
  filterModalContent?: ReactNode | ModalContentRender;
  onFilterButtonPress?: () => void;
  onFilterModalClose?: () => void;
  carouselOptions: ButtonCarouselOption<T>[];
  selectedCarouselId?: T | null;
  onCarouselSelect: (optionId: T) => void;
  showCarousel?: boolean;
  carouselDisplay?: 'all' | 'selectedOnly';
  containerStyle?: StyleProp<ViewStyle>;
  carouselContentContainerStyle?: StyleProp<ViewStyle>;
};

const HOME_FILTER_ICON_DEFAULT_COLOR = '#001137';
const HOME_FILTER_ICON_SELECTED_COLOR = COLORS.PRIMARY.PURE;

const StickyFilterCarouselRow = <T extends string | number = string>({
  filterButtonLabel,
  filterButtonIconImageStyle,
  filterButtonSelected = false,
  filterModalTitle,
  filterModalContent,
  onFilterButtonPress,
  onFilterModalClose,
  carouselOptions,
  selectedCarouselId,
  onCarouselSelect,
  showCarousel = true,
  carouselDisplay = 'all',
  containerStyle,
  carouselContentContainerStyle,
}: Props<T>) => {
  const hasFilterButton = !!filterButtonLabel;

  const carouselOptionsForDisplay = useMemo(() => {
    if (carouselDisplay !== 'selectedOnly') {
      return carouselOptions;
    }
    const selected = carouselOptions.find((o) => String(o.id) === String(selectedCarouselId ?? ''));
    return selected != null ? [selected] : [];
  }, [carouselDisplay, carouselOptions, selectedCarouselId]);

  const homeFilterButtonIconStyle = {
    tintColor: filterButtonSelected ? HOME_FILTER_ICON_SELECTED_COLOR : HOME_FILTER_ICON_DEFAULT_COLOR,
    ...filterButtonIconImageStyle,
  } as ImageStyle;

  return (
    <View style={[styles.container, containerStyle]}>
      {hasFilterButton && (
        <FilterButton
          label={filterButtonLabel}
          icon='arrow-drop-down'
          iconImage={HOME_MVP_ASSETS.filterChevron}
          iconImageStyle={homeFilterButtonIconStyle}
          iconPosition='right'
          selected={filterButtonSelected}
          modalTitle={filterModalTitle}
          modalContent={filterModalContent}
          onPress={onFilterButtonPress}
          onModalClose={onFilterModalClose}
        />
      )}
      {showCarousel && (
        <ButtonCarousel
          options={carouselOptionsForDisplay}
          selectedId={selectedCarouselId}
          onSelect={onCarouselSelect}
          contentContainerStyle={carouselContentContainerStyle}
        />
      )}
    </View>
  );
};

export default StickyFilterCarouselRow;
