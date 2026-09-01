export const ADVERTISER_STATUS = {
  ACTIVE: 'active',
} as const;

export const ADVERTISER_TYPE = {
  PERSON: 'person',
  ORGANIZATION: 'organization',
} as const;

export type AdvertiserType = (typeof ADVERTISER_TYPE)[keyof typeof ADVERTISER_TYPE];
