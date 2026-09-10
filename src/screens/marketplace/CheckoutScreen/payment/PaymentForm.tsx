import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SecondaryButton } from '@/components/ui/buttons';
import TextInput from '@/components/ui/inputs/TextInput';
import { PAYMENT_METHOD, type PaymentMethod } from '@/constants/payment/paymentMethod';
import { COLORS } from '@/constants';
import { useFormattedInput } from '@/hooks';
import { useTranslation } from '@/hooks/i18n';
import { styles } from '../styles';
import AddressForm from '../address/AddressForm';
import type { AddressData } from '../address/AddressForm';
import { E2E_TEST_IDS } from '@/constants/e2eTestIds';

const WALLET_PAY_WORDMARK = 'Pay';

function ApplePayMark() {
  return (
    <View style={styles.walletPayMarkSlot}>
      <Svg width={20} height={22} viewBox='0 0 24 24'>
        <Path
          fill={COLORS.TEXT}
          d='M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z'
        />
      </Svg>
    </View>
  );
}

function GooglePayMark() {
  return (
    <View style={styles.walletPayMarkSlot}>
      <Svg width={20} height={20} viewBox='0 0 24 24'>
        <Path
          fill='#4285F4'
          d='M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.48a5.54 5.54 0 0 1-2.4 3.63v3.02h3.88c2.27-2.09 3.53-5.17 3.53-8.89Z'
        />
        <Path
          fill='#34A853'
          d='M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3.02c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z'
        />
        <Path
          fill='#FBBC05'
          d='M5.27 14.26A7.21 7.21 0 0 1 4.89 12c0-.79.14-1.55.38-2.26V6.63H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.37l4-3.11Z'
        />
        <Path
          fill='#EA4335'
          d='M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.16 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.63l4 3.11C6.22 6.86 8.87 4.75 12 4.75Z'
        />
      </Svg>
    </View>
  );
}

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
  googlePayVisible?: boolean;
  applePayVisible?: boolean;
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
  googlePayVisible = false,
  applePayVisible = false,
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
  const showApplePayButton = applePayVisible || applePayAvailable;
  const showGooglePayButton = googlePayVisible || googlePayAvailable;
  const showWalletOptions = showApplePayButton || showGooglePayButton;

  return (
    <View testID={E2E_TEST_IDS.CHECKOUT_PAYMENT_FORM}>
      {showWalletOptions ? (
        <View style={styles.paymentMethodSection}>
          <Text style={styles.sectionTitle}>{t('checkout.paymentMethod', { defaultValue: 'Forma de pagamento' })}</Text>
          <View style={styles.walletPayButtons}>
            {showApplePayButton ? (
              <SecondaryButton
                disabled={!applePayAvailable}
                iconElement={<ApplePayMark />}
                iconPosition='left'
                label={WALLET_PAY_WORDMARK}
                labelStyle={styles.walletPayLabel}
                onPress={() => onPaymentMethodChange?.(PAYMENT_METHOD.APPLE_PAY)}
                size='large'
                style={[
                  styles.walletPayButton,
                  selectedPaymentMethod === PAYMENT_METHOD.APPLE_PAY ? styles.walletPayButtonSelected : undefined,
                ]}
                testID={E2E_TEST_IDS.CHECKOUT_PAYMENT_METHOD_APPLE_PAY}
              />
            ) : null}
            {showGooglePayButton ? (
              <SecondaryButton
                disabled={!googlePayAvailable}
                iconElement={<GooglePayMark />}
                iconPosition='left'
                label={WALLET_PAY_WORDMARK}
                labelStyle={styles.walletPayLabel}
                onPress={() => onPaymentMethodChange?.(PAYMENT_METHOD.GOOGLE_PAY)}
                size='large'
                style={[
                  styles.walletPayButton,
                  selectedPaymentMethod === PAYMENT_METHOD.GOOGLE_PAY ? styles.walletPayButtonSelected : undefined,
                ]}
                testID={E2E_TEST_IDS.CHECKOUT_PAYMENT_METHOD_GOOGLE_PAY}
              />
            ) : null}
          </View>
          <View style={styles.walletPayOrRow}>
            <View style={styles.walletPayOrLine} />
            <Text style={styles.walletPayOrLabel}>{t('checkout.or', { defaultValue: 'ou' })}</Text>
            <View style={styles.walletPayOrLine} />
          </View>
          <View style={styles.paymentMethodOptions}>
            <PaymentMethodRadio
              selected={selectedPaymentMethod === PAYMENT_METHOD.CREDIT_CARD}
              label={t('checkout.creditCard', { defaultValue: 'Cartão de crédito' })}
              testID={E2E_TEST_IDS.CHECKOUT_PAYMENT_METHOD_CARD}
              onPress={() => onPaymentMethodChange?.(PAYMENT_METHOD.CREDIT_CARD)}
            />
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
