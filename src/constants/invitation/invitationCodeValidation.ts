export const INVITATION_CODE_VALIDATION_REASON = {
  INVALID: 'INVALID',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  REDEEMED: 'REDEEMED',
  PROGRAM_UNAVAILABLE: 'PROGRAM_UNAVAILABLE',
  IDENTITY: 'IDENTITY',
} as const;

export type InvitationCodeValidationReason =
  (typeof INVITATION_CODE_VALIDATION_REASON)[keyof typeof INVITATION_CODE_VALIDATION_REASON];

export const INVITATION_CODE_VALIDATION_ERROR = {
  INVALID: 'Código de convite inválido',
  EXPIRED: 'Este código de convite expirou',
  CANCELLED: 'Este código de convite foi cancelado',
  REDEEMED: 'Este código de convite já foi utilizado',
  PROGRAM_UNAVAILABLE: 'Este código de convite não pode ser utilizado',
  IDENTITY: 'Não foi possível vincular este convite à sua conta',
} as const;

export const INVITATION_CODE_VALIDATION_I18N_KEY = {
  INVALID: 'invitation.codeInvalid',
  EXPIRED: 'invitation.codeExpired',
  CANCELLED: 'invitation.codeCancelled',
  REDEEMED: 'invitation.codeRedeemed',
  PROGRAM_UNAVAILABLE: 'invitation.codeUnavailable',
  IDENTITY: 'invitation.identityMismatch',
} as const;

export const INVITATION_CODE_VALIDATE_FAILED_I18N_KEY = 'invitation.codeValidateFailed';

const VALIDATION_ERROR_MESSAGES = Object.values(INVITATION_CODE_VALIDATION_ERROR);

export function invitationCodeValidationI18nKey(error: unknown): string {
  const message = error instanceof Error ? error.message.trim() : '';
  const reason = (Object.keys(INVITATION_CODE_VALIDATION_ERROR) as InvitationCodeValidationReason[]).find(
    (key) => INVITATION_CODE_VALIDATION_ERROR[key] === message,
  );
  if (!reason || !VALIDATION_ERROR_MESSAGES.includes(message)) {
    return INVITATION_CODE_VALIDATE_FAILED_I18N_KEY;
  }
  return INVITATION_CODE_VALIDATION_I18N_KEY[reason];
}
