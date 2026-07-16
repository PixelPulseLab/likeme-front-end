import * as AuthSession from 'expo-auth-session';
import { AUTH0_CONFIG, AUTH_CONFIG, getApiUrl } from '@/config';
import { AUTH_BOOTSTRAP_HTTP_TIMEOUT_MS, AUTH_LOGOUT_AND_POLICY_HTTP_TIMEOUT_MS } from '@/constants';
import { invalidateApiClientAuthTokenMemoryCache } from '@/services/infrastructure/apiClient';
import notificationService from '@/services/notification/notificationService';
import { clearPublicUserCache } from '@/services/user/publicUserCache';
import { fetchWithTimeout } from '@/utils/network/fetchWithTimeout';
import { setOnboardingStep } from './setOnboardingStep';
import storageService from './storageService';
import { logger } from '@/utils/logger';
import type { AuthResult } from '@/types/auth';
import { LoginUserAbortError, isLoginUserAbortError } from '@/utils/auth/loginUserAbort';

const AUTH0_DISCOVERY_TIMEOUT_MS = 15_000;
const AUTH0_TOKEN_EXCHANGE_TIMEOUT_MS = 20_000;
const AUTH0_USERINFO_TIMEOUT_MS = 15_000;
const AUTH_BACKEND_LOGIN_TIMEOUT_MS = 25_000;
const AUTH0_REFRESH_TOKEN_TIMEOUT_MS = 20_000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise.finally(() => {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
      }),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${label} timeout (${timeoutMs}ms)`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

class AuthService {
  private getTokenUrl(): string {
    return `https://${AUTH0_CONFIG.domain}/oauth/token`;
  }

  private getUserInfoUrl(): string {
    return `https://${AUTH0_CONFIG.domain}/userinfo`;
  }

  /**
   * Retorna sempre a mesma URL de callback para o Auth0, para que você não precise
   * atualizar Allowed Callback/Logout URLs no Auth0 a cada deploy.
   * - Com proxy: https://auth.expo.dev/@pixelpulselab/likeme-front-end (fixo)
   * - Sem proxy: likeme://auth (fixo, scheme + path do app)
   */
  private getRedirectUri(): string {
    if (AUTH_CONFIG.useAuthProxy && AUTH_CONFIG.proxyUrl) {
      void this._getProjectNameForProxy(); // usado para resolver project name quando necessário
      return AUTH_CONFIG.proxyUrl.trim().replace(/\/$/, '');
    }
    const scheme = AUTH_CONFIG.scheme || 'likeme';
    const path = AUTH_CONFIG.redirectPath || 'auth';
    return `${scheme}://${path}`;
  }

  async login(): Promise<AuthResult> {
    try {
      if (AUTH0_CONFIG.domain === 'your-auth0-domain.auth0.com' || AUTH0_CONFIG.clientId === 'your-auth0-client-id') {
        throw new Error(
          'Configuração do Auth0 não encontrada. Verifique as variáveis de ambiente EXPO_PUBLIC_AUTH0_DOMAIN, EXPO_PUBLIC_AUTH0_CLIENT_ID e EXPO_PUBLIC_AUTH0_AUDIENCE.',
        );
      }

      logger.debug('[AuthService] login start', { domain: AUTH0_CONFIG.domain, redirectUri: this.getRedirectUri() });

      let discovery;
      try {
        discovery = await withTimeout(
          AuthSession.fetchDiscoveryAsync(`https://${AUTH0_CONFIG.domain}`),
          AUTH0_DISCOVERY_TIMEOUT_MS,
          'Auth0 discovery',
        );
      } catch (error) {
        logger.error('Discovery error:', error);
        if (error instanceof Error && error.message.includes('timeout')) {
          throw new Error(
            `Auth0 não respondeu a tempo (discovery). Verifique rede, domínio ${AUTH0_CONFIG.domain} e se o emulador tem acesso à internet.`,
          );
        }
        if (error instanceof Error && error.message.includes('JSON')) {
          throw new Error(`Erro ao conectar com Auth0. Verifique se o domínio ${AUTH0_CONFIG.domain} está correto.`);
        }
        throw error;
      }

      if (!discovery) {
        throw new Error('Falha ao descobrir endpoints do Auth0');
      }

      logger.debug('[AuthService] Auth0 discovery ok');

      const redirectUri = this.getRedirectUri();
      logger.debug('[AuthService] redirect', { useAuthProxy: AUTH_CONFIG.useAuthProxy, redirectUri });

      const baseExtraParams: Record<string, string> = {
        ui_locales: 'pt-BR',
        prompt: 'login',
        max_age: '0',
      };

      const extraParams =
        AUTH0_CONFIG.audience && AUTH0_CONFIG.audience !== 'your-api-identifier'
          ? { ...baseExtraParams, audience: AUTH0_CONFIG.audience }
          : baseExtraParams;

      const request = new AuthSession.AuthRequest({
        clientId: AUTH0_CONFIG.clientId,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.Code,
        redirectUri,
        usePKCE: true,
        extraParams,
      });

      logger.debug('[AuthService] AuthRequest.redirectUri', request.redirectUri);

      logger.debug('[AuthService] prompting AuthSession');
      const result = await request.promptAsync(discovery, {
        preferEphemeralSession: true,
      });
      logger.debug('[AuthService] prompt result', { type: result.type });

      if (result.type !== 'success') {
        if (result.type === 'cancel' || result.type === 'dismiss') {
          throw new LoginUserAbortError();
        }
        if (result.type === 'error') {
          const error = (result as any).error;
          const errorDescription =
            error?.description || error?.error_description || error?.message || 'Erro desconhecido';
          logger.error('Auth error details:', errorDescription);

          if (errorDescription.includes('Service not found') || errorDescription.includes('your-api-identifier')) {
            throw new Error(
              'Configuração do Auth0 Audience incorreta. Verifique a variável EXPO_PUBLIC_AUTH0_AUDIENCE no arquivo .env e configure com o identifier da sua API no Auth0 Dashboard.',
            );
          }

          throw new Error(`Falha na autenticação: ${errorDescription}`);
        }
        throw new Error(`Falha na autenticação. Tipo: ${result.type}`);
      }

      let tokenResponse;
      try {
        logger.debug('[AuthService] exchanging authorization code for tokens', {
          hasCode: typeof result.params.code === 'string' && result.params.code.length > 0,
          hasState: typeof result.params.state === 'string' && result.params.state.length > 0,
        });

        const codeVerifier = (request as any).codeVerifier;
        if (!codeVerifier) {
          throw new Error('code_verifier não encontrado no request. O PKCE pode não ter sido gerado corretamente.');
        }
        logger.debug('[AuthService] PKCE code_verifier disponível');

        tokenResponse = await withTimeout(
          AuthSession.exchangeCodeAsync(
            {
              clientId: AUTH0_CONFIG.clientId,
              code: result.params.code,
              redirectUri: this.getRedirectUri(),
              extraParams: {
                code_verifier: codeVerifier,
              },
            },
            discovery,
          ),
          AUTH0_TOKEN_EXCHANGE_TIMEOUT_MS,
          'Auth0 token exchange',
        );
        logger.debug('[AuthService] token exchange concluído');
      } catch (error) {
        logger.error('Token exchange error:', error);
        if (error instanceof Error) {
          if (error.message.includes('code_verifier') || error.message.includes('codeVerifier')) {
            throw new Error(
              'Erro PKCE: O code_verifier não foi encontrado. Isso pode acontecer se a sessão foi perdida. Tente fazer login novamente.',
            );
          }
          if (error.message.includes('JSON')) {
            throw new Error('Erro ao processar resposta do Auth0. Verifique a configuração do cliente e do audience.');
          }
          throw new Error(`Erro ao trocar código por token: ${error.message}`);
        }
        throw new Error('Erro ao trocar código por token');
      }

      if (!tokenResponse.idToken) {
        logger.debug('Token response:', JSON.stringify(tokenResponse, null, 2));
        throw new Error(
          'Erro de configuração: idToken não foi retornado pelo Auth0. Verifique a configuração do audience.',
        );
      }

      logger.debug('[AuthService] idToken recebido', { length: tokenResponse.idToken.length });

      const userInfoResponse = await fetchWithTimeout(
        this.getUserInfoUrl(),
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.accessToken}`,
          },
        },
        AUTH0_USERINFO_TIMEOUT_MS,
      );

      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        logger.error('UserInfo error response:', errorText);
        throw new Error(`Falha ao obter informações do usuário: ${userInfoResponse.status}`);
      }

      const contentType = userInfoResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await userInfoResponse.text();
        logger.error('UserInfo não retornou JSON:', responseText.substring(0, 200));
        throw new Error('Resposta inválida do servidor Auth0');
      }

      const userInfo = await userInfoResponse.json();

      return {
        accessToken: tokenResponse.accessToken,
        idToken: tokenResponse.idToken,
        refreshToken: tokenResponse.refreshToken,
        user: {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        },
      };
    } catch (error) {
      if (isLoginUserAbortError(error)) {
        throw error;
      }

      try {
        await storageService.clearAll();
        invalidateApiClientAuthTokenMemoryCache();
      } catch (clearError) {
        logger.warn('Falha ao limpar sessão local após erro de login', { cause: clearError });
      }

      logger.error('Login error:', error);
      logger.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro desconhecido durante o login');
    }
  }

  private _getProjectNameForProxy(): string | undefined {
    if (AUTH_CONFIG.projectNameForProxy) {
      return AUTH_CONFIG.projectNameForProxy;
    }

    // Lazy import do Constants para evitar problemas durante a inicialização
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- dynamic optional dependency
      const Constants = require('expo-constants').default;
      const expoConfig = Constants?.expoConfig;
      if (!expoConfig) {
        return undefined;
      }

      if (expoConfig.originalFullName) {
        return expoConfig.originalFullName;
      }

      if (expoConfig.owner && expoConfig.slug) {
        return `@${expoConfig.owner}/${expoConfig.slug}`;
      }

      if (expoConfig.slug) {
        return expoConfig.slug;
      }
    } catch (error) {
      // Silenciosamente ignora erros se Constants não estiver disponível
    }

    return undefined;
  }

  async refreshToken(refreshToken: string): Promise<string> {
    try {
      const response = await fetchWithTimeout(
        this.getTokenUrl(),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            client_id: AUTH0_CONFIG.clientId,
            refresh_token: refreshToken,
          }),
        },
        AUTH0_REFRESH_TOKEN_TIMEOUT_MS,
      );

      if (!response.ok) {
        throw new Error('Falha ao renovar token');
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw new Error('Falha ao renovar token.');
    }
  }

  async validateToken(authResult: AuthResult): Promise<any> {
    try {
      const url = getApiUrl('/api/auth/login');
      logger.debug('[AuthService] validateToken → backend', {
        url,
        idTokenLength: authResult.idToken.length,
        idTokenParts: authResult.idToken.split('.').length,
      });

      // Decode token header to check for kid
      try {
        const tokenParts = authResult.idToken.split('.');
        if (tokenParts.length >= 2) {
          const header = JSON.parse(
            (globalThis as typeof globalThis & { atob: (s: string) => string }).atob(tokenParts[0]),
          );
          logger.debug('[AuthService] JWT header', { hasKid: !!header.kid, alg: header.alg });
        }
      } catch (decodeError) {
        logger.error('[AuthService] Falha ao decodificar header do idToken antes do login no backend', decodeError);
      }

      const response = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idToken: authResult.idToken,
            user: authResult.user,
          }),
        },
        AUTH_BACKEND_LOGIN_TIMEOUT_MS,
      );

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;

        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            const errorText = await response.text();
            logger.error('Backend error response:', errorText.substring(0, 200));
            errorMessage = errorText.substring(0, 100) || errorMessage;
          }
        } else {
          const errorText = await response.text();
          logger.error('Backend error response (not JSON):', errorText.substring(0, 200));
        }

        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        logger.error('Backend não retornou JSON:', responseText.substring(0, 200));
        throw new Error('Resposta inválida do servidor');
      }

      const backendResponse = await response.json();

      const sessionToken =
        backendResponse.token ||
        backendResponse.accessToken ||
        backendResponse.data?.token ||
        backendResponse.data?.accessToken;

      if (sessionToken) {
        await storageService.setToken(sessionToken);
      } else {
        logger.warn('Backend não retornou token de sessão. Usando accessToken do Auth0.');
        await storageService.setToken(authResult.accessToken);
      }

      await storageService.clearLocalUserDataIfOwnerChanged(authResult.user.email);

      await storageService.setUser({
        ...authResult.user,
        picture:
          (typeof backendResponse.data?.user?.avatar === 'string' && backendResponse.data.user.avatar.trim()) ||
          authResult.user.picture,
      });

      await setOnboardingStep(backendResponse);

      invalidateApiClientAuthTokenMemoryCache();

      return backendResponse;
    } catch (error) {
      logger.error('Backend communication error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Falha na comunicação com o servidor.');
    }
  }

  /**
   * GET /api/auth/token: valida o token guardado, persiste o JWT de sessão do backend quando a API o devolve
   * e aplica `data.onboarding` no storage (com fallback ao formato antigo no mesmo nível que `token`).
   */
  async refreshBackendSessionFromStoredCredentials(): Promise<{
    ok: boolean;
    responseBody: Record<string, unknown> | null;
  }> {
    try {
      const token = await storageService.getToken();
      if (!token) {
        return { ok: false, responseBody: null };
      }
      const response = await fetchWithTimeout(
        getApiUrl('/api/auth/token'),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
        AUTH_BOOTSTRAP_HTTP_TIMEOUT_MS,
      );
      if (!response.ok) {
        return { ok: false, responseBody: null };
      }
      const data = (await response.json()) as Record<string, unknown>;
      await setOnboardingStep(data);
      const payload = data.data ?? data;
      const sessionTokenCandidate =
        (typeof payload === 'object' &&
          payload !== null &&
          ((payload as Record<string, unknown>).token ?? (payload as Record<string, unknown>).accessToken)) ??
        data.token ??
        data.accessToken;
      const sessionToken = typeof sessionTokenCandidate === 'string' ? sessionTokenCandidate : null;
      if (sessionToken && sessionToken.length > 0) {
        await storageService.setToken(sessionToken);
        invalidateApiClientAuthTokenMemoryCache();
      }
      return { ok: true, responseBody: data };
    } catch (error) {
      logger.warn('[AuthService] refreshBackendSessionFromStoredCredentials falhou', { cause: error });
      return { ok: false, responseBody: null };
    }
  }

  async logout(): Promise<void> {
    try {
      try {
        await notificationService.unregisterDevice();
      } catch (error) {
        logger.warn('[Auth] Falha ao desregistar push FCM antes do logout', { cause: error });
      }
      try {
        const token = await storageService.getToken();
        if (token) {
          try {
            const response = await fetchWithTimeout(
              getApiUrl('/api/auth/logout'),
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              },
              AUTH_LOGOUT_AND_POLICY_HTTP_TIMEOUT_MS,
            );
            if (!response.ok) {
              logger.warn('Backend logout retornou status não-sucesso', { status: response.status });
            }
          } catch (error) {
            logger.warn('Erro ao fazer logout no backend (rede ou timeout)', { cause: error });
          }
        }
      } catch (error) {
        logger.warn('Erro ao preparar logout no backend:', { cause: error });
      }

      await storageService.clearAll();
      invalidateApiClientAuthTokenMemoryCache();
      clearPublicUserCache();
    } catch (error) {
      logger.error('Logout error:', error);
      await storageService.clearAll();
      invalidateApiClientAuthTokenMemoryCache();
      clearPublicUserCache();
    }
  }

  async logoutFromBackend(): Promise<void> {
    return this.logout();
  }

  /**
   * Registra o aceite da política de privacidade no backend (atualiza privacyPolicyAcceptedAt do usuário).
   * @param acceptedAt Data/hora do aceite em ISO 8601 (ex: new Date().toISOString()). Enviada ao backend para persistência.
   */
  async acceptPrivacyPolicy(acceptedAt: string): Promise<void> {
    const token = await storageService.getToken();
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    const response = await fetchWithTimeout(
      getApiUrl('/api/auth/accept-privacy-policy'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ acceptedAt }),
      },
      AUTH_LOGOUT_AND_POLICY_HTTP_TIMEOUT_MS,
    );
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Não foi possível registrar o aceite da política de privacidade.');
    }
  }
}

export default new AuthService();
