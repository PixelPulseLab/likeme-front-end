import { buildApiProductFromRouteFallback } from './routeProductFallback';

describe('buildApiProductFromRouteFallback', () => {
  const fixedIso = '2024-01-15T12:00:00.000Z';

  it('mapeia preço em string com símbolo $ (ponto decimal)', () => {
    const result = buildApiProductFromRouteFallback(
      {
        id: 'p-1',
        title: 'Item',
        price: '$19.99',
        image: 'https://img.example/x.jpg',
        type: 'physical',
        description: 'Desc',
      },
      fixedIso,
    );

    expect(result).toMatchObject({
      id: 'p-1',
      name: 'Item',
      price: 19.99,
      image: 'https://img.example/x.jpg',
      type: 'physical',
      description: 'Desc',
      quantity: 0,
      status: 'active',
      createdAt: fixedIso,
      updatedAt: fixedIso,
    });
  });

  it('mapeia preço em string BRL com vírgula decimal', () => {
    const result = buildApiProductFromRouteFallback(
      {
        id: 'p-2',
        title: 'Item BRL',
        price: 'R$1.234,56',
        image: '',
      },
      fixedIso,
    );

    expect(result.price).toBe(1234.56);
  });

  it('preserva preço nulo quando o fallback não tem valor numérico', () => {
    const result = buildApiProductFromRouteFallback(
      {
        id: 'p-3',
        title: 'Serviço sob demanda',
        price: 'Sob Demanda',
        image: '',
      },
      fixedIso,
    );

    expect(result.price).toBeNull();
  });
});
