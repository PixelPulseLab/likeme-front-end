import React from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '@/constants';
import { useTranslation } from '@/hooks/i18n';
import type {
  ActivityLeadTimeMinutes,
  NotificationCategoryForm,
  NotificationPreferenceChannelId,
  NotificationPreferredTimeId,
} from '@/types/notification/notificationPreferences';
import { styles } from './styles';

const CHANNELS: { id: NotificationPreferenceChannelId; label: string }[] = [
  { id: 'email', label: 'E-mail' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'push', label: 'Notificação' },
];

const PREFERRED_TIMES: {
  id: NotificationPreferredTimeId;
  key: string;
  label: string;
  hint?: string;
}[] = [
  { id: 'morning', key: 'morning', label: 'Manhã', hint: '(07h às 12h)' },
  { id: 'afternoon', key: 'afternoon', label: 'Tarde', hint: '(13h às 18h)' },
  { id: 'evening', key: 'evening', label: 'Noite', hint: '(18h às 22h)' },
  { id: 'no_preferred', key: 'noPreferred', label: 'Sem preferência' },
];

const LEAD_TIMES: { minutes: ActivityLeadTimeMinutes; label: string }[] = [
  { minutes: 10, label: '10 minutos antes das atividades' },
  { minutes: 30, label: '30 minutos antes das atividades' },
  { minutes: 60, label: '1 hora antes das atividades' },
];

const COPY = {
  offers: {
    title: 'Ofertas e novidades',
    description: 'Conteúdos sobre serviços, profissionais, eventos, programas, benefícios e promoções.',
    requiredChannel: 'email' as const,
  },
  activities: {
    title: 'Minhas atividades',
    description: 'Lembretes sobre suas sessões, programas e eventos da sua jornada.',
    requiredChannel: 'push' as const,
  },
  transactions: {
    title: 'Transações',
    description: 'Confirmações de compras, pagamentos, assinatura e outras movimentações da sua conta.',
    requiredChannel: 'email' as const,
  },
};

type Props = {
  category: NotificationCategoryForm;
  expanded: boolean;
  disabled: boolean;
  onToggleExpanded: () => void;
  onEnabledChange: (enabled: boolean) => void;
  onChannelChange: (channel: NotificationPreferenceChannelId, selected: boolean) => void;
  onPreferredTimeChange: (preferredTime: NotificationPreferredTimeId) => void;
  onLeadTimeChange: (leadTimeMinutes: ActivityLeadTimeMinutes) => void;
};

export function NotificationPreferenceCategoryCard({
  category,
  expanded,
  disabled,
  onToggleExpanded,
  onEnabledChange,
  onChannelChange,
  onPreferredTimeChange,
  onLeadTimeChange,
}: Props) {
  const { t } = useTranslation();
  const copy = COPY[category.id];
  const title = t(`profile.notifications.${category.id}.title`, { defaultValue: copy.title });
  const hasTime = category.id === 'offers' || category.id === 'activities';

  return (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryTitle}>{title}</Text>
        <Switch
          value={category.enabled}
          onValueChange={onEnabledChange}
          disabled={disabled || category.id === 'transactions'}
          trackColor={{ false: COLORS.NEUTRAL.LOW.LIGHT, true: COLORS.PRIMARY.PURE }}
          thumbColor={COLORS.WHITE}
          ios_backgroundColor={COLORS.NEUTRAL.LOW.LIGHT}
          accessibilityLabel={title}
        />
      </View>

      <View style={styles.categorySummary}>
        <Text style={styles.categoryDescription}>
          {t(`profile.notifications.${category.id}.description`, { defaultValue: copy.description })}
        </Text>
        <TouchableOpacity
          style={styles.seeMoreButton}
          onPress={onToggleExpanded}
          accessibilityRole='button'
          accessibilityState={{ expanded }}
        >
          <Text style={styles.seeMoreLabel}>
            {expanded
              ? t('profile.notifications.seeLess', { defaultValue: 'Ver menos' })
              : t('profile.notifications.seeMore', { defaultValue: 'Ver mais' })}
          </Text>
          <Icon name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={24} color={COLORS.TEXT} />
        </TouchableOpacity>
      </View>

      {expanded ? (
        <View style={styles.categoryBody}>
          {hasTime ? <View style={styles.separator} /> : null}

          <View style={styles.optionBlock}>
            <Text style={styles.optionLabel}>
              {t('profile.notifications.channelsLabel', {
                defaultValue: 'Como você prefere receber?',
              })}
            </Text>
            {CHANNELS.map((channel) => {
              const requiredLocked = channel.id === copy.requiredChannel && category.enabled;
              const checked = category.enabled && (requiredLocked || category.channels[channel.id]);
              const rowDisabled = disabled || !category.enabled || requiredLocked;
              return (
                <TouchableOpacity
                  key={channel.id}
                  style={styles.optionRow}
                  onPress={() => onChannelChange(channel.id, !category.channels[channel.id])}
                  disabled={rowDisabled}
                  activeOpacity={0.7}
                  accessibilityRole='checkbox'
                  accessibilityState={{ checked, disabled: rowDisabled }}
                >
                  <View
                    style={[
                      styles.checkbox,
                      checked && styles.checkboxChecked,
                      requiredLocked && styles.checkboxLocked,
                    ]}
                  >
                    {checked ? (
                      <Icon
                        name='check'
                        size={12}
                        color={requiredLocked ? COLORS.NEUTRAL.LOW.MEDIUM : COLORS.PRIMARY.PURE}
                      />
                    ) : null}
                  </View>
                  <Text style={styles.optionName}>
                    {t(`profile.notifications.channel.${channel.id}`, { defaultValue: channel.label })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {category.id === 'offers' ? (
            <>
              <View style={styles.separator} />
              <View style={styles.optionBlock}>
                <Text style={styles.optionLabel}>
                  {t('profile.notifications.preferredTimeLabel', {
                    defaultValue: 'Qual é o melhor horário para você?',
                  })}
                </Text>
                {PREFERRED_TIMES.map((option) => {
                  const selected = category.preferredTime === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.optionRow}
                      onPress={() => onPreferredTimeChange(option.id)}
                      disabled={disabled || !category.enabled}
                      activeOpacity={0.7}
                      accessibilityRole='radio'
                      accessibilityState={{ selected }}
                    >
                      <View style={[styles.radio, selected && styles.radioSelected]}>
                        {selected ? <View style={styles.radioInner} /> : null}
                      </View>
                      <Text>
                        <Text style={option.hint ? styles.optionName : styles.optionHint}>
                          {t(`profile.notifications.preferredTime.${option.key}`, {
                            defaultValue: option.label,
                          })}
                          {option.hint ? ' ' : ''}
                        </Text>
                        {option.hint ? (
                          <Text style={styles.optionHint}>
                            {t(`profile.notifications.preferredTime.${option.key}Hint`, {
                              defaultValue: option.hint,
                            })}
                          </Text>
                        ) : null}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : null}

          {category.id === 'activities' ? (
            <>
              <View style={styles.separator} />
              <View style={styles.optionBlock}>
                <Text style={styles.optionLabel}>
                  {t('profile.notifications.leadTimeLabel', {
                    defaultValue: 'Quando prefere receber a notificação?',
                  })}
                </Text>
                {LEAD_TIMES.map((option) => {
                  const selected = category.leadTimeMinutes === option.minutes;
                  return (
                    <TouchableOpacity
                      key={option.minutes}
                      style={styles.optionRow}
                      onPress={() => onLeadTimeChange(option.minutes)}
                      disabled={disabled || !category.enabled}
                      activeOpacity={0.7}
                      accessibilityRole='radio'
                      accessibilityState={{ selected }}
                    >
                      <View style={[styles.radio, selected && styles.radioSelected]}>
                        {selected ? <View style={styles.radioInner} /> : null}
                      </View>
                      <Text style={styles.optionName}>
                        {t(`profile.notifications.leadTime.minutes${option.minutes}`, {
                          defaultValue: option.label,
                        })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
