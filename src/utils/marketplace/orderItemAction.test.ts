import { PRODUCT_CATALOG_TYPE, type Product } from '@/types/product';
import type { OrderItem } from '@/types/order';
import { orderItemActionKey, orderItemIsCanceled, orderItemPrimaryAction } from './orderItemAction';

const baseProduct = (overrides: Partial<Product> & Pick<Product, 'id' | 'name' | 'type'>): Product => ({
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('orderItemActionKey', () => {
  it('retorna viewProtocol para programas', () => {
    expect(orderItemActionKey(PRODUCT_CATALOG_TYPE.PROGRAM)).toBe('viewProtocol');
  });

  it('retorna createActivity para serviços', () => {
    expect(orderItemActionKey(PRODUCT_CATALOG_TYPE.SERVICE)).toBe('createActivity');
  });

  it('retorna null para produtos físicos', () => {
    expect(orderItemActionKey(PRODUCT_CATALOG_TYPE.PHYSICAL)).toBeNull();
  });
});

describe('orderItemIsCanceled', () => {
  const serviceItem: Pick<OrderItem, 'productId' | 'product'> = {
    productId: 'svc-1',
    product: baseProduct({ id: 'svc-1', type: PRODUCT_CATALOG_TYPE.SERVICE, name: 'Consulta' }),
  };

  const programItem: Pick<OrderItem, 'productId' | 'product'> = {
    productId: 'prog-1',
    product: baseProduct({ id: 'prog-1', type: PRODUCT_CATALOG_TYPE.PROGRAM, name: 'Protocolo' }),
  };

  it('marca cancelado quando o pedido está cancelled', () => {
    expect(
      orderItemIsCanceled({ status: 'cancelled', deliveryStatus: 'cancelled', paymentStatus: 'paid' }, serviceItem),
    ).toBe(true);
  });

  it('marca cancelado quando pagamento foi estornado', () => {
    expect(
      orderItemIsCanceled({ status: 'delivered', deliveryStatus: 'delivered', paymentStatus: 'refunded' }, serviceItem),
    ).toBe(true);
  });

  it('marca cancelado quando a assinatura do protocolo foi cancelada', () => {
    expect(
      orderItemIsCanceled(
        {
          status: 'delivered',
          deliveryStatus: 'delivered',
          paymentStatus: 'paid',
          subscription: {
            id: 'sub-1',
            status: 'CANCELED',
            cancelAtPeriodEnd: false,
            canceledAt: '2026-08-01T00:00:00.000Z',
            productId: 'prog-1',
          },
        },
        programItem,
      ),
    ).toBe(true);
  });

  it('não marca cancelado para pedido pago ativo', () => {
    expect(
      orderItemIsCanceled({ status: 'delivered', deliveryStatus: 'delivered', paymentStatus: 'paid' }, serviceItem),
    ).toBe(false);
  });
});

describe('orderItemPrimaryAction', () => {
  it('retorna canceled no lugar da ação para serviço cancelado', () => {
    expect(
      orderItemPrimaryAction(
        { status: 'cancelled', deliveryStatus: 'cancelled', paymentStatus: 'paid' },
        {
          productId: 'svc-1',
          product: baseProduct({ id: 'svc-1', type: PRODUCT_CATALOG_TYPE.SERVICE, name: 'Consulta' }),
        },
      ),
    ).toEqual({ kind: 'canceled' });
  });

  it('retorna viewProtocol para protocolo ativo', () => {
    expect(
      orderItemPrimaryAction(
        { status: 'delivered', paymentStatus: 'paid', deliveryStatus: 'delivered' },
        {
          productId: 'prog-1',
          product: baseProduct({ id: 'prog-1', type: PRODUCT_CATALOG_TYPE.PROGRAM, name: 'Protocolo' }),
        },
      ),
    ).toEqual({ kind: 'action', action: 'viewProtocol' });
  });

  it('retorna createActivity para serviço ativo', () => {
    expect(
      orderItemPrimaryAction(
        { status: 'delivered', paymentStatus: 'paid', deliveryStatus: 'delivered' },
        {
          productId: 'svc-1',
          product: baseProduct({ id: 'svc-1', type: PRODUCT_CATALOG_TYPE.SERVICE, name: 'Consulta' }),
        },
      ),
    ).toEqual({ kind: 'action', action: 'createActivity' });
  });

  it('retorna null para produto físico mesmo cancelado', () => {
    expect(
      orderItemPrimaryAction(
        { status: 'cancelled', deliveryStatus: 'cancelled', paymentStatus: 'paid' },
        {
          productId: 'phy-1',
          product: baseProduct({ id: 'phy-1', type: PRODUCT_CATALOG_TYPE.PHYSICAL, name: 'Kit' }),
        },
      ),
    ).toBeNull();
  });
});
