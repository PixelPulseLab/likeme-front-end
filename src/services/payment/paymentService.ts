import apiClient from '../infrastructure/apiClient';
import { logger } from '@/utils/logger';
import type { ApiResponse } from '@/types/infrastructure';
import type { ListPaymentMethodsResponse } from '@/types/payment/paymentInstrument';

export interface ProcessPaymentRequest {
  orderId: string;
  cardData: {
    cardNumber: string;
    cardHolderName: string;
    cardExpirationDate: string; // MMYY format
    cardCvv: string;
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
}

export interface ProcessPaymentResponse {
  order: any;
  transaction: {
    id: string;
    status: string;
    authorizationCode?: string;
  };
}

export interface TransactionStatusResponse {
  id: string;
  status: string;
  amount: number;
  authorizationCode?: string;
}

export interface CapturePaymentRequest {
  amount?: number; // in reais
}

export interface RefundPaymentRequest {
  amount?: number; // in reais
}

class PaymentService {
  async listPaymentMethods(): Promise<ApiResponse<ListPaymentMethodsResponse>> {
    try {
      const response = await apiClient.get<ApiResponse<ListPaymentMethodsResponse>>(
        '/api/payment/methods',
        undefined,
        true,
        false,
      );

      logger.debug('Payment methods listed:', {
        success: response.success,
        methodCount: response.data?.paymentMethods?.length,
      });

      return response;
    } catch (error) {
      logger.error('Error listing payment methods:', error);
      throw error;
    }
  }

  async processPayment(data: ProcessPaymentRequest): Promise<ApiResponse<ProcessPaymentResponse>> {
    try {
      const response = await apiClient.post<ApiResponse<ProcessPaymentResponse>>('/api/payment/process', data, true);

      logger.debug('Payment processed:', {
        orderId: data.orderId,
        transactionId: response.data?.transaction?.id,
        success: response.success,
      });

      return response;
    } catch (error) {
      logger.error('Error processing payment:', error);
      throw error;
    }
  }

  /**
   * Get payment transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<ApiResponse<TransactionStatusResponse>> {
    try {
      if (!transactionId || transactionId.trim() === '') {
        throw new Error('Transaction ID is required');
      }

      const response = await apiClient.get<ApiResponse<TransactionStatusResponse>>(
        `/api/payment/status/${transactionId.trim()}`,
        undefined,
        true,
        false,
      );

      logger.debug('Transaction status retrieved:', {
        transactionId,
        status: response.data?.status,
        success: response.success,
      });

      return response;
    } catch (error) {
      logger.error('Error fetching transaction status:', error);
      throw error;
    }
  }

  /**
   * Capture an authorized transaction
   */
  async captureTransaction(
    transactionId: string,
    data?: CapturePaymentRequest,
  ): Promise<ApiResponse<{ id: string; status: string }>> {
    try {
      if (!transactionId || transactionId.trim() === '') {
        throw new Error('Transaction ID is required');
      }

      const response = await apiClient.post<ApiResponse<{ id: string; status: string }>>(
        `/api/payment/capture/${transactionId.trim()}`,
        data,
        true,
      );

      logger.debug('Transaction captured:', {
        transactionId,
        status: response.data?.status,
        success: response.success,
      });

      return response;
    } catch (error) {
      logger.error('Error capturing transaction:', error);
      throw error;
    }
  }

  /**
   * Refund a payment
   */
  async refundTransaction(
    transactionId: string,
    data?: RefundPaymentRequest,
  ): Promise<ApiResponse<{ id: string; status: string }>> {
    try {
      if (!transactionId || transactionId.trim() === '') {
        throw new Error('Transaction ID is required');
      }

      const response = await apiClient.post<ApiResponse<{ id: string; status: string }>>(
        `/api/payment/refund/${transactionId.trim()}`,
        data,
        true,
      );

      logger.debug('Transaction refunded:', {
        transactionId,
        status: response.data?.status,
        success: response.success,
      });

      return response;
    } catch (error) {
      logger.error('Error refunding transaction:', error);
      throw error;
    }
  }
}

export default new PaymentService();
