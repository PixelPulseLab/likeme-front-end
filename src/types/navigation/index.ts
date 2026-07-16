import type { NavigatorScreenParams } from '@react-navigation/native';
import type { CategoryName } from '@/types';
import type { MarketplaceSolutionTab, SolutionFilterId } from '@/types/solution';

export type MarketplaceRouteParams = {
  initialSearch?: string;
  initialCategoryId?: string;
  initialCategoryName?: CategoryName | null;
  initialSolutionTab?: MarketplaceSolutionTab;
  initialSolutionIds?: SolutionFilterId[];
  openFilterModal?: boolean;
  focusSearch?: boolean;
};

export type CommunityStackParamList = {
  CommunityList: { openFeedFromMenu?: true; focusCommunityId?: string } | undefined;
  PostDetail: { post: import('@/types').Post } | { postId: string };
};

export type ProtocolDetailProtocol = {
  id: string;
  name: string;
  image?: string;
  badges?: string[];
  communityId?: string;
  rating?: number;
  shortDescription?: string;
  description?: string;
  productId?: string;
  /** Mesmo conteúdo da aba Acordos em ProductDetails (`Product.technicalSpecifications`). */
  agreements?: string;
  providerName?: string;
  nextSessionDate?: string;
  modules?: import('@/types/program').ProgramModule[];
};

type RootStackParamListCore = {
  ForcedUpdate: { storeUrl: string; message?: string };
  Unauthenticated: { skipAutoLogin?: boolean } | undefined;
  Authenticated: undefined;
  Welcome: undefined;
  AppPresentation: { userName?: string };
  Register: { userName?: string };
  Plans: { userName?: string };
  InterestCategories: { firstName?: string };
  Anamnesis: undefined;
  AnamnesisHome: undefined;
  AnamnesisBody: undefined;
  AnamnesisMind: undefined;
  AnamnesisHabits: { title: string; keyPrefix: string };
  Community: NavigatorScreenParams<CommunityStackParamList>;
  Chat: undefined;
  Activities:
    | {
        initialTab?: 'actives' | 'history';
        initialFilter?: 'all' | 'activities' | 'appointments' | 'orders';
        focusActivityId?: string;
      }
    | undefined;
  OrderDetail: { orderId: string };
  Marketplace: MarketplaceRouteParams | undefined;
  ProductDetails: {
    productId: string;
    product?: {
      id: string;
      title: string;
      price: string;
      image: string;
      category?: string;
      tags?: string[];
      description?: string;
      provider?: {
        name: string;
        avatar: string;
      };
      rating?: number;
    };
  };
  AffiliateProduct: {
    productId: string;
    adId?: string;
    product?: {
      id: string;
      title: string;
      price: string;
      image: string;
      category?: string;
      description?: string;
      externalUrl?: string;
      provider?: {
        name: string;
        avatar: string;
        description?: string;
      };
    };
  };
  Profile: undefined;
  UserProfileHome: undefined;
  PersonalDataEdit: undefined;
  InterestCategoriesEdit: undefined;
  SettingsAndSecurity: undefined;
  DeleteAccount: undefined;
  SubscriptionList: undefined;
  ProtocolDetail: { protocol: ProtocolDetailProtocol } | { productId: string };
  PrivacyPolicies: { userName?: string };
  Home: undefined;
  Summary: undefined;
  AvatarProgress: undefined;
  MarkerDetails: {
    marker: {
      id: string;
      name: string;
      percentage: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    };
  };
  Cart: undefined;
  Checkout: { zipCode?: string } | undefined;
  ProviderProfile: {
    providerId: string;
    provider?: {
      name: string;
      avatar?: string;
      title?: string;
      description?: string;
      rating?: number;
      specialties?: string[];
    };
  };
};

export type AppLoadingNavigateTarget =
  | { name: 'ProductDetails'; params: RootStackParamListCore['ProductDetails'] }
  | { name: 'AffiliateProduct'; params: RootStackParamListCore['AffiliateProduct'] }
  | { name: 'Community'; params?: RootStackParamListCore['Community'] }
  | { name: 'Marketplace'; params?: MarketplaceRouteParams }
  | { name: 'ProviderProfile'; params: RootStackParamListCore['ProviderProfile'] };

export type RootStackParamList = RootStackParamListCore & {
  AppLoading: {
    target: AppLoadingNavigateTarget;
    loadingMessage?: string;
  };
};

export type ChatStackParamList = {
  ChatList: { chat?: import('@/types').ProviderChat };
  ChatConversation: {
    channelId?: string;
    channelName: string;
    channelAvatar?: string;
    channelDescription?: string;
    /** Modo “nova conversa”: ID do parceiro (advertiser). Ao enviar, cria o canal e envia a mensagem. */
    targetAdvertiserId?: string;
    initialMessage?: string;
  };
  ChatDetails: {
    channelId: string;
    channelName: string;
    channelAvatar?: string;
  };
};

export interface ScreenProps<T extends keyof RootStackParamList> {
  navigation: any;
  route: {
    params: RootStackParamList[T];
  };
}
