import React from 'react';
import { Modal, Text, View } from 'react-native';
import { CTACard } from '@/components/ui/cards';
import { PartnerSection } from '@/components/sections/advertiser';
import { COLORS } from '@/constants';
import { useTranslation } from '@/hooks/i18n';
import { styles } from './styles';

export type CommunityDescriptionVariant = 'feed' | 'solutions';

/** Dados do parceiro/especialista exibidos acima do feed (alinhado ao que o PartnerSection consome). */
export type CommunityDescriptionSpecialist = {
  name: string;
  subtitle?: string;
  tags?: string[];
  avatarUri?: string | null;
};

export type CommunityDescriptionSectionProps = {
  variant: CommunityDescriptionVariant;
  specialist?: CommunityDescriptionSpecialist | null;
  showNotificationPrompt?: boolean;
  onNotificationPromptClose?: () => void;
  onDefineNotifications?: () => void;
  shoppingTipDismissed?: boolean;
  onShoppingTipClose?: () => void;
};

const CommunityDescriptionSection: React.FC<CommunityDescriptionSectionProps> = ({
  variant,
  specialist,
  showNotificationPrompt = false,
  onNotificationPromptClose,
  onDefineNotifications,
  shoppingTipDismissed = true,
  onShoppingTipClose,
}) => {
  const { t } = useTranslation();

  const specialistBlock =
    specialist != null ? (
      <View style={[styles.specialistBlock, variant === 'solutions' && styles.specialistBlockCompact]}>
        <PartnerSection
          name={specialist.name}
          avatar={specialist.avatarUri ?? undefined}
          specialistLabel={specialist.subtitle?.trim() || t('community.specialistLabel')}
        />
      </View>
    ) : null;

  if (variant === 'feed') {
    return (
      <>
        <Modal
          visible={showNotificationPrompt}
          transparent
          animationType='fade'
          onRequestClose={onNotificationPromptClose}
        >
          <View style={styles.promptOverlay}>
            <CTACard
              backgroundColor='#F6CFFB'
              style={styles.welcomeCtaCard}
              onClose={onNotificationPromptClose}
              primaryButtonLabel={t('profile.notifications.defineNow', { defaultValue: 'Definir agora' })}
              primaryButtonOnPress={onDefineNotifications ?? onNotificationPromptClose}
              primaryButtonIcon='chevron-right'
              primaryButtonIconPosition='right'
            >
              <Text style={styles.promptTitle}>
                {t('profile.notifications.lead', { defaultValue: 'Suas notificações, do seu jeito.' })}
              </Text>
              <Text style={styles.promptIntro}>
                {t('profile.notifications.promptIntro', {
                  defaultValue: 'Você ainda não definiu as suas preferências de notificação.',
                })}
              </Text>
              <Text style={styles.promptBody}>
                {t('profile.notifications.promptBody', {
                  defaultValue:
                    'No Like:me você escolhe por onde e em que horário quer receber novidades, ofertas e aviso das suas atividades.',
                })}
              </Text>
            </CTACard>
          </View>
        </Modal>
        {specialistBlock}
      </>
    );
  }

  return (
    <>
      {!shoppingTipDismissed && (
        <View style={styles.shoppingTipContainer}>
          <CTACard backgroundColor={COLORS.HIGHLIGHT.LIGHT} style={styles.shoppingTip} onClose={onShoppingTipClose}>
            <Text style={styles.shoppingTipTitle}>{t('community.shoppingTipTitle')}</Text>
            <Text style={styles.shoppingTipDescription}>{t('community.shoppingTipIntro')}</Text>
            <Text style={styles.shoppingTipDescription}>{t('community.shoppingTipBullet1')}</Text>
            <Text style={styles.shoppingTipDescription}>{t('community.shoppingTipBullet2')}</Text>
            <Text style={styles.shoppingTipDescription}>{t('community.shoppingTipBullet3')}</Text>
            <Text style={styles.shoppingTipDescription}>{t('community.shoppingTipBullet4')}</Text>
            <Text style={styles.shoppingTipDescription}>{t('community.shoppingTipBullet5')}</Text>
            <Text style={[styles.shoppingTipDescription, styles.shoppingTipDescriptionBold]}>
              {t('community.shoppingTipOutro')}
            </Text>
          </CTACard>
        </View>
      )}
      {specialistBlock}
    </>
  );
};

export default CommunityDescriptionSection;
