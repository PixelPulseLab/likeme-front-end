const MAX_CARD_NUMBER_LENGTH = 19;
const MAX_CARD_DIGITS = 16;

export const formatCardNumber = (text: string): string => {
  const digitsOnly = text.replace(/\D/g, '').slice(0, MAX_CARD_DIGITS);
  const formatted = digitsOnly.match(/.{1,4}/g)?.join(' ') || digitsOnly;
  return formatted.slice(0, MAX_CARD_NUMBER_LENGTH);
};

export const formatCpf = (text: string): string => {
  const numbers = text.replace(/\D/g, '');

  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  } else if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  }
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

export const formatExpiryDate = (text: string): string => {
  const cleaned = text.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  }
  return cleaned;
};

export const BR_PHONE_MIN_DIGITS = 10;
export const BR_PHONE_MAX_DIGITS = 11;

export const formatPhone = (text: string): string => {
  const numbers = text.replace(/\D/g, '').slice(0, BR_PHONE_MAX_DIGITS);

  if (numbers.length === 0) return '';
  if (numbers.length <= 2) {
    return `(${numbers}`;
  }
  if (numbers.length <= 7) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
};

export const phoneDigits = (value: string): string => value.replace(/\D/g, '');

export const isOptionalBrazilianPhoneValid = (value: string): boolean => {
  const digits = phoneDigits(value);
  if (!digits) return true;
  return digits.length >= BR_PHONE_MIN_DIGITS && digits.length <= BR_PHONE_MAX_DIGITS;
};

/** CEP: apenas dígitos, formata como 00000-000 (máx. 8 dígitos). */
export const formatZipCode = (text: string): string => {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};
