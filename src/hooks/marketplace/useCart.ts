import { useState, useCallback, useMemo } from 'react';
import storageService from '@/services/auth/storageService';
import productService from '@/services/product/productService';
import type { CartItem } from '@/types/cart';
import { isProductCatalogType, resolveCartItemCatalogType } from '@/types/product';
import { isProtocolCartItem, isProtocolProductCatalogType } from '@/utils/profile/protocolProduct';
import { logger } from '@/utils/logger';

type StoredCartItem = CartItem & { tags?: unknown; description?: string };

function stripLegacyCartFields(item: StoredCartItem): CartItem {
  const { tags: _legacyTags, description: legacyDescription, ...rest } = item;
  const fromPayload = resolveCartItemCatalogType({ type: rest.type, tags: item.tags });
  const type = isProductCatalogType(rest.type ?? undefined) ? rest.type : fromPayload ?? rest.type;
  const subtitle =
    (rest.subtitle && rest.subtitle.trim()) ||
    (typeof legacyDescription === 'string' && legacyDescription.trim() ? legacyDescription.trim() : '') ||
    undefined;
  return { ...rest, type, subtitle };
}

function programPriceOptions(product: {
  prices?: Array<{ billingPeriod?: string; priceCents?: number }>;
}): Array<{ billingPeriod: string; price: number }> {
  return (product.prices ?? [])
    .filter((row) => typeof row.billingPeriod === 'string' && typeof row.priceCents === 'number')
    .map((row) => ({
      billingPeriod: row.billingPeriod as string,
      price: (row.priceCents as number) / 100,
    }));
}

function selectedProgramPrice(
  options: Array<{ billingPeriod: string; price: number }>,
  billingPeriod?: string,
): { billingPeriod: string; price: number } | null {
  if (options.length === 0) {
    return null;
  }
  const current = options.find((option) => option.billingPeriod === billingPeriod);
  if (current) {
    return current;
  }
  return options.reduce((lowest, option) => (option.price < lowest.price ? option : lowest));
}

function cartItemsFromStorage(items: StoredCartItem[]): CartItem[] {
  return items.map((item) => stripLegacyCartFields(item));
}

export type UseCartOptions = {
  /** Chamado quando o carrinho fica vazio após remover item (ex.: navegar para Cart) */
  onEmpty?: () => void;
};

export type UseCartReturn = {
  cartItems: CartItem[];
  loading: boolean;
  /** Carrega itens do storage (sem validar estoque) */
  loadCartItems: () => Promise<void>;
  /** Carrega e valida itens (estoque, produto existe). Chama onRemoved com títulos dos removidos. */
  loadAndValidateCartItems: (onRemoved?: (removedNames: string[]) => void) => Promise<void>;
  increaseQuantity: (id: string) => Promise<void>;
  decreaseQuantity: (id: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  selectBillingPeriod: (id: string, billingPeriod: string) => Promise<void>;
  subtotal: number;
};

export function useCart(options: UseCartOptions = {}): UseCartReturn {
  const { onEmpty } = options;
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCartItems = useCallback(async () => {
    try {
      setLoading(true);
      const items = await storageService.getCartItems();
      setCartItems(cartItemsFromStorage(items));
    } catch (error) {
      logger.error('[useCart] Erro ao carregar itens do carrinho', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAndValidateCartItems = useCallback(async (onRemoved?: (removedNames: string[]) => void) => {
    try {
      setLoading(true);
      const items = await storageService.getCartItems();
      const validatedItems: CartItem[] = [];
      const removedItems: string[] = [];

      for (const item of items) {
        try {
          const productResponse = await productService.getProductById(item.id);

          if (!productResponse.success || !productResponse.data) {
            removedItems.push(item.title || item.id);
            continue;
          }

          const product = productResponse.data;
          let requestedQuantity = Number(item.quantity) || 1;

          if (isProtocolProductCatalogType(product.type)) {
            requestedQuantity = 1;
            item.quantity = 1;
          }

          if (product.quantity !== null) {
            const availableQuantity = product.quantity;
            if (availableQuantity < requestedQuantity) {
              if (availableQuantity === 0) {
                removedItems.push(item.title || item.id);
                continue;
              }
              (item as CartItem).quantity = availableQuantity;
            }
          }

          const cleaned = stripLegacyCartFields(item as StoredCartItem);
          const subtitle =
            (product.description && product.description.trim()) || (cleaned.subtitle && cleaned.subtitle.trim()) || '';
          const priceOptions = isProtocolProductCatalogType(product.type) ? programPriceOptions(product) : [];
          const selectedPrice = selectedProgramPrice(priceOptions, cleaned.billingPeriod);
          const catalogPrice = selectedPrice?.price ?? (Number(product.price) || Number(item.price) || 0);

          validatedItems.push({
            ...cleaned,
            price: catalogPrice,
            billingPeriod: selectedPrice?.billingPeriod,
            priceOptions: priceOptions.length > 0 ? priceOptions : undefined,
            quantity: Number(item.quantity) || 1,
            rating: Number(item.rating) || 0,
            type: product.type ?? cleaned.type,
            subtitle: subtitle || undefined,
          });
        } catch {
          removedItems.push(item.title || item.id);
        }
      }

      await storageService.setCartItems(validatedItems);
      if (removedItems.length > 0) {
        onRemoved?.(removedItems);
      }

      setCartItems(cartItemsFromStorage(validatedItems as StoredCartItem[]));
    } catch (error) {
      logger.error('[useCart] Erro ao carregar/validar itens do carrinho', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const increaseQuantity = useCallback(async (id: string) => {
    const items = await storageService.getCartItems();
    const target = items.find((item: CartItem) => item.id === id);
    if (target && isProtocolCartItem(target)) {
      return;
    }
    const updated = cartItemsFromStorage(
      items.map((item: CartItem) =>
        item.id === id ? { ...item, quantity: (Number(item.quantity) || 1) + 1 } : item,
      ) as StoredCartItem[],
    );
    await storageService.setCartItems(updated);
    setCartItems(updated);
  }, []);

  const decreaseQuantity = useCallback(
    async (id: string) => {
      const items = await storageService.getCartItems();
      const current = items.find((i: CartItem) => i.id === id);
      if (!current) return;
      const q = Number(current.quantity) || 1;
      if (q <= 1) {
        await storageService.removeCartItem(id);
        const next = cartItemsFromStorage((await storageService.getCartItems()) as StoredCartItem[]);
        setCartItems(next);
        if (next.length === 0) onEmpty?.();
        return;
      }
      const updated = cartItemsFromStorage(
        items.map((item: CartItem) => (item.id === id ? { ...item, quantity: q - 1 } : item)) as StoredCartItem[],
      );
      await storageService.setCartItems(updated);
      setCartItems(updated);
    },
    [onEmpty],
  );

  const removeItem = useCallback(
    async (id: string) => {
      await storageService.removeCartItem(id);
      const items = cartItemsFromStorage((await storageService.getCartItems()) as StoredCartItem[]);
      setCartItems(items);
      if (items.length === 0) onEmpty?.();
    },
    [onEmpty],
  );

  const selectBillingPeriod = useCallback(async (id: string, billingPeriod: string) => {
    const items = await storageService.getCartItems();
    const updated = cartItemsFromStorage(
      items.map((item: CartItem) => {
        if (item.id !== id) {
          return item;
        }
        const selected = item.priceOptions?.find((option) => option.billingPeriod === billingPeriod);
        if (!selected) {
          return item;
        }
        return { ...item, billingPeriod: selected.billingPeriod, price: selected.price };
      }) as StoredCartItem[],
    );
    await storageService.setCartItems(updated);
    setCartItems(updated);
  }, []);

  const subtotal = useMemo(
    () =>
      cartItems.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return sum + price * quantity;
      }, 0),
    [cartItems],
  );

  return {
    cartItems,
    loading,
    loadCartItems,
    loadAndValidateCartItems,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    selectBillingPeriod,
    subtotal,
  };
}
