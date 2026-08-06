import type { ApiResponse } from '@/types/infrastructure';
import type { Order } from '@/types/order';

export type ActivityType = 'task' | 'event';

export type ActivityListScope = 'active' | 'history';

export interface UserActivity {
  id: string;
  userId: string;
  name: string;
  type: ActivityType;
  startDate: string;
  startTime?: string | null;
  endDate?: string | null;
  endTime?: string | null;
  location?: string | null;
  description?: string | null;
  reminderEnabled: boolean;
  reminderOffset?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ListActivitiesParams {
  type?: ActivityType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  scope?: ActivityListScope;
  /** @deprecated use scope=history */
  includeDeleted?: boolean;
}

export type ListActivitiesApiResponse = ApiResponse<{
  activities: UserActivity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>;

export type GetActivityApiResponse = ApiResponse<UserActivity>;

export const SUBSCRIPTION_HISTORY_STATUS = {
  CREATED: 'created',
  CANCEL_REQUESTED: 'cancel_requested',
  CANCEL_REACTIVATED: 'cancel_reactivated',
  CANCEL_FINALIZED: 'cancel_finalized',
} as const;

export type SubscriptionHistoryStatus = (typeof SUBSCRIPTION_HISTORY_STATUS)[keyof typeof SUBSCRIPTION_HISTORY_STATUS];

export type SubscriptionHistory = {
  id: string;
  subscriptionStatus: SubscriptionHistoryStatus;
  at: string;
  subscriptionId: string;
  productId: string;
  productName: string;
  orderId: string | null;
};

export type ActivityHistoryPayload = {
  activities: UserActivity[];
  orders: Order[];
  subscriptionEvents: SubscriptionHistory[];
};

export type ActivityHistoryApiResponse = ApiResponse<ActivityHistoryPayload>;

export interface CreateActivityData {
  name: string;
  type: ActivityType;
  startDate: string; // Required - ISO date string
  startTime?: string | null;
  endDate?: string | null; // ISO date string
  endTime?: string | null;
  location?: string | null;
  description?: string | null;
  reminderEnabled?: boolean;
  reminderOffset?: string | null; // e.g., "5 min before", "10 min after"
}

export interface UpdateActivityData {
  name?: string;
  type?: ActivityType;
  startDate?: string; // ISO date string
  startTime?: string | null;
  endDate?: string | null; // ISO date string
  endTime?: string | null;
  location?: string | null;
  description?: string | null;
  reminderEnabled?: boolean;
  reminderOffset?: string | null; // e.g., "5 min before", "10 min after"
}

export * from './hooks';
