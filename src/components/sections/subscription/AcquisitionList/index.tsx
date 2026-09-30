import { ScrollView, Text, View } from 'react-native';
import ProtocolList from '@/components/sections/subscription/ProtocolList';
import { JoinCard } from '@/components/ui/cards/JoinCard';
import { JOIN_CARD_VARIANT } from '@/components/ui/cards/JoinCard/types';
import { useTranslation } from '@/hooks/i18n';
import type {
  AcquisitionCardContent,
  AcquisitionEventCard,
  AcquisitionListView,
} from '@/types/subscription/acquisitionList';
import { styles } from './styles';

type AcquisitionListProps = {
  listView: AcquisitionListView;
  onExplore: () => void;
  onOpenCard: (card: AcquisitionCardContent) => void;
  onAddToCalendar: (title: string) => void;
  onOpenCommunity: (communityId: string) => void;
};

function solutionBadges(card: AcquisitionCardContent, inactiveLabel: string): string[] {
  const inactiveBadge = card.inactive ? inactiveLabel : null;
  return [card.categoryLabel, inactiveBadge].filter((label): label is string => Boolean(label));
}

function SolutionCards({
  cards,
  inactiveLabel,
  variant,
  onOpenCard,
  onAddToCalendar,
}: {
  cards: AcquisitionCardContent[];
  inactiveLabel: string;
  variant: typeof JOIN_CARD_VARIANT.HERO | typeof JOIN_CARD_VARIANT.SQUARE;
  onOpenCard: (card: AcquisitionCardContent) => void;
  onAddToCalendar: (title: string) => void;
}) {
  return (
    <View style={styles.cards}>
      {cards.map((card) => (
        <JoinCard
          key={card.id}
          title={card.title}
          badges={solutionBadges(card, inactiveLabel)}
          image={card.image}
          detail={card.description}
          desaturated={card.inactive}
          onPress={() => onOpenCard(card)}
          onAddToCalendar={() => onAddToCalendar(card.title)}
          blur={false}
          variant={variant}
          testID={card.testID}
        />
      ))}
    </View>
  );
}

function EventJoinCard({
  event,
  variant,
  onOpenCommunity,
  onAddToCalendar,
}: {
  event: AcquisitionEventCard;
  variant: typeof JOIN_CARD_VARIANT.COMPACT | typeof JOIN_CARD_VARIANT.DEFAULT;
  onOpenCommunity: (communityId: string) => void;
  onAddToCalendar: (title: string) => void;
}) {
  const isCompact = variant === JOIN_CARD_VARIANT.COMPACT;
  const badges = event.categoryLabel ? [event.categoryLabel] : [];

  return (
    <JoinCard
      title={event.title}
      badges={badges}
      image={event.image}
      detail={event.whenLabel}
      caption={event.description}
      onPress={() => onOpenCommunity(event.communityId)}
      onAddToCalendar={() => onAddToCalendar(event.title)}
      blur={false}
      variant={variant}
      fullWidth={!isCompact}
    />
  );
}

function EventCards({
  liveEvents,
  placeEvents,
  onOpenCommunity,
  onAddToCalendar,
}: {
  liveEvents: AcquisitionEventCard[];
  placeEvents: AcquisitionEventCard[];
  onOpenCommunity: (communityId: string) => void;
  onAddToCalendar: (title: string) => void;
}) {
  const { t } = useTranslation();
  const hasLives = liveEvents.length > 0;
  const hasPlaces = placeEvents.length > 0;

  return (
    <View style={styles.eventsStack}>
      {hasLives ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.acquisitionList.eventsLives', { defaultValue: 'Lives' })}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.liveRow}>
            {liveEvents.map((event) => (
              <EventJoinCard
                key={event.id}
                event={event}
                variant={JOIN_CARD_VARIANT.COMPACT}
                onOpenCommunity={onOpenCommunity}
                onAddToCalendar={onAddToCalendar}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
      {hasPlaces ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('profile.acquisitionList.eventsInPerson', { defaultValue: 'Presenciais' })}
          </Text>
          <View style={styles.cards}>
            {placeEvents.map((event) => (
              <EventJoinCard
                key={event.id}
                event={event}
                variant={JOIN_CARD_VARIANT.DEFAULT}
                onOpenCommunity={onOpenCommunity}
                onAddToCalendar={onAddToCalendar}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function AcquisitionList({
  listView,
  onExplore,
  onOpenCard,
  onAddToCalendar,
  onOpenCommunity,
}: AcquisitionListProps) {
  if (listView.view === 'explore') {
    return (
      <View style={styles.emptyWrap}>
        <ProtocolList subscriptions={[]} onSubscriptionPress={() => undefined} onExplorePress={onExplore} />
      </View>
    );
  }

  if (listView.view === 'empty') {
    return <Text style={styles.emptyMessage}>{listView.message}</Text>;
  }

  if (listView.view === 'programs') {
    return (
      <SolutionCards
        cards={listView.cards}
        inactiveLabel={listView.inactiveLabel}
        variant={JOIN_CARD_VARIANT.HERO}
        onOpenCard={onOpenCard}
        onAddToCalendar={onAddToCalendar}
      />
    );
  }

  if (listView.view === 'services') {
    return (
      <SolutionCards
        cards={listView.cards}
        inactiveLabel={listView.inactiveLabel}
        variant={JOIN_CARD_VARIANT.SQUARE}
        onOpenCard={onOpenCard}
        onAddToCalendar={onAddToCalendar}
      />
    );
  }

  return (
    <EventCards
      liveEvents={listView.liveEvents}
      placeEvents={listView.placeEvents}
      onOpenCommunity={onOpenCommunity}
      onAddToCalendar={onAddToCalendar}
    />
  );
}
