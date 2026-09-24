import type { Product } from '@/types/product';

/** Alinhado a `Product.type` (catálogo + extensões ex.: `service`). */
export type ProductType = Product['type'];

/**
 * Categoria de exibição do item (derivada de type para compatibilidade de UI).
 * Programs = program, Product = physical product / amazon product.
 */
export type CartItemCategory = 'Programs' | 'Product' | 'Service' | 'Sport';

/**
 * Item do carrinho: dados do produto (type, categoryId) + quantidade e campos de exibição.
 * Alinhado ao tipo Product para categories e type.
 */
export interface CartItem {
  id: string;
  image: string;
  title: string;
  /** Texto de apoio na listagem (ex.: trecho de `Product.description`). */
  subtitle?: string;
  price: number;
  quantity: number;
  rating?: number;
  /** `Product.type` (catálogo + extensões) */
  type?: ProductType;
  /** Categoria de domínio (Product.categoryId), ex.: Estresse, Sono */
  categoryId?: string;
  /** Categoria de exibição derivada de type (Programs, Product, etc.) */
  category?: CartItemCategory;
  /** Data opcional (ex.: entrega, evento) */
  date?: string;
  /** Previsão de entrega (ex.: tela de pedido) */
  deliveryForecast?: string;
  billingPeriod?: string;
  priceOptions?: Array<{ billingPeriod: string; price: number }>;
}
