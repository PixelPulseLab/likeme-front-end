import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useSuggestedProducts } from './useSuggestedProducts';
import { productService } from '@/services';
import {
  SUGGESTED_PRODUCTS_CACHE_STALE_MS,
  clearSuggestedProductsCache,
  getCachedSuggestedProducts,
  setCachedSuggestedProducts,
  suggestedProductsCacheKey,
} from '@/services/product/suggestedProductsCache';

jest.mock('@/services', () => ({
  productService: {
    listProducts: jest.fn(),
  },
}));

jest.mock('@/hooks/category/useCategories', () => ({
  useCategories: () => ({
    categories: [],
    allCategoryOptions: [],
    loading: false,
    error: null,
    refresh: jest.fn(),
  }),
}));

jest.mock('@/utils/image/prefetchImageUris', () => ({
  prefetchImageUris: jest.fn(),
}));

jest.mock('@/utils/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

const rankedProducts = [
  {
    id: 'p-sleep',
    name: 'Produto Sono',
    price: 10,
    image: 'https://example.com/sleep.jpg',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    categoryNames: ['Sono'],
  },
  {
    id: 'p-other',
    name: 'Produto Outro',
    price: 20,
    image: 'https://example.com/other.jpg',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    categoryNames: ['Outra'],
  },
  {
    id: 'p-third',
    name: 'Produto Extra',
    price: 30,
    image: 'https://example.com/extra.jpg',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    categoryNames: ['Extra'],
  },
];

describe('useSuggestedProducts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearSuggestedProductsCache();
  });

  it('preserva a ordem ranqueada da API sem embaralhar (APP-352)', async () => {
    (productService.listProducts as jest.Mock).mockResolvedValue({
      success: true,
      data: { products: rankedProducts },
    });

    const { result } = renderHook(() => useSuggestedProducts({ limit: 2 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.products).toHaveLength(2);
    });

    expect(result.current.products.map((product) => product.id)).toEqual(['p-sleep', 'p-other']);
    expect(productService.listProducts).toHaveBeenCalledWith(expect.objectContaining({ limit: 2, status: 'active' }));
  });

  it('não busca pool maior só para sorteio no client', async () => {
    (productService.listProducts as jest.Mock).mockResolvedValue({
      success: true,
      data: { products: rankedProducts },
    });

    renderHook(() => useSuggestedProducts({ limit: 4 }));

    await waitFor(() => {
      expect(productService.listProducts).toHaveBeenCalled();
    });

    expect(productService.listProducts).toHaveBeenCalledWith(expect.objectContaining({ limit: 4 }));
  });

  it('solicita complemento de outras categorias excluindo o produto atual', async () => {
    (productService.listProducts as jest.Mock).mockResolvedValue({
      success: true,
      data: { products: rankedProducts },
    });

    renderHook(() =>
      useSuggestedProducts({
        categoryId: 'cat-current',
        excludeProductId: 'product-current',
        fillWithOtherCategories: true,
      }),
    );

    await waitFor(() => {
      expect(productService.listProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: 'cat-current',
          excludeProductId: 'product-current',
          fillWithOtherCategories: true,
          status: 'active',
        }),
      );
    });
  });

  it('reusa o cache na remontagem sem novo fetch', async () => {
    (productService.listProducts as jest.Mock).mockResolvedValue({
      success: true,
      data: { products: rankedProducts },
    });

    const first = renderHook(() => useSuggestedProducts({ limit: 2 }));
    await waitFor(() => {
      expect(first.result.current.products).toHaveLength(2);
    });
    first.unmount();

    const second = renderHook(() => useSuggestedProducts({ limit: 2 }));
    expect(second.result.current.products.map((product) => product.id)).toEqual(['p-sleep', 'p-other']);
    expect(second.result.current.loading).toBe(false);
    expect(productService.listProducts).toHaveBeenCalledTimes(1);
  });

  it('mantém a lista anterior visível enquanto busca outra chave', async () => {
    let resolveSecond: (value: unknown) => void = () => undefined;
    const secondResponse = new Promise((resolve) => {
      resolveSecond = resolve;
    });
    (productService.listProducts as jest.Mock)
      .mockResolvedValueOnce({
        success: true,
        data: { products: rankedProducts },
      })
      .mockReturnValueOnce(secondResponse);

    const { result, rerender } = renderHook(
      ({ excludeProductId }: { excludeProductId?: string }) => useSuggestedProducts({ limit: 2, excludeProductId }),
      { initialProps: { excludeProductId: undefined as string | undefined } },
    );

    await waitFor(() => {
      expect(result.current.products.map((product) => product.id)).toEqual(['p-sleep', 'p-other']);
    });

    rerender({ excludeProductId: 'p-sleep' });

    expect(result.current.products.map((product) => product.id)).toEqual(['p-sleep', 'p-other']);
    expect(result.current.loading).toBe(false);

    await act(async () => {
      resolveSecond({
        success: true,
        data: { products: [rankedProducts[1], rankedProducts[2]] },
      });
    });

    await waitFor(() => {
      expect(result.current.products.map((product) => product.id)).toEqual(['p-other', 'p-third']);
    });
  });

  it('descarta o cache após 5 minutos', () => {
    setCachedSuggestedProducts('products', rankedProducts as never, 0);
    expect(getCachedSuggestedProducts('products', SUGGESTED_PRODUCTS_CACHE_STALE_MS - 1)).toHaveLength(3);
    expect(getCachedSuggestedProducts('products', SUGGESTED_PRODUCTS_CACHE_STALE_MS)).toBeUndefined();
  });

  it('não repovoa cache quando request inflight resolve após limpeza de sessão', async () => {
    let resolveFetch: (value: unknown) => void = () => undefined;
    const pendingResponse = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    (productService.listProducts as jest.Mock).mockReturnValueOnce(pendingResponse);

    const { unmount } = renderHook(() => useSuggestedProducts({ limit: 2 }));

    await waitFor(() => {
      expect(productService.listProducts).toHaveBeenCalledTimes(1);
    });

    unmount();
    clearSuggestedProductsCache();

    await act(async () => {
      resolveFetch({
        success: true,
        data: { products: rankedProducts },
      });
      await pendingResponse;
    });

    const key = suggestedProductsCacheKey({ limit: 2, status: 'active' });
    expect(getCachedSuggestedProducts(key)).toBeUndefined();
  });
});
