import {
  INVITATION_CODE_VALIDATE_FAILED_I18N_KEY,
  INVITATION_CODE_VALIDATION_ERROR,
  INVITATION_CODE_VALIDATION_I18N_KEY,
  invitationCodeValidationI18nKey,
} from '@/constants/invitation/invitationCodeValidation';

describe('invitationCodeValidationI18nKey', () => {
  it('mapeia as mensagens do backend para as chaves de i18n', () => {
    expect(invitationCodeValidationI18nKey(new Error(INVITATION_CODE_VALIDATION_ERROR.INVALID))).toBe(
      INVITATION_CODE_VALIDATION_I18N_KEY.INVALID,
    );
    expect(invitationCodeValidationI18nKey(new Error(INVITATION_CODE_VALIDATION_ERROR.EXPIRED))).toBe(
      INVITATION_CODE_VALIDATION_I18N_KEY.EXPIRED,
    );
    expect(invitationCodeValidationI18nKey(new Error(INVITATION_CODE_VALIDATION_ERROR.CANCELLED))).toBe(
      INVITATION_CODE_VALIDATION_I18N_KEY.CANCELLED,
    );
    expect(invitationCodeValidationI18nKey(new Error(INVITATION_CODE_VALIDATION_ERROR.REDEEMED))).toBe(
      INVITATION_CODE_VALIDATION_I18N_KEY.REDEEMED,
    );
    expect(invitationCodeValidationI18nKey(new Error(INVITATION_CODE_VALIDATION_ERROR.PROGRAM_UNAVAILABLE))).toBe(
      INVITATION_CODE_VALIDATION_I18N_KEY.PROGRAM_UNAVAILABLE,
    );
  });

  it('usa chave genérica quando a mensagem não é do contrato de validação', () => {
    expect(invitationCodeValidationI18nKey(new Error('Network request failed'))).toBe(
      INVITATION_CODE_VALIDATE_FAILED_I18N_KEY,
    );
    expect(invitationCodeValidationI18nKey('not-an-error')).toBe(INVITATION_CODE_VALIDATE_FAILED_I18N_KEY);
  });
});
