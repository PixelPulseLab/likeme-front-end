import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { DesaturatedImage } from '@/components/ui/media/DesaturatedImage';
import { BlurView } from 'expo-blur';
import { IMAGE_PRIORITY_HIGH } from '@/constants';
import { styles } from './styles';

const DEFAULT_IMAGE_URI = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_COMPACT_HEIGHT = 280;

const DEFAULT_GRADIENT_COLORS = ['rgba(48, 48, 48, 0)', 'rgba(41, 41, 41, 1)'] as const;
const COMPACT_GRADIENT_COLORS = ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.74)'] as const;

export type HeroImageVariant = 'default' | 'compact';

export type HeroImageProps = {
  imageUri: string;
  name?: string;
  title?: string;
  badges?: string[];
  footer?: React.ReactNode;
  children?: React.ReactNode;
  cardContent?: React.ReactNode;
  heightRatio?: number;
  offsetTop?: number;
  desaturated?: boolean;
  variant?: HeroImageVariant;
};

const HeroImage = ({
  imageUri,
  name,
  title,
  badges = [],
  footer,
  children,
  cardContent,
  heightRatio = 0.5,
  offsetTop = 0,
  desaturated = false,
  variant = 'default',
}: HeroImageProps) => {
  const source = useMemo(() => ({ uri: imageUri || DEFAULT_IMAGE_URI }), [imageUri]);

  const isCompact = variant === 'compact';
  const profileMode = !children && !cardContent;
  const customOverlay = Boolean(children);
  const cardMode = Boolean(cardContent);

  const shouldRenderOverlay = profileMode || customOverlay;
  const shouldRenderCard = cardMode;

  const availableHeight = SCREEN_HEIGHT - offsetTop;
  const sectionHeight = isCompact ? HERO_COMPACT_HEIGHT : Math.max(0, availableHeight * heightRatio);
  const sectionStyle = { height: sectionHeight };

  const footerNode = footer != null ? <View style={styles.footer}>{footer}</View> : null;
  const showEmptyFooter = footer == null && !isCompact;

  return (
    <View style={[styles.section, sectionStyle, isCompact && styles.compactSection]}>
      {desaturated ? (
        <DesaturatedImage
          uri={imageUri || DEFAULT_IMAGE_URI}
          style={[styles.desaturatedImageWrap, styles.imageStyle, isCompact && styles.compactRadius]}
        />
      ) : (
        <CachedImage
          source={source}
          style={[styles.image, styles.imageStyle, isCompact && styles.compactRadius]}
          priority={IMAGE_PRIORITY_HIGH}
        />
      )}
      {shouldRenderCard ? (
        <View style={styles.cardContainer}>{cardContent}</View>
      ) : (
        <View style={[styles.overlay, isCompact && styles.compactOverlay]}>
          {isCompact && shouldRenderOverlay ? (
            <LinearGradient colors={[...COMPACT_GRADIENT_COLORS]} locations={[0, 1]} style={styles.compactGradient} />
          ) : null}
          <View style={[styles.bottomBlock, isCompact && styles.compactBottomBlock]}>
            {shouldRenderOverlay && !isCompact ? (
              <View style={styles.effectsContainer}>
                <BlurView intensity={10} tint='dark' style={styles.blur} />
                <LinearGradient colors={[...DEFAULT_GRADIENT_COLORS]} locations={[0.64, 1]} style={styles.gradient} />
              </View>
            ) : null}
            <View style={[styles.content, isCompact && styles.compactContent]}>
              {badges.length > 0 && (
                <View style={[styles.badgesContainer, (customOverlay || isCompact) && styles.badgesContainerCompact]}>
                  {badges.map((badge, index) => (
                    <View key={index} style={styles.badge}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  ))}
                </View>
              )}
              {customOverlay ? (
                children
              ) : (
                <>
                  {title ? <Text style={styles.title}>{title}</Text> : null}
                  {name ? <Text style={[styles.name, isCompact && styles.compactName]}>{name}</Text> : null}
                  {footerNode}
                  {showEmptyFooter ? <View style={styles.footer} /> : null}
                </>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default HeroImage;
