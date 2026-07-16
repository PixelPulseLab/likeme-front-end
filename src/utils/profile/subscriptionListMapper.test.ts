import {
  filterSubscriptionItems,
  mapSubscriptionToListItem,
  serviceSubscriptionsFromOrders,
} from '@/utils/profile/subscriptionListMapper';
import type { UserSubscriptionListItem } from '@/services/payment/subscriptionService';
import type { Order } from '@/types/order';
import { PRODUCT_CATALOG_TYPE } from '@/types/product';

const t = (key: string) => key;

describe('subscriptionListMapper', () => {
  it('mapeia assinatura para item de protocolo', () => {
    const row: UserSubscriptionListItem = {
      id: 'sub-1',
      productId: 'prod-1',
      status: 'ACTIVE',
      nextBillingAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      product: {
        id: 'prod-1',
        name: 'Protocolo X',
        image: 'https://example.com/img.jpg',
        type: 'program',
      },
    };

    const item = mapSubscriptionToListItem(row, t);
    expect(item.kind).toBe('protocol');
    expect(item.title).toBe('Protocolo X');
    expect(item.desaturated).toBe(false);
  });

  it('marca protocolo cancelado com badge e card dessaturado', () => {
    const row: UserSubscriptionListItem = {
      id: 'sub-canceled',
      productId: 'prod-1',
      status: 'ACTIVE',
      nextBillingAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      cancelAtPeriodEnd: true,
      cancelRequestedAt: '2026-06-28T00:00:00.000Z',
      accessValidUntil: '2026-07-15T00:00:00.000Z',
      product: {
        id: 'prod-1',
        name: 'Protocolo Y',
        image: 'https://example.com/img.jpg',
        type: 'program',
      },
    };

    const item = mapSubscriptionToListItem(row, (key, options) => options?.defaultValue ?? key);
    expect(item.desaturated).toBe(true);
    expect(item.badges).toContain('Cancelado');
    expect(item.cancelAtPeriodEnd).toBe(true);
  });

  it('extrai serviços pagos dos pedidos', () => {
    const orders: Order[] = [
      {
        id: 'order-1',
        userId: 'u1',
        status: 'delivered',
        total: 100,
        subtotal: 100,
        shippingCost: 0,
        tax: 0,
        paymentStatus: 'paid',
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
        items: [
          {
            id: 'item-1',
            orderId: 'order-1',
            productId: 'svc-1',
            quantity: 1,
            unitPrice: 100,
            discount: 0,
            total: 100,
            createdAt: '2026-02-01T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z',
            product: {
              id: 'svc-1',
              name: 'Yoga',
              type: PRODUCT_CATALOG_TYPE.SERVICE,
              status: 'active',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          },
        ],
      },
    ];

    const services = serviceSubscriptionsFromOrders(orders);
    expect(services).toHaveLength(1);
    expect(services[0].kind).toBe('service');
    expect(services[0].title).toBe('Yoga');
  });

  it('filtra por título na busca', () => {
    const items = [
      {
        id: '1',
        kind: 'protocol' as const,
        productId: 'a',
        title: 'Alpha',
        image: '',
        badges: [],
        acquiredAt: '2026-01-01',
      },
      {
        id: '2',
        kind: 'service' as const,
        productId: 'b',
        title: 'Beta',
        image: '',
        badges: [],
        acquiredAt: '2026-01-02',
      },
    ];

    expect(filterSubscriptionItems(items, 'beta')).toHaveLength(1);
  });

  it('filtra por badge na busca', () => {
    const items = [
      {
        id: '1',
        kind: 'protocol' as const,
        productId: 'a',
        title: 'Protocolo X',
        image: '',
        badges: ['Relacionamentos', 'Online'],
        acquiredAt: '2026-01-01',
      },
    ];

    expect(filterSubscriptionItems(items, 'relacionamentos')).toHaveLength(1);
    expect(filterSubscriptionItems(items, 'movimento')).toHaveLength(0);
  });
});
