import {
  backendHostFromBaseUrl,
  e2eStagingEmailFromEnv,
  e2eStagingNameFromEnv,
  e2eStagingTokenFromEnv,
  isE2eAuthBypassEnabled,
  isProductionBackendHost,
  isStagingOrPreviewBackendHost,
} from '@/utils/e2e/e2eAuthBypass';

jest.mock('@/config/environment', () => ({
  BACKEND_CONFIG: { baseUrl: 'https://likeme-back-end-staging.vercel.app/' },
  getEnvVarFromConstants: jest.fn(() => undefined),
}));

jest.mock('@/utils/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

const { BACKEND_CONFIG } = jest.requireMock('@/config/environment') as {
  BACKEND_CONFIG: { baseUrl: string };
  getEnvVarFromConstants: jest.Mock;
};
const { getEnvVarFromConstants } = jest.requireMock('@/config/environment') as {
  getEnvVarFromConstants: jest.Mock;
};

describe('e2eAuthBypass', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_E2E_AUTH_BYPASS;
    delete process.env.E2E_STAGING_TOKEN;
    delete process.env.EXPO_PUBLIC_E2E_STAGING_TOKEN;
    delete process.env.E2E_LOGIN_EMAIL;
    delete process.env.EXPO_PUBLIC_E2E_STAGING_EMAIL;
    delete process.env.E2E_LOGIN_NAME;
    delete process.env.EXPO_PUBLIC_E2E_STAGING_NAME;
    getEnvVarFromConstants.mockReturnValue(undefined);
    BACKEND_CONFIG.baseUrl = 'https://likeme-back-end-staging.vercel.app/';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('detecta host de produção', () => {
    expect(isProductionBackendHost('likeme-back-end-one.vercel.app')).toBe(true);
    expect(isStagingOrPreviewBackendHost('likeme-back-end-one.vercel.app')).toBe(false);
  });

  it('aceita preview Vercel e localhost', () => {
    expect(isStagingOrPreviewBackendHost('likeme-back-end-git-x-pixel-pulse-labs.vercel.app')).toBe(true);
    expect(isStagingOrPreviewBackendHost('localhost')).toBe(true);
    expect(backendHostFromBaseUrl('https://foo.pixel-pulse-labs.vercel.app/')).toBe('foo.pixel-pulse-labs.vercel.app');
  });

  it('bloqueia bypass em produção mesmo com flag', () => {
    process.env.EXPO_PUBLIC_E2E_AUTH_BYPASS = 'true';
    BACKEND_CONFIG.baseUrl = 'https://likeme-back-end-one.vercel.app/';
    expect(isE2eAuthBypassEnabled()).toBe(false);
  });

  it('ativa bypass em preview com flag', () => {
    process.env.EXPO_PUBLIC_E2E_AUTH_BYPASS = 'true';
    expect(isE2eAuthBypassEnabled()).toBe(true);
  });

  it('desliga sem flag', () => {
    expect(isE2eAuthBypassEnabled()).toBe(false);
  });

  it('não lê credenciais de staging do manifesto público do Expo', () => {
    getEnvVarFromConstants.mockImplementation((key: string) => `manifest-${key}`);
    process.env.EXPO_PUBLIC_E2E_STAGING_TOKEN = 'public-token';
    process.env.EXPO_PUBLIC_E2E_STAGING_EMAIL = 'public@example.com';
    process.env.EXPO_PUBLIC_E2E_STAGING_NAME = 'Public Name';

    expect(e2eStagingTokenFromEnv()).toBe('');
    expect(e2eStagingEmailFromEnv()).toBe('');
    expect(e2eStagingNameFromEnv()).toBe('');
  });

  it('lê credenciais de staging apenas do ambiente do runner', () => {
    process.env.E2E_STAGING_TOKEN = ' runner-token ';
    process.env.E2E_LOGIN_EMAIL = ' duda@example.com ';
    process.env.E2E_LOGIN_NAME = ' Duda ';

    expect(e2eStagingTokenFromEnv()).toBe('runner-token');
    expect(e2eStagingEmailFromEnv()).toBe('duda@example.com');
    expect(e2eStagingNameFromEnv()).toBe('Duda');
  });
});
