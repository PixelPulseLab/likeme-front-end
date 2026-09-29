export const ACQUISITION_CATEGORY = {
  PROGRAMS: 'programs',
  SERVICES: 'services',
  EVENTS: 'events',
} as const;

export const ACQUISITION_FILTER = {
  ALL: 'all',
  IN_PROGRESS: 'inProgress',
  TASKS: 'tasks',
} as const;

export const DATE_SORT = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
} as const;

export type AcquisitionCategory = (typeof ACQUISITION_CATEGORY)[keyof typeof ACQUISITION_CATEGORY];
export type AcquisitionFilter = (typeof ACQUISITION_FILTER)[keyof typeof ACQUISITION_FILTER];
export type DateSort = (typeof DATE_SORT)[keyof typeof DATE_SORT];

export const ACQUISITION_SOURCE = {
  SUBSCRIPTION: 'subscription',
  MEMBERSHIP: 'membership',
  SERVICE: 'service',
} as const;

export type AcquisitionSource = (typeof ACQUISITION_SOURCE)[keyof typeof ACQUISITION_SOURCE];

export type AcquisitionCardContent = {
  id: string;
  source: AcquisitionSource;
  title: string;
  image: string;
  description?: string | null;
  categoryLabel: string | null;
  inactive: boolean;
  inProgress: boolean;
  isTask: boolean;
  sortAt: number;
  testID?: string;
};

export type AcquisitionEventCard = {
  id: string;
  communityId: string;
  title: string;
  description?: string;
  image: string;
  categoryLabel: string | null;
  whenLabel: string;
  sortAt: number;
  isVirtual: boolean;
  inProgress: boolean;
  isTask: boolean;
};

export type AcquisitionEventCommunity = {
  communityId: string;
  image: string;
  categoryLabel: string | null;
};

export type AcquisitionListView =
  | { view: 'explore' }
  | { view: 'empty'; message: string }
  | { view: 'programs'; cards: AcquisitionCardContent[]; inactiveLabel: string }
  | { view: 'services'; cards: AcquisitionCardContent[]; inactiveLabel: string }
  | {
      view: 'events';
      liveEvents: AcquisitionEventCard[];
      placeEvents: AcquisitionEventCard[];
    };
