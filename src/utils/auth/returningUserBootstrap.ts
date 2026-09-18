import { AuthService } from '@/services';
import { hydrateI18nFromCache, startI18nHydration } from '@/i18n/hydration';
import { logger } from '@/utils/logger';
import { isE2eAuthBypassEnabled } from '@/utils/e2e/e2eAuthBypass';

export type ReturningUserBootstrapResult = {
  hadStoredToken: boolean;
  shouldAuthenticate: boolean;
};

export async function runReturningUserBootstrap(storedToken: string): Promise<ReturningUserBootstrapResult> {
  void startI18nHydration('pt-BR');
  void hydrateI18nFromCache('pt-BR');

  if (isE2eAuthBypassEnabled()) {
    return {
      hadStoredToken: true,
      shouldAuthenticate: true,
    };
  }

  try {
    const session = await AuthService.bootstrapBackendSession();
    return {
      hadStoredToken: Boolean(storedToken),
      shouldAuthenticate: session.ok,
    };
  } catch (error) {
    logger.error('[returningUserBootstrap] Erro ao renovar sessão', error);
    return {
      hadStoredToken: Boolean(storedToken),
      shouldAuthenticate: false,
    };
  }
}
