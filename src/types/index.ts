import type { Attachment, AttachmentType } from '@/types/attachment';

export * from './navigation';
export * from './community';
export * from './auth';
export * from './person';
export * from './infrastructure';
export * from './event';
export * from './program';
export * from './product';
export type { ListAdsParams, ListAdsApiResponse, GetAdApiResponse, CreateAdData, UpdateAdData } from './ad';
export * from './activity';
export * from './order';
export * from './cart';
export * from './category';
export * from './contact';
export * from './solution';
export type { Attachment, AttachmentType };
export type PostAttachment = Attachment;
export type PostAttachmentKind = AttachmentType;

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthMetric {
  id: string;
  userId: string;
  type: 'weight' | 'blood_pressure' | 'heart_rate' | 'temperature';
  value: number;
  unit: string;
  recordedAt: Date;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  type: 'exercise' | 'meditation' | 'nutrition' | 'sleep';
  duration?: number;
  completedAt?: Date;
  userId: string;
}

export interface Protocol {
  id: string;
  name: string;
  description: string;
  steps: ProtocolStep[];
  duration: number;
  userId: string;
}

export interface ProtocolStep {
  id: string;
  title: string;
  description: string;
  order: number;
  completed: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  category: string;
  inStock: boolean;
}

export interface PollOption {
  id: string;
  /** Identificador da opção no backend (voto); costuma coincidir com `id` */
  answerId?: string;
  text: string;
  votes: number;
  percentage: number;
  isSelected?: boolean;
}

export interface Poll {
  id: string;
  pollId?: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  endedAt?: Date;
  isFinished: boolean;
}

export interface Post {
  id: string;
  userId?: string;
  content: string;
  image?: string;
  /** URL de reprodução quando o post é vídeo (feed Amity / arquivo com mime vídeo). */
  videoUrl?: string;
  attachments?: Attachment[];
  likes?: number;
  isLiked?: boolean;
  /** Nomes das reações do usuário atual neste post (cópia do backend, sem filtrar tipo). */
  myReactions?: string[];
  reactionsCount?: number;
  comments: Comment[];
  commentsCount?: number;
  createdAt: Date;
  category?: string;
  /** structureType / dataType / data.type da API (normalizado em minúsculas) para label de tipo no feed */
  feedPostType?: string;
  tags?: string | string[];
  overline?: string;
  title?: string;
  userName?: string;
  userAvatar?: string;
  poll?: Poll;
  /** Post em destaque na comunidade (carrossel no topo do feed). */
  isFeatured?: boolean;
}

export interface Reaction {
  id: string;
  userId: string;
  type: 'like' | 'dislike' | string;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  userName?: string;
  userAvatar?: string;
  reactionsCount?: number;
  reactions?: Reaction[];
  commentsCount?: number;
  userReaction?: 'like' | 'dislike';
}

export interface HealthProvider {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  location: string;
  avatar?: string;
  availableSlots: Date[];
}
