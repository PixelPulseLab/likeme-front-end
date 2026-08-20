import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import TextInput from '@/components/ui/inputs/TextInput';
import { SecondaryButton } from '@/components/ui/buttons';
import { useTranslation } from '@/hooks/i18n';
import { useFormattedInput } from '@/hooks';
import { fetchAddressByZipCode, formatZipCodeDisplay } from '@/services/address/cepService';
import { AddressData } from './AddressForm';
import { styles } from '../styles';
import { E2E_TEST_IDS } from '@/constants/e2eTestIds';

interface AddressEditProps {
  initialData: AddressData;
  onSave: (address: AddressData) => void;
  onCancel?: () => void;
  saving?: boolean;
  titleKey?: string;
}

const AddressEdit: React.FC<AddressEditProps> = ({
  initialData,
  onSave,
  onCancel,
  saving = false,
  titleKey = 'checkout.deliveryAddress',
}) => {
  const { t } = useTranslation();
  const [editData, setEditData] = useState<AddressData>(initialData);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loadingCep, setLoadingCep] = useState(false);
  const lastFetchedCepRef = useRef<string | null>(null);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleZipCodeChange = useFormattedInput({
    type: 'zipCode',
    onChangeText: (text) => setEditData((prev) => ({ ...prev, zipCode: text })),
  });

  useEffect(() => {
    const digits = editData.zipCode.replace(/\D/g, '');
    if (digits.length !== 8 || digits === lastFetchedCepRef.current) return;
    let cancelled = false;
    lastFetchedCepRef.current = digits;
    setLoadingCep(true);
    fetchAddressByZipCode(editData.zipCode)
      .then((data) => {
        if (cancelled || !data) return;
        setEditData((prev) => ({
          ...prev,
          zipCode: data.cep ? formatZipCodeDisplay(data.cep) : prev.zipCode,
          addressLine1: data.logradouro ?? prev.addressLine1,
          neighborhood: data.bairro ?? prev.neighborhood,
          city: data.localidade ?? prev.city,
          state: data.uf ?? prev.state,
        }));
      })
      .then(
        () => {
          if (!cancelled) setLoadingCep(false);
        },
        () => {
          if (!cancelled) setLoadingCep(false);
        },
      );
    return () => {
      cancelled = true;
    };
  }, [editData.zipCode]);

  const handlePhoneChange = useFormattedInput({
    type: 'phone',
    onChangeText: (text) => setEditData((prev) => ({ ...prev, phone: text })),
  });

  useEffect(() => {
    setEditData(initialData);
    lastFetchedCepRef.current = null;
  }, [initialData]);

  const handleSave = () => {
    const errors: Record<string, string> = {};
    if (!editData.fullName.trim()) errors.fullName = t('common.requiredField');
    if (!editData.addressLine1.trim()) errors.addressLine1 = t('common.requiredField');
    if (!editData.neighborhood.trim()) errors.neighborhood = t('common.requiredField');
    if (!editData.city.trim()) errors.city = t('common.requiredField');
    if (!editData.state.trim()) errors.state = t('common.requiredField');
    const zipDigits = editData.zipCode.replace(/\D/g, '');
    if (zipDigits.length < 8) errors.zipCode = t('common.requiredField');
    const phoneDigits = editData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) errors.phone = t('common.requiredField');

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    onSave(editData);
  };

  return (
    <View style={styles.addressCard}>
      <View style={styles.addressCardHeader}>
        <Text style={styles.addressCardTitle}>{t(titleKey)}</Text>
      </View>
      <View style={styles.editAddressContainer}>
        <View style={styles.addressRow}>
          <View style={styles.addressFieldHalf}>
            <TextInput
              label={t('checkout.zipCode')}
              placeholder={t('cart.zipCodePlaceholder')}
              value={editData.zipCode}
              onChangeText={(text) => {
                handleZipCodeChange(text);
                clearFieldError('zipCode');
              }}
              keyboardType='numeric'
              errorText={fieldErrors.zipCode}
              required
              testID={E2E_TEST_IDS.CHECKOUT_ZIP}
            />
          </View>
        </View>
        {loadingCep && (
          <View style={styles.cepLoadingWrap}>
            <ActivityIndicator size='small' color='#001137' />
            <Text style={styles.cepLoadingText}>{t('checkout.searchingAddress')}</Text>
          </View>
        )}
        <TextInput
          label={t('checkout.fullName')}
          placeholder={t('checkout.fullNamePlaceholder')}
          value={editData.fullName}
          onChangeText={(text) => {
            setEditData({ ...editData, fullName: text });
            clearFieldError('fullName');
          }}
          errorText={fieldErrors.fullName}
          required
          testID={E2E_TEST_IDS.CHECKOUT_FULL_NAME}
        />
        <View style={styles.addressRow}>
          <View style={styles.addressFieldHalf}>
            <TextInput
              label={t('checkout.addressLine1')}
              placeholder={t('checkout.addressLine1Placeholder')}
              value={editData.addressLine1}
              onChangeText={(text) => {
                setEditData({ ...editData, addressLine1: text });
                clearFieldError('addressLine1');
              }}
              errorText={fieldErrors.addressLine1}
              required
              testID={E2E_TEST_IDS.CHECKOUT_STREET}
            />
          </View>
          <View style={styles.addressFieldNumber}>
            <TextInput
              label={t('checkout.streetNumber')}
              placeholder={t('checkout.streetNumberPlaceholder')}
              value={editData.streetNumber}
              onChangeText={(text) => setEditData({ ...editData, streetNumber: text })}
              keyboardType='numeric'
              testID={E2E_TEST_IDS.CHECKOUT_STREET_NUMBER}
            />
          </View>
        </View>
        <TextInput
          label={t('checkout.addressLine2')}
          placeholder={t('checkout.addressLine2Placeholder')}
          value={editData.addressLine2}
          onChangeText={(text) => setEditData({ ...editData, addressLine2: text })}
        />
        <TextInput
          label={t('checkout.neighborhood')}
          placeholder={t('checkout.neighborhoodPlaceholder')}
          value={editData.neighborhood}
          onChangeText={(text) => {
            setEditData({ ...editData, neighborhood: text });
            clearFieldError('neighborhood');
          }}
          errorText={fieldErrors.neighborhood}
          required
          testID={E2E_TEST_IDS.CHECKOUT_NEIGHBORHOOD}
        />
        <View style={styles.addressRow}>
          <View style={styles.addressFieldHalf}>
            <TextInput
              label={t('checkout.city')}
              placeholder={t('checkout.cityPlaceholder')}
              value={editData.city}
              onChangeText={(text) => {
                setEditData({ ...editData, city: text });
                clearFieldError('city');
              }}
              errorText={fieldErrors.city}
              required
              testID={E2E_TEST_IDS.CHECKOUT_CITY}
            />
          </View>
          <View style={styles.addressFieldHalf}>
            <TextInput
              label={t('checkout.state')}
              placeholder={t('checkout.statePlaceholder')}
              value={editData.state}
              onChangeText={(text) => {
                setEditData({ ...editData, state: text });
                clearFieldError('state');
              }}
              errorText={fieldErrors.state}
              required
              testID={E2E_TEST_IDS.CHECKOUT_STATE}
            />
          </View>
        </View>
        <TextInput
          label={t('checkout.phone')}
          placeholder={t('checkout.phonePlaceholder')}
          value={editData.phone}
          onChangeText={(text) => {
            handlePhoneChange(text);
            clearFieldError('phone');
          }}
          keyboardType='phone-pad'
          errorText={fieldErrors.phone}
          required
          testID={E2E_TEST_IDS.CHECKOUT_PHONE}
        />
        <View style={styles.editAddressActions}>
          {onCancel && (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          )}
          <SecondaryButton
            label={t('common.save')}
            onPress={handleSave}
            disabled={saving}
            loading={saving}
            testID={E2E_TEST_IDS.CHECKOUT_ADDRESS_SAVE}
          />
        </View>
      </View>
    </View>
  );
};

export default AddressEdit;
