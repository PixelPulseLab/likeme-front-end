import { CommonActions, type NavigationContainerRefWithCurrent } from '@react-navigation/native';
import storageService from '@/services/auth/storageService';
import { invalidateApiClientAuthTokenMemoryCache } from '@/services/infrastructure/apiClient';
import type { RootStackParamList } from '@/types/navigation';
import { e2eStagingTokenFromEnv, isE2eAuthBypassEnabled } from '@/utils/e2e/e2eAuthBypass';
import { isE2eBootstrapDeepLinkPath } from '@/utils/e2e/isE2eBootstrapDeepLinkPath';
import { logger } from '@/utils/logger';

/** Placeholder só para navegação UI quando não há JWT staging; APIs autenticadas falham. */
const E2E_PLACEHOLDER_TOKEN = 'e2e-staging-placeholder-token';

export type BootstrapE2eSessionOptions = {
  /** Se true, marca onboarding completo e cai em Home/Summary. */
  completeOnboarding?: boolean;
  token?: string;
  email?: string;
  name?: string;
};

type NavigationLike =
  | NavigationContainerRefWithCurrent<RootStackParamList>
  | { dispatch: (action: ReturnType<typeof CommonActions.reset>) => void; reset?: (state: object) => void };

export { isE2eBootstrapDeepLinkPath };

export function bootstrapOptionsFromDeepLinkUrl(url: string): BootstrapE2eSessionOptions {
  try {
    const parsed = new URL(url.trim());
    return {
      completeOnboarding: parsed.searchParams.get('completeOnboarding') === '1',
      token: parsed.searchParams.get('token') ?? undefined,
      email: parsed.searchParams.get('email') ?? undefined,
      name: parsed.searchParams.get('name') ?? undefined,
    };
  } catch {
    return {};
  }
}

export async function seedE2eSession(options: BootstrapE2eSessionOptions = {}): Promise<void> {
  if (!isE2eAuthBypassEnabled()) {
    throw new Error('seedE2eSession bloqueado: E2E auth bypass desabilitado ou backend inválido');
  }

  const tokenFromEnv = e2eStagingTokenFromEnv();
  const token = (options.token ?? (tokenFromEnv || E2E_PLACEHOLDER_TOKEN)).trim();
  const email = (options.email ?? 'e2e-staging@likeme.local').trim();
  const name = (options.name ?? 'E2E Staging').trim();
  const now = new Date().toISOString();

  await storageService.setToken(token);
  await storageService.setUser({ email, name, nickname: name });
  invalidateApiClientAuthTokenMemoryCache();

  if (options.completeOnboarding) {
    await storageService.setWelcomeScreenAccessedAt(now);
    await storageService.setPrivacyPolicyAcceptedAt(now);
    await storageService.setRegisterCompletedAt(now);
    await storageService.setObjectivesSelectedAt(now);
  }

  logger.info('[e2e] Sessão E2E seedada', {
    completeOnboarding: Boolean(options.completeOnboarding),
    email,
    hasRealToken: token !== E2E_PLACEHOLDER_TOKEN,
  });
}

export function resetNavigationToAuthenticated(navigation: NavigationLike): void {
  const action = CommonActions.reset({
    index: 0,
    routes: [{ name: 'Authenticated' }],
  });
  navigation.dispatch(action);
}

export async function bootstrapE2eSessionAndNavigate(
  navigation: NavigationLike,
  options: BootstrapE2eSessionOptions = {},
): Promise<void> {
  await seedE2eSession(options);
  resetNavigationToAuthenticated(navigation);
}
