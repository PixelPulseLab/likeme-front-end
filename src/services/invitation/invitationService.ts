import apiClient from '@/services/infrastructure/apiClient';
import { logger } from '@/utils/logger';
import type { ApiResponse } from '@/types/infrastructure';
import type { InvitationCodeValidationContext } from '@/types/invitation/invitation';

function optionalImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapInvitationCodeValidationContext(
  data: InvitationCodeValidationContext | null | undefined,
): InvitationCodeValidationContext | null {
  if (!data?.code || !data.program?.id || !data.program.name || !data.provider?.id || !data.provider.name) {
    return null;
  }

  return {
    code: data.code,
    program: {
      id: data.program.id,
      name: data.program.name,
      imageUrl: optionalImageUrl(data.program.imageUrl),
    },
    provider: {
      id: data.provider.id,
      name: data.provider.name,
      logoUrl: optionalImageUrl(data.provider.logoUrl),
    },
    community: data.community?.id
      ? {
          id: data.community.id,
          displayName: data.community.displayName,
          imageUrl: optionalImageUrl(data.community.imageUrl),
        }
      : null,
  };
}

class InvitationService {
  private readonly validateEndpoint = '/api/invitations/validate';

  async validateCode(code: string): Promise<InvitationCodeValidationContext> {
    try {
      const response = await apiClient.post<ApiResponse<InvitationCodeValidationContext>>(
        this.validateEndpoint,
        { code },
        false,
      );
      const context = mapInvitationCodeValidationContext(response.data);
      if (!response.success || !context) {
        throw new Error(response.message?.trim() || 'Não foi possível validar o código de convite');
      }
      return context;
    } catch (error) {
      logger.error('[InvitationService] validateCode failed', { cause: error });
      throw error;
    }
  }
}

export const invitationService = new InvitationService();
