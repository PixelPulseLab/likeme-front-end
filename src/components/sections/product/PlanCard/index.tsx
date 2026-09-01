import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { CachedImage } from '@/components/ui/media/CachedImage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { formatPrice } from '@/utils';
import { styles } from './styles';

export interface Plan {
  id: string;
  title: string;
  price: number | null | undefined;
  tag: string;
  tagColor?: 'orange' | 'green' | 'default';
  image: string;
  likes: number;
  currency?: 'BRL' | 'USD';
}

type Props = {
  plan: Plan;
  onPress?: (plan: Plan) => void;
  onLike?: (plan: Plan) => void;
};

const PlanCard: React.FC<Props> = ({ plan, onPress, onLike }) => {
  const getTagColor = () => {
    switch (plan.tagColor) {
      case 'orange':
        return '#f6dea9';
      case 'green':
        return '#d8e4d6';
      default:
        return '#d8e4d6';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <CachedImage source={{ uri: plan.image }} style={styles.image} />
        <BlurView intensity={10} tint='dark' style={styles.imageOverlay} />
        <View style={styles.contentOverlay}>
          <View style={[styles.tagBadge, { backgroundColor: 'rgba(0, 17, 55, 0.64)' }]}>
            <Text style={[styles.tagText, { color: getTagColor() }]}>{plan.tag}</Text>
          </View>
          <View style={styles.bottomInfo}>
            <Text style={styles.price}>{formatPrice(plan.price, plan.currency || 'BRL')}</Text>
            <TouchableOpacity style={styles.likeButton} onPress={() => onLike?.(plan)} activeOpacity={0.7}>
              <Icon name='favorite-border' size={20} color='#f6cffb' />
              <Text style={styles.likesCount}>{plan.likes}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.title} numberOfLines={2}>
          {plan.title}
        </Text>
        <TouchableOpacity style={styles.arrowButton} onPress={() => onPress?.(plan)} activeOpacity={0.7}>
          <Icon name='chevron-right' size={24} color='#001137' />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PlanCard;
