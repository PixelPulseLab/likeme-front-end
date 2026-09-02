import { useState, useCallback } from 'react';
import { useFormattedInput } from '../useFormattedInput';
import type { CardData } from '@/types/order';

type TFunction = (key: string) => string;

export function usePayment() {
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cpf, setCpf] = useState('');
  const [paymentFieldErrors, setPaymentFieldErrors] = useState<Record<string, string>>({});
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCpfChange = useFormattedInput({
    type: 'cpf',
    onChangeText: setCpf,
  });

  const clearFieldError = useCallback((field: string) => {
    setPaymentFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const onCardholderNameChange = useCallback(
    (value: string) => {
      setCardholderName(value);
      clearFieldError('cardholderName');
    },
    [clearFieldError],
  );

  const onCardNumberChange = useCallback(
    (value: string) => {
      setCardNumber(value);
      clearFieldError('cardNumber');
    },
    [clearFieldError],
  );

  const onExpiryDateChange = useCallback(
    (value: string) => {
      setExpiryDate(value);
      clearFieldError('expiryDate');
    },
    [clearFieldError],
  );

  const onCvvChange = useCallback(
    (value: string) => {
      setCvv(value);
      clearFieldError('cvv');
    },
    [clearFieldError],
  );

  const onCpfChange = useCallback(
    (text: string) => {
      handleCpfChange(text);
      clearFieldError('cpf');
    },
    [handleCpfChange, clearFieldError],
  );

  const isPaymentStepValid = useCallback(
    (billingAddressFilled: boolean, requireCard = true) =>
      cpf.replace(/\D/g, '').length === 11 &&
      billingAddressFilled &&
      (!requireCard ||
        (cardholderName.trim() !== '' &&
          cardNumber.replace(/\s/g, '').trim() !== '' &&
          expiryDate.replace(/\D/g, '').length === 4 &&
          cvv.trim() !== '')),
    [cardholderName, cardNumber, expiryDate, cvv, cpf],
  );

  const validatePaymentFields = useCallback(
    (t: TFunction, requireCard = true): Record<string, string> | null => {
      const errors: Record<string, string> = {};
      if (requireCard) {
        if (!cardholderName.trim()) errors.cardholderName = t('common.requiredField');
        if (!cardNumber.replace(/\s/g, '').trim()) errors.cardNumber = t('common.requiredField');
        const expDigits = expiryDate.replace(/\D/g, '');
        if (expDigits.length === 0) errors.expiryDate = t('common.requiredField');
        else if (expDigits.length !== 4) errors.expiryDate = t('checkout.invalidExpiryError');
        if (!cvv.trim()) errors.cvv = t('common.requiredField');
      }
      const cpfDigits = cpf.replace(/\D/g, '');
      if (cpfDigits.length !== 11) errors.cpf = t('common.requiredField');
      return Object.keys(errors).length > 0 ? errors : null;
    },
    [cardholderName, cardNumber, expiryDate, cvv, cpf],
  );

  const getCpfDigits = useCallback(() => cpf.replace(/\D/g, ''), [cpf]);

  const getCardData = useCallback((): CardData | undefined => {
    const formattedExpiry = expiryDate.replace(/\D/g, '');
    if (formattedExpiry.length !== 4) return undefined;
    const formattedCpf = cpf.replace(/\D/g, '');
    return {
      cardNumber: cardNumber.replace(/\s/g, ''),
      cardHolderName: cardholderName,
      cardExpirationDate: formattedExpiry,
      cardCvv: cvv,
      cpf: formattedCpf.length === 11 ? formattedCpf : undefined,
    };
  }, [cardholderName, cardNumber, expiryDate, cvv, cpf]);

  return {
    cardholderName,
    cardNumber,
    expiryDate,
    cvv,
    cpf,
    paymentFieldErrors,
    paymentError,
    isProcessing,
    setPaymentError,
    setPaymentFieldErrors,
    setIsProcessing,
    onCardholderNameChange,
    onCardNumberChange,
    onExpiryDateChange,
    onCvvChange,
    onCpfChange,
    isPaymentStepValid,
    validatePaymentFields,
    getCardData,
    getCpfDigits,
  };
}
