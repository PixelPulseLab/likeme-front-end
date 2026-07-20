const E2E_BOOTSTRAP_PATH = '/e2e/bootstrap';

/** Path-only check — sem side-effects / imports pesados (seguro para testes de share). */
export function isE2eBootstrapDeepLinkPath(path: string | null): boolean {
  if (!path) {
    return false;
  }
  const pathOnly = path.split('?')[0] ?? path;
  return pathOnly === E2E_BOOTSTRAP_PATH;
}
