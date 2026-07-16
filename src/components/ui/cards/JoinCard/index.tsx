import { View, Text } from 'react-native';
import BlurCard from '../BlurCard';
import { IconButton } from '@/components/ui/buttons';
import { formatPriceLabel } from '@/utils/formatters/priceFormatter';
import type { JoinCardProps } from './types';
import { styles } from './styles';

export type { JoinCardItem, JoinCardProps } from './types';

export function JoinCard({
  title,
  badges,
  image,
  price,
  desaturated = false,
  onPress,
  square = false,
  fullWidth = true,
  testID,
}: JoinCardProps) {
  const visibleBadges = badges.map((label) => label.trim()).filter(Boolean);
  const cardStyle = square ? styles.cardSquare : styles.card;
  const wrapperStyle = fullWidth ? styles.cardWrapperFullWidth : styles.cardWrapperCarousel;

  const topSection = (
    <View style={styles.badgesWrap}>
      {visibleBadges.map((label, index) => (
        <View key={`${label}-${index}`} style={styles.badge}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      ))}
    </View>
  );

  const footerSection = (
    <View style={styles.bottom}>
      <View style={styles.footerTextBlock}>
        <Text style={styles.title} {...(square ? {} : { numberOfLines: 2 })}>
          {title}
        </Text>
        {price !== undefined ? <Text style={styles.price}>{formatPriceLabel(price)}</Text> : null}
      </View>
      <IconButton
        icon='chevron-right'
        iconColor='#001137'
        iconSize={28}
        onPress={onPress}
        backgroundSize='large'
        containerStyle={styles.ctaIconButton}
      />
    </View>
  );

  return (
    <View style={wrapperStyle} testID={testID}>
      <BlurCard
        backgroundImage={image}
        topSection={topSection}
        footerSection={footerSection}
        onPress={onPress}
        style={cardStyle}
        desaturated={desaturated}
      />
    </View>
  );
}

export default JoinCard;
