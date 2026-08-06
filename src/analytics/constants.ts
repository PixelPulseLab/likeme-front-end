/**
 * Constantes para Google Analytics 4 (GA4).
 * Nomes em snake_case; parâmetros consistentes; sem PII.
 */

// ========== Eventos recomendados GA4 (usar quando possível) ==========
export const GA4_EVENTS = {
  /** Visualização de tela (recomendado) */
  SCREEN_VIEW: 'screen_view',
  /** Clique em elemento (recomendado) */
  SELECT_CONTENT: 'select_content',
  /** Início de checkout */
  BEGIN_CHECKOUT: 'begin_checkout',
  /** Adicionar ao carrinho */
  ADD_TO_CART: 'add_to_cart',
  /** Remover do carrinho */
  REMOVE_FROM_CART: 'remove_from_cart',
  /** Login */
  LOGIN: 'login',
  /** Cadastro */
  SIGN_UP: 'sign_up',
  /** Compra concluída */
  PURCHASE: 'purchase',
  /** Busca */
  SEARCH: 'search',
  /** Compartilhar */
  SHARE: 'share',
  /** Erro visível ao usuário */
  APP_EXCEPTION: 'app_exception',
  /** Tutorial/onboarding início */
  TUTORIAL_BEGIN: 'tutorial_begin',
  /** Tutorial/onboarding conclusão */
  TUTORIAL_COMPLETE: 'tutorial_complete',
} as const;

// ========== Eventos customizados (snake_case) ==========
export const CUSTOM_EVENTS = {
  /** Botão clicado */
  BUTTON_CLICK: 'button_click',
  /** Navegação (voltar, próximo, etc.) */
  NAVIGATION: 'navigation',
  /** Formulário submetido */
  FORM_SUBMIT: 'form_submit',
  /** Formulário com erro de validação */
  FORM_VALIDATION_ERROR: 'form_validation_error',
  /** Aba/tab selecionada */
  TAB_SELECT: 'tab_select',
  /** Item de lista selecionado */
  ITEM_SELECT: 'item_select',
  /** Estado vazio exibido */
  EMPTY_STATE_VIEWED: 'empty_state_viewed',
  /** Estado de loading exibido */
  LOADING_STATE_VIEWED: 'loading_state_viewed',
  /** Sucesso em ação (ex: cadastro, compra) */
  ACTION_SUCCESS: 'action_success',
  /** Falha em ação */
  ACTION_FAILURE: 'action_failure',
  /** Gestos: long press, swipe */
  GESTURE: 'gesture',
  /** Favorito adicionado/removido */
  FAVORITE_TOGGLE: 'favorite_toggle',
  /** Perfil de provedor visualizado */
  PROVIDER_PROFILE_VIEW: 'provider_profile_view',
  /** Produto relacionado clicado */
  RELATED_PRODUCT_CLICK: 'related_product_click',
  /** Plano clicado */
  PLAN_CLICK: 'plan_click',
  /** Objetivos pessoais submetidos (onboarding) */
  OBJECTIVES_SUBMITTED: 'objectives_submitted',
} as const;

export const ANALYTICS_EVENTS = { ...GA4_EVENTS, ...CUSTOM_EVENTS } as const;
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

// ========== Parâmetros (GA4 + custom) ==========
export const ANALYTICS_PARAMS = {
  SCREEN_NAME: 'screen_name',
  SCREEN_CLASS: 'screen_class',
  ITEM_ID: 'item_id',
  ITEM_NAME: 'item_name',
  CONTENT_TYPE: 'content_type',
  CONTENT_GROUP: 'content_group',
  /** Nome da ação (ex: "add_to_cart", "go_back") */
  ACTION_NAME: 'action_name',
  /** Label do botão/elemento */
  BUTTON_LABEL: 'button_label',
  /** Destino da navegação */
  DESTINATION_SCREEN: 'destination_screen',
  /** Origem (tela atual) */
  SOURCE_SCREEN: 'source_screen',
  /** Tipo de erro (não incluir mensagem com PII) */
  ERROR_TYPE: 'error_type',
  /** Sucesso true/false */
  SUCCESS: 'success',
  /** Categoria do item (ex: "product", "post") */
  ITEM_CATEGORY: 'item_category',
  /** Valor numérico quando fizer sentido */
  VALUE: 'value',
  /** Tab/aba selecionada */
  TAB_ID: 'tab_id',
  /** ID do formulário ou etapa */
  FORM_NAME: 'form_name',
  /** Tipo de gesto */
  GESTURE_TYPE: 'gesture_type',
} as const;

export type AnalyticsParamName = (typeof ANALYTICS_PARAMS)[keyof typeof ANALYTICS_PARAMS];

// ========== Nomes de telas (mapeamento route -> screen_name GA4) ==========
export const SCREEN_NAMES = {
  Loading: 'loading',
  Unauthenticated: 'unauthenticated',
  Authenticated: 'authenticated',
  Welcome: 'welcome',
  AppPresentation: 'app_presentation',
  Register: 'register',
  Anamnesis: 'anamnesis_start',
  AnamnesisHome: 'anamnesis_home',
  AnamnesisBody: 'anamnesis_body',
  AnamnesisMind: 'anamnesis_mind',
  AnamnesisHabits: 'anamnesis_habits',
  AnamnesisCompletion: 'anamnesis_completion',
  InterestCategories: 'interest_categories',
  InterestCategoriesEdit: 'interest_categories_edit',
  SelfAwarenessIntro: 'self_awareness_intro',
  Error: 'error',
  AppLoading: 'app_loading',
  Community: 'community',
  CommunityList: 'community_list',
  PostDetails: 'post_details',
  ChatList: 'chat_list',
  Activities: 'activities',
  Marketplace: 'marketplace',
  ProductDetails: 'product_details',
  AffiliateProduct: 'affiliate_product',
  Cart: 'cart',
  Checkout: 'checkout',
  ProviderProfile: 'provider_profile',
  ProductRecommenders: 'product_recommenders',
  SubscriptionList: 'subscription_list',
  Profile: 'profile',
  Home: 'home',
  Summary: 'summary',
  AvatarProgress: 'avatar_progress',
  MarkerDetails: 'marker_details',
} as const;

export type ScreenRouteName = keyof typeof SCREEN_NAMES;

/** Retorna screen_name GA4 a partir do nome da rota */
export function getScreenName(routeName: string): string {
  return (SCREEN_NAMES as Record<string, string>)[routeName] ?? routeName;
}
