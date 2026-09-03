import { AuthService } from '@/services';
import { hydrateI18nFromCache, startI18nHydration } from '@/i18n/hydration';
import type { AppReleasePolicy } from '@/types/app/appReleasePolicy';
import { logger } from '@/utils/logger';
import { isE2eAuthBypassEnabled } from '@/utils/e2e/e2eAuthBypass';

export type ReturningUserBootstrapResult = {
  hadStoredToken: boolean;
  shouldAuthenticate: boolean;
  releasePolicy: AppReleasePolicy | null;
  serverMustUpdate: boolean | null;
  serverRecommendUpdate: boolean | null;
};

export async function runReturningUserBootstrap(
  storedToken: string,
  installedVersion: string,
): Promise<ReturningUserBootstrapResult> {
  void startI18nHydration('pt-BR');
  void hydrateI18nFromCache('pt-BR');

  if (isE2eAuthBypassEnabled()) {
    return {
      hadStoredToken: true,
      shouldAuthenticate: true,
      releasePolicy: null,
      serverMustUpdate: null,
      serverRecommendUpdate: null,
    };
  }

  try {
    const session = await AuthService.bootstrapBackendSession({ installedVersion });
    return {
      hadStoredToken: Boolean(storedToken),
      shouldAuthenticate: session.ok,
      releasePolicy: session.releasePolicy,
      serverMustUpdate: session.serverMustUpdate,
      serverRecommendUpdate: session.serverRecommendUpdate,
    };
  } catch (error) {
    logger.error('[returningUserBootstrap] Erro ao renovar sessão', error);
    return {
      hadStoredToken: Boolean(storedToken),
      shouldAuthenticate: false,
      releasePolicy: null,
      serverMustUpdate: null,
      serverRecommendUpdate: null,
    };
  }
}
