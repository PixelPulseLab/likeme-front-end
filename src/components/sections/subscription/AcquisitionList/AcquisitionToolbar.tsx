import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Chip from '@/components/ui/feedback/Chip';
import { ToggleTabs } from '@/components/ui/tabs';
import { COLORS } from '@/constants';
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

export function AcquisitionToolbar({
  category,
  onCategoryChange,
  filter,
  onFilterChange,
  isNewestFirst,
  onToggleDateSort,
}: AcquisitionToolbarProps) {
  const { t } = useTranslation();
  const sortAccessibilityLabel = isNewestFirst
    ? t('profile.acquisitionList.sortNewest', { defaultValue: 'Ordenar por data, mais recentes primeiro' })
    : t('profile.acquisitionList.sortOldest', { defaultValue: 'Ordenar por data, mais antigos primeiro' });
  const sortIconStyle = isNewestFirst ? undefined : styles.sortIconOldest;
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
  const filters: { id: AcquisitionFilter; label: string }[] = [
    { id: ACQUISITION_FILTER.ALL, label: t('profile.acquisitionList.filterAll', { defaultValue: 'Todos' }) },
    {
      id: ACQUISITION_FILTER.IN_PROGRESS,
      label: t('profile.acquisitionList.filterInProgress', { defaultValue: 'Em andamento' }),
    },
    { id: ACQUISITION_FILTER.TASKS, label: t('profile.acquisitionList.filterTasks', { defaultValue: 'Tarefas' }) },
  ];

  const handleCategoryChange = (id: string) => {
    onCategoryChange(id as AcquisitionCategory);
  };

  return (
    <>
      <ToggleTabs
        tabs={categories}
        selectedId={category}
        onSelect={handleCategoryChange}
        containerStyle={styles.tabs}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        contentContainerStyle={styles.filtersContent}
      >
        <Pressable
          accessibilityRole='button'
          accessibilityLabel={sortAccessibilityLabel}
          onPress={onToggleDateSort}
          style={styles.sortButton}
        >
          <Text style={styles.sortLabel}>
            {t('profile.acquisitionList.sortByDate', { defaultValue: 'Ordenar por data' })}
          </Text>
          <Icon name='keyboard-arrow-down' size={18} color={COLORS.PRIMARY.PURE} style={sortIconStyle} />
        </Pressable>
        {filters.map((item) => {
          const isSelected = item.id === filter;
          const chipStyle = isSelected ? styles.filterChipSelected : styles.filterChip;
          return (
            <Chip
              key={item.id}
              label={item.label}
              selected={isSelected}
              selectedBackgroundColor={COLORS.PRIMARY.PURE}
              selectedTextColor={COLORS.SECONDARY.PURE}
              accessibilityRole='button'
              accessibilityState={{ selected: isSelected }}
              onPress={() => onFilterChange(item.id)}
              style={chipStyle}
            />
          );
        })}
      </ScrollView>
    </>
  );
}
