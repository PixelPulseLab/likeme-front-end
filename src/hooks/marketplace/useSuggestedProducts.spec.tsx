import { renderHook, waitFor } from '@testing-library/react-native';
import { useSuggestedProducts } from './useSuggestedProducts';
import { productService } from '@/services';

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
});
