export const ACCOUNT_CLOSURE_REASONS = {
  NOT_USING_ENOUGH: 'not_using_enough',
  PRICE_TOO_HIGH: 'price_too_high',
  LEARNED_ENOUGH: 'learned_enough',
  WILL_RESUME_LATER: 'will_resume_later',
  OTHER: 'other',
} as const;

export type AccountClosureReason = (typeof ACCOUNT_CLOSURE_REASONS)[keyof typeof ACCOUNT_CLOSURE_REASONS];

export const ACCOUNT_CLOSURE_REASON_OPTIONS: ReadonlyArray<{
  id: AccountClosureReason;
  labelKey: string;
}> = [
  { id: ACCOUNT_CLOSURE_REASONS.NOT_USING_ENOUGH, labelKey: 'profile.deleteAccountFlow.reasonNotUsingEnough' },
  { id: ACCOUNT_CLOSURE_REASONS.PRICE_TOO_HIGH, labelKey: 'profile.deleteAccountFlow.reasonPriceTooHigh' },
  { id: ACCOUNT_CLOSURE_REASONS.LEARNED_ENOUGH, labelKey: 'profile.deleteAccountFlow.reasonLearnedEnough' },
  { id: ACCOUNT_CLOSURE_REASONS.WILL_RESUME_LATER, labelKey: 'profile.deleteAccountFlow.reasonWillResumeLater' },
  { id: ACCOUNT_CLOSURE_REASONS.OTHER, labelKey: 'profile.deleteAccountFlow.reasonOther' },
];

export const ACCOUNT_DELETION_CONFIRMATION_WORD = 'EXCLUIR';
