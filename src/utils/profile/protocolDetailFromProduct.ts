import type { Product } from '@/types/product';
import type { ProtocolDetailProtocol } from '@/types/navigation';

export function programCommunityIdFromProduct(product: Pick<Product, 'programCommunity'>): string | undefined {
  return product.programCommunity?.socialPlusCommunityId?.trim() || undefined;
}

export function protocolDetailFromProduct(product: Product): ProtocolDetailProtocol {
  const productId = product.id.trim();

  return {
    id: productId,
    productId,
    name: product.name,
    image: product.image,
    description: product.description,
    agreements: product.technicalSpecifications,
    communityId: programCommunityIdFromProduct(product),
    programType: product.programType ?? null,
    badges: product.categoryNames?.filter(Boolean) ?? [],
  };
}
