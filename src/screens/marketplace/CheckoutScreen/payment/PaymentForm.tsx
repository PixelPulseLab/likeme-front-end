import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import TextInput from '@/components/ui/inputs/TextInput';
import { PAYMENT_METHOD, type PaymentMethod } from '@/constants/payment/paymentMethod';
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
  selectedPaymentMethod?: PaymentMethod;
  googlePayAvailable?: boolean;
  applePayAvailable?: boolean;
  onPaymentMethodChange?: (method: PaymentMethod) => void;
  onCardholderNameChange: (text: string) => void;
  onCardNumberChange: (text: string) => void;
  onExpiryDateChange: (text: string) => void;
  onCvvChange: (text: string) => void;
  onCpfChange: (text: string) => void;
  onSaveBillingAddress: (address: AddressData) => void | Promise<void>;
  onDeliverySameAsBillingChange?: (value: boolean) => void;
}

function PaymentMethodRadio({
  selected,
  label,
  testID,
  onPress,
}: {
  selected: boolean;
  label: string;
  testID: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.paymentMethodOption} onPress={onPress} testID={testID}>
      <View style={[styles.radioButton, selected && styles.radioButtonSelected]}>
        {selected ? <View style={styles.radioButtonInner} /> : null}
      </View>
      <Text style={styles.paymentMethodLabel}>{label}</Text>
    </TouchableOpacity>
  );
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
  selectedPaymentMethod = PAYMENT_METHOD.CREDIT_CARD,
  googlePayAvailable = false,
  applePayAvailable = false,
  onPaymentMethodChange,
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

  const showCardFields = selectedPaymentMethod === PAYMENT_METHOD.CREDIT_CARD;
  const showWalletOptions = googlePayAvailable || applePayAvailable;

  return (
    <View testID={E2E_TEST_IDS.CHECKOUT_PAYMENT_FORM}>
      {showWalletOptions ? (
        <View style={styles.paymentMethodSection}>
          <Text style={styles.sectionTitle}>{t('checkout.paymentMethod', { defaultValue: 'Forma de pagamento' })}</Text>
          <View style={styles.paymentMethodOptions}>
            <PaymentMethodRadio
              selected={selectedPaymentMethod === PAYMENT_METHOD.CREDIT_CARD}
              label={t('checkout.creditCard', { defaultValue: 'Cartão de crédito' })}
              testID={E2E_TEST_IDS.CHECKOUT_PAYMENT_METHOD_CARD}
              onPress={() => onPaymentMethodChange?.(PAYMENT_METHOD.CREDIT_CARD)}
            />
            {googlePayAvailable ? (
              <PaymentMethodRadio
                selected={selectedPaymentMethod === PAYMENT_METHOD.GOOGLE_PAY}
                label={t('checkout.googlePay', { defaultValue: 'Google Pay' })}
                testID={E2E_TEST_IDS.CHECKOUT_PAYMENT_METHOD_GOOGLE_PAY}
                onPress={() => onPaymentMethodChange?.(PAYMENT_METHOD.GOOGLE_PAY)}
              />
            ) : null}
            {applePayAvailable ? (
              <PaymentMethodRadio
                selected={selectedPaymentMethod === PAYMENT_METHOD.APPLE_PAY}
                label={t('checkout.applePay', { defaultValue: 'Apple Pay' })}
                testID={E2E_TEST_IDS.CHECKOUT_PAYMENT_METHOD_APPLE_PAY}
                onPress={() => onPaymentMethodChange?.(PAYMENT_METHOD.APPLE_PAY)}
              />
            ) : null}
          </View>
        </View>
      ) : null}

      <View style={styles.cardForm}>
        {showCardFields ? (
          <>
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
          </>
        ) : null}
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
