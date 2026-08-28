import type { Product as ApiProduct } from '@/types/product';

export type RouteFallbackProduct = {
  id: string;
  title: string;
  price: string;
  image: string;
  type?: string;
  description?: string;
};

function parseRouteFallbackPrice(priceLabel: string): number | null {
  const numericLabel = priceLabel.trim().replace(/[^\d,.-]/g, '');
  if (!/\d/.test(numericLabel)) {
    return null;
  }

  const lastComma = numericLabel.lastIndexOf(',');
  const lastDot = numericLabel.lastIndexOf('.');
  const normalized =
    lastComma > lastDot ? numericLabel.replace(/\./g, '').replace(',', '.') : numericLabel.replace(/,/g, '');
  const parsed = Number.parseFloat(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

export function buildApiProductFromRouteFallback(fallback: RouteFallbackProduct, timestampsIso: string): ApiProduct {
  return {
    id: fallback.id,
    name: fallback.title,
    description: fallback.description,
    price: parseRouteFallbackPrice(fallback.price),
    image: fallback.image,
    type: fallback.type,
    quantity: 0,
    status: 'active',
    createdAt: timestampsIso,
    updatedAt: timestampsIso,
  };
}
