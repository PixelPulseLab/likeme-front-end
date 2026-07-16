import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type { SvgProps } from 'react-native-svg';
import { PrimaryButton } from '@/components/ui/buttons';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { AuthService, storageService } from '@/services';
import { useTranslation } from '@/hooks/i18n';
import type { StoredUser } from '@/types/auth';
import { PROFILE_FLOATING_MENU_ICONS, PROFILE_MENU_CHEVRON_SIZE, PROFILE_MENU_ICON_SIZE } from '@/assets/profile';
import { COLORS } from '@/constants';
import { logger } from '@/utils/logger';
import { navigateToActivitiesOrders } from '@/utils/navigation/activitiesNavigation';
import { navigateRootStack, rootStackNavigationFrom } from '@/utils/navigation/rootStackNavigation';
import { styles } from './styles';

type Props = {
  visible: boolean;
  navigation: any;
  onClose: () => void;
};

type ProfileMenuItem = {
  key: string;
  label: string;
  IconComponent: React.FC<SvgProps>;
  onPress: () => void;
};

const ProfileFloatingMenu: React.FC<Props> = ({ visible, navigation, onClose }) => {
  const { t } = useTranslation();
  const rootNavigation = rootStackNavigationFrom(navigation) ?? navigation;
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;

    const loadUser = async () => {
      try {
        setLoading(true);
        const storedUser = await storageService.getUser();
        setUser(storedUser);
      } catch (error) {
        logger.error('[ProfileFloatingMenu] Erro ao carregar usuário', error);
      } finally {
        setLoading(false);
      }
    };

    void loadUser();
  }, [visible]);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      logger.error('[ProfileFloatingMenu] Erro ao fazer logout', error);
    }
    onClose();
    rootNavigation.reset({
      index: 0,
      routes: [{ name: 'Unauthenticated' as never, params: { skipAutoLogin: true } }],
    });
  };

  const handleGoToSubscriptions = useCallback(() => {
    onClose();
    navigateRootStack(rootNavigation, 'SubscriptionList');
  }, [onClose, rootNavigation]);

  const handleGoToOrders = useCallback(() => {
    onClose();
    navigateToActivitiesOrders(rootNavigation);
  }, [onClose, rootNavigation]);

  const handleGoToActivities = useCallback(() => {
    onClose();
    navigateRootStack(rootNavigation, 'Activities', { initialTab: 'actives' });
  }, [onClose, rootNavigation]);

  const handleGoToUserProfile = useCallback(() => {
    onClose();
    navigateRootStack(rootNavigation, 'UserProfileHome');
  }, [onClose, rootNavigation]);

  const menuItems: ProfileMenuItem[] = useMemo(
    () => [
      {
        key: 'my-profile',
        label: t('profile.floatingMenu.myProfile', { defaultValue: 'Meu Perfil' }),
        IconComponent: PROFILE_FLOATING_MENU_ICONS.myProfile,
        onPress: handleGoToUserProfile,
      },
      {
        key: 'my-orders',
        label: t('profile.floatingMenu.myOrders', { defaultValue: 'Meus Pedidos' }),
        IconComponent: PROFILE_FLOATING_MENU_ICONS.myOrders,
        onPress: handleGoToOrders,
      },
      {
        key: 'my-protocols',
        label: t('profile.acquisitionList.menuLabel', { defaultValue: 'Meus Programas e Serviços' }),
        IconComponent: PROFILE_FLOATING_MENU_ICONS.myProtocols,
        onPress: handleGoToSubscriptions,
      },
      {
        key: 'my-activities',
        label: t('profile.floatingMenu.myActivities', { defaultValue: 'Minhas Atividades' }),
        IconComponent: PROFILE_FLOATING_MENU_ICONS.myActivities,
        onPress: handleGoToActivities,
      },
    ],
    [handleGoToActivities, handleGoToOrders, handleGoToSubscriptions, handleGoToUserProfile, t],
  );

  const userName = useMemo(() => user?.name?.trim() || user?.nickname?.trim() || 'Usuário', [user]);
  const userEmail = useMemo(() => user?.email?.trim() || '', [user]);
  const CloseIcon = PROFILE_FLOATING_MENU_ICONS.close;

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.panel}>
          <View style={styles.profileMenu}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.8}
              accessibilityRole='button'
            >
              <CloseIcon width={24} height={24} />
            </TouchableOpacity>

            <View style={styles.avatarWithText}>
              {user?.picture ? (
                <CachedImage source={{ uri: user.picture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Icon name='person' size={18} color={COLORS.TEXT} />
                </View>
              )}
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{loading ? t('profile.loading') : userName}</Text>
                {userEmail ? <Text style={styles.userEmail}>{userEmail}</Text> : null}
              </View>
            </View>

            <View style={styles.itemsContainer}>
              {menuItems.map((item) => {
                const MenuIcon = item.IconComponent;
                return (
                  <View key={item.key} style={styles.menuItemBlock}>
                    <TouchableOpacity style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
                      <View style={styles.menuItemLeft}>
                        <MenuIcon width={PROFILE_MENU_ICON_SIZE.width} height={PROFILE_MENU_ICON_SIZE.height} />
                        <Text style={styles.menuItemLabel}>{item.label}</Text>
                      </View>
                      <PROFILE_FLOATING_MENU_ICONS.chevronRight
                        width={PROFILE_MENU_CHEVRON_SIZE}
                        height={PROFILE_MENU_CHEVRON_SIZE}
                      />
                    </TouchableOpacity>
                    <View style={styles.separator} />
                  </View>
                );
              })}
            </View>

            <View style={styles.bottomButtons}>
              <PrimaryButton label='Logout' onPress={handleLogout} size='large' />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ProfileFloatingMenu;
