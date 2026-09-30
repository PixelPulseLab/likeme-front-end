import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { StackScreenProps } from '@react-navigation/stack';
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
  type DateSort,
} from '@/types/subscription/acquisitionList';
import { useTranslation } from '@/hooks/i18n';
import {
  useMemberProtocolCommunities,
  type MemberProtocolCardItem,
} from '@/hooks/community/useMemberProtocolCommunities';
import { useSubscriptionList } from '@/hooks/subscription/useSubscriptionList';
import { eventService } from '@/services';
import type { RootStackParamList } from '@/types/navigation';
import type { SubscriptionListItem } from '@/types/subscription/subscription';
import { logger } from '@/utils/logger';
import { navigateToCommunity } from '@/utils/navigation/communityNavigation';
import { navigateToSubscribedProgram } from '@/utils/navigation/productNavigation';
import {
  acquisitionEventCommunities,
  acquisitionListView,
  excludedAcquisitionBadgeLabels,
  filterAndSortAcquisition,
  mapCommunityEventToCard,
  mapMemberProgramToCard,
  mapServiceToCard,
  mapSubscribedProgramToCard,
} from '@/utils/mappers/acquisitionListMapper';

const EVENT_COMMUNITY_FETCH_LIMIT = 8;

async function listEventsForCommunities(
  communities: AcquisitionEventCommunity[],
  now: Date,
): Promise<AcquisitionEventCard[]> {
  const slices = await Promise.all(
    communities.slice(0, EVENT_COMMUNITY_FETCH_LIMIT).map(async (community) => {
      const response = await eventService.listEvents(community.communityId);
      const isSuccess = response.success === true || response.status === 'success';
      if (!isSuccess) {
        return [];
      }
      return (response.data?.events ?? [])
        .map((event) => mapCommunityEventToCard(event, community, now))
        .filter((event): event is AcquisitionEventCard => event != null);
    }),
  );
  const byId = new Map<string, AcquisitionEventCard>();
  for (const event of slices.flat()) {
    if (!byId.has(event.id)) {
      byId.set(event.id, event);
    }
  }
  return Array.from(byId.values());
}

type SubscriptionListNavigation = StackScreenProps<RootStackParamList, 'SubscriptionList'>['navigation'];

export function useAcquisitionList(navigation: SubscriptionListNavigation) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<AcquisitionCategory>(ACQUISITION_CATEGORY.PROGRAMS);
  const [filter, setFilter] = useState<AcquisitionFilter>(ACQUISITION_FILTER.ALL);
  const [dateSort, setDateSort] = useState<DateSort>(DATE_SORT.NEWEST);
  const [events, setEvents] = useState<AcquisitionEventCard[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsSettled, setEventsSettled] = useState(false);

  const {
    loading: subscriptionLoading,
    protocols: subscriptionProtocols,
    services,
    hasContent: hasSubscriptionContent,
    reload: reloadSubscriptions,
  } = useSubscriptionList();

  const {
    loading: communityLoading,
    protocols: communityProtocols,
    hasContent: hasCommunityContent,
    reload: reloadMemberProtocols,
  } = useMemberProtocolCommunities();

  const inactiveLabel = t('profile.acquisitionList.statusInactive', { defaultValue: 'Inativo' });
  // t() é outra função a cada render; a chave das labels evita relistar a mesma comunidade.
  const excludedBadgeKey = [...excludedAcquisitionBadgeLabels(t)].sort().join('\0');
  const excludedBadgeLabels = useMemo(
    () => new Set(excludedBadgeKey ? excludedBadgeKey.split('\0') : []),
    [excludedBadgeKey],
  );

  const subscriptionCommunityIds = useMemo(() => {
    const ids = new Set<string>();
    for (const item of subscriptionProtocols) {
      const communityId = item.communityId?.trim();
      if (communityId) {
        ids.add(communityId);
      }
    }
    return ids;
  }, [subscriptionProtocols]);

  const communityProtocolsWithoutSubscription = useMemo(
    () => communityProtocols.filter((item) => !subscriptionCommunityIds.has(item.communityId.trim())),
    [communityProtocols, subscriptionCommunityIds],
  );

  const openSubscriptionItem = useCallback(
    (item: SubscriptionListItem) => {
      navigateToSubscribedProgram(navigation, {
        programType: item.programType,
        communityId: item.communityId,
        protocolDetailParams: {
          protocol: {
            id: item.productId,
            name: item.title,
            image: item.image,
            badges: item.badges,
            communityId: item.communityId,
            programType: item.programType,
            productId: item.productId,
            subscriptionId: item.subscriptionId,
            subscriptionStatus: item.status,
            cancelAtPeriodEnd: item.cancelAtPeriodEnd,
            canceledAt: item.canceledAt,
            cancelRequestedAt: item.cancelRequestedAt,
            accessValidUntil: item.accessValidUntil,
            description: item.description ?? undefined,
            agreements: item.agreements ?? undefined,
          },
        },
      });
    },
    [navigation],
  );

  const openCommunityProtocol = useCallback(
    (item: MemberProtocolCardItem) => {
      navigation.navigate('ProtocolDetail', {
        protocol: {
          id: item.communityId,
          communityId: item.communityId,
          name: item.title,
          image: item.image,
          badges: item.badges,
          description: item.description ?? undefined,
        },
      });
    },
    [navigation],
  );

  const openEventCommunity = useCallback(
    (communityId: string) => {
      navigateToCommunity(navigation, { focusCommunityId: communityId });
    },
    [navigation],
  );

  const programCommunities = useMemo(
    () => acquisitionEventCommunities(subscriptionProtocols, communityProtocols, excludedBadgeLabels),
    [communityProtocols, excludedBadgeLabels, subscriptionProtocols],
  );
  const programCommunitiesRef = useRef(programCommunities);
  programCommunitiesRef.current = programCommunities;
  const eventsRequestId = useRef(0);
  const eventCommunityKey = programCommunities
    .map((community) => `${community.communityId}\u0001${community.image}`)
    .join('\u0002');

  const loadEvents = useCallback(async () => {
    const requestId = eventsRequestId.current + 1;
    eventsRequestId.current = requestId;
    const communities = programCommunitiesRef.current;
    if (communities.length === 0) {
      setEvents([]);
      return;
    }
    setEventsLoading(true);
    try {
      const listed = await listEventsForCommunities(communities, new Date());
      if (eventsRequestId.current !== requestId) {
        return;
      }
      setEvents(listed);
    } catch (cause) {
      logger.error('[SubscriptionListScreen] Falha ao carregar eventos dos programas', { cause });
      if (eventsRequestId.current === requestId) {
        setEvents([]);
      }
    } finally {
      if (eventsRequestId.current === requestId) {
        setEventsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (subscriptionLoading || communityLoading) {
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        await loadEvents();
      } catch (cause: unknown) {
        logger.error('[SubscriptionListScreen] Falha ao carregar eventos dos programas', { cause });
      } finally {
        if (!cancelled) {
          setEventsSettled(true);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [communityLoading, eventCommunityKey, loadEvents, subscriptionLoading]);

  const reloadOnFocus = useCallback(() => {
    reloadSubscriptions().catch((cause: unknown) => {
      logger.error('[SubscriptionListScreen] Falha ao atualizar programas', { cause });
    });
  }, [reloadSubscriptions]);

  const refresh = useCallback(async () => {
    try {
      await Promise.all([reloadSubscriptions(), reloadMemberProtocols(), loadEvents()]);
    } catch (cause) {
      logger.error('[SubscriptionListScreen] Falha ao atualizar programas', { cause });
    }
  }, [loadEvents, reloadMemberProtocols, reloadSubscriptions]);

  const toggleDateSort = useCallback(() => {
    setDateSort((current) => (current === DATE_SORT.NEWEST ? DATE_SORT.OLDEST : DATE_SORT.NEWEST));
  }, []);

  const exploreMarketplace = useCallback(() => {
    navigation.navigate('Marketplace' as never);
  }, [navigation]);

  const programCards = useMemo((): AcquisitionCardContent[] => {
    const purchased = subscriptionProtocols.map((item) => mapSubscribedProgramToCard(item, excludedBadgeLabels));
    const joined = communityProtocolsWithoutSubscription.map((item) =>
      mapMemberProgramToCard(item, excludedBadgeLabels),
    );
    return [...purchased, ...joined];
  }, [communityProtocolsWithoutSubscription, excludedBadgeLabels, subscriptionProtocols]);

  const serviceCards = useMemo((): AcquisitionCardContent[] => {
    return services.map((item) => mapServiceToCard(item, excludedBadgeLabels));
  }, [excludedBadgeLabels, services]);

  const openCard = useCallback(
    (card: AcquisitionCardContent) => {
      if (card.source === ACQUISITION_SOURCE.MEMBERSHIP) {
        const membership = communityProtocolsWithoutSubscription.find((item) => item.communityId === card.id);
        if (membership) {
          openCommunityProtocol(membership);
        }
        return;
      }
      const items = card.source === ACQUISITION_SOURCE.SERVICE ? services : subscriptionProtocols;
      const item = items.find((entry) => entry.id === card.id);
      if (item) {
        openSubscriptionItem(item);
      }
    },
    [
      communityProtocolsWithoutSubscription,
      openCommunityProtocol,
      openSubscriptionItem,
      services,
      subscriptionProtocols,
    ],
  );

  const visiblePrograms = useMemo(
    () => filterAndSortAcquisition(programCards, filter, dateSort),
    [dateSort, filter, programCards],
  );
  const visibleServices = useMemo(
    () => filterAndSortAcquisition(serviceCards, filter, dateSort),
    [dateSort, filter, serviceCards],
  );
  const visibleEvents = useMemo(() => filterAndSortAcquisition(events, filter, dateSort), [dateSort, events, filter]);

  const isFullyEmpty =
    eventsSettled && !hasSubscriptionContent && !hasCommunityContent && events.length === 0 && !eventsLoading;
  const listView = acquisitionListView({
    category,
    isFullyEmpty,
    visiblePrograms,
    visibleServices,
    visibleEvents,
    programCount: programCards.length,
    serviceCount: serviceCards.length,
    eventCount: events.length,
    emptyFilterMessage: t('profile.acquisitionList.emptyFilter', { defaultValue: 'Nenhum item com esse filtro.' }),
    emptyCategoryMessage: t('profile.acquisitionList.emptyCategory', { defaultValue: 'Nada por aqui ainda.' }),
    inactiveLabel,
  });

  const isNewestFirst = dateSort === DATE_SORT.NEWEST;

  return {
    category,
    setCategory,
    filter,
    setFilter,
    isNewestFirst,
    toggleDateSort,
    listView,
    openCard,
    openEventCommunity,
    exploreMarketplace,
    isContentReady: eventsSettled,
    reloadOnFocus,
    refresh,
  };
}
