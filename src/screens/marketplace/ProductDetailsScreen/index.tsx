import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { ScrollView as ScrollViewType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import { HeroImage, ScreenWithHeader } from '@/components/ui/layout';
import { ShareContentUnavailable } from '@/components/ui/feedback';
import { Toggle } from '@/components/ui';
import { SecondaryButton } from '@/components/ui/buttons';
import {
  ProductDetailsPriceQuantityRow,
  ProductHeroFooter,
  ProgramParticipationTermsRequiredModal,
} from '@/components/sections/marketplace';
import { RecommendedProductsSection } from '@/components/sections/marketplace/RecommendedProductsSection';
import { Checkbox } from '@/components/ui/inputs';
import { MarkdownText } from '@/components/ui/text/MarkdownText';
import { PartnerSection } from '@/components/sections/advertiser/PartnerSection';
import { ContactButtonsRow } from '@/components/sections/advertiser/ContactButtonsRow';
import { type ButtonCarouselOption } from '@/components/ui/carousel';
import InfoSectionTabsRow from '@/components/ui/carousel/InfoSectionTabsRow';
import { useMenuItems, useProductDetails, useProductPartner } from '@/hooks';
import { useSetFloatingMenu } from '@/contexts/FloatingMenuContext';
import { useTranslation } from '@/hooks/i18n';
import { formatPrice, getProductModeTranslationKey } from '@/utils';
import { useAnalyticsScreen, logButtonClick, logTabSelect, logAddToCart, logError } from '@/analytics';
import { MARKETPLACE_PRODUCT_PLACEHOLDER_IMAGE_URI } from '@/constants';
import type { RootStackParamList } from '@/types/navigation';
import { PRODUCT_CATALOG_TYPE, catalogTypeTranslatedBadgeLabels, isProgramCatalogType } from '@/types/product';
import { navigateToProviderProfile } from '@/utils/navigation/marketplaceNavigation';
import { goBackOrShareHome, navigateToShareHome } from '@/utils/navigation/shareHomeNavigation';
import { navigateToShareDiscover } from '@/utils/navigation/shareDiscoverNavigation';
import { shareContent, shareInputForProduct } from '@/utils/share/shareContent';
import { styles } from './styles';

type ProductDetailsScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'ProductDetails'>;
  route: {
    params: {
      productId: string;
      product?: {
        id: string;
        title: string;
        price: string;
        image: string;
        type?: string;
        tags?: string[];
        description?: string;
        provider?: {
          name: string;
          avatar: string;
        };
      };
    };
  };
};

const PROGRAM_TERMS_SCROLL_OFFSET_PX = 100;

const ProductDetailsScreen: React.FC<ProductDetailsScreenProps> = ({ navigation, route }) => {
  useAnalyticsScreen({ screenName: 'ProductDetails', screenClass: 'ProductDetailsScreen' });
  const { t } = useTranslation();
  const menuItems = useMenuItems(navigation);
  useSetFloatingMenu(menuItems, 'marketplace');
  const [activeProductTab, setActiveProductTab] = useState<'about' | 'agreements'>('about');
  const [activeSwapperTab, setActiveSwapperTab] = useState<'protocol' | 'shop'>('protocol');
  const [quantity, setQuantity] = useState(1);
  const [isQuantityDropdownOpen, setIsQuantityDropdownOpen] = useState(false);
  const [programParticipationTermsAccepted, setProgramParticipationTermsAccepted] = useState(false);
  const [programTermsModalVisible, setProgramTermsModalVisible] = useState(false);

  const scrollViewRef = useRef<ScrollViewType>(null);
  const scrollContentRef = useRef<View>(null);
  const programTermsCheckboxRef = useRef<View>(null);

  const { product, ad, advertiserId, loading, handleAddToCart } = useProductDetails({
    productId: route.params?.productId,
    fallbackProduct: route.params?.product,
    navigation,
  });

  const { partnerData, hasSpecialistPartner, partnerDisplayName } = useProductPartner({
    product,
    ad,
    advertiserId,
    routeProduct: route.params?.product,
    productIdFallback: route.params?.productId,
  });

  const displayData = useMemo(() => {
    if (!product) {
      return null;
    }

    const catalogBadges = catalogTypeTranslatedBadgeLabels(product.type, t);
    const modeTranslationKey = getProductModeTranslationKey(product);
    const modeLabel = modeTranslationKey ? t(`marketplace.productMode.${modeTranslationKey}`).trim() : '';
    const tags = [...catalogBadges, modeLabel].filter(Boolean);

    return {
      title: ad?.product?.name || product.name,
      description: ad?.product?.description || product.description,
      image: product.image || ad?.product?.image,
      price: product.price,
      tags,
      isOutOfStock: product.status === 'out_of_stock' || product.quantity === 0,
    };
  }, [product, ad, t]);

  const isAmazonProduct = useMemo(() => {
    if (!product) return false;
    if (product.type === PRODUCT_CATALOG_TYPE.AMAZON) return true;
    const url = (product.externalUrl ?? '').trim().toLowerCase();
    return url.includes('amazon.');
  }, [product]);

  const productTabContent = useMemo(() => {
    const rawDescription = displayData?.description ?? '';
    const descriptionTrimmed = rawDescription.trim();
    const audience = product?.targetAudience?.trim() ?? '';
    const aboutParts: string[] = [];
    if (descriptionTrimmed.length > 0) aboutParts.push(descriptionTrimmed);
    if (audience.length > 0) aboutParts.push(audience);
    return {
      about: aboutParts.join('\n\n'),
      agreements: product?.technicalSpecifications?.trim() ?? '',
    };
  }, [displayData?.description, product?.targetAudience, product?.technicalSpecifications]);

  const isProgramProduct = isProgramCatalogType(product?.type);

  const productTabOptions: ButtonCarouselOption<'about' | 'agreements'>[] = useMemo(() => {
    const isPhysicalProduct = product?.type === PRODUCT_CATALOG_TYPE.PHYSICAL;
    const secondaryTabLabel = isProgramProduct
      ? 'Acordos'
      : isPhysicalProduct
      ? t('marketplace.composition')
      : 'Acordos';

    const allTabs: ButtonCarouselOption<'about' | 'agreements'>[] = [
      { id: 'about', label: 'Sobre' },
      { id: 'agreements', label: secondaryTabLabel },
    ];

    if (isProgramProduct) {
      const tabs: ButtonCarouselOption<'about' | 'agreements'>[] = [];
      if (productTabContent.about.length > 0) {
        tabs.push({ id: 'about', label: 'Sobre' });
      }
      tabs.push({ id: 'agreements', label: secondaryTabLabel });
      return tabs;
    }

    return allTabs.filter((tab) => productTabContent[tab.id].length > 0);
  }, [productTabContent, isProgramProduct, product?.type, t]);

  const productCategory = product?.type ?? 'Product';
  const heroBadges = useMemo(() => {
    const extra = displayData?.tags ?? [];
    return [...extra].filter(Boolean);
  }, [displayData?.tags, t]);

  const usesPhysicalProductDetailLayout =
    product?.type === PRODUCT_CATALOG_TYPE.PHYSICAL ||
    isProgramCatalogType(product?.type) ||
    product?.type === PRODUCT_CATALOG_TYPE.SERVICE;

  const quantityOptions = useMemo(() => {
    const maxQuantity = Math.max(1, Math.min(product?.quantity ?? 10, 10));
    return Array.from({ length: maxQuantity }, (_, index) => index + 1);
  }, [product?.quantity]);

  const scrollToProgramTermsCheckbox = useCallback(() => {
    const scrollView = scrollViewRef.current;
    const checkboxRow = programTermsCheckboxRef.current;
    const scrollContent = scrollContentRef.current;
    if (!scrollView || !checkboxRow || !scrollContent) {
      return;
    }

    checkboxRow.measureLayout(
      scrollContent,
      (_left, top) => {
        scrollView.scrollTo({ y: Math.max(0, top - PROGRAM_TERMS_SCROLL_OFFSET_PX), animated: true });
      },
      () => undefined,
    );
  }, []);

  const focusProgramParticipationTerms = useCallback(() => {
    setActiveProductTab('agreements');
    logTabSelect({ screen_name: 'product_details', tab_id: 'agreements' });
    requestAnimationFrame(() => {
      setTimeout(() => scrollToProgramTermsCheckbox(), 80);
    });
  }, [scrollToProgramTermsCheckbox]);

  const runAddToCartFlow = () => {
    logAddToCart({
      item_id: product?.id ?? route.params?.productId ?? '',
      item_name: displayData?.title,
      item_category: productCategory,
    });
    void handleAddToCart(isProgramProduct ? 1 : quantity);
  };

  const handleAddToCartPress = () => {
    if (isProgramProduct && !programParticipationTermsAccepted) {
      setProgramTermsModalVisible(true);
      return;
    }
    runAddToCartFlow();
  };

  const handleProgramTermsModalGoToAgreements = () => {
    logButtonClick({
      screen_name: 'product_details',
      button_label: 'program_terms_modal_view_terms',
      action_name: 'open_agreements_tab',
    });
    setProgramTermsModalVisible(false);
    focusProgramParticipationTerms();
  };

  const handleBackPress = () => {
    logButtonClick({
      screen_name: 'product_details',
      button_label: 'back',
      action_name: 'go_back',
    });
    goBackOrShareHome(navigation);
  };

  const handleGoHome = () => {
    navigateToShareHome(navigation);
  };

  const handleDiscover = () => {
    navigateToShareDiscover(navigation, route.params.productId);
  };

  const handleSharePress = async () => {
    if (!product) {
      return;
    }
    const shareInput = shareInputForProduct(product, ad?.id);
    await shareContent(shareInput, { screenName: 'product_details' });
  };

  const handleSeeProviderProfile = () => {
    const providerId = advertiserId ?? partnerData.id ?? '';

    logButtonClick({
      screen_name: 'product_details',
      button_label: 'see_provider_profile',
      action_name: 'navigate_provider',
      item_id: providerId,
    });

    navigateToProviderProfile(navigation, {
      providerId,
    });
  };

  const renderSpecialistPartnerSection = (showProfileButton: boolean, atScreenEnd = false) => {
    if (!hasSpecialistPartner) {
      return null;
    }

    return (
      <View style={[styles.partnerSectionAbovePrice, atScreenEnd && styles.partnerSectionAtScreenEnd]}>
        <PartnerSection
          recommendedByLabel={t('marketplace.recommendedBy')}
          name={partnerDisplayName}
          avatar={partnerData.avatar}
          specialistLabel={partnerData.description?.trim() || t('marketplace.specialistLabel')}
          profileButtonLabel={showProfileButton ? t('marketplace.seePartnerProfile') : undefined}
          onPressProfile={showProfileButton ? handleSeeProviderProfile : undefined}
        />
      </View>
    );
  };

  useEffect(() => {
    const firstOption = quantityOptions[0] ?? 1;
    const lastOption = quantityOptions[quantityOptions.length - 1] ?? 1;
    if (quantity < firstOption || quantity > lastOption) {
      setQuantity(firstOption);
    }
  }, [quantity, quantityOptions]);

  useEffect(() => {
    if (isProgramProduct) {
      setIsQuantityDropdownOpen(false);
    }
  }, [isProgramProduct]);

  useEffect(() => {
    setProgramParticipationTermsAccepted(false);
    setProgramTermsModalVisible(false);
  }, [product?.id]);

  useEffect(() => {
    if (productTabOptions.length === 0) {
      return;
    }

    if (!productTabOptions.some((tab) => tab.id === activeProductTab)) {
      setActiveProductTab(productTabOptions[0].id);
    }
  }, [activeProductTab, productTabOptions]);

  const backgroundImage = useMemo(() => {
    if (displayData?.image) return displayData.image;
    if (route.params?.product?.image) return route.params.product.image;
    return MARKETPLACE_PRODUCT_PLACEHOLDER_IMAGE_URI;
  }, [displayData?.image, route.params?.product?.image]);

  const productImages = useMemo(() => {
    const images: string[] = [];
    if (backgroundImage && backgroundImage !== MARKETPLACE_PRODUCT_PLACEHOLDER_IMAGE_URI) {
      images.push(backgroundImage);
    }
    return images;
  }, [backgroundImage]);

  if (loading && (!product || !displayData)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#2196F3' />
          <Text style={styles.loadingText}>{t('marketplace.loadingProduct')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product || !displayData) {
    logError({ screen_name: 'product_details', error_type: 'product_not_found' });
    return (
      <ScreenWithHeader
        navigation={navigation}
        headerProps={{ showBackButton: true, onBackPress: handleBackPress }}
        contentContainerStyle={styles.container}
      >
        <ShareContentUnavailable
          itemId={route.params.productId}
          screenName='product_details'
          onDiscover={handleDiscover}
          onGoHome={handleGoHome}
        />
      </ScreenWithHeader>
    );
  }

  return (
    <>
      <ScreenWithHeader
        navigation={navigation}
        headerProps={{
          showBackButton: true,
          onBackPress: handleBackPress,
        }}
        contentContainerStyle={styles.container}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View ref={scrollContentRef} collapsable={false}>
            {/* Hero Section with Image */}
            <HeroImage
              imageUri={backgroundImage}
              name={displayData.title}
              badges={heroBadges}
              footer={
                <ProductHeroFooter
                  isOutOfStock={displayData.isOutOfStock}
                  price={displayData.price}
                  priceSuffix={isProgramProduct ? t('marketplace.programPriceMonthly') : undefined}
                  onCartPress={handleAddToCartPress}
                />
              }
            />

            {/* Pagination Dots - Mostrar apenas se houver mais de uma imagem */}
            {productImages && productImages.length > 1 && (
              <View style={styles.paginationContainer}>
                {productImages.map((_, index) => (
                  <View key={index} style={[styles.paginationDot, index === 0 && styles.paginationDotActive]} />
                ))}
              </View>
            )}
            <View style={styles.content}>
              <ContactButtonsRow
                contacts={product.contacts}
                providerId={advertiserId}
                testID='product-details-contacts'
                containerStyle={styles.contactButtonsRow}
              />
              {usesPhysicalProductDetailLayout ? (
                <>
                  <View style={styles.contentCard}>
                    {isProgramProduct ? renderSpecialistPartnerSection(true) : null}
                    {productTabOptions.length > 0 && (
                      <View style={styles.tabsContainerInCard}>
                        <Text style={styles.sectionTitle}>Informações</Text>
                        <InfoSectionTabsRow
                          options={productTabOptions}
                          selectedId={activeProductTab}
                          onSelect={(tabId) => {
                            logTabSelect({ screen_name: 'product_details', tab_id: tabId });
                            setActiveProductTab(tabId);
                          }}
                          onSharePress={handleSharePress}
                        />
                      </View>
                    )}
                    {renderProductTabContent()}
                    {!isProgramProduct && displayData.price != null ? (
                      <ProductDetailsPriceQuantityRow
                        formattedPrice={formatPrice(displayData.price * quantity)}
                        quantity={quantity}
                        quantityOptions={quantityOptions}
                        isQuantityDropdownOpen={isQuantityDropdownOpen}
                        onToggleQuantityDropdown={() => setIsQuantityDropdownOpen((open) => !open)}
                        onSelectQuantity={(value) => {
                          setQuantity(value);
                          setIsQuantityDropdownOpen(false);
                        }}
                        paymentLinkLabel={t('marketplace.paymentOptionsText')}
                        onPaymentLinkPress={() => undefined}
                      />
                    ) : null}
                    {displayData.price != null && !displayData.isOutOfStock ? (
                      <SecondaryButton
                        label={t('marketplace.addToCart')}
                        onPress={handleAddToCartPress}
                        style={styles.addToCartSecondaryBelowPrice}
                        size='large'
                        testID='product-details-add-to-cart'
                      />
                    ) : null}
                  </View>
                </>
              ) : (
                <>
                  {(displayData.description ?? '').trim().length > 0 ? (
                    <MarkdownText style={styles.productDescription} text={(displayData.description ?? '').trim()} />
                  ) : null}
                  {renderInfoSection()}
                  {displayData.price != null && !displayData.isOutOfStock ? (
                    <View style={styles.addToCartSecondaryWrapper}>
                      <SecondaryButton
                        label={t('marketplace.addToCart')}
                        onPress={handleAddToCartPress}
                        style={styles.addToCartSecondary}
                        size='large'
                        testID='product-details-add-to-cart'
                      />
                    </View>
                  ) : null}
                </>
              )}
              {!isProgramProduct ? renderSpecialistPartnerSection(false, true) : null}
              <RecommendedProductsSection
                excludeProductId={product?.id}
                providerName={partnerData.name}
                navigation={navigation}
                analyticsScreenName='product_details'
                enabled={!!product?.id}
              />
            </View>
          </View>
        </ScrollView>
      </ScreenWithHeader>
      <ProgramParticipationTermsRequiredModal
        visible={programTermsModalVisible}
        title={t('marketplace.programTermsRequiredModalTitle')}
        body={t('marketplace.programTermsRequiredModalBody')}
        ctaLabel={t('marketplace.programTermsRequiredModalCta')}
        onClose={() => setProgramTermsModalVisible(false)}
        onPressViewTerms={handleProgramTermsModalGoToAgreements}
      />
    </>
  );

  function renderInfoSection() {
    return <View style={styles.tabsContainer}>{renderAboutContent()}</View>;
  }

  function renderAboutContent() {
    return (
      <View style={styles.aboutContent}>
        {product.technicalSpecifications && (
          <MarkdownText style={styles.productDescription} text={product.technicalSpecifications} />
        )}
      </View>
    );
  }

  function renderProductTabContent() {
    const fallbackTabId = productTabOptions[0]?.id ?? 'about';
    const resolvedTab = productTabOptions.some((tab) => tab.id === activeProductTab) ? activeProductTab : fallbackTabId;

    if (isProgramProduct && resolvedTab === 'agreements') {
      const agreementsText = productTabContent.agreements.trim();

      return (
        <View style={styles.tabContent}>
          {agreementsText.length > 0 ? <MarkdownText style={styles.descriptionText} text={agreementsText} /> : null}
          <View
            ref={programTermsCheckboxRef}
            style={styles.programAgreementsCheckboxRow}
            collapsable={false}
            testID='program-participation-terms-checkbox-row'
          >
            <Checkbox
              label={t('marketplace.programParticipationTermsCheckbox')}
              checked={programParticipationTermsAccepted}
              onPress={() => setProgramParticipationTermsAccepted((current) => !current)}
            />
          </View>
        </View>
      );
    }

    const tabText = (productTabContent[resolvedTab] || productTabContent[fallbackTabId] || '').trim();

    if (tabText.length === 0) {
      return (
        <View style={styles.tabContent}>
          <Text style={styles.productDescription}>{t('marketplace.noDescriptionAvailable')}</Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <MarkdownText style={styles.descriptionText} text={tabText} />
      </View>
    );
  }
};

export default ProductDetailsScreen;
