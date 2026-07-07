import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StatusBar } from 'react-native';
import { ChartBar, CTACard, PeriodSelector, ProgressHeaderLogo } from '@/components/ui';
import { ScreenWithHeader } from '@/components/ui/layout';
import ProgressBar from '@/components/ui/feedback/ProgressBar';
import { useMenuItems } from '@/hooks';
import { useSetFloatingMenu } from '@/contexts/FloatingMenuContext';
import { rootStackNavigationFrom } from '@/utils/navigation/rootStackNavigation';
import { useTranslation } from '@/hooks/i18n';
import { COLORS, SPACING } from '@/constants';
import { getMarkerColor, getMarkerGradient, MARKER_NAMES, hasMarkerGradient } from '@/constants/markers';
import type { UserMarker } from '@/types/anamnesis';
import { useAnalyticsScreen } from '@/analytics';
import { styles } from './styles';

type Props = {
  navigation: any;
  route: {
    params: {
      marker: UserMarker;
    };
  };
};

type Period = 'day' | 'week' | 'month';

const MarkerDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  useAnalyticsScreen({ screenName: 'MarkerDetails', screenClass: 'MarkerDetailsScreen' });
  const { t } = useTranslation();
  const rootNavigation = rootStackNavigationFrom(navigation) ?? navigation;
  const menuItems = useMenuItems(rootNavigation);
  useSetFloatingMenu(menuItems, 'activities');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('week');

  const marker = route?.params?.marker;

  if (!marker) {
    return (
      <ScreenWithHeader
        navigation={navigation}
        headerProps={{
          onBackPress: () => navigation.goBack(),
          showBackButton: true,
          customLogo: <ProgressHeaderLogo />,
        }}
        contentBackgroundColor={COLORS.BACKGROUND}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 16, color: COLORS.TEXT }}>{t('avatar.markerNotFound')}</Text>
        </View>
      </ScreenWithHeader>
    );
  }

  const markerColor = getMarkerColor(marker.id);
  const markerGradient = getMarkerGradient(marker.id);
  const markerName = MARKER_NAMES[marker.id] || marker.name;

  // Mock data - será substituído por dados reais do backend
  // Por enquanto, usa dados genéricos baseados no marker
  const metric1 = 4;
  const metric2 = 8;
  const improvementPercentage = marker.trend === 'increasing' ? 23 : marker.trend === 'decreasing' ? -15 : 0;
  const averageValue = Math.round(marker.percentage / 10);

  // Mock weekly data
  const weeklyData = [
    { day: 'S', value: 6, date: '28-4 Oct.' },
    { day: 'M', value: 4, date: '5-11 Oct.' },
    { day: 'T', value: 4, date: '12-18 Oct.' },
    { day: 'W', value: 4, date: '19-25 Oct.' },
    { day: 'T', value: 4, date: '26-1 Nov.' },
    { day: 'F', value: 4, date: '2-8 Nov.' },
    { day: 'S', value: 6, date: '9-15 Nov.' },
  ];

  const maxValue = Math.max(...weeklyData.map((d) => d.value), 1);

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{ onBackPress: handleBack, showBackButton: true, customLogo: <ProgressHeaderLogo /> }}
      contentBackgroundColor={COLORS.BACKGROUND}
      contentContainerStyle={{ flex: 1 }}
    >
      <StatusBar backgroundColor={COLORS.BACKGROUND} barStyle='dark-content' />
      <View style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Marker Header Section */}
          <View style={styles.markerHeaderSection}>
            <TouchableOpacity style={styles.markerHeaderRow} activeOpacity={0.7}>
              <Text style={styles.markerName}>{markerName}</Text>
            </TouchableOpacity>
            <View style={styles.markerProgressContainer}>
              <ProgressBar
                current={marker.percentage}
                total={100}
                color={markerColor}
                gradientColors={hasMarkerGradient(marker.id) ? getMarkerGradient(marker.id) || undefined : undefined}
                height={30}
                showRemaining={false}
              />
            </View>
          </View>

          {/* Main Stats Card */}
          <View style={styles.mainStatsCard}>
            <Text style={styles.mainStatsTitle}>
              {markerName.toUpperCase()} : +{improvementPercentage}%
            </Text>

            <View style={styles.insightsSection}>
              <Text style={styles.insightsTitle}>{t('avatar.youveImproved')}</Text>
              <Text style={styles.insightsText}>
                {t('avatar.niceJobBody')}
                {'\n'}
                {t('avatar.improveMind')}
              </Text>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>{t('avatar.markerQuality', { marker: markerName })}</Text>
                <Text style={styles.metricValue}>{metric1.toString().padStart(2, '0')}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>{t('avatar.markerRoutine', { marker: markerName })}</Text>
                <Text style={styles.metricValue}>{metric2.toString().padStart(2, '0')}</Text>
              </View>
            </View>
          </View>

          <CTACard
            title={t('avatar.routineTitle', { marker: markerName.toUpperCase() })}
            highlightText={t('avatar.averageScore', {
              marker: markerName.toLowerCase(),
              score: averageValue,
            })}
            description={[t('avatar.maintainingRoutine', { marker: markerName.toLowerCase() })]}
            backgroundColor={COLORS.PRIMARY.LIGHT}
            descriptionColor={COLORS.TEXT}
            titleStyle={styles.routineTitle}
            borderRadius={{
              topLeft: 32,
              topRight: 32,
              bottomLeft: 12,
              bottomRight: 64,
            }}
            style={[
              styles.routineCard,
              {
                paddingBottom: SPACING.XL,
                paddingHorizontal: SPACING.LG,
              },
            ]}
          />

          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>{t('avatar.qualityHistory', { marker: markerName })}</Text>

            {/* Period Selector */}
            <PeriodSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={(period) => setSelectedPeriod(period)}
              options={['day', 'week', 'month']}
              activeColor={markerColor}
              style={styles.periodSelector}
            />

            {/* Weekly Chart */}
            <View style={styles.chartContainer}>
              {weeklyData.map((data, index) => {
                const barHeight = (data.value / maxValue) * 200; // Max height of 200
                return (
                  <ChartBar
                    key={`${data.date}-${index}`}
                    date={data.date}
                    value={data.value}
                    height={barHeight}
                    gradientColors={markerGradient || undefined}
                    color={markerColor}
                  />
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    </ScreenWithHeader>
  );
};

export default MarkerDetailsScreen;
