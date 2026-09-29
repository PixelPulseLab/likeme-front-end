import { chargedProgramPrice } from './useCart';

describe('chargedProgramPrice', () => {
  it('divide o total cadastrado pela quantidade de parcelas', () => {
    expect(
      chargedProgramPrice({
        priceCents: 180_000,
        installmentsEnabled: true,
        defaultInstallments: 3,
      }),
    ).toEqual({ price: 1800, installments: 3 });
  });

  it('aplica acréscimo só quando há mais de uma parcela', () => {
    expect(
      chargedProgramPrice({
        priceCents: 10_000,
        installmentsEnabled: true,
        defaultInstallments: 2,
        installmentSurchargePercent: 10,
      }),
    ).toEqual({ price: 110, installments: 2 });
  });

  it('cobra o valor cheio em uma parcela quando o parcelamento está desligado', () => {
    expect(
      chargedProgramPrice({
        priceCents: 45_000,
        installmentsEnabled: false,
        defaultInstallments: 12,
        installmentSurchargePercent: 10,
      }),
    ).toEqual({ price: 450, installments: 1 });
  });
});
