import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Loading, PrimaryButton } from '@/components/ui';
import { GradientBackground, ScreenWithHeader } from '@/components/ui/layout';
import { COLORS, SPACING } from '@/constants';
import { useTranslation } from '@/hooks/i18n';
import { useAnalyticsScreen } from '@/analytics';
import {
  emptyPreferencesForm,
  NOTIFICATION_REQUIRED_CHANNEL,
  notificationPreferenceService,
  preferencesFormFromRows,
} from '@/services/notification/notificationPreferenceService';
import type { RootStackParamList } from '@/types/navigation';
import type {
  NotificationCategoryForm,
  NotificationPreferenceCategoryId,
  NotificationPreferencesForm,
} from '@/types/notification/notificationPreferences';
import { logger } from '@/utils/logger';
import { NotificationPreferenceCategoryCard } from './NotificationPreferenceCategoryCard';
import { styles } from './styles';

type Props = StackScreenProps<RootStackParamList, 'NotificationPreferences'>;

const CATEGORY_IDS: NotificationPreferenceCategoryId[] = ['offers', 'activities', 'transactions'];

const NotificationPreferencesScreen: React.FC<Props> = ({ navigation }) => {
  useAnalyticsScreen({
    screenName: 'NotificationPreferences',
    screenClass: 'NotificationPreferencesScreen',
  });
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [form, setForm] = useState<NotificationPreferencesForm>(emptyPreferencesForm);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [savingCategoryId, setSavingCategoryId] = useState<NotificationPreferenceCategoryId | null>(null);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<NotificationPreferenceCategoryId>>(
    () => new Set(),
  );

  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    setLoadFailed(false);
    try {
      const rows = await notificationPreferenceService.listPreferences();
      setForm(preferencesFormFromRows(rows));
    } catch (error) {
      logger.error('[NotificationPreferencesScreen] Falha ao carregar preferências', error);
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  async function saveCategory(next: NotificationCategoryForm) {
    setForm((current) => ({ ...current, [next.id]: next }));
    setSavingCategoryId(next.id);
    try {
      await notificationPreferenceService.saveCategory(next);
    } catch (error) {
      logger.error('[NotificationPreferencesScreen] Falha ao salvar preferência', {
        category: next.id,
        cause: error,
      });
      Alert.alert(
        t('common.error'),
        t('profile.notifications.saveError', {
          defaultValue: 'Não foi possível salvar suas preferências. Tente novamente.',
        }),
      );
      await loadPreferences();
    } finally {
      setSavingCategoryId(null);
    }
  }

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        onBackPress: () => navigation.goBack(),
        showBackButton: true,
        backgroundColor: COLORS.SECONDARY.LIGHT,
      }}
      contentBackgroundColor={COLORS.BACKGROUND}
      contentContainerStyle={styles.container}
    >
      <GradientBackground />
      {isLoading ? (
        <Loading message={t('common.loading')} fullScreen />
      ) : loadFailed ? (
        <View style={styles.loadErrorBlock}>
          <Text style={styles.loadErrorText}>
            {t('profile.notifications.loadError', {
              defaultValue: 'Não foi possível carregar suas preferências de notificação.',
            })}
          </Text>
          <PrimaryButton label={t('common.retry')} onPress={() => void loadPreferences()} size='large' />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: SPACING.GAP_20 + Math.max(insets.bottom, SPACING.MD) },
          ]}
        >
          <View style={styles.content}>
            <View style={styles.headerBlock}>
              <Text style={styles.title}>{t('profile.notifications.title', { defaultValue: 'Notificação' })}</Text>
              <View style={styles.introTexts}>
                <Text style={styles.lead}>
                  {t('profile.notifications.lead', {
                    defaultValue: 'Suas notificações, do seu jeito.',
                  })}
                </Text>
                <Text style={styles.subtitle}>
                  {t('profile.notifications.subtitle', {
                    defaultValue:
                      'Você escolhe por onde e em que horário recebe novidades, ofertas e avisos do Like:Me. Porque cuidar da saúde também é cuidar de quanto você fica conectado.',
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('profile.notifications.sectionTitle', {
                  defaultValue: 'Personalize suas notificações',
                })}
              </Text>
              <View style={styles.categoryList}>
                {CATEGORY_IDS.map((categoryId) => {
                  const category = form[categoryId];
                  return (
                    <NotificationPreferenceCategoryCard
                      key={categoryId}
                      category={category}
                      expanded={expandedCategoryIds.has(categoryId)}
                      disabled={savingCategoryId === categoryId}
                      onToggleExpanded={() => {
                        setExpandedCategoryIds((current) => {
                          const next = new Set(current);
                          if (next.has(categoryId)) {
                            next.delete(categoryId);
                          } else {
                            next.add(categoryId);
                          }
                          return next;
                        });
                      }}
                      onEnabledChange={(enabled) => {
                        if (category.id === 'transactions') {
                          return;
                        }
                        const required = NOTIFICATION_REQUIRED_CHANNEL[category.id];
                        void saveCategory({
                          ...category,
                          enabled,
                          channels: enabled
                            ? { ...category.channels, [required]: true }
                            : { email: false, whatsapp: false, push: false },
                        });
                      }}
                      onChannelChange={(channel, selected) => {
                        const required = NOTIFICATION_REQUIRED_CHANNEL[category.id];
                        if (channel === required && !selected) {
                          return;
                        }
                        void saveCategory({
                          ...category,
                          channels: { ...category.channels, [channel]: selected },
                        });
                      }}
                      onPreferredTimeChange={(preferredTime) => void saveCategory({ ...category, preferredTime })}
                      onLeadTimeChange={(leadTimeMinutes) => void saveCategory({ ...category, leadTimeMinutes })}
                    />
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </ScreenWithHeader>
  );
};

export default NotificationPreferencesScreen;
