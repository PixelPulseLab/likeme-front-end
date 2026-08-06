import React from 'react';
import { Text, TouchableOpacity, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { SecondaryButton } from '@/components/ui/buttons';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { styles } from './styles';

export type PartnerSectionRecommender = {
  id: string;
  name: string;
  avatar?: string;
  specialty?: string;
};

type PartnerSectionProps = {
  recommendedByLabel?: string;
  name?: string;
  avatar?: string;
  specialistLabel?: string;
  profileButtonLabel?: string;
  onPressProfile?: () => void;
  recommenders?: PartnerSectionRecommender[];
  recommendationsCountLabel?: string;
  onPressRecommenders?: () => void;
  style?: StyleProp<ViewStyle>;
};

const MAX_VISIBLE_AVATARS = 5;

function PartnerAvatar({ uri, style }: { uri?: string; style: StyleProp<ImageStyle> }) {
  if (uri) {
    return <CachedImage source={{ uri }} style={style} />;
  }
  return <View style={[style, styles.avatarPlaceholder]} />;
}

function StackedPartnerAvatar({ uri, overlap, zIndex }: { uri?: string; overlap: boolean; zIndex: number }) {
  return (
    <View style={[styles.stackedAvatarRing, overlap ? styles.stackedAvatarOverlap : null, { zIndex }]}>
      {uri ? (
        <CachedImage source={{ uri }} style={styles.stackedAvatarImage as ImageStyle} />
      ) : (
        <View style={[styles.stackedAvatarImage, styles.avatarPlaceholder]} />
      )}
    </View>
  );
}

export function PartnerSection({
  name,
  avatar,
  specialistLabel,
  recommendedByLabel,
  profileButtonLabel,
  onPressProfile,
  recommenders = [],
  recommendationsCountLabel,
  onPressRecommenders,
  style,
}: PartnerSectionProps) {
  const label = recommendedByLabel?.trim() || '';
  /** Com label “Recomendado por”, a fonte canônica é só `recommenders` (APP-285). */
  const recommendedByFromRecommendationsOnly = Boolean(label);
  const hasMultipleRecommenders = recommenders.length > 1;
  const singleRecommender = recommenders.length === 1 ? recommenders[0] : null;
  const singleName = recommendedByFromRecommendationsOnly
    ? singleRecommender?.name?.trim() || ''
    : (singleRecommender?.name ?? name)?.trim() || '';
  const singleAvatar = recommendedByFromRecommendationsOnly
    ? singleRecommender?.avatar
    : singleRecommender?.avatar ?? avatar;
  const singleSpecialty = recommendedByFromRecommendationsOnly
    ? singleRecommender?.specialty?.trim() || ''
    : singleRecommender?.specialty?.trim() || specialistLabel?.trim() || '';

  if (!hasMultipleRecommenders && !singleName) {
    return null;
  }

  const body = hasMultipleRecommenders ? (
    <View style={styles.multiRow}>
      <View style={styles.avatarStack}>
        {recommenders.slice(0, MAX_VISIBLE_AVATARS).map((recommender, index) => (
          <StackedPartnerAvatar
            key={recommender.id}
            uri={recommender.avatar}
            overlap={index > 0}
            zIndex={MAX_VISIBLE_AVATARS - index}
          />
        ))}
      </View>
      {recommendationsCountLabel?.trim() ? (
        <Text style={styles.recommendationsCount}>{recommendationsCountLabel.trim()}</Text>
      ) : null}
    </View>
  ) : (
    <>
      <View style={[styles.row, label ? styles.rowWithRecommendedByLabel : null]}>
        <PartnerAvatar uri={singleAvatar} style={styles.avatar as ImageStyle} />
        <View style={styles.info}>
          <Text style={styles.name}>{singleName}</Text>
          {singleSpecialty ? <Text style={styles.role}>{singleSpecialty}</Text> : null}
        </View>
      </View>
      {onPressProfile ? (
        <SecondaryButton
          label={profileButtonLabel ?? ''}
          onPress={onPressProfile}
          style={styles.profileButton}
          size='large'
        />
      ) : null}
    </>
  );

  const content = (
    <>
      {label ? <Text style={styles.recommendedByLabel}>{label}</Text> : null}
      {body}
    </>
  );

  if (hasMultipleRecommenders && onPressRecommenders) {
    return (
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={onPressRecommenders}
        activeOpacity={0.7}
        accessibilityRole='button'
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.container, style]}>{content}</View>;
}
