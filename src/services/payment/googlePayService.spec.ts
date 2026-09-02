import { brlAmountString, googlePayPaymentDataFromTokenJson } from './googlePayService';

const TOKEN = {
  signature: 'MEUCIQsig',
  intermediateSigningKey: {
    signedKey: '{"keyValue":"abc"}',
    signatures: ['MEYCIQsig'],
  },
  protocolVersion: 'ECv2',
  signedMessage: '{"encryptedMessage":"xyz"}',
};

describe('googlePayPaymentDataFromTokenJson', () => {
  it('mapeia o token ECv2 do Google Pay para o payload da API', () => {
    expect(googlePayPaymentDataFromTokenJson(JSON.stringify(TOKEN), 'acc_merchant')).toEqual({
      signature: TOKEN.signature,
      intermediateSigningKey: {
        signedKey: TOKEN.intermediateSigningKey.signedKey,
        signatures: TOKEN.intermediateSigningKey.signatures,
      },
      version: 'ECv2',
      signedMessage: TOKEN.signedMessage,
      merchantIdentifier: 'acc_merchant',
    });
  });

  it('rejeita token sem assinatura', () => {
    expect(() =>
      googlePayPaymentDataFromTokenJson(JSON.stringify({ ...TOKEN, signature: '' }), 'acc_merchant'),
    ).toThrow(/incompleto/);
  });
});

describe('brlAmountString', () => {
  it('formata o total em reais com duas casas', () => {
    expect(brlAmountString(12.3)).toBe('12.30');
    expect(brlAmountString(-1)).toBe('0.00');
  });
});
