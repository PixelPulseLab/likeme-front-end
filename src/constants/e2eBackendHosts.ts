/** Hosts de API de produção — E2E auth bypass nunca pode ativar nestes. */
export const E2E_PRODUCTION_BACKEND_HOSTS = ['likeme-back-end-one.vercel.app'] as const;

/**
 * Hosts/padrões aceitos para E2E (staging/preview/local).
 * Preview Vercel do time: `*pixel-pulse-labs.vercel.app` (hífen antes de pixel).
 */
export const E2E_STAGING_BACKEND_HOST_MARKERS = ['pixel-pulse-labs.vercel.app'] as const;
