import type { Event } from '@/types/event';
import { PROGRAM_TYPE } from '@/types/product/programType';
import {
  ACQUISITION_CATEGORY,
  ACQUISITION_FILTER,
  ACQUISITION_SOURCE,
  DATE_SORT,
  type AcquisitionCardContent,
  type AcquisitionEventCard,
} from '@/types/subscription/acquisitionList';
import type { SubscriptionListItem } from '@/types/subscription/subscription';
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

const LABELS: Record<string, string> = {
  'profile.acquisitionList.statusInactive': 'Inativo',
  'profile.acquisitionList.statusCanceled': 'Cancelado',
  'profile.acquisitionList.statusCanceling': 'Em cancelamento',
  'profile.acquisitionList.statusUnpaid': 'Inadimplente',
  'profile.acquisitionList.statusPastDue': 'Em atraso',
  'marketplace.productCatalogType.program': 'Programa',
  'marketplace.productCatalogType.service': 'Serviço',
};

const translate = (key: string, options?: { defaultValue?: string }) => LABELS[key] ?? options?.defaultValue ?? key;

function programItem(overrides: Partial<SubscriptionListItem> = {}): SubscriptionListItem {
  return {
    id: 'sub-1',
    kind: 'protocol',
    productId: 'prod-1',
    title: 'Curso de sono',
    image: 'https://example.com/curso.jpg',
    badges: ['Sono', 'Programa'],
    acquiredAt: '2026-03-01T00:00:00.000Z',
    status: 'ACTIVE',
    programType: PROGRAM_TYPE.COURSE,
    desaturated: false,
    ...overrides,
  };
}

function card(id: string, overrides: Partial<AcquisitionCardContent> = {}): AcquisitionCardContent {
  return {
    id,
    source: ACQUISITION_SOURCE.SUBSCRIPTION,
    title: id,
    image: '',
    categoryLabel: null,
    inactive: false,
    inProgress: true,
    isTask: false,
    sortAt: 1,
    ...overrides,
  };
}

function eventCard(id: string, isVirtual: boolean): AcquisitionEventCard {
  return {
    id,
    communityId: 'community-1',
    title: id,
    image: '',
    categoryLabel: null,
    whenLabel: '',
    sortAt: 1,
    isVirtual,
    inProgress: true,
    isTask: false,
  };
}

describe('acquisitionListMapper', () => {
  const excluded = excludedAcquisitionBadgeLabels(translate);

  it('separa a categoria do badge de status e do tipo de catálogo', () => {
    const mapped = mapSubscribedProgramToCard(programItem({ badges: ['Sono', 'Programa', 'Inativo'] }), excluded);

    expect(mapped.categoryLabel).toBe('Sono');
    expect(mapped.source).toBe(ACQUISITION_SOURCE.SUBSCRIPTION);
    expect(excluded.has('programa')).toBe(true);
    expect(excluded.has('serviço')).toBe(true);
  });

  it('trata curso acessível como tarefa e comunidade acessível como em andamento', () => {
    const course = mapSubscribedProgramToCard(programItem(), excluded);
    const community = mapSubscribedProgramToCard(
      programItem({ programType: PROGRAM_TYPE.COMMUNITY, communityId: 'community-1' }),
      excluded,
    );

    expect(course.inactive).toBe(false);
    expect(course.inProgress).toBe(true);
    expect(course.isTask).toBe(true);
    expect(community.inProgress).toBe(true);
    expect(community.isTask).toBe(false);
  });

  it('marca programa inativo fora de andamento e de tarefas', () => {
    const inactive = mapSubscribedProgramToCard(programItem({ desaturated: true, status: 'CANCELED' }), excluded);

    expect(inactive.inactive).toBe(true);
    expect(inactive.inProgress).toBe(false);
    expect(inactive.isTask).toBe(false);
  });

  it('marca adesão de comunidade e serviço com a origem da navegação', () => {
    const membership = mapMemberProgramToCard(
      {
        communityId: 'community-9',
        title: 'Comunidade',
        image: 'https://example.com/c.jpg',
        badges: ['Movimento'],
      },
      excluded,
    );
    const service = mapServiceToCard(programItem({ id: 'svc-1', kind: 'service' }), excluded);

    expect(membership.id).toBe('community-9');
    expect(membership.source).toBe(ACQUISITION_SOURCE.MEMBERSHIP);
    expect(membership.inProgress).toBe(true);
    expect(membership.isTask).toBe(false);
    expect(service.source).toBe(ACQUISITION_SOURCE.SERVICE);
    expect(service.isTask).toBe(false);
  });

  it('filtra e ordena, mandando data ausente para o fim', () => {
    const entries = [
      { id: 'recent', inProgress: true, isTask: false, sortAt: 20 },
      { id: 'task', inProgress: false, isTask: true, sortAt: 30 },
      { id: 'undated', inProgress: true, isTask: true, sortAt: 0 },
    ];

    expect(
      filterAndSortAcquisition(entries, ACQUISITION_FILTER.IN_PROGRESS, DATE_SORT.NEWEST).map((entry) => entry.id),
    ).toEqual(['recent', 'undated']);
    expect(
      filterAndSortAcquisition(entries, ACQUISITION_FILTER.TASKS, DATE_SORT.OLDEST).map((entry) => entry.id),
    ).toEqual(['task', 'undated']);
  });

  it('prioriza a comunidade da assinatura e ignora id vazio', () => {
    const communities = acquisitionEventCommunities(
      [
        { communityId: 'community-1', image: 'from-subscription', badges: ['Sono', 'Programa'] },
        { communityId: '  ', image: 'blank', badges: [] },
      ],
      [{ communityId: 'community-1', image: 'from-membership', badges: ['Outra'] }],
      excluded,
    );

    expect(communities).toEqual([{ communityId: 'community-1', image: 'from-subscription', categoryLabel: 'Sono' }]);
  });

  it('escolhe explorar, vazio de filtro ou a categoria com eventos separados', () => {
    const programs = [card('program-1')];
    const live = eventCard('live', true);
    const place = eventCard('place', false);
    const messages = {
      emptyFilterMessage: 'Nenhum item com esse filtro.',
      emptyCategoryMessage: 'Nada por aqui ainda.',
      inactiveLabel: 'Inativo',
    };

    expect(
      acquisitionListView({
        category: ACQUISITION_CATEGORY.PROGRAMS,
        isFullyEmpty: true,
        visiblePrograms: programs,
        visibleServices: [],
        visibleEvents: [],
        programCount: 1,
        serviceCount: 0,
        eventCount: 0,
        ...messages,
      }).view,
    ).toBe('explore');

    expect(
      acquisitionListView({
        category: ACQUISITION_CATEGORY.PROGRAMS,
        isFullyEmpty: false,
        visiblePrograms: [],
        visibleServices: [],
        visibleEvents: [],
        programCount: 2,
        serviceCount: 0,
        eventCount: 0,
        ...messages,
      }),
    ).toEqual({ view: 'empty', message: messages.emptyFilterMessage });

    expect(
      acquisitionListView({
        category: ACQUISITION_CATEGORY.SERVICES,
        isFullyEmpty: false,
        visiblePrograms: [],
        visibleServices: [],
        visibleEvents: [],
        programCount: 0,
        serviceCount: 0,
        eventCount: 0,
        ...messages,
      }),
    ).toEqual({ view: 'empty', message: messages.emptyCategoryMessage });

    expect(
      acquisitionListView({
        category: ACQUISITION_CATEGORY.EVENTS,
        isFullyEmpty: false,
        visiblePrograms: [],
        visibleServices: [],
        visibleEvents: [live, place],
        programCount: 0,
        serviceCount: 0,
        eventCount: 2,
        ...messages,
      }),
    ).toEqual({ view: 'events', liveEvents: [live], placeEvents: [place] });
  });

  it('omite evento oculto e classifica live virtual e tarefa futura', () => {
    const now = new Date(2026, 5, 15, 10, 0, 0);
    const startsAt = new Date(2026, 5, 15, 18, 30, 0).toISOString();
    const community = { communityId: 'community-1', image: 'cover', categoryLabel: 'Sono' };
    const draft: Event = {
      id: 'draft-1',
      title: 'Rascunho',
      status: 'draft',
      provider: 'unknown',
      source: 'social_plus',
    };
    const live: Event = {
      id: 'live-1',
      title: 'Live',
      description: 'Ao vivo',
      startsAt,
      status: 'scheduled',
      provider: 'zoom',
      source: 'social_plus',
    };

    expect(mapCommunityEventToCard(draft, community, now)).toBeNull();

    const mapped = mapCommunityEventToCard(live, community, now);
    expect(mapped).toMatchObject({
      id: 'community-1:live-1',
      communityId: 'community-1',
      title: 'Live',
      image: 'cover',
      categoryLabel: 'Sono',
      whenLabel: 'Hoje | 18h30',
      isVirtual: true,
      inProgress: true,
      isTask: true,
    });
  });
});
