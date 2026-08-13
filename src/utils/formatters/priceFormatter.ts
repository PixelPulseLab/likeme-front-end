import i18n from '@/i18n';

const MARKETPLACE_NO_PRICE_LABEL_KEY = 'marketplace.noPriceLabel';

function splitFixedParts(value: number): { sign: '' | '-'; intPart: string; fraction: string } {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  const parts = rounded.toFixed(2).split('.');
  const intRaw = parts[0] ?? '0';
  const fraction = parts[1] ?? '00';
  const isNegative = intRaw.startsWith('-');
  return {
    sign: isNegative ? '-' : '',
    intPart: isNegative ? intRaw.slice(1) : intRaw,
    fraction,
  };
}

function formatBRLAmount(value: number): string {
  const { sign, intPart, fraction } = splitFixedParts(value);
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$${sign}${grouped},${fraction}`;
}

function formatUSDAmount(value: number): string {
  const { sign, intPart, fraction } = splitFixedParts(value);
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `$${sign}${grouped}.${fraction}`;
}

export class PriceFormatter {
  private readonly value: number;

  constructor(price: number | null | undefined) {
    this.value = this.normalizePrice(price);
  }

  private normalizePrice(price: number | null | undefined): number {
    if (price === null || price === undefined || isNaN(Number(price))) {
      return 0;
    }
    return typeof price === 'number' ? price : parseFloat(String(price)) || 0;
  }

  toUSD(): string {
    return formatUSDAmount(this.value);
  }

  toBRL(): string {
    return formatBRLAmount(this.value);
  }

  format(currency: 'USD' | 'BRL' = 'USD'): string {
    return currency === 'BRL' ? this.toBRL() : this.toUSD();
  }

  getValue(): number {
    return this.value;
  }

  isValid(): boolean {
    return this.value > 0;
  }
}

export const formatPrice = (price: number | null | undefined, currency: 'USD' | 'BRL' = 'BRL'): string => {
  return new PriceFormatter(price).format(currency);
};

export const formatPriceLabel = (price: number | null | undefined, currency: 'USD' | 'BRL' = 'BRL'): string => {
  if (price === null || price === undefined) {
    return i18n.t(MARKETPLACE_NO_PRICE_LABEL_KEY);
  }
  return formatPrice(price, currency);
};
