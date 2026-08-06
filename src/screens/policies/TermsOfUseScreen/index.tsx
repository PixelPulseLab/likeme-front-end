import React, { useCallback, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type { StackScreenProps } from '@react-navigation/stack';
import { MarkdownText } from '@/components/ui/text/MarkdownText';
import { GradientBackground, ScreenWithHeader } from '@/components/ui/layout';
import { useAnalyticsScreen } from '@/analytics';
import { useTranslation } from '@/hooks/i18n';
import i18n from '@/i18n';
import type { RootStackParamList } from '@/types/navigation';
import { COLORS } from '@/constants';
import { styles } from './styles';

type Props = StackScreenProps<RootStackParamList, 'TermsOfUse'>;

const SECTION_KEYS = [
  'section1',
  'section2',
  'section3',
  'section4',
  'section5',
  'section6',
  'section7',
  'section8',
  'section9',
  'section10',
  'section11',
  'section12',
  'section13',
  'section14',
  'section15',
  'section16',
] as const;

const PLANS_SECTION_KEY = 'section5';

type PlansTablePayload = {
  headerColumns?: string[];
  rows?: Array<{ feature?: string; basic?: string; premium?: string; advanced?: string }>;
};

function termsPlansTable(): PlansTablePayload | null {
  const table = i18n.t('termsOfUse.section5PlansTable', {
    returnObjects: true,
  }) as PlansTablePayload;

  if (!table || !Array.isArray(table.headerColumns) || !Array.isArray(table.rows)) {
    return null;
  }

  return table;
}

function plansTableCellStyle(value: string) {
  if (value === '✓') {
    return [styles.plansTableCell, styles.plansTableCheck];
  }
  if (value === '–' || value === '-') {
    return [styles.plansTableCell, styles.plansTableDash];
  }
  return styles.plansTableCell;
}

const TermsOfUseScreen: React.FC<Props> = ({ navigation }) => {
  useAnalyticsScreen({ screenName: 'TermsOfUse', screenClass: 'TermsOfUseScreen' });
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleAccordion = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{ onBackPress: () => navigation.goBack() }}
      contentContainerStyle={styles.container}
    >
      <View pointerEvents='none' style={styles.gradientBackground}>
        <GradientBackground />
      </View>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <Text style={styles.title}>
            {t('termsOfUse.titleLine1')}
            {'\n'}
            {t('termsOfUse.titleLine2')}
          </Text>
          <MarkdownText text={t('termsOfUse.intro')} style={styles.intro} />

          {SECTION_KEYS.map((sectionKey, index) => {
            const id = `section-${index + 1}`;
            const isExpanded = expandedId === id;
            const titleKey = `termsOfUse.${sectionKey}Title`;
            const plansTable = sectionKey === PLANS_SECTION_KEY ? termsPlansTable() : null;

            return (
              <View key={id} style={[styles.accordionItem, isExpanded && styles.accordionItemExpanded]}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => toggleAccordion(id)}
                  activeOpacity={0.7}
                  accessibilityRole='button'
                  accessibilityState={{ expanded: isExpanded }}
                >
                  <Text style={styles.accordionTitle}>{t(titleKey)}</Text>
                  <Icon name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={24} color={COLORS.TEXT} />
                </TouchableOpacity>
                {isExpanded ? (
                  <View style={styles.accordionContent}>
                    {sectionKey === PLANS_SECTION_KEY ? (
                      <>
                        <MarkdownText text={t('termsOfUse.section5ContentBefore')} style={styles.accordionBody} />
                        {plansTable?.headerColumns && plansTable.rows?.length ? (
                          <View>
                            <Text style={styles.plansSubtitle}>{t('termsOfUse.section5PlansSubtitle')}</Text>
                            <View style={styles.plansTable}>
                              <View style={styles.plansTableHeader}>
                                {plansTable.headerColumns.map((column, columnIndex) => (
                                  <Text
                                    key={`${column}-${columnIndex}`}
                                    style={[
                                      columnIndex === 0 ? styles.plansTableCellFeature : styles.plansTableCell,
                                      styles.plansTableCellHeader,
                                    ]}
                                  >
                                    {column}
                                  </Text>
                                ))}
                              </View>
                              {plansTable.rows.map((row, rowIndex) => (
                                <View key={`${row.feature ?? 'plan'}-${rowIndex}`} style={styles.plansTableRow}>
                                  <Text style={styles.plansTableCellFeature}>{row.feature}</Text>
                                  <Text style={plansTableCellStyle(row.basic ?? '')}>{row.basic}</Text>
                                  <Text style={plansTableCellStyle(row.premium ?? '')}>{row.premium}</Text>
                                  <Text style={plansTableCellStyle(row.advanced ?? '')}>{row.advanced}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        ) : null}
                        <MarkdownText text={t('termsOfUse.section5ContentAfter')} style={styles.accordionBody} />
                      </>
                    ) : (
                      <MarkdownText text={t(`termsOfUse.${sectionKey}Content`)} style={styles.accordionBody} />
                    )}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenWithHeader>
  );
};

export default TermsOfUseScreen;
