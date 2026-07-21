import apiClient from '../infrastructure/apiClient';
import { logger } from '@/utils/logger';
import type {
  Product,
  ListProductsParams,
  ListProductsApiResponse,
  GetProductApiResponse,
  CreateProductData,
  UpdateProductData,
  UpdateStockData,
} from '@/types/product';
import type { ApiResponse } from '@/types/infrastructure';

class ProductService {
  private readonly productsEndpoint = '/api/products';

  async listProducts(params: ListProductsParams = {}): Promise<ListProductsApiResponse> {
    try {
      const queryParams: Record<string, string> = {};

      if (params.page !== undefined) {
        queryParams.page = String(params.page);
      }

      if (params.limit !== undefined) {
        queryParams.limit = String(params.limit);
      }

      if (params.type) {
        queryParams.type = params.type;
      }

      if (params.categoryId) {
        queryParams.categoryId = params.categoryId;
      }

      if (params.status) {
        queryParams.status = params.status;
      }

      if (params.search) {
        queryParams.search = params.search;
      }

      if (params.excludeProductId) {
        queryParams.excludeProductId = params.excludeProductId;
      }

      if (params.fillWithOtherCategories !== undefined) {
        queryParams.fillWithOtherCategories = String(params.fillWithOtherCategories);
      }

      const response = await apiClient.get<ListProductsApiResponse>(this.productsEndpoint, queryParams, true, false);
      return response;
    } catch (error) {
      logger.error('Error fetching products list:', error);
      throw error;
    }
  }

  async getProductById(productId: string): Promise<GetProductApiResponse> {
    try {
      if (!productId || productId.trim() === '') {
        throw new Error('Product ID is required');
      }

      const endpoint = `${this.productsEndpoint}/${productId.trim()}`;

      const response = await apiClient.get<GetProductApiResponse>(endpoint, undefined, true, false);

      logger.debug('Product detail response:', {
        productId,
        success: response.success,
        hasData: !!response.data,
      });

      return response;
    } catch (error) {
      logger.error('Error fetching product detail:', error);
      throw error;
    }
  }

  async createProduct(data: CreateProductData): Promise<ApiResponse<Product>> {
    try {
      const response = await apiClient.post<ApiResponse<Product>>(this.productsEndpoint, data, true);

      logger.debug('Product created:', {
        productId: response.data?.id,
        success: response.success,
      });

      return response;
    } catch (error) {
      logger.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(productId: string, data: UpdateProductData): Promise<ApiResponse<Product>> {
    try {
      if (!productId || productId.trim() === '') {
        throw new Error('Product ID is required');
      }

      const endpoint = `${this.productsEndpoint}/${productId.trim()}`;

      const response = await apiClient.put<ApiResponse<Product>>(endpoint, data, true);

      logger.debug('Product updated:', {
        productId,
        success: response.success,
      });

      return response;
    } catch (error) {
      logger.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(productId: string): Promise<ApiResponse<null>> {
    try {
      if (!productId || productId.trim() === '') {
        throw new Error('Product ID is required');
      }

      const endpoint = `${this.productsEndpoint}/${productId.trim()}`;

      const response = await apiClient.delete<ApiResponse<null>>(endpoint, undefined, true);

      logger.debug('Product deleted:', {
        productId,
        success: response.success,
      });

      return response;
    } catch (error) {
      logger.error('Error deleting product:', error);
      throw error;
    }
  }

  async updateStock(productId: string, data: UpdateStockData): Promise<ApiResponse<Product>> {
    try {
      if (!productId || productId.trim() === '') {
        throw new Error('Product ID is required');
      }

      const endpoint = `${this.productsEndpoint}/${productId.trim()}/stock`;

      const response = await apiClient.patch<ApiResponse<Product>>(endpoint, data, true);

      logger.debug('Stock updated:', {
        productId,
        operation: data.operation,
        success: response.success,
      });

      return response;
    } catch (error) {
      logger.error('Error updating stock:', error);
      throw error;
    }
  }
}

export default new ProductService();
