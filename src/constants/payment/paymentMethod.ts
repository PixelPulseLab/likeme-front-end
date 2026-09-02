export const PAYMENT_METHOD = {
  CREDIT_CARD: 'credit_card',
  GOOGLE_PAY: 'google_pay',
  APPLE_PAY: 'apple_pay',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];
