export interface CommunityPost {
  _id?: string;
  /** ID interno de evento/realtime; alguns payloads usam em `parentPostId`. */
  path?: string;
  postId?: string;
  parentPostId?: string;
  postedUserId?: string;
  userId?: string;
  targetId?: string;
  targetType?: string;
  structureType?: string;
  dataType?: string;
  tags?: string | string[];
  childrenPosts?: CommunityPost[];
  pollOptions?: CommunityPost[]; // Opções de poll agrupadas (nova estrutura do backend)
  sequenceNumber?: number; // Para ordenação das opções de poll
  /** Arquivos embutidos no post (algumas respostas Amity enviam junto do post). */
  files?: CommunityFile[];
  /** Filhos inline quando a API retorna objetos completos (além do array global `postChildren`). */
  children?: CommunityPost[] | string[];
  data?: {
    text?: string;
    title?: string;
    fileId?: string;
    thumbnailFileId?: string;
    videoFileId?: string | Record<string, string | undefined>;
    pollId?: string;
    endedAt?: string;
    endDate?: string;
    tags?: string | string[];
    [key: string]: unknown;
  };
  reactionsCount?: number;
  myReactions?: string[];
  commentsCount?: number;
  createdAt: string;
  updatedAt?: string;
  /** Post em destaque na comunidade (`GET /api/communities/:id/featured-posts`). */
  isFeatured?: boolean;
}

export interface CommunityFile {
  fileId: string;
  fileUrl: string;
  /** URLs por resolução quando `type` é vídeo transcoded (Amity). */
  videoUrl?: Record<string, string>;
  type?: string;
  attributes?: {
    mimeType?: string;
    metadata?: { thumbnail?: boolean; [key: string]: unknown };
    [key: string]: unknown;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CommunityReaction {
  reactionId?: string;
  userId?: string;
  reactionName?: string;
  reactionType?: string;
  [key: string]: unknown;
}

export interface CommunityComment {
  commentId: string;
  userId: string;
  referenceId?: string;
  data?: {
    text?: string;
    [key: string]: unknown;
  };
  reactionsCount?: number;
  reactions?: Record<string, number>; // Ex: { "like": 1, "dislike": 0 }
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityUser {
  userId: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  avatarFileId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Community {
  communityId: string;
  displayName: string;
  tags?: string[];
  categoryIds?: string[];
  description?: string | null;
  socialDescription?: string | null;
  /** Texto de acordo/termos da comunidade (campo `community.agreement` no backend). */
  agreement?: string | null;
  avatarFileId?: string;
  /** URL resolvida no backend (`fileUrl` cruzado com `avatarFileId`). */
  avatarUrl?: string;
  bannerImageUrl?: string | null;
  heroImageUrl?: string | null;
  isPublic: boolean;
  membersCount: number;
  postsCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityUserRelation {
  userId: string;
  communityId: string;
  communityMembership: string;
  roles?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CommunityCategory {
  categoryId: string;
  name: string;
  metadata?: Record<string, unknown>;
  avatarFileId?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommunityFeedData {
  posts?: CommunityPost[];
  postChildren?: CommunityPost[];
  comments?: CommunityComment[];
  users?: CommunityUser[];
  files?: CommunityFile[];
  communities?: Community[];
  communityUsers?: CommunityUserRelation[];
  categories?: CommunityCategory[];
  paging?: {
    next?: string;
    previous?: string;
  };
}

export interface CommunityFeaturedPostData extends CommunityFeedData {
  post: CommunityPost | null;
}

export interface CommunityFeaturedPostApiResponse {
  success?: boolean;
  message?: string;
  data?: {
    status?: string;
    data?: CommunityFeaturedPostData;
  };
}

export interface UserFeedApiResponse {
  success?: boolean;
  status?: string;
  data?: {
    status?: string;
    data?: CommunityFeedData;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface UserFeedParams {
  page?: number;
  limit?: number;
  /** Valor de `paging.next` da página anterior (obrigatório no backend quando `page` > 1). */
  token?: string;
  search?: string;
  postTypes?: string | string[];
  authorIds?: string | string[];
  startDate?: string;
  endDate?: string;
  orderBy?: 'createdAt' | 'updatedAt' | 'reactionsCount';
  order?: 'asc' | 'desc';
  categoryId?: string | null;
  solutionIds?: string[];
  communityId?: string;
}

export interface ListCommunitiesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'displayName' | 'membersCount' | 'postsCount';
  includeDeleted?: boolean;
}

export interface ListCommunitiesApiResponse {
  success?: boolean;
  status?: string;
  message?: string;
  data?: {
    communities?: Community[];
    files?: CommunityFile[];
    categories?: CommunityCategory[];
    communityUsers?: CommunityUserRelation[];
    paging?: {
      next?: string | null;
      previous?: string | null;
    };
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProviderChat {
  id: string;
  providerName: string;
  providerAvatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
}

export interface ProviderData {
  userId: string;
  displayName: string;
  profileHandle?: string;
  description?: string;
  avatarCustomUrl?: string;
  avatarFileId?: string;
  isBrand?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  files?: CommunityFile[];
}

export interface ProviderApiResponse {
  success?: boolean;
  status?: string;
  data?: ProviderData;
  message?: string;
}

export interface Channel {
  channelId: string;
  displayName?: string;
  channelType: 'conversation' | 'broadcast' | 'live' | 'community';
  avatarFileId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ChannelsApiResponse {
  success?: boolean;
  status?: string;
  data?: {
    channels?: Channel[];
    hasNextPage?: boolean;
    loading?: boolean;
    error?: any;
  };
  message?: string;
}

export interface GetChannelsParams {
  types?: string | string[];
}
