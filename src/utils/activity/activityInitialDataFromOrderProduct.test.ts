import type { Product } from '@/types/product';
import { activityInitialDataFromOrderProduct } from './activityInitialDataFromOrderProduct';

const productStub = (overrides: Partial<Product> & Pick<Product, 'id' | 'name'>): Product => ({
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('activityInitialDataFromOrderProduct', () => {
  it('pré-preenche nome e agenda ligada por padrão', () => {
    const data = activityInitialDataFromOrderProduct(
      productStub({
        id: 'p1',
        name: 'Consulta nutricional',
        description: 'Sessão de 60 min',
      }),
    );

    expect(data.name).toBe('Consulta nutricional');
    expect(data.type).toBe('event');
    expect(data.addToDeviceCalendar).toBe(true);
    expect(data.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.endDate).toBe(data.startDate);
  });

  it('aceita produto ausente com nome vazio', () => {
    const data = activityInitialDataFromOrderProduct(null);
    expect(data.name).toBe('');
    expect(data.addToDeviceCalendar).toBe(true);
  });
});
