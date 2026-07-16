import type { ApiResponse } from '@/types/infrastructure';
import type { Product } from '@/types/product';

export interface OrderVoucherSummary {
  code: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  product?: Product;
}

export type OrderSubscriptionSummary = {
  id: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string | null;
  accessValidUntil?: string | null;
  cancelRequestedAt?: string | null;
  productId: string;
};

export interface Order {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  deliveryStatus?: string | null;
  total: number;
  subtotal: number;
  shippingCost: number;
  tax: number;
  shippingAddress?: string;
  billingAddress?: string;
  notes?: string;
  paymentMethod?: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  trackingNumber?: string;
  voucherId?: string | null;
  voucherDiscount?: number;
  voucher?: OrderVoucherSummary | null;
  subscription?: OrderSubscriptionSummary | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  items?: OrderItem[];
}

export interface CreateOrderItem {
  productId: string;
  quantity: number;
  discount?: number;
}

export interface BillingAddress {
  country?: string;
  state: string;
  city: string;
  neighborhood?: string;
  street: string;
  streetNumber: string;
  zipcode: string;
  complement?: string;
}

export interface CardData {
  cardNumber: string;
  cardHolderName: string;
  cardExpirationDate: string; // MMYY format
  cardCvv: string;
  cpf?: string; // CPF do cliente (opcional, backend busca automaticamente se não fornecido)
  phone?: string; // Telefone do cliente (opcional, backend busca automaticamente se não fornecido)
}

export type SubscriptionBillingPeriod =
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'BIMONTHLY'
  | 'QUARTERLY'
  | 'SEMIANNUAL'
  | 'YEARLY';

export interface SubscriptionEnrollmentSummary {
  orderId: string;
  subscriptionId: string;
  productId: string;
  billingId: string;
}

export interface CreateOrderData {
  items: CreateOrderItem[];
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingCost?: number;
  tax?: number;
  shippingAddress?: string;
  billingAddress: BillingAddress; // Backend sempre exige como objeto estruturado
  cardData?: CardData; // Obrigatório quando paymentMethod é 'credit_card'
  notes?: string;
  paymentMethod?: string;
  /** Código do voucher; desconto calculado no servidor. */
  voucherCode?: string;
  /** Periodicidade da assinatura quando o carrinho contém protocolos. */
  billingPeriod?: SubscriptionBillingPeriod;
  trackingNumber?: string;
}

export interface CreateOrderResponse extends Order {
  subscriptionEnrollments?: SubscriptionEnrollmentSummary[];
}

export interface UpdateOrderData {
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress?: string;
  billingAddress?: string;
  notes?: string;
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  trackingNumber?: string;
  restoreStock?: boolean;
}

export interface ListOrdersParams {
  page?: number;
  limit?: number;
  userId?: string;
  status?: string;
  paymentStatus?: string;
}

export type ListOrdersApiResponse = ApiResponse<{
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>;

export type GetOrderApiResponse = ApiResponse<Order>;
