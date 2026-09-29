import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconButton } from '@/components/ui/buttons';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { DesaturatedImage } from '@/components/ui/media/DesaturatedImage';
import { COLORS } from '@/constants';
import { formatPriceLabel } from '@/utils/formatters/priceFormatter';
import BlurCard from '../BlurCard';
import { styles } from './styles';
import { JOIN_CARD_VARIANT, type JoinCardProps, type JoinCardVariant } from './types';

export type { JoinCardItem, JoinCardProps } from './types';

const HERO_GRADIENT = ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.74)'] as const;

type BlurJoinCardVariant = Exclude<JoinCardVariant, typeof JOIN_CARD_VARIANT.HERO>;

type BlurCardLayout = {
  cardStyle: StyleProp<ViewStyle>;
  titleLines?: number;
  detailBeforeTitle: boolean;
  footerChevron: boolean;
  showCaption: boolean;
};

const BLUR_CARD_LAYOUT: Record<BlurJoinCardVariant, BlurCardLayout> = {
  [JOIN_CARD_VARIANT.DEFAULT]: {
    cardStyle: styles.card,
    titleLines: 2,
    detailBeforeTitle: true,
    footerChevron: true,
    showCaption: false,
  },
  [JOIN_CARD_VARIANT.SQUARE]: {
    cardStyle: styles.cardSquare,
    detailBeforeTitle: false,
    footerChevron: true,
    showCaption: false,
  },
  [JOIN_CARD_VARIANT.COMPACT]: {
    cardStyle: styles.cardCompact,
    titleLines: 2,
    detailBeforeTitle: false,
    footerChevron: false,
    showCaption: true,
  },
};

function visibleBadgeLabels(badges: readonly string[]): string[] {
  return badges.map((label) => label.trim()).filter(Boolean);
}

function JoinCardBadges({ badges }: { badges: string[] }) {
  return (
    <View style={styles.badgesWrap}>
      {badges.map((label, index) => (
        <View key={`${label}-${index}`} style={styles.badge}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

function JoinCardChevron({ onPress }: { onPress: () => void }) {
  return (
    <IconButton
      icon='chevron-right'
      iconColor={COLORS.TEXT}
      iconSize={28}
      onPress={onPress}
      backgroundSize='large'
      containerStyle={styles.ctaIconButton}
    />
  );
}

function JoinCardTop({ badges, onShare }: { badges: string[]; onShare?: () => void }) {
  if (!onShare) {
    return <JoinCardBadges badges={badges} />;
  }

  return (
    <View style={styles.topRow}>
      <JoinCardBadges badges={badges} />
      <IconButton icon='ios-share' onPress={onShare} backgroundSize='small' />
    </View>
  );
}

function JoinCardCover({ image, desaturated }: { image: string; desaturated: boolean }) {
  if (desaturated) {
    return <DesaturatedImage uri={image} style={styles.heroMedia} />;
  }

  return <CachedImage source={{ uri: image }} style={styles.heroMedia} />;
}

function blurCardWrapperStyle(variant: BlurJoinCardVariant, fullWidth: boolean): StyleProp<ViewStyle> {
  if (variant === JOIN_CARD_VARIANT.COMPACT) {
    return styles.cardWrapperCompact;
  }
  if (fullWidth) {
    return styles.cardWrapperFullWidth;
  }
  return styles.cardWrapperCarousel;
}

function BlurJoinCard({
  title,
  badges,
  image,
  price,
  detail,
  caption,
  desaturated = false,
  onPress,
  onShare,
  variant,
  fullWidth = true,
  testID,
}: JoinCardProps & { variant: BlurJoinCardVariant }) {
  const layout = BLUR_CARD_LAYOUT[variant];
  const labels = visibleBadgeLabels(badges);
  const detailText = detail ? (
    <Text style={styles.detail} numberOfLines={2}>
      {detail}
    </Text>
  ) : null;
  const leadingDetail = layout.detailBeforeTitle ? detailText : null;
  const trailingDetail = layout.detailBeforeTitle ? null : detailText;
  const showFooterChevron = layout.footerChevron && Boolean(onPress);

  return (
    <View style={blurCardWrapperStyle(variant, fullWidth)} testID={testID}>
      <BlurCard
        backgroundImage={image}
        topSection={<JoinCardTop badges={labels} onShare={onShare} />}
        footerSection={
          <View style={styles.bottom}>
            <View style={styles.footerTextBlock}>
              {leadingDetail}
              <Text style={[styles.title, !onPress && styles.titleWithoutCta]} numberOfLines={layout.titleLines}>
                {title}
              </Text>
              {trailingDetail}
              {price !== undefined ? <Text style={styles.price}>{formatPriceLabel(price)}</Text> : null}
            </View>
            {showFooterChevron && onPress ? <JoinCardChevron onPress={onPress} /> : null}
          </View>
        }
        onPress={onPress}
        style={layout.cardStyle}
        desaturated={desaturated}
      />
      {layout.showCaption ? (
        <View style={styles.captionRow}>
          <Text style={styles.caption} numberOfLines={2}>
            {caption ?? ''}
          </Text>
          {onPress ? <JoinCardChevron onPress={onPress} /> : null}
        </View>
      ) : null}
    </View>
  );
}

function MediaJoinCard({
  title,
  badges,
  image,
  price,
  detail,
  caption,
  desaturated = false,
  onPress,
  onShare,
  variant,
  fullWidth = true,
  testID,
}: JoinCardProps & { variant: BlurJoinCardVariant }) {
  const layout = BLUR_CARD_LAYOUT[variant];
  const labels = visibleBadgeLabels(badges);
  const detailText = detail ? (
    <Text style={styles.detail} numberOfLines={2}>
      {detail}
    </Text>
  ) : null;
  const leadingDetail = layout.detailBeforeTitle ? detailText : null;
  const trailingDetail = layout.detailBeforeTitle ? null : detailText;
  const showFooterChevron = layout.footerChevron && Boolean(onPress);

  return (
    <View style={blurCardWrapperStyle(variant, fullWidth)} testID={testID}>
      <Pressable onPress={onPress} style={[layout.cardStyle, styles.mediaFrame]}>
        <JoinCardCover image={image} desaturated={desaturated} />
        <LinearGradient pointerEvents='none' colors={HERO_GRADIENT} style={styles.heroMedia} />
        <View style={styles.mediaBody}>
          <View style={styles.mediaTop}>
            <JoinCardTop badges={labels} onShare={onShare} />
          </View>
          <View style={styles.mediaFooter}>
            <View style={styles.bottom}>
              <View style={styles.footerTextBlock}>
                {leadingDetail}
                <Text style={[styles.title, !onPress && styles.titleWithoutCta]} numberOfLines={layout.titleLines}>
                  {title}
                </Text>
                {trailingDetail}
                {price !== undefined ? <Text style={styles.price}>{formatPriceLabel(price)}</Text> : null}
              </View>
              {showFooterChevron && onPress ? <JoinCardChevron onPress={onPress} /> : null}
            </View>
          </View>
        </View>
      </Pressable>
      {layout.showCaption ? (
        <View style={styles.captionRow}>
          <Text style={styles.caption} numberOfLines={2}>
            {caption ?? ''}
          </Text>
          {onPress ? <JoinCardChevron onPress={onPress} /> : null}
        </View>
      ) : null}
    </View>
  );
}

function HeroJoinCard({ title, badges, image, detail, desaturated = false, onPress, onShare, testID }: JoinCardProps) {
  const labels = visibleBadgeLabels(badges);

  return (
    <View style={styles.cardWrapperFullWidth} testID={testID}>
      <Pressable onPress={onPress} style={styles.cardHero}>
        <JoinCardCover image={image} desaturated={desaturated} />
        <LinearGradient pointerEvents='none' colors={HERO_GRADIENT} style={styles.heroMedia} />
        <View style={styles.heroBody}>
          <JoinCardTop badges={labels} onShare={onShare} />
          <View style={styles.bottom}>
            <View style={styles.footerTextBlock}>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
              {detail ? (
                <Text style={styles.detail} numberOfLines={2}>
                  {detail}
                </Text>
              ) : null}
            </View>
            {onPress ? <JoinCardChevron onPress={onPress} /> : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export function JoinCard({ variant = JOIN_CARD_VARIANT.DEFAULT, blur = true, ...props }: JoinCardProps) {
  if (variant === JOIN_CARD_VARIANT.HERO) {
    return <HeroJoinCard {...props} />;
  }

  if (!blur) {
    return <MediaJoinCard {...props} variant={variant} />;
  }

  return <BlurJoinCard {...props} variant={variant} />;
}
