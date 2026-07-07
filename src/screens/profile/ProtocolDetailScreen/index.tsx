import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWithHeader, HeroImage } from '@/components/ui/layout';
import { EmptyState, ShareContentUnavailable } from '@/components/ui/feedback';
import { type ButtonCarouselOption } from '@/components/ui/carousel';
import InfoSectionTabsRow from '@/components/ui/carousel/InfoSectionTabsRow';
import { ModuleAccordion } from '@/components/sections/program';
import { EventBanner } from '@/components/sections/community';
import { EventWebViewSession } from '@/components/infrastructure/webview/EventWebViewSession';
import { MarkdownText } from '@/components/ui/text/MarkdownText';
import { useCommunityEventBanner, useMenuItems, useProgramCourse } from '@/hooks';
import { useFloatingMenuActions } from '@/contexts/FloatingMenuContext';
import { useAnalyticsScreen, logTabSelect } from '@/analytics';
import { useTranslation } from '@/hooks/i18n';
import { MEMBER_PROTOCOL_COMMUNITY_IMAGE_FALLBACK } from '@/constants/community/communityProtocol';
import { SHARE_CONTENT_TYPES } from '@/constants/share';
import type { ProtocolDetailProtocol, RootStackParamList } from '@/types/navigation';
import type { ModuleItem } from '@/components/sections/program/ModuleAccordion';
import productService from '@/services/product/productService';
import { COLORS } from '@/constants';
import { moduleItemsFromProgramCourse } from '@/utils/course/programCourseModules';
import { protocolDetailFromProduct } from '@/utils/profile/protocolDetailFromProduct';
import { goBackOrShareHome, navigateToShareHome } from '@/utils/navigation/shareHomeNavigation';
import { navigateToShareDiscover } from '@/utils/navigation/shareDiscoverNavigation';
import { logger } from '@/utils/logger';
import { shareContent } from '@/utils/share/shareContent';
import { styles } from './styles';

type Props = StackScreenProps<RootStackParamList, 'ProtocolDetail'>;

type ProtocolTabId = 'content' | 'about' | 'agreements';

const TAB_OPTIONS: ButtonCarouselOption<ProtocolTabId>[] = [
  { id: 'content', label: 'Conteúdo' },
  { id: 'about', label: 'Sobre' },
  { id: 'agreements', label: 'Acordos' },
];

function protocolProductIdFromRouteParams(params: RootStackParamList['ProtocolDetail']): string | null {
  if ('productId' in params) {
    const productId = params.productId?.trim();
    return productId || null;
  }

  const productId = params.protocol.productId?.trim() || params.protocol.id?.trim();
  return productId || null;
}

const ProtocolDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  useAnalyticsScreen({ screenName: 'ProtocolDetail', screenClass: 'ProtocolDetailScreen' });
  const { t } = useTranslation();
  const menuItems = useMenuItems(navigation);
  const { setMenu } = useFloatingMenuActions();
  const routeParams = route.params;
  const initialProtocol = 'protocol' in routeParams ? routeParams.protocol : undefined;
  const routeProductId = protocolProductIdFromRouteParams(routeParams);

  const [resolvedProtocol, setResolvedProtocol] = useState<ProtocolDetailProtocol | null>(initialProtocol ?? null);
  const [protocolLoadState, setProtocolLoadState] = useState<'idle' | 'loading' | 'error'>(
    initialProtocol ? 'idle' : 'loading',
  );

  useEffect(() => {
    if (initialProtocol) {
      setResolvedProtocol(initialProtocol);
      setProtocolLoadState('idle');
      return;
    }

    if (!routeProductId) {
      setResolvedProtocol(null);
      setProtocolLoadState('error');
      return;
    }

    let cancelled = false;
    setProtocolLoadState('loading');

    void (async () => {
      try {
        const response = await productService.getProductById(routeProductId);
        const isSuccess = response.success === true || (response as { status?: string }).status === 'success';
        if (cancelled) {
          return;
        }
        if (!isSuccess || !response.data) {
          setResolvedProtocol(null);
          setProtocolLoadState('error');
          return;
        }
        setResolvedProtocol(protocolDetailFromProduct(response.data));
        setProtocolLoadState('idle');
      } catch (error) {
        logger.warn('[ProtocolDetailScreen] Falha ao carregar protocolo compartilhado', {
          productId: routeProductId,
          cause: error,
        });
        if (!cancelled) {
          setResolvedProtocol(null);
          setProtocolLoadState('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialProtocol, routeProductId]);

  const protocol = resolvedProtocol;

  const communityId = protocol?.communityId?.trim() ?? '';
  const hasCommunity = Boolean(communityId);
  const productId = protocol?.productId?.trim() ?? '';

  const [activeTab, setActiveTab] = useState<ProtocolTabId>('content');
  const [agreementsText, setAgreementsText] = useState(protocol?.agreements?.trim() ?? '');
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  const heroImageUri = protocol?.image?.trim() || (hasCommunity ? MEMBER_PROTOCOL_COMMUNITY_IMAGE_FALLBACK : '');

  const { course, loading: courseLoading } = useProgramCourse(communityId, hasCommunity);
  const { eventBanner, eventJoinUrl, closeEventSession, handleEventBannerPress } = useCommunityEventBanner({
    enabled: hasCommunity,
    communityId,
    communityAvatarUrl: heroImageUri,
    communityProviderName: protocol?.name ?? '',
    defaultThumbnailUrl: heroImageUri,
    programProductId: productId || undefined,
    hasProgramAccess: true,
    navigation,
  });

  const courseModules: ModuleItem[] = useMemo(() => {
    if (course?.steps?.length) {
      return moduleItemsFromProgramCourse(course);
    }

    return [];
  }, [course]);

  const aboutText = protocol?.description?.trim() || protocol?.shortDescription?.trim() || null;

  useEffect(() => {
    const fromRoute = protocol?.agreements?.trim();
    if (fromRoute) {
      setAgreementsText(fromRoute);
      return;
    }

    if (!productId) {
      setAgreementsText('');
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const response = await productService.getProductById(productId);
        const isSuccess = response.success === true || (response as { status?: string }).status === 'success';
        if (cancelled || !isSuccess || !response.data) {
          return;
        }
        setAgreementsText(response.data.technicalSpecifications?.trim() ?? '');
      } catch {
        if (!cancelled) {
          setAgreementsText('');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId, protocol?.agreements]);

  const contentLoading = hasCommunity && courseLoading;
  const moduleStorageScopeId = communityId || protocol?.id || productId;

  useFocusEffect(
    useCallback(() => {
      setMenu(menuItems, 'profile');
    }, [menuItems, setMenu]),
  );

  const handleBack = () => {
    goBackOrShareHome(navigation);
  };

  const handleGoHome = () => {
    navigateToShareHome(navigation);
  };

  const handleDiscover = () => {
    navigateToShareDiscover(navigation, protocol?.productId ?? routeProductId);
  };

  const handleSharePress = async () => {
    const productId = protocol?.productId ?? routeProductId;
    if (!productId) {
      return;
    }
    await shareContent({ contentType: SHARE_CONTENT_TYPES.PROTOCOL, productId }, { screenName: 'protocol_detail' });
  };

  const handleTabSelect = (tabId: ProtocolTabId) => {
    logTabSelect({ screen_name: 'protocol_detail', tab_id: tabId });
    setActiveTab(tabId);
  };

  if (protocolLoadState === 'loading') {
    return (
      <ScreenWithHeader
        navigation={navigation}
        headerProps={{ showBackButton: true, onBackPress: handleBack }}
        contentContainerStyle={styles.container}
        contentBackgroundColor={COLORS.BACKGROUND}
      >
        <View style={styles.loaderWrap}>
          <ActivityIndicator size='large' color={COLORS.PRIMARY.PURE} />
        </View>
      </ScreenWithHeader>
    );
  }

  if (protocolLoadState === 'error' || !protocol) {
    return (
      <ScreenWithHeader
        navigation={navigation}
        headerProps={{ showBackButton: true, onBackPress: handleBack }}
        contentContainerStyle={styles.container}
        contentBackgroundColor={COLORS.BACKGROUND}
      >
        <ShareContentUnavailable
          contentType={SHARE_CONTENT_TYPES.PROTOCOL}
          itemId={routeProductId ?? undefined}
          screenName='protocol_detail'
          onDiscover={handleDiscover}
          onGoHome={handleGoHome}
        />
      </ScreenWithHeader>
    );
  }

  const renderContentTab = () => {
    if (!hasCommunity) {
      return (
        <View style={styles.tabContent}>
          {courseModules.length > 0 ? (
            <ModuleAccordion modules={courseModules} storageScopeId={moduleStorageScopeId} />
          ) : (
            <Text style={styles.emptyText}>
              {t('profile.protocolDetail.noCommunityLinked', {
                defaultValue: 'Conteúdo indisponível: protocolo sem comunidade vinculada.',
              })}
            </Text>
          )}
        </View>
      );
    }

    if (contentLoading) {
      return (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size='large' color={COLORS.PRIMARY.PURE} />
        </View>
      );
    }

    const showLessons = courseModules.length > 0;
    const noCourseStepsTitle = t('profile.protocolDetail.noCourseSteps', {
      defaultValue: 'Nenhuma aula disponível no momento.',
    });

    if (!eventBanner && !showLessons) {
      return (
        <View style={styles.tabContent}>
          <EmptyState title={noCourseStepsTitle} iconName='menu-book' />
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {eventBanner ? (
          <View style={styles.eventBannerContainer}>
            <EventBanner event={eventBanner} onPress={handleEventBannerPress} />
          </View>
        ) : null}
        {showLessons ? (
          <ModuleAccordion
            modules={courseModules}
            storageScopeId={moduleStorageScopeId}
            expandedModuleId={expandedModuleId}
            onExpandedModuleChange={setExpandedModuleId}
          />
        ) : (
          <EmptyState title={noCourseStepsTitle} iconName='menu-book' />
        )}
      </View>
    );
  };

  const renderAboutTab = () => (
    <View style={styles.tabContent}>
      {aboutText ? (
        <MarkdownText style={styles.descriptionText} text={aboutText} />
      ) : (
        <Text style={styles.emptyText}>
          {t('community.aboutEmpty', { defaultValue: 'Sem informações disponíveis.' })}
        </Text>
      )}
    </View>
  );

  const renderAgreementsTab = () => (
    <View style={styles.tabContent}>
      {agreementsText.length > 0 ? (
        <MarkdownText style={styles.descriptionText} text={agreementsText} />
      ) : (
        <Text style={styles.emptyText}>
          {t('marketplace.noDescriptionAvailable', {
            defaultValue: 'Descrição não disponível.',
          })}
        </Text>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'content':
        return renderContentTab();
      case 'about':
        return renderAboutTab();
      case 'agreements':
        return renderAgreementsTab();
    }
  };

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        showBackButton: true,
        onBackPress: handleBack,
      }}
      contentContainerStyle={styles.container}
      contentBackgroundColor={COLORS.BACKGROUND}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <HeroImage
          imageUri={heroImageUri}
          name={protocol.name}
          badges={protocol.badges ?? []}
          heightRatio={0.6}
          footer={
            aboutText ? (
              <View style={styles.heroFooter}>
                <Text style={styles.heroDescription}>{aboutText}</Text>
              </View>
            ) : undefined
          }
        />

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>{t('community.informationTitle', { defaultValue: 'Informações' })}</Text>
          <InfoSectionTabsRow
            options={TAB_OPTIONS}
            selectedId={activeTab}
            onSelect={handleTabSelect}
            onSharePress={() => void handleSharePress()}
          />
        </View>

        {renderTabContent()}
      </ScrollView>
      {eventJoinUrl ? <EventWebViewSession url={eventJoinUrl} onClose={closeEventSession} /> : null}
    </ScreenWithHeader>
  );
};

export default ProtocolDetailScreen;
