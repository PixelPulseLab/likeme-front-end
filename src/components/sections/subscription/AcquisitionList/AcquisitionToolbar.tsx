import React from 'react';
import { View, type ImageStyle } from 'react-native';
import { StickyFilterCarouselRow } from '@/components/ui/menu';
import { ToggleTabs } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/i18n';
import {
  ACQUISITION_CATEGORY,
  ACQUISITION_FILTER,
  type AcquisitionCategory,
  type AcquisitionFilter,
} from '@/types/subscription/acquisitionList';
import { styles } from './styles';

type AcquisitionToolbarProps = {
  category: AcquisitionCategory;
  onCategoryChange: (category: AcquisitionCategory) => void;
  filter: AcquisitionFilter;
  onFilterChange: (filter: AcquisitionFilter) => void;
  isNewestFirst: boolean;
  onToggleDateSort: () => void;
};

const SORT_ICON_OLDEST = { transform: [{ rotate: '180deg' }] } as ImageStyle;

export function AcquisitionToolbar({
  category,
  onCategoryChange,
  filter,
  onFilterChange,
  isNewestFirst,
  onToggleDateSort,
}: AcquisitionToolbarProps) {
  const { t } = useTranslation();
  const categories = [
    {
      id: ACQUISITION_CATEGORY.PROGRAMS,
      label: t('profile.acquisitionList.categoryPrograms', { defaultValue: 'Programas' }),
    },
    {
      id: ACQUISITION_CATEGORY.SERVICES,
      label: t('profile.acquisitionList.categoryServices', { defaultValue: 'Serviços' }),
    },
    {
      id: ACQUISITION_CATEGORY.EVENTS,
      label: t('profile.acquisitionList.categoryEvents', { defaultValue: 'Eventos' }),
    },
  ];
  const filters = [
    { id: ACQUISITION_FILTER.ALL, label: t('profile.acquisitionList.filterAll', { defaultValue: 'Todos' }) },
    {
      id: ACQUISITION_FILTER.IN_PROGRESS,
      label: t('profile.acquisitionList.filterInProgress', { defaultValue: 'Em andamento' }),
    },
    { id: ACQUISITION_FILTER.TASKS, label: t('profile.acquisitionList.filterTasks', { defaultValue: 'Tarefas' }) },
  ];
  const sortIconStyle = isNewestFirst ? undefined : SORT_ICON_OLDEST;

  const handleCategoryChange = (id: string) => {
    onCategoryChange(id as AcquisitionCategory);
  };

  return (
    <>
      <View style={styles.tabs}>
        <ToggleTabs tabs={categories} selectedId={category} onSelect={handleCategoryChange} />
      </View>
      <StickyFilterCarouselRow
        filterButtonLabel={t('profile.acquisitionList.sortByDate', { defaultValue: 'Ordenar por data' })}
        filterButtonSelected
        filterButtonIconImageStyle={sortIconStyle}
        onFilterButtonPress={onToggleDateSort}
        carouselOptions={filters}
        selectedCarouselId={filter}
        onCarouselSelect={onFilterChange}
        containerStyle={styles.filters}
      />
    </>
  );
}
