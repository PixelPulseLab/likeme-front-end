import React, { useCallback, useMemo } from 'react';
import { View, Linking, type ViewStyle } from 'react-native';
import { IconButton } from '@/components/ui/buttons';
import type { Contact } from '@/types/contact';
import { buildAdvertiserContactButtons, type AdvertiserContactButton } from '@/utils/advertiser/contactButtons';
import { resolveWaMePrefillFromI18n } from '@/utils/marketplace/resolveWaMePrefillFromI18n';
import { logger } from '@/utils/logger';
import { styles } from './styles';

type ContactButtonsRowProps = {
  contacts: Contact[] | undefined;
  providerId?: string;
  onSharePress?: () => void;
  testID?: string;
  containerStyle?: ViewStyle;
};

export function ContactButtonsRow({
  contacts,
  providerId,
  onSharePress,
  testID,
  containerStyle,
}: ContactButtonsRowProps) {
  const contactButtons = useMemo(
    () =>
      buildAdvertiserContactButtons(contacts, {
        waMePrefillText: providerId ? resolveWaMePrefillFromI18n(providerId) : undefined,
      }),
    [contacts, providerId],
  );

  const onContactPress = useCallback(
    (contactButton: AdvertiserContactButton) => {
      Linking.openURL(contactButton.url).catch((error: Error) => {
        logger.error('[ContactButtonsRow] Erro ao abrir contato', {
          providerId,
          contactType: contactButton.contact.type,
          cause: error,
        });
      });
    },
    [providerId],
  );

  if (contactButtons.length === 0 && !onSharePress) {
    return null;
  }

  return (
    <View style={[styles.contactButtonsRow, containerStyle]} testID={testID}>
      <View style={styles.contactButtonsGroup}>
        {contactButtons.map((contactButton, index) => {
          const ContactIcon = contactButton.IconComponent;
          const contactTestId = `${testID ?? 'contact'}-${contactButton.contact.type}`;
          return (
            <View key={`${contactButton.contact.type}-${contactButton.contact.value}-${index}`} testID={contactTestId}>
              <IconButton
                onPress={() => onContactPress(contactButton)}
                {...(ContactIcon
                  ? { iconElement: <ContactIcon width={contactButton.size} height={contactButton.size} /> }
                  : { icon: contactButton.materialIcon ?? 'link', iconSize: contactButton.size })}
                variant='dark'
                backgroundSize='medium'
                containerStyle={styles.contactIconButtonContainer}
              />
            </View>
          );
        })}
      </View>
      {onSharePress ? (
        <IconButton
          icon='share'
          onPress={onSharePress}
          backgroundSize='medium'
          containerStyle={styles.shareButtonContainer}
        />
      ) : null}
    </View>
  );
}
