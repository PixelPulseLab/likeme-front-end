import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, type ImageSourcePropType } from 'react-native';
import { HOME_MVP_ASSETS } from '@/assets/homeMvp';
import { LogoMini } from '@/assets/ui';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { IconButton } from '@/components/ui/buttons';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { useCartItemCount } from '@/hooks/marketplace/useCartItemCount';
import { IMAGE_PRIORITY_HIGH } from '@/constants';
import { styles } from './styles';

const noop = () => undefined;

function CartHeaderButton({ onPress }: { onPress: () => void }) {
  const cartItemCount = useCartItemCount();
  const label = cartItemCount > 99 ? '99+' : String(cartItemCount);
  return (
    <View style={styles.cartButtonWrapper} testID='e2e.header.cart'>
      <IconButton iconImageSource={HOME_MVP_ASSETS.cart} iconSize={22} onPress={onPress} backgroundSize='medium' />
      {cartItemCount > 0 ? (
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

interface HeaderProps {
  onBackPress?: () => void;
  showBackButton?: boolean;
  onSharePress?: () => void;
  showShareButton?: boolean;
  onLogoutPress?: () => void;
  showLogoutButton?: boolean;
  onCartPress?: () => void;
  showCartButton?: boolean;
  onBellPress?: () => void;
  showBellButton?: boolean;
  onRatingPress?: () => void;
  showRating?: boolean;
  /** Quando definido, alterna ícone cheio (star) e contorno (star-border). Omitir mantém só `star` (comportamento anterior). */
  favoriteActive?: boolean;
  customLogo?: ReactNode;
  /** Callback ao tocar na logo central. Ex.: voltar para a Home. */
  onLogoPress?: () => void;
  /** Texto do botão à direita (ex. "Pular"). Quando definido, exibe em vez dos botões de ícone. */
  rightLabel?: string;
  onRightPress?: () => void;
  /** Menu + avatar à esquerda (home). Quando true, exibe pill com ícone de menu e foto do usuário. */
  showMenuWithAvatar?: boolean;
  onMenuPress?: () => void;
  userAvatarUri?: string | null;
  headerLogoImageSource?: ImageSourcePropType;
  headerLogoImageWidth?: number;
  headerLogoImageHeight?: number;
  backgroundColor?: string;
}

const Header: React.FC<HeaderProps> = ({
  onBackPress,
  showBackButton = true,
  onSharePress,
  showShareButton = false,
  onLogoutPress,
  showLogoutButton = false,
  onCartPress,
  showCartButton = false,
  onBellPress,
  showBellButton = false,
  onRatingPress,
  showRating = false,
  favoriteActive,
  customLogo,
  onLogoPress,
  rightLabel,
  onRightPress,
  showMenuWithAvatar = false,
  onMenuPress,
  userAvatarUri,
  headerLogoImageSource,
  headerLogoImageWidth = 87,
  headerLogoImageHeight = 16,
  backgroundColor,
}) => {
  const hasRightLabel = Boolean(rightLabel && onRightPress);
  const ratingIconName = favoriteActive === undefined ? 'star' : favoriteActive ? 'star' : 'star-border';
  return (
    <View style={[styles.container, backgroundColor ? { backgroundColor } : null]}>
      <View style={styles.header}>
        {showMenuWithAvatar && onMenuPress && (
          <TouchableOpacity
            style={styles.menuWithAvatarPill}
            onPress={onMenuPress}
            activeOpacity={0.7}
            testID='e2e.header.profileMenu'
          >
            <CachedImage source={HOME_MVP_ASSETS.menu} style={styles.menuIconImage} contentFit='contain' />
            {userAvatarUri ? (
              <CachedImage source={{ uri: userAvatarUri }} style={styles.headerAvatar} priority={IMAGE_PRIORITY_HIGH} />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Icon name='person' size={18} color='#0F1B33' />
              </View>
            )}
          </TouchableOpacity>
        )}
        {!showMenuWithAvatar && showBackButton && (
          <IconButton
            icon='chevron-left'
            onPress={onBackPress ?? noop}
            backgroundSize='medium'
            containerStyle={styles.leftButton}
          />
        )}
        <TouchableOpacity
          onPress={onLogoPress ?? noop}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {customLogo ||
            (headerLogoImageSource != null ? (
              <CachedImage
                source={headerLogoImageSource}
                style={{ width: headerLogoImageWidth, height: headerLogoImageHeight }}
                contentFit='contain'
              />
            ) : (
              <LogoMini width={87} height={16} />
            ))}
        </TouchableOpacity>
        {hasRightLabel && (
          <TouchableOpacity
            style={styles.rightLabelButton}
            onPress={onRightPress}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.rightLabelText}>{rightLabel}</Text>
          </TouchableOpacity>
        )}
        {!hasRightLabel && (
          <View style={styles.rightButtons}>
            {showBellButton && (
              <IconButton
                iconImageSource={HOME_MVP_ASSETS.bell}
                iconSize={22}
                onPress={onBellPress ?? noop}
                backgroundSize='medium'
              />
            )}
            {showCartButton && onCartPress && <CartHeaderButton onPress={onCartPress} />}
            {showShareButton && onSharePress ? (
              <IconButton icon='share' onPress={onSharePress} backgroundSize='medium' />
            ) : null}
            {showLogoutButton && onLogoutPress && (
              <IconButton icon='logout' onPress={onLogoutPress} backgroundSize='medium' />
            )}
            {showRating && <IconButton icon={ratingIconName} onPress={onRatingPress ?? noop} backgroundSize='medium' />}
          </View>
        )}
      </View>
    </View>
  );
};

export default Header;
