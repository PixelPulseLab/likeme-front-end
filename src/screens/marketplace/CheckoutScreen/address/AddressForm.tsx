import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import AddressView from './AddressView';
import AddressEdit from './AddressEdit';
import { styles } from '../styles';
import { E2E_TEST_IDS } from '@/constants/e2eTestIds';

export interface AddressData {
  fullName: string;
  addressLine1: string;
  streetNumber: string;
  addressLine2: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

export const EMPTY_ADDRESS: AddressData = {
  fullName: '',
  addressLine1: '',
  streetNumber: '',
  addressLine2: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
};

export function isAddressFilled(address: AddressData): boolean {
  return (
    address.fullName.trim() !== '' &&
    address.addressLine1.trim() !== '' &&
    address.neighborhood.trim() !== '' &&
    address.city.trim() !== '' &&
    address.state.trim() !== '' &&
    address.zipCode.replace(/\D/g, '').length >= 8 &&
    address.phone.replace(/\D/g, '').length >= 10
  );
}

interface AddressFormProps {
  addressData?: AddressData;
  onSaveAddress?: (address: AddressData) => void | Promise<void>;
  titleKey?: string;
  deliverySameAsBilling?: boolean;
  onDeliverySameAsBillingChange?: (value: boolean) => void;
  startWithEditOpen?: boolean;
  addressLoadError?: string | null;
  addressSaveError?: string | null;
}

const AddressForm: React.FC<AddressFormProps> = ({
  addressData = EMPTY_ADDRESS,
  onSaveAddress,
  titleKey = 'checkout.deliveryAddress',
  deliverySameAsBilling,
  onDeliverySameAsBillingChange,
  startWithEditOpen = false,
  addressLoadError = null,
  addressSaveError = null,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (startWithEditOpen) {
      setIsEditing(true);
    }
  }, [startWithEditOpen]);

  useEffect(() => {
    if (deliverySameAsBilling === false) {
      setIsEditing(true);
    }
  }, [deliverySameAsBilling]);

  const handleEditPress = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async (address: AddressData) => {
    if (onSaveAddress) {
      try {
        setIsSaving(true);
        await Promise.resolve(onSaveAddress(address));
        setIsEditing(false);
      } catch {
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  return (
    <View testID={E2E_TEST_IDS.CHECKOUT_ADDRESS_FORM}>
      {addressLoadError ? (
        <View style={styles.addressErrorContainer}>
          <Text style={styles.fieldError}>{addressLoadError}</Text>
        </View>
      ) : null}
      {!isEditing ? (
        <AddressView
          address={addressData}
          onEditPress={handleEditPress}
          titleKey={titleKey}
          deliverySameAsBilling={deliverySameAsBilling}
          onDeliverySameAsBillingChange={onDeliverySameAsBillingChange}
        />
      ) : (
        <AddressEdit
          initialData={addressData}
          onSave={handleSave}
          onCancel={handleCancelEdit}
          saving={isSaving}
          titleKey={titleKey}
        />
      )}
      {addressSaveError ? <Text style={styles.fieldError}>{addressSaveError}</Text> : null}
    </View>
  );
};

export default AddressForm;
