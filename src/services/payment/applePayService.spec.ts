import { applePayPaymentDataFromTokenJson } from './applePayService';

const TOKEN = {
  version: 'EC_v1',
  data: 'encrypted-payload',
  signature: 'apple-signature',
  header: {
    ephemeralPublicKey: 'ephemeral-key',
    publicKeyHash: 'public-hash',
    transactionId: 'txn-1',
  },
};

describe('applePayPaymentDataFromTokenJson', () => {
  it('mapeia o token EC_v1 do Apple Pay para o payload da API', () => {
    expect(applePayPaymentDataFromTokenJson(JSON.stringify(TOKEN), 'merchant.app.likeme.com')).toEqual({
      version: 'EC_v1',
      merchantIdentifier: 'merchant.app.likeme.com',
      header: {
        transactionId: TOKEN.header.transactionId,
        ephemeralPublicKey: TOKEN.header.ephemeralPublicKey,
        publicKeyHash: TOKEN.header.publicKeyHash,
      },
      signature: TOKEN.signature,
      data: TOKEN.data,
    });
  });

  it('rejeita token sem assinatura', () => {
    expect(() =>
      applePayPaymentDataFromTokenJson(JSON.stringify({ ...TOKEN, signature: '' }), 'merchant.app.likeme.com'),
    ).toThrow(/incompleto/);
  });
});
