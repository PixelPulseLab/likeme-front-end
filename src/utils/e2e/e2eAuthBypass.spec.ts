import {
  backendHostFromBaseUrl,
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

describe('e2eAuthBypass', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_E2E_AUTH_BYPASS;
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
});
