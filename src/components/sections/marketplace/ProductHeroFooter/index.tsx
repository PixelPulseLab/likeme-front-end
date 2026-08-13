import React from 'react';
import { View, Text } from 'react-native';
import { IconButton } from '@/components/ui/buttons';
import { formatPriceLabel } from '@/utils/formatters/priceFormatter';
import { styles } from './styles';

type ProductHeroFooterProps = {
  isOutOfStock: boolean;
  price: number | null | undefined;
  priceSuffix?: string;
  onCartPress: () => void;
};

export const ProductHeroFooter: React.FC<ProductHeroFooterProps> = ({
  isOutOfStock,
  price,
  priceSuffix,
  onCartPress,
}) => {
  const isOnConsultation = price == null;

  return (
    <View style={styles.heroFooter}>
      {!isOutOfStock ? (
        isOnConsultation ? (
          <View style={styles.onConsultationTag} testID='product-hero-on-consultation'>
            <Text style={styles.onConsultationTagText}>{formatPriceLabel(price)}</Text>
          </View>
        ) : (
          <View style={styles.priceRow}>
            <Text style={styles.heroPrice}>{formatPriceLabel(price)}</Text>
            {priceSuffix?.trim() ? <Text style={styles.heroPriceSuffix}>{priceSuffix.trim()}</Text> : null}
          </View>
        )
      ) : (
        <View />
      )}

      {!isOutOfStock && !isOnConsultation ? (
        <IconButton
          icon='shopping-cart'
          variant='light'
          onPress={onCartPress}
          containerStyle={{ alignSelf: 'flex-end' }}
        />
      ) : null}
    </View>
  );
};
