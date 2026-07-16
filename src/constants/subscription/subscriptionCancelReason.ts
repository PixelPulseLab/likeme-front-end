export const SUBSCRIPTION_CANCEL_REASONS = {
  NOT_USING_ENOUGH: 'not_using_enough',
  PRICE_TOO_HIGH: 'price_too_high',
  LEARNED_ENOUGH: 'learned_enough',
  WILL_RESUME_LATER: 'will_resume_later',
  OTHER: 'other',
} as const;

export type SubscriptionCancelReason = (typeof SUBSCRIPTION_CANCEL_REASONS)[keyof typeof SUBSCRIPTION_CANCEL_REASONS];

export const SUBSCRIPTION_CANCEL_REASON_OPTIONS: ReadonlyArray<{
  id: SubscriptionCancelReason;
  labelKey: string;
  labelDefault: string;
}> = [
  {
    id: SUBSCRIPTION_CANCEL_REASONS.NOT_USING_ENOUGH,
    labelKey: 'profile.subscriptionCancel.reasonNotUsingEnough',
    labelDefault: 'Não estou usando o suficiente',
  },
  {
    id: SUBSCRIPTION_CANCEL_REASONS.PRICE_TOO_HIGH,
    labelKey: 'profile.subscriptionCancel.reasonPriceTooHigh',
    labelDefault: 'O valor está alto para mim',
  },
  {
    id: SUBSCRIPTION_CANCEL_REASONS.LEARNED_ENOUGH,
    labelKey: 'profile.subscriptionCancel.reasonLearnedEnough',
    labelDefault: 'Já aprendi o que precisava',
  },
  {
    id: SUBSCRIPTION_CANCEL_REASONS.WILL_RESUME_LATER,
    labelKey: 'profile.subscriptionCancel.reasonWillResumeLater',
    labelDefault: 'Vou retomar em outro momento',
  },
  {
    id: SUBSCRIPTION_CANCEL_REASONS.OTHER,
    labelKey: 'profile.subscriptionCancel.reasonOther',
    labelDefault: 'Outro motivo',
  },
];

/** Motivo enviado à API quando o usuário não seleciona opção (pesquisa opcional no UI). */
export const SUBSCRIPTION_CANCEL_REASON_UNSPECIFIED = 'Não informado';

export const DEFAULT_SUBSCRIPTION_BENEFIT_KEYS = [
  {
    key: 'profile.subscriptionManage.benefitFullProtocol',
    defaultValue: 'Acesso ao protocolo completo',
  },
  {
    key: 'profile.subscriptionManage.benefitLiveSessions',
    defaultValue: 'Sessões ao vivo semanais',
  },
  {
    key: 'profile.subscriptionManage.benefitExclusiveCommunity',
    defaultValue: 'Comunidade exclusiva',
  },
  {
    key: 'profile.subscriptionManage.benefitSupportMaterial',
    defaultValue: 'Material de apoio',
  },
] as const;
