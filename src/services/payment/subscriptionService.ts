import apiClient from '@/services/infrastructure/apiClient';
import type { ApiResponse } from '@/types/infrastructure';

export type SubscriptionBillingPeriod =
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'BIMONTHLY'
  | 'QUARTERLY'
  | 'SEMIANNUAL'
  | 'YEARLY';

export interface CreateProtocolSubscriptionRequest {
  productId: string;
  billingPeriod: SubscriptionBillingPeriod;
  cardData: {
    cardNumber: string;
    cardHolderName: string;
    cardExpirationDate: string;
    cardCvv: string;
    cpf?: string;
    phone?: string;
  };
  billingAddress: {
    country?: string;
    state: string;
    city: string;
    neighborhood?: string;
    street: string;
    streetNumber: string;
    zipcode: string;
    complement?: string;
  };
  programTitle?: string;
}

export interface CreateProtocolSubscriptionResponse {
  orderId: string;
  subscriptionId: string;
  billingId: string;
  externalSubscriptionId: string;
  subscriptionStatus: string;
  internalSubscriptionStatus: string;
  nextBillingAt?: string | null;
}

export interface ProtocolAccessResponse {
  hasAccess: boolean;
  subscription: unknown | null;
}

export interface UserSubscriptionListItem {
  id: string;
  productId: string;
  status: string;
  nextBillingAt: string | null;
  createdAt: string;
  accessValidUntil?: string | null;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string | null;
  cancelRequestedAt?: string | null;
  product: {
    id: string;
    name: string;
    image: string | null;
    type: string | null;
    description?: string | null;
  };
  programCommunity?: {
    communityId: string;
    description?: string | null;
    agreement?: string | null;
  } | null;
}

export interface UserAcquiredServiceItem {
  productId: string;
  acquiredAt: string;
  product: {
    id: string;
    name: string;
    image: string | null;
    type: string | null;
    description?: string | null;
  };
}

export interface ListUserSubscriptionsParams {
  search?: string;
}

export interface SubscriptionManageResult {
  subscriptionId: string;
  productId: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  startedAt: string;
  lastBillingAt: string | null;
  nextBillingAt: string | null;
  accessValidUntil: string | null;
  priceCents: number;
  billingPeriod: string;
  benefits: string[];
  canCancel: boolean;
  canReactivate: boolean;
}

export interface ScheduleSubscriptionCancelResult {
  subscriptionId: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  accessValidUntil: string;
}

class SubscriptionService {
  async createProtocolSubscription(
    data: CreateProtocolSubscriptionRequest,
  ): Promise<ApiResponse<CreateProtocolSubscriptionResponse>> {
    return apiClient.post<ApiResponse<CreateProtocolSubscriptionResponse>>('/api/payment/subscriptions', data, true);
  }

  async getProtocolAccess(productId: string): Promise<ApiResponse<ProtocolAccessResponse>> {
    return apiClient.get<ApiResponse<ProtocolAccessResponse>>(
      `/api/payment/subscriptions/access?productId=${encodeURIComponent(productId)}`,
    );
  }

  async getSubscription(subscriptionId: string): Promise<ApiResponse<unknown>> {
    return apiClient.get<ApiResponse<unknown>>(`/api/payment/subscriptions/${encodeURIComponent(subscriptionId)}`);
  }

  async listUserSubscriptions(
    params: ListUserSubscriptionsParams = {},
  ): Promise<ApiResponse<{ subscriptions: UserSubscriptionListItem[]; services: UserAcquiredServiceItem[] }>> {
    const queryParams: Record<string, string> = {};
    const search = params.search?.trim();
    if (search) {
      queryParams.search = search;
    }

    return apiClient.get<
      ApiResponse<{ subscriptions: UserSubscriptionListItem[]; services: UserAcquiredServiceItem[] }>
    >('/api/payment/subscriptions', queryParams);
  }

  async getManageSubscription(subscriptionId: string): Promise<ApiResponse<SubscriptionManageResult>> {
    return apiClient.get<ApiResponse<SubscriptionManageResult>>(
      `/api/payment/subscriptions/${encodeURIComponent(subscriptionId)}/manage`,
    );
  }

  async scheduleSubscriptionCancel(
    subscriptionId: string,
    reason: string,
  ): Promise<ApiResponse<ScheduleSubscriptionCancelResult>> {
    return apiClient.post<ApiResponse<ScheduleSubscriptionCancelResult>>(
      `/api/payment/subscriptions/${encodeURIComponent(subscriptionId)}/schedule-cancel`,
      { reason },
      true,
    );
  }

  async reactivateSubscription(subscriptionId: string): Promise<ApiResponse<{ subscriptionId: string }>> {
    return apiClient.post<ApiResponse<{ subscriptionId: string }>>(
      `/api/payment/subscriptions/${encodeURIComponent(subscriptionId)}/reactivate`,
      {},
      true,
    );
  }
}

export const subscriptionService = new SubscriptionService();
