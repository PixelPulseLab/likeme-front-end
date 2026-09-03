import type { Product } from '@/types/product';
import { protocolDetailFromProduct } from '@/utils/profile/protocolDetailFromProduct';
import { PROGRAM_TYPE } from '@/types/product/programType';

describe('protocolDetailFromProduct', () => {
  it('mapeia produto program para modelo de ProtocolDetail', () => {
    const product: Product = {
      id: 'product-1',
      name: 'Protocolo X',
      description: 'Descrição',
      technicalSpecifications: 'Acordos',
      image: 'https://example.com/image.jpg',
      categoryNames: ['Saúde'],
      programCommunity: {
        socialPlusCommunityId: 'community-1',
      },
      status: 'active',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    expect(protocolDetailFromProduct(product)).toEqual({
      id: 'product-1',
      productId: 'product-1',
      name: 'Protocolo X',
      image: 'https://example.com/image.jpg',
      description: 'Descrição',
      agreements: 'Acordos',
      communityId: 'community-1',
      programType: null,
      badges: ['Saúde'],
    });
  });

  it('mapeia programType community quando o produto é programa de comunidade', () => {
    const product: Product = {
      id: 'product-2',
      name: 'O.Culto',
      status: 'active',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      programType: PROGRAM_TYPE.COMMUNITY,
      programCommunity: {
        socialPlusCommunityId: 'community-feed-id',
      },
    };

    expect(protocolDetailFromProduct(product)).toEqual({
      id: 'product-2',
      productId: 'product-2',
      name: 'O.Culto',
      image: undefined,
      description: undefined,
      agreements: undefined,
      communityId: 'community-feed-id',
      programType: PROGRAM_TYPE.COMMUNITY,
      badges: [],
    });
  });
});
