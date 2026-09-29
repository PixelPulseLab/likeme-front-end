import type { Event } from '@/types/event';
import { PRODUCT_CATALOG_TYPE, catalogTypeTranslatedBadgeLabels } from '@/types/product';
import { PROGRAM_TYPE } from '@/types/product/programType';
import {
  ACQUISITION_CATEGORY,
  ACQUISITION_FILTER,
  ACQUISITION_SOURCE,
  DATE_SORT,
  type AcquisitionCardContent,
  type AcquisitionCategory,
  type AcquisitionEventCard,
  type AcquisitionEventCommunity,
  type AcquisitionFilter,
  type AcquisitionListView,
  type AcquisitionSource,
  type DateSort,
} from '@/types/subscription/acquisitionList';
import type { SubscriptionListItem } from '@/types/subscription/subscription';
import { subscriptionHasProtocolContentAccess } from '@/utils/subscription/subscriptionManageDisplay';

type AcquisitionLabelTranslate = (key: string, options?: { defaultValue?: string }) => string;

const HIDDEN_EVENT_STATUS = new Set<Event['status']>(['draft', 'unknown', 'error']);

type MemberProgramSource = {
  communityId: string;
  title: string;
  image: string;
  description?: string | null;
  badges: string[];
};

export function excludedAcquisitionBadgeLabels(translate: AcquisitionLabelTranslate): Set<string> {
  const labels = [
    translate('profile.acquisitionList.statusInactive', { defaultValue: 'Inativo' }),
    translate('profile.acquisitionList.statusCanceled', { defaultValue: 'Cancelado' }),
    translate('profile.acquisitionList.statusCanceling', { defaultValue: 'Em cancelamento' }),
    translate('profile.acquisitionList.statusUnpaid', { defaultValue: 'Inadimplente' }),
    translate('profile.acquisitionList.statusPastDue', { defaultValue: 'Em atraso' }),
    ...catalogTypeTranslatedBadgeLabels(PRODUCT_CATALOG_TYPE.PROGRAM, translate),
    ...catalogTypeTranslatedBadgeLabels(PRODUCT_CATALOG_TYPE.SERVICE, translate),
  ];
  return new Set(labels.map((label) => label.trim().toLowerCase()).filter(Boolean));
}

export function categoryLabelFromBadges(badges: string[], excluded: Set<string>): string | null {
  for (const badge of badges) {
    const label = badge.trim();
    if (!label || excluded.has(label.toLowerCase())) {
      continue;
    }
    return label;
  }
  return null;
}

function matchesAcquisitionFilter(entry: { inProgress: boolean; isTask: boolean }, filter: AcquisitionFilter): boolean {
  if (filter === ACQUISITION_FILTER.ALL) {
    return true;
  }
  if (filter === ACQUISITION_FILTER.IN_PROGRESS) {
    return entry.inProgress;
  }
  return entry.isTask;
}

function compareSortAt(left: number, right: number, dateSort: DateSort): number {
  const missing = dateSort === DATE_SORT.NEWEST ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  const leftStamp = left > 0 ? left : missing;
  const rightStamp = right > 0 ? right : missing;
  if (dateSort === DATE_SORT.NEWEST) {
    return rightStamp - leftStamp;
  }
  return leftStamp - rightStamp;
}

export function filterAndSortAcquisition<T extends { inProgress: boolean; isTask: boolean; sortAt: number }>(
  entries: T[],
  filter: AcquisitionFilter,
  dateSort: DateSort,
): T[] {
  return entries
    .filter((entry) => matchesAcquisitionFilter(entry, filter))
    .sort((left, right) => compareSortAt(left.sortAt, right.sortAt, dateSort));
}

function acquiredAtSortValue(acquiredAt: string): number {
  return new Date(acquiredAt).getTime() || 0;
}

type ListedCardSource = {
  id: string;
  title: string;
  image: string;
  description?: string | null;
  badges: string[];
  testID?: string;
};

function mapListedCard(
  source: ListedCardSource,
  excludedBadgeLabels: Set<string>,
  participation: Pick<AcquisitionCardContent, 'inactive' | 'inProgress' | 'isTask' | 'sortAt'>,
  cardSource: AcquisitionSource,
): AcquisitionCardContent {
  return {
    id: source.id,
    source: cardSource,
    title: source.title,
    image: source.image,
    description: source.description,
    categoryLabel: categoryLabelFromBadges(source.badges, excludedBadgeLabels),
    testID: source.testID,
    ...participation,
  };
}

export function mapSubscribedProgramToCard(
  item: SubscriptionListItem,
  excludedBadgeLabels: Set<string>,
): AcquisitionCardContent {
  const inactive = Boolean(item.desaturated);
  const inProgress = !inactive && subscriptionHasProtocolContentAccess(item);
  const isCourse = item.programType !== PROGRAM_TYPE.COMMUNITY;
  // Tarefas são aulas do curso ainda acessível. Serviço e comunidade ficam em Em andamento.
  const isTask = inProgress && isCourse;

  return mapListedCard(
    item,
    excludedBadgeLabels,
    {
      inactive,
      inProgress,
      isTask,
      sortAt: acquiredAtSortValue(item.acquiredAt),
    },
    ACQUISITION_SOURCE.SUBSCRIPTION,
  );
}

export function mapMemberProgramToCard(
  item: MemberProgramSource,
  excludedBadgeLabels: Set<string>,
): AcquisitionCardContent {
  return mapListedCard(
    { ...item, id: item.communityId },
    excludedBadgeLabels,
    { inactive: false, inProgress: true, isTask: false, sortAt: 0 },
    ACQUISITION_SOURCE.MEMBERSHIP,
  );
}

export function mapServiceToCard(item: SubscriptionListItem, excludedBadgeLabels: Set<string>): AcquisitionCardContent {
  return mapListedCard(
    item,
    excludedBadgeLabels,
    {
      inactive: false,
      inProgress: true,
      isTask: false,
      sortAt: acquiredAtSortValue(item.acquiredAt),
    },
    ACQUISITION_SOURCE.SERVICE,
  );
}

function formatEventClock(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h${String(minutes).padStart(2, '0')}`;
}

function formatEventWhen(startsAt: string | undefined, now: Date): string {
  if (!startsAt) {
    return '';
  }
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const clock = formatEventClock(date);
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return `Hoje | ${clock}`;
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
  return `${day} ${month} ${date.getFullYear()} | ${clock}`;
}

function eventSortAt(startsAt: string | undefined): number {
  if (!startsAt) {
    return 0;
  }
  const time = new Date(startsAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function mapCommunityEventToCard(
  event: Event,
  community: AcquisitionEventCommunity,
  now: Date,
): AcquisitionEventCard | null {
  if (HIDDEN_EVENT_STATUS.has(event.status)) {
    return null;
  }
  const startsAt = event.startsAt;
  const inProgress = event.status === 'live' || event.status === 'scheduled';
  const startsInFuture = eventSortAt(startsAt) > now.getTime();
  const isTask = event.status === 'scheduled' && startsInFuture;
  const isVirtual = event.provider === 'zoom' || Boolean(event.externalUrl);

  return {
    id: `${community.communityId}:${event.id}`,
    communityId: community.communityId,
    title: event.title,
    description: event.description,
    image: community.image,
    categoryLabel: community.categoryLabel,
    whenLabel: formatEventWhen(startsAt, now),
    sortAt: eventSortAt(startsAt),
    isVirtual,
    inProgress,
    isTask,
  };
}

type AcquisitionCommunitySource = {
  communityId?: string | null;
  image: string;
  badges: string[];
};

export function acquisitionEventCommunities(
  subscriptions: AcquisitionCommunitySource[],
  memberships: AcquisitionCommunitySource[],
  excludedBadgeLabels: Set<string>,
): AcquisitionEventCommunity[] {
  const byId = new Map<string, AcquisitionEventCommunity>();
  const remember = (item: AcquisitionCommunitySource) => {
    const communityId = item.communityId?.trim();
    if (!communityId || byId.has(communityId)) {
      return;
    }
    byId.set(communityId, {
      communityId,
      image: item.image,
      categoryLabel: categoryLabelFromBadges(item.badges, excludedBadgeLabels),
    });
  };

  for (const item of subscriptions) {
    remember(item);
  }
  for (const item of memberships) {
    remember(item);
  }
  return Array.from(byId.values());
}

type AcquisitionListViewInput = {
  category: AcquisitionCategory;
  isFullyEmpty: boolean;
  visiblePrograms: AcquisitionCardContent[];
  visibleServices: AcquisitionCardContent[];
  visibleEvents: AcquisitionEventCard[];
  programCount: number;
  serviceCount: number;
  eventCount: number;
  emptyFilterMessage: string;
  emptyCategoryMessage: string;
  inactiveLabel: string;
};

export function acquisitionListView(input: AcquisitionListViewInput): AcquisitionListView {
  const isPrograms = input.category === ACQUISITION_CATEGORY.PROGRAMS;
  const isServices = input.category === ACQUISITION_CATEGORY.SERVICES;
  let visibleCount = input.visibleEvents.length;
  let sourceCount = input.eventCount;
  if (isPrograms) {
    visibleCount = input.visiblePrograms.length;
    sourceCount = input.programCount;
  } else if (isServices) {
    visibleCount = input.visibleServices.length;
    sourceCount = input.serviceCount;
  }

  if (input.isFullyEmpty) {
    return { view: 'explore' };
  }

  const categoryIsEmpty = visibleCount === 0;
  if (categoryIsEmpty) {
    const hasSourceItems = sourceCount > 0;
    const message = hasSourceItems ? input.emptyFilterMessage : input.emptyCategoryMessage;
    return { view: 'empty', message };
  }

  if (isPrograms) {
    return { view: 'programs', cards: input.visiblePrograms, inactiveLabel: input.inactiveLabel };
  }
  if (isServices) {
    return { view: 'services', cards: input.visibleServices, inactiveLabel: input.inactiveLabel };
  }

  const liveEvents = input.visibleEvents.filter((event) => event.isVirtual);
  const placeEvents = input.visibleEvents.filter((event) => !event.isVirtual);
  return { view: 'events', liveEvents, placeEvents };
}
