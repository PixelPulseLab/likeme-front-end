import paymentService from './paymentService';
import apiClient from '../infrastructure/apiClient';

jest.mock('../infrastructure/apiClient');

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listPaymentMethods', () => {
    it('should call apiClient.get with methods endpoint', async () => {
      const mockResponse = {
        success: true,
        data: {
          paymentMethods: [{ type: 'credit_card', oneOff: true, subscription: true }],
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await paymentService.listPaymentMethods();

      expect(apiClient.get).toHaveBeenCalledWith('/api/payment/methods', undefined, true, false);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('processPayment', () => {
    it('should call apiClient.post with correct endpoint and data', async () => {
      const mockResponse = {
        success: true,
        data: {
          order: { id: 'order-123', paymentStatus: 'paid' },
          transaction: { id: 'trans-123', status: 'paid' },
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const paymentData = {
        orderId: 'order-123',
        cardData: {
          cardNumber: '4111111111111111',
          cardHolderName: 'John Doe',
          cardExpirationDate: '1225',
          cardCvv: '123',
        },
        billingAddress: {
          state: 'SP',
          city: 'São Paulo',
          street: 'Rua Test',
          streetNumber: '123',
          zipcode: '01234567',
        },
      };

      const result = await paymentService.processPayment(paymentData);

      expect(apiClient.post).toHaveBeenCalledWith('/api/payment/process', paymentData, true);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getTransactionStatus', () => {
    it('should call apiClient.get with correct endpoint', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'trans-123',
          status: 'paid',
          amount: 10000,
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await paymentService.getTransactionStatus('trans-123');

      expect(apiClient.get).toHaveBeenCalledWith('/api/payment/status/trans-123', undefined, true, false);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('captureTransaction', () => {
    it('should call apiClient.post with correct endpoint and data', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'trans-123',
          status: 'paid',
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await paymentService.captureTransaction('trans-123', { amount: 50.0 });

      expect(apiClient.post).toHaveBeenCalledWith('/api/payment/capture/trans-123', { amount: 50.0 }, true);
      expect(result).toEqual(mockResponse);
    });

    it('should call apiClient.post without data if not provided', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'trans-123',
          status: 'paid',
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await paymentService.captureTransaction('trans-123');

      expect(apiClient.post).toHaveBeenCalledWith('/api/payment/capture/trans-123', undefined, true);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('refundTransaction', () => {
    it('should call apiClient.post with correct endpoint and data', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'trans-123',
          status: 'refunded',
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await paymentService.refundTransaction('trans-123', { amount: 50.0 });

      expect(apiClient.post).toHaveBeenCalledWith('/api/payment/refund/trans-123', { amount: 50.0 }, true);
      expect(result).toEqual(mockResponse);
    });

    it('should call apiClient.post without data if not provided', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'trans-123',
          status: 'refunded',
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await paymentService.refundTransaction('trans-123');

      expect(apiClient.post).toHaveBeenCalledWith('/api/payment/refund/trans-123', undefined, true);
      expect(result).toEqual(mockResponse);
    });
  });
});
