import React from 'react';
import { View } from 'react-native';
import TextInput from '@/components/ui/inputs/TextInput';
import { useFormattedInput } from '@/hooks';
import { useTranslation } from '@/hooks/i18n';
import { styles } from '../styles';
import AddressForm from '../address/AddressForm';
import type { AddressData } from '../address/AddressForm';
import { E2E_TEST_IDS } from '@/constants/e2eTestIds';

interface PaymentFormProps {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cpf: string;
  paymentFieldErrors?: Record<string, string>;
  billingAddressData: AddressData;
  deliverySameAsBilling?: boolean;
  onCardholderNameChange: (text: string) => void;
  onCardNumberChange: (text: string) => void;
  onExpiryDateChange: (text: string) => void;
  onCvvChange: (text: string) => void;
  onCpfChange: (text: string) => void;
  onSaveBillingAddress: (address: AddressData) => void | Promise<void>;
  onDeliverySameAsBillingChange?: (value: boolean) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  cardholderName,
  cardNumber,
  expiryDate,
  cvv,
  cpf,
  paymentFieldErrors = {},
  billingAddressData,
  deliverySameAsBilling,
  onCardholderNameChange,
  onCardNumberChange,
  onExpiryDateChange,
  onCvvChange,
  onCpfChange,
  onSaveBillingAddress,
  onDeliverySameAsBillingChange,
}) => {
  const { t } = useTranslation();
  const handleCardNumberChange = useFormattedInput({
    type: 'cardNumber',
    onChangeText: onCardNumberChange,
  });

  const handleExpiryDateChange = useFormattedInput({
    type: 'expiryDate',
    onChangeText: onExpiryDateChange,
  });

  return (
    <View testID={E2E_TEST_IDS.CHECKOUT_PAYMENT_FORM}>
      {/* Cartão de crédito (único método implementado) */}
      <View style={styles.cardForm}>
        <TextInput
          label={t('checkout.cardholderName')}
          placeholder={t('checkout.cardholderNamePlaceholder')}
          value={cardholderName}
          onChangeText={onCardholderNameChange}
          errorText={paymentFieldErrors.cardholderName}
          required
          testID={E2E_TEST_IDS.CHECKOUT_CARDHOLDER}
        />
        <TextInput
          label={t('checkout.cardNumber')}
          placeholder={t('checkout.cardNumberPlaceholder')}
          value={cardNumber}
          onChangeText={handleCardNumberChange}
          keyboardType='numeric'
          errorText={paymentFieldErrors.cardNumber}
          required
          testID={E2E_TEST_IDS.CHECKOUT_CARD_NUMBER}
        />
        <View style={styles.cardRow}>
          <View style={styles.cardFieldHalf}>
            <TextInput
              label={t('checkout.expiryDate')}
              placeholder={t('checkout.expiryDatePlaceholder')}
              value={expiryDate}
              onChangeText={handleExpiryDateChange}
              keyboardType='numeric'
              errorText={paymentFieldErrors.expiryDate}
              required
              testID={E2E_TEST_IDS.CHECKOUT_EXPIRY}
            />
          </View>
          <View style={styles.cardFieldHalf}>
            <TextInput
              label={t('checkout.cvv')}
              placeholder={t('checkout.cvvPlaceholder')}
              value={cvv}
              onChangeText={onCvvChange}
              keyboardType='numeric'
              secureTextEntry
              errorText={paymentFieldErrors.cvv}
              required
              testID={E2E_TEST_IDS.CHECKOUT_CVV}
            />
          </View>
        </View>
        <TextInput
          label={t('checkout.cpf')}
          placeholder={t('checkout.cpfPlaceholder')}
          value={cpf}
          onChangeText={onCpfChange}
          keyboardType='numeric'
          errorText={paymentFieldErrors.cpf}
          required
          testID={E2E_TEST_IDS.CHECKOUT_CPF}
        />
      </View>

      {/* Endereço de cobrança */}
      <AddressForm
        addressData={billingAddressData}
        onSaveAddress={onSaveBillingAddress}
        titleKey='checkout.billingAddress'
        deliverySameAsBilling={deliverySameAsBilling}
        onDeliverySameAsBillingChange={onDeliverySameAsBillingChange}
        startWithEditOpen={deliverySameAsBilling === undefined ? true : !deliverySameAsBilling}
      />
    </View>
  );
};

export default PaymentForm;
