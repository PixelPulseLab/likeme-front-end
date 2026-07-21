import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Linking } from 'react-native';
import { SecondaryButton } from '@/components/ui/buttons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import { PartnerSection } from '@/components/sections/advertiser';
import { ProductHeroFooter } from '@/components/sections/marketplace/ProductHeroFooter';
import { RecommendedProductsSection } from '@/components/sections/marketplace/RecommendedProductsSection';
import { HeroImage, ScreenWithHeader } from '@/components/ui/layout';
import { ShareContentUnavailable } from '@/components/ui/feedback';
import InfoSectionTabsRow from '@/components/ui/carousel/InfoSectionTabsRow';
import { MarkdownText } from '@/components/ui/text/MarkdownText';
import { MARKETPLACE_PRODUCT_PLACEHOLDER_IMAGE_URI } from '@/constants';
import { useMenuItems, useProductDetails, useProductPartner } from '@/hooks';
import { useTranslation } from '@/hooks/i18n';
import type { RootStackParamList } from '@/types/navigation';
import { useAnalyticsScreen } from '@/analytics';
import { useSetFloatingMenu } from '@/contexts/FloatingMenuContext';
import { getProductModeTranslationKey } from '@/utils';
import { logger } from '@/utils/logger';
import { catalogTypeTranslatedBadgeLabels } from '@/types/product';
import { SHARE_CONTENT_TYPES } from '@/constants/share';
import { goBackOrShareHome, navigateToShareHome } from '@/utils/navigation/shareHomeNavigation';
import { navigateToShareDiscover } from '@/utils/navigation/shareDiscoverNavigation';
import { shareContent } from '@/utils/share/shareContent';
import { styles } from './styles';

type AffiliateProductScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'AffiliateProduct'>;
  route: {
    params: {
      productId: string;
      adId?: string;
      product?: {
        id: string;
        title: string;
        price: string;
        image: string;
        type?: string;
        description?: string;
        externalUrl?: string;
        provider?: {
          name: string;
          avatar: string;
          description?: string;
        };
      };
    };
  };
};

type TabType = 'goal' | 'description' | 'composition';
const HTTPS_PROTOCOL = 'https:';
const AMAZON_ALLOWED_HOSTS = ['amazon.com', 'amazon.com.br'];

function isAllowedAffiliateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== HTTPS_PROTOCOL) {
      return false;
    }

    const normalizedHost = parsed.hostname.toLowerCase();
    return AMAZON_ALLOWED_HOSTS.some((host) => normalizedHost === host || normalizedHost.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

const AffiliateProductScreen: React.FC<AffiliateProductScreenProps> = ({ navigation, route }) => {
  useAnalyticsScreen({ screenName: 'AffiliateProduct', screenClass: 'AffiliateProductScreen' });
  const { t } = useTranslation();
  const menuItems = useMenuItems(navigation);
  useSetFloatingMenu(menuItems, 'marketplace');
  const [activeTab, setActiveTab] = useState<TabType>('goal');

  const fallbackProduct = useMemo(() => {
    const p = route.params?.product;
    if (!p) return undefined;
    return {
      id: p.id,
      title: p.title,
      price: p.price,
      image: p.image,
      type: p.type,
      description: p.description,
    };
  }, [
    route.params?.product?.id,
    route.params?.product?.title,
    route.params?.product?.price,
    route.params?.product?.image,
    route.params?.product?.type,
    route.params?.product?.description,
  ]);

  const { product, ad, advertiserId, loading } = useProductDetails({
    productId: route.params?.productId,
    adId: route.params?.adId,
    fallbackProduct,
    navigation,
    skipAmazonRedirect: true,
    supplementalExternalUrl: route.params?.product?.externalUrl,
  });

  const { partnerData, hasSpecialistPartner, partnerDisplayName } = useProductPartner({
    product,
    ad,
    advertiserId,
    routeProduct: route.params?.product,
    productIdFallback: route.params?.productId,
  });

  const handleBackPress = () => {
    goBackOrShareHome(navigation);
  };

  const handleGoHome = () => {
    navigateToShareHome(navigation);
  };

  const handleDiscover = () => {
    navigateToShareDiscover(navigation, route.params?.productId);
  };

  const handleSharePress = async () => {
    const productId = product?.id ?? route.params?.productId;
    if (!productId) {
      return;
    }
    await shareContent(
      { contentType: SHARE_CONTENT_TYPES.AFFILIATE, productId, adId: route.params?.adId },
      { screenName: 'affiliate_product' },
    );
  };

  const handleBuyOnAmazon = () => {
    const externalUrl = ad?.product?.externalUrl || product?.externalUrl || route.params?.product?.externalUrl;
    if (!externalUrl) {
      return;
    }

    if (!isAllowedAffiliateUrl(externalUrl)) {
      logger.warn('[AffiliateProductScreen] URL de afiliado bloqueada por domínio/protocolo inválido.', {
        externalUrl,
      });
      return;
    }

    Linking.openURL(externalUrl).catch((error: Error) => {
      logger.error('[AffiliateProductScreen] Falha ao abrir URL de afiliado.', { externalUrl, error });
    });
  };

  const paramsProduct = route.params?.product;
  const displayTitle = ad?.product?.name || product?.name || paramsProduct?.title || 'Product';
  const displayDescription = ad?.product?.description || product?.description || paramsProduct?.description || '';
  const displayGoal = (ad?.product?.targetAudience ?? product?.targetAudience ?? '').trim();
  const displayComposition = (ad?.product?.technicalSpecifications ?? product?.technicalSpecifications ?? '').trim();
  const displayDescriptionTrimmed = displayDescription.trim();
  const displayImage =
    product?.image || ad?.product?.image || paramsProduct?.image || MARKETPLACE_PRODUCT_PLACEHOLDER_IMAGE_URI;

  const productImages = useMemo(() => {
    const images: string[] = [];
    if (displayImage && displayImage !== MARKETPLACE_PRODUCT_PLACEHOLDER_IMAGE_URI) {
      images.push(displayImage);
    }
    return images;
  }, [displayImage]);

  const heroBadges = useMemo(() => {
    const catalogType = product?.type ?? ad?.product?.type ?? paramsProduct?.type;
    const catalogBadges = catalogTypeTranslatedBadgeLabels(catalogType, t);
    const modeTranslationKey = getProductModeTranslationKey(product ?? null);
    const modeLabel = modeTranslationKey ? t(`marketplace.productMode.${modeTranslationKey}`).trim() : '';
    return [...catalogBadges, modeLabel].filter(Boolean);
  }, [product, ad?.product, paramsProduct?.type, t]);

  const tabs = useMemo(() => {
    const all: { id: TabType; label: string; text: string }[] = [
      { id: 'goal', label: t('marketplace.goal'), text: displayGoal },
      { id: 'description', label: t('marketplace.description'), text: displayDescriptionTrimmed },
      { id: 'composition', label: t('marketplace.composition'), text: displayComposition },
    ];
    return all.filter((tab) => tab.text.length > 0);
  }, [t, displayGoal, displayDescriptionTrimmed, displayComposition]);

  // Não persistir fallback em estado: enquanto o produto completo carrega, a aba
  // "Objetivo" ainda não existe e gravar tabs[0] fixaria "Descrição" para sempre.
  // resolvedTabId já deriva a aba exibida quando activeTab não está disponível.
  const resolvedTabId = useMemo((): TabType | null => {
    if (tabs.length === 0) return null;
    return tabs.some((tab) => tab.id === activeTab) ? activeTab : tabs[0].id;
  }, [tabs, activeTab]);

  const renderSpecialistPartnerSection = () => {
    if (!hasSpecialistPartner) {
      return null;
    }

    return (
      <View style={styles.partnerSection}>
        <PartnerSection
          recommendedByLabel={t('marketplace.recommendedBy')}
          name={partnerDisplayName}
          avatar={partnerData.avatar}
          specialistLabel={partnerData.description?.trim() || t('marketplace.specialistLabel')}
        />
      </View>
    );
  };

  const renderTabContent = () => {
    if (resolvedTabId == null) {
      return null;
    }
    const active = tabs.find((tab) => tab.id === resolvedTabId);
    const sourceText = (active?.text ?? '').trim();

    if (sourceText.length === 0) {
      return null;
    }

    return (
      <View style={styles.tabContent}>
        <MarkdownText style={styles.descriptionText} text={sourceText} />
      </View>
    );
  };

  if (loading && !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('marketplace.loadingProduct')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <ScreenWithHeader
        navigation={navigation}
        headerProps={{ showBackButton: true, onBackPress: handleBackPress }}
        contentContainerStyle={styles.container}
      >
        <ShareContentUnavailable
          contentType={SHARE_CONTENT_TYPES.AFFILIATE}
          itemId={route.params?.productId}
          screenName='affiliate_product'
          onDiscover={handleDiscover}
          onGoHome={handleGoHome}
        />
      </ScreenWithHeader>
    );
  }

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        showBackButton: true,
        onBackPress: handleBackPress,
      }}
      contentContainerStyle={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <HeroImage
          imageUri={displayImage}
          name={displayTitle}
          badges={heroBadges}
          footer={<ProductHeroFooter isOutOfStock={false} price={product?.price} onCartPress={handleBuyOnAmazon} />}
        />

        {productImages.length > 1 && (
          <View style={styles.paginationContainer}>
            {productImages.map((_, index) => (
              <View key={index} style={[styles.paginationDot, index === 0 && styles.paginationDotActive]} />
            ))}
          </View>
        )}

        <View style={styles.contentSection}>
          {tabs.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Informações</Text>
              <InfoSectionTabsRow
                options={tabs}
                selectedId={resolvedTabId}
                onSelect={(tabId) => setActiveTab(tabId)}
                onSharePress={handleSharePress}
              />
              {renderTabContent()}
            </>
          ) : null}

          {renderSpecialistPartnerSection()}

          <View style={styles.buySection}>
            <SecondaryButton
              label={t('marketplace.buyOnAmazon')}
              onPress={handleBuyOnAmazon}
              icon='shopping-cart'
              iconPosition='right'
              iconSize={24}
              size='large'
              style={styles.buyButton}
              testID='affiliate-buy-on-amazon'
            />
            <Text style={styles.disclaimerText}>
              {t('marketplace.amazonDisclaimer')} <Text style={styles.learnMoreLink}>{t('marketplace.learnMore')}</Text>
            </Text>
          </View>
        </View>

        <RecommendedProductsSection
          excludeProductId={product?.id ?? route.params?.productId}
          providerName={partnerData.name}
          navigation={navigation}
          analyticsScreenName='affiliate_product'
          enabled={!!(product?.id ?? route.params?.productId)}
          style={styles.recommendedSection}
        />
      </ScrollView>
    </ScreenWithHeader>
  );
};

export default AffiliateProductScreen;
