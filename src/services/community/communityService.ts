import apiClient from '../infrastructure/apiClient';
import { logger } from '@/utils/logger';
import type { ApiResponse } from '@/types/infrastructure';
import type {
  Community,
  CommunityFeedData,
  CommunityFeaturedPostApiResponse,
  UserFeedApiResponse,
  UserFeedParams,
  ListCommunitiesParams,
  ListCommunitiesApiResponse,
  GetCommunityApiResponse,
} from '@/types/community';
import type { ApiError } from '@/types/infrastructure';
class CommunityService {
  private readonly userFeeEndpoint = '/api/communities/feed';
  private readonly pollsBasePath = '/api/communities/polls';
  private readonly commentReactionEndpoint = '/api/communities/comments';
  private readonly postReactionEndpoint = '/api/communities/posts';
  private readonly addCommentEndpoint = '/api/communities/comments';
  private readonly communitiesEndpoint = '/api/communities';

  private buildFeedQueryParams(
    params: UserFeedParams,
    options?: { includeCommunityId?: boolean },
  ): Record<string, string> {
    const queryParams: Record<string, string> = {};
    const formatListParam = (value?: string | string[]) => {
      if (!value) {
        return undefined;
      }
      if (Array.isArray(value)) {
        return value.filter((item) => item && item.trim().length > 0).join(',');
      }
      return value.trim();
    };

    if (params.page !== undefined) {
      queryParams.page = String(params.page);
    }

    if (params.limit !== undefined) {
      queryParams.limit = String(params.limit);
    }

    if (params.token != null && params.token.trim() !== '') {
      queryParams.token = params.token.trim();
    }

    if (params.search && params.search.trim() !== '') {
      queryParams.search = params.search.trim();
    }

    const postTypesParam = formatListParam(params.postTypes);
    if (postTypesParam) {
      queryParams.postTypes = postTypesParam;
    }

    const authorIdsParam = formatListParam(params.authorIds);
    if (authorIdsParam) {
      queryParams.authorIds = authorIdsParam;
    }

    if (params.startDate) {
      queryParams.startDate = params.startDate;
    }

    if (params.endDate) {
      queryParams.endDate = params.endDate;
    }

    if (params.orderBy) {
      queryParams.orderBy = params.orderBy;
    }

    if (params.order) {
      queryParams.order = params.order;
    }

    if (params.categoryId != null && params.categoryId !== '') {
      queryParams.categoryId = params.categoryId;
    }

    if (params.solutionIds != null && params.solutionIds.length > 0) {
      queryParams.solutionIds = params.solutionIds.join(',');
    }

    if (options?.includeCommunityId !== false && params.communityId != null && params.communityId.trim() !== '') {
      queryParams.communityId = params.communityId.trim();
    }

    return queryParams;
  }

  async getUserFeed(params: UserFeedParams = {}): Promise<UserFeedApiResponse> {
    try {
      const queryParams = this.buildFeedQueryParams(params);

      const userFeedResponse = await apiClient.get<UserFeedApiResponse>(this.userFeeEndpoint, queryParams, true, false);
      logger.debug('[CommunityService] userFeed response', userFeedResponse);
      return userFeedResponse;
    } catch (error) {
      logger.error('Error fetching user feed:', error);
      throw error;
    }
  }

  async getCommunityPosts(
    communityId: string,
    params: Omit<UserFeedParams, 'communityId'> = {},
  ): Promise<UserFeedApiResponse> {
    const trimmedCommunityId = communityId?.trim();
    if (!trimmedCommunityId) {
      throw new Error('communityId is required');
    }

    try {
      const queryParams = this.buildFeedQueryParams(params, { includeCommunityId: false });
      const endpoint = `${this.communitiesEndpoint}/${encodeURIComponent(trimmedCommunityId)}/posts`;
      const response = await apiClient.get<UserFeedApiResponse>(endpoint, queryParams, true, false);
      logger.debug('[CommunityService] communityPosts response', response);
      return response;
    } catch (error) {
      logger.error('Error fetching community posts:', error);
      throw error;
    }
  }

  async getCommunityFeaturedPost(communityId: string): Promise<CommunityFeaturedPostApiResponse> {
    const trimmedCommunityId = communityId?.trim();
    if (!trimmedCommunityId) {
      throw new Error('communityId is required');
    }

    try {
      const endpoint = `${this.communitiesEndpoint}/${encodeURIComponent(trimmedCommunityId)}/featured-posts`;
      const response = await apiClient.get<CommunityFeaturedPostApiResponse>(endpoint, undefined, true, false);
      logger.debug('[CommunityService] communityFeaturedPost response', response);
      return response;
    } catch (error) {
      logger.error('Error fetching community featured post:', error);
      throw error;
    }
  }

  async getPollDetail(pollId: string): Promise<unknown> {
    try {
      if (!pollId || pollId.trim() === '') {
        throw new Error('Poll ID is required');
      }

      const endpoint = `${this.pollsBasePath}/${encodeURIComponent(pollId.trim())}`;

      const pollResponse = await apiClient.get<ApiResponse<unknown>>(endpoint, undefined, true, false);

      if (!pollResponse.success) {
        throw new Error(pollResponse.message || 'Falha ao carregar enquete');
      }
      return pollResponse.data;
    } catch (error) {
      logger.error('Error fetching poll detail:', error);
      throw error;
    }
  }

  async getCommunityPostSnapshot(postId: string): Promise<CommunityFeedData> {
    if (!postId || postId.trim() === '') {
      throw new Error('Post ID is required');
    }
    const endpoint = `${this.postReactionEndpoint}/${encodeURIComponent(postId.trim())}`;
    const res = await apiClient.get<ApiResponse<CommunityFeedData>>(endpoint, undefined, true, false);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Falha ao carregar o post');
    }
    return res.data;
  }

  async votePoll(pollId: string, answerIds: string[]): Promise<ApiResponse<unknown>> {
    try {
      if (!pollId || pollId.trim() === '') {
        throw new Error('Poll ID is required');
      }

      if (!answerIds || answerIds.length === 0) {
        throw new Error('At least one answer ID is required');
      }

      // Endpoint fixo, pollId vai no body
      const endpoint = `/api/communities/polls/${pollId.trim()}/votes`;

      const voteResponse = await apiClient.put<ApiResponse<unknown>>(
        endpoint,
        {
          pollId: pollId.trim(),
          answerIds,
        },
        true,
      );

      if (!voteResponse.success) {
        throw new Error(voteResponse.message || 'Falha ao registrar voto na enquete');
      }

      logger.debug('Poll vote response:', {
        pollId,
        answerIds,
        success: voteResponse.success,
      });

      return voteResponse;
    } catch (error) {
      logger.error('Error voting on poll:', error);
      throw error;
    }
  }

  async addPostReaction(postId: string, reactionName = 'like'): Promise<boolean> {
    try {
      if (!postId || postId.trim() === '') {
        throw new Error('Post ID is required');
      }

      const endpoint = `${this.postReactionEndpoint}/${postId.trim()}/reactions`;

      await apiClient.post(
        endpoint,
        {
          reactionName,
        },
        true,
      );

      logger.debug('Post reaction added:', { postId, reactionName });
      return true;
    } catch (error) {
      logger.warn('Error adding post reaction (ignored):', error);
      return false;
    }
  }

  async removePostReaction(postId: string, reactionName = 'like'): Promise<boolean> {
    try {
      if (!postId || postId.trim() === '') {
        throw new Error('Post ID is required');
      }

      const trimmedReaction = reactionName.trim() || 'like';
      const endpoint = `${this.postReactionEndpoint}/${postId.trim()}/reactions?reactionName=${encodeURIComponent(
        trimmedReaction,
      )}`;

      await apiClient.delete(endpoint, undefined, true);

      logger.debug('Post reaction removed:', { postId, reactionName: trimmedReaction });
      return true;
    } catch (error) {
      logger.warn('Error removing post reaction (ignored):', error);
      return false;
    }
  }

  async addCommentReaction(commentId: string, reactionName = 'like'): Promise<boolean> {
    try {
      if (!commentId || commentId.trim() === '') {
        throw new Error('Comment ID is required');
      }

      const endpoint = `${this.commentReactionEndpoint}/${commentId.trim()}/reactions`;

      await apiClient.post(
        endpoint,
        {
          reactionName,
        },
        true,
      );

      logger.debug('Comment reaction added:', { commentId, reactionName });
      return true;
    } catch (error) {
      logger.warn('Error adding comment reaction (ignored):', error);
      return false;
    }
  }

  async removeCommentReaction(commentId: string, reactionName = 'like'): Promise<boolean> {
    try {
      if (!commentId || commentId.trim() === '') {
        throw new Error('Comment ID is required');
      }

      const trimmedReaction = reactionName.trim() || 'like';
      const endpoint = `${this.commentReactionEndpoint}/${commentId.trim()}/reactions?reactionName=${encodeURIComponent(
        trimmedReaction,
      )}`;

      await apiClient.delete(endpoint, undefined, true);

      logger.debug('Comment reaction removed:', { commentId, reactionName: trimmedReaction });
      return true;
    } catch (error) {
      logger.warn('Error removing comment reaction (ignored):', error);
      return false;
    }
  }

  /**
   * Lista comentários por referência (post, content ou story).
   * Proxy: GET /api/communities/comments?referenceId=...&referenceType=...
   */
  async getCommentsByReference(
    referenceId: string,
    referenceType: 'post' | 'content' | 'story' = 'post',
  ): Promise<any> {
    const trimmedId = referenceId?.trim();
    if (!trimmedId) {
      throw new Error('referenceId é obrigatório para buscar comentários');
    }

    return apiClient.get<any>(this.commentReactionEndpoint, {
      referenceId: trimmedId,
      referenceType,
    });
  }

  async addPostComment(postId: string, text: string, parentId?: string): Promise<any> {
    try {
      if (!postId || postId.trim() === '') {
        throw new Error('Post ID is required');
      }

      const trimmedText = text?.trim();
      if (!trimmedText) {
        throw new Error('Text is required');
      }

      const response = await apiClient.post<any>(
        this.addCommentEndpoint,
        {
          postId: postId.trim(),
          text: trimmedText,
          referenceType: 'post',
          parentId,
        },
        true,
      );

      logger.debug('Post comment added:', { postId, hasParentId: !!parentId });
      return response;
    } catch (error) {
      logger.error('Error adding post comment:', error);
      throw error;
    }
  }

  async listMemberProtocolCommunities(params: ListCommunitiesParams = {}): Promise<ListCommunitiesApiResponse> {
    try {
      const queryParams: Record<string, string> = {};

      if (params.page !== undefined) {
        queryParams.page = String(params.page);
      }

      if (params.limit !== undefined) {
        queryParams.limit = String(params.limit);
      }

      if (params.search && params.search.trim() !== '') {
        queryParams.search = params.search.trim();
      }

      const communitiesResponse = await apiClient.get<ListCommunitiesApiResponse>(
        `${this.communitiesEndpoint}/member-protocols`,
        queryParams,
        true,
        false,
      );

      logger.debug('Member protocol communities response:', {
        page: params.page,
        limit: params.limit,
        success: communitiesResponse.success,
        count: communitiesResponse.data?.communities?.length ?? 0,
      });

      return communitiesResponse;
    } catch (error) {
      logger.error('Error fetching member protocol communities:', error);
      throw error;
    }
  }

  async listCommunities(params: ListCommunitiesParams = {}): Promise<ListCommunitiesApiResponse> {
    try {
      const queryParams: Record<string, string> = {};

      if (params.page !== undefined) {
        queryParams.page = String(params.page);
      }

      if (params.limit !== undefined) {
        queryParams.limit = String(params.limit);
      }

      if (params.sortBy) {
        queryParams.sortBy = params.sortBy;
      }

      if (params.includeDeleted !== undefined) {
        queryParams.includeDeleted = String(params.includeDeleted);
      }

      const communitiesResponse = await apiClient.get<ListCommunitiesApiResponse>(
        this.communitiesEndpoint,
        queryParams,
        true,
        false,
      );

      logger.debug('Communities list response:', {
        page: params.page,
        limit: params.limit,
        success: communitiesResponse.success,
        hasData: !!communitiesResponse.data,
      });

      return communitiesResponse;
    } catch (error) {
      logger.error('Error fetching communities list:', error);
      throw error;
    }
  }

  async getCommunity(communityId: string): Promise<Community> {
    const trimmedCommunityId = communityId?.trim();
    if (!trimmedCommunityId) {
      throw new Error('communityId is required');
    }

    const response = await apiClient.get<GetCommunityApiResponse>(
      `${this.communitiesEndpoint}/${encodeURIComponent(trimmedCommunityId)}`,
      undefined,
      true,
      false,
    );

    const isSuccess = response.success === true || response.status === 'success';
    const community = response.data?.community;
    if (!isSuccess || !community?.communityId?.trim()) {
      throw new Error(response.message || 'Comunidade não encontrada');
    }

    return community;
  }

  async getMyCommunityTermsAccepted(communityId: string): Promise<boolean> {
    try {
      if (!communityId?.trim()) {
        return false;
      }
      const endpoint = `${this.communitiesEndpoint}/${encodeURIComponent(communityId.trim())}/members/me/terms`;
      const response = await apiClient.get<{
        success?: boolean;
        data?: { hasTermsAccepted?: boolean };
      }>(endpoint, undefined, true, false);
      const raw = response.data?.hasTermsAccepted;
      if (typeof raw === 'boolean') {
        return raw;
      }
      if (response.success === false) {
        logger.warn('Resposta de termos sem payload esperado', { communityId });
      }
      return false;
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError?.status === 401 || apiError?.status === 404) {
        logger.warn('Aceite dos termos indisponível no momento; usando false como fallback', {
          communityId,
          status: apiError.status,
        });
        return false;
      }
      logger.error('Erro ao obter aceite dos termos da comunidade', { communityId, cause: error });
      return false;
    }
  }

  async updateMyCommunityTermsAccepted(communityId: string, hasTermsAccepted: boolean): Promise<boolean> {
    if (!communityId?.trim()) {
      throw new Error('Community ID is required');
    }
    const endpoint = `${this.communitiesEndpoint}/${encodeURIComponent(communityId.trim())}/members/me/terms`;
    const response = await apiClient.patch<{
      success?: boolean;
      data?: { hasTermsAccepted?: boolean };
      message?: string;
    }>(endpoint, { hasTermsAccepted }, true);
    const raw = response.data?.hasTermsAccepted;
    if (typeof raw === 'boolean') {
      return raw;
    }
    if (response.success === false) {
      throw new Error(response.message || 'Falha ao atualizar aceite dos termos');
    }
    return Boolean(hasTermsAccepted);
  }

  async joinCommunity(
    communityId: string,
  ): Promise<{ success: boolean; data?: { communityId: string; joined: boolean }; message?: string }> {
    try {
      if (!communityId || communityId.trim() === '') {
        throw new Error('Community ID is required');
      }

      const endpoint = `${this.communitiesEndpoint}/${communityId.trim()}/join`;
      const response = await apiClient.post<{
        success: boolean;
        data: { communityId: string; joined: boolean };
        message: string;
      }>(endpoint, undefined, true);

      logger.debug('Join community response:', { communityId, success: response.success });
      return response;
    } catch (error) {
      logger.error('Error joining community:', error);
      throw error;
    }
  }
}

export default new CommunityService();
