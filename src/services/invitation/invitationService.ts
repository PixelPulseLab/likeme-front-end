import apiClient from '@/services/infrastructure/apiClient';
import storageService from '@/services/auth/storageService';
import { logger } from '@/utils/logger';
import type { ApiResponse } from '@/types/infrastructure';
import type { InvitationActivationContext, InvitationCodeValidationContext } from '@/types/invitation/invitation';
import { INVITATION_CODE_VALIDATION_ERROR } from '@/constants/invitation/invitationCodeValidation';

export type PendingInvitationActivationOutcome = 'none' | 'linked' | 'mismatch' | 'failed';

function optionalImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalDisplayName(value: unknown): string | null {
  return optionalImageUrl(value);
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

function mapInvitationActivationContext(
  data: InvitationActivationContext | null | undefined,
): InvitationActivationContext | null {
  const context = mapInvitationCodeValidationContext(data);
  if (!context) {
    return null;
  }
  return {
    ...context,
    displayName: optionalDisplayName(data?.displayName),
    alreadyParticipating: data?.alreadyParticipating === true,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message.trim() : '';
}

export function isInvitationIdentityMismatchError(error: unknown): boolean {
  return errorMessage(error) === INVITATION_CODE_VALIDATION_ERROR.IDENTITY;
}

function isUnrecoverableInvitationActivationError(error: unknown): boolean {
  const message = errorMessage(error);
  return (
    message === INVITATION_CODE_VALIDATION_ERROR.INVALID ||
    message === INVITATION_CODE_VALIDATION_ERROR.EXPIRED ||
    message === INVITATION_CODE_VALIDATION_ERROR.CANCELLED ||
    message === INVITATION_CODE_VALIDATION_ERROR.REDEEMED ||
    message === INVITATION_CODE_VALIDATION_ERROR.PROGRAM_UNAVAILABLE
  );
}

async function applyInvitationDisplayNameIfEmpty(displayName: string | null): Promise<void> {
  const name = displayName?.trim();
  if (!name) {
    return;
  }
  const user = await storageService.getUser();
  if (!user || user.name?.trim() || user.nickname?.trim()) {
    return;
  }
  await storageService.setUser({ ...user, name });
}

class InvitationService {
  private readonly validateEndpoint = '/api/invitations/validate';
  private readonly activateEndpoint = '/api/invitations/activate';

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

  async activateCode(code: string): Promise<InvitationActivationContext> {
    try {
      const response = await apiClient.post<ApiResponse<InvitationActivationContext>>(this.activateEndpoint, {
        code,
      });
      const context = mapInvitationActivationContext(response.data);
      if (!response.success || !context) {
        throw new Error(response.message?.trim() || INVITATION_CODE_VALIDATION_ERROR.IDENTITY);
      }
      return context;
    } catch (error) {
      logger.error('[InvitationService] activateCode failed', { cause: error });
      throw error;
    }
  }

  async activatePendingStoredCode(): Promise<{
    outcome: PendingInvitationActivationOutcome;
    context?: InvitationActivationContext;
  }> {
    const code = await storageService.getPendingInvitationCode();
    if (!code) {
      return { outcome: 'none' };
    }

    try {
      const context = await this.activateCode(code);
      await storageService.removePendingInvitationCode();
      await applyInvitationDisplayNameIfEmpty(context.displayName);
      return { outcome: 'linked', context };
    } catch (error) {
      logger.error('[InvitationService] activatePendingStoredCode failed', { cause: error });
      if (isInvitationIdentityMismatchError(error) || isUnrecoverableInvitationActivationError(error)) {
        await storageService.removePendingInvitationCode();
        return { outcome: isInvitationIdentityMismatchError(error) ? 'mismatch' : 'failed' };
      }
      return { outcome: 'failed' };
    }
  }
}

export const invitationService = new InvitationService();
