import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from '@/hooks/i18n';
import { Checkbox } from '@/components/ui/inputs';
import { AddressData } from './AddressForm';
import { styles } from '../styles';
import { E2E_TEST_IDS } from '@/constants/e2eTestIds';

interface AddressViewProps {
  address: AddressData;
  onEditPress: () => void;
  titleKey?: string;
  deliverySameAsBilling?: boolean;
  onDeliverySameAsBillingChange?: (value: boolean) => void;
}

const AddressView: React.FC<AddressViewProps> = ({
  address,
  onEditPress,
  titleKey = 'checkout.deliveryAddress',
  deliverySameAsBilling,
  onDeliverySameAsBillingChange,
}) => {
  const { t } = useTranslation();
  const showDeliverySameAsBillingCheckbox =
    typeof deliverySameAsBilling === 'boolean' && typeof onDeliverySameAsBillingChange === 'function';

  const formatAddressText = (address: AddressData) => {
    const addressParts = [
      address.fullName,
      [address.addressLine1, address.streetNumber].filter(Boolean).join(', '),
      address.addressLine2,
      '',
      `${address.neighborhood} - ${address.city} - ${address.state}`,
      address.zipCode,
      address.phone,
    ].filter((part) => part !== '');

    return addressParts.join('\n');
  };

  return (
    <View style={styles.addressCard} testID={E2E_TEST_IDS.CHECKOUT_ADDRESS_VIEW}>
      <View style={styles.addressCardHeader}>
        <Text style={styles.addressCardTitle}>{t(titleKey)}</Text>
        <TouchableOpacity onPress={onEditPress} activeOpacity={0.7}>
          <Icon name='edit' size={24} color='#001137' />
        </TouchableOpacity>
      </View>
      <View style={styles.addressCardContent}>
        <Text style={styles.addressText}>{formatAddressText(address)}</Text>
        {showDeliverySameAsBillingCheckbox && (
          <View style={styles.checkboxPaddingTop}>
            <Checkbox
              label={t('checkout.deliverySameAsBilling')}
              checked={deliverySameAsBilling!}
              onPress={() => onDeliverySameAsBillingChange!(!deliverySameAsBilling)}
            />
          </View>
        )}
      </View>
    </View>
  );
};

export default AddressView;
