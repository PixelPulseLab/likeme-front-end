export function sharePathFromUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.includes('://')) {
    try {
      const parsed = new URL(trimmed);
      const scheme = parsed.protocol.replace(':', '');
      if (scheme === 'likeme') {
        const host = parsed.hostname;
        const pathname = parsed.pathname;
        if (!host && pathname && pathname !== '/') {
          return pathname.startsWith('/') ? pathname : `/${pathname}`;
        }
        if (host) {
          const suffix = pathname && pathname !== '/' ? (pathname.startsWith('/') ? pathname : `/${pathname}`) : '';
          return `/${host}${suffix}${parsed.search}`;
        }
        return null;
      }
      if (scheme !== 'http' && scheme !== 'https') {
        return null;
      }
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return null;
    }
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function shareQueryParamFromUrl(url: string, key: string): string | null {
  if (!url.includes('://')) {
    return null;
  }

  try {
    const value = new URL(url.trim()).searchParams.get(key)?.trim();
    return value || null;
  } catch {
    return null;
  }
}

export function shareEntityIdFromPath(path: string, pathPrefix: string): string | null {
  const normalizedPrefix = `${pathPrefix.replace(/^\/+/, '')}/`;
  const pathWithoutQuery = path.split('?')[0]?.split('#')[0] ?? path;
  const normalized = pathWithoutQuery.replace(/^\/+/, '');
  if (!normalized.startsWith(normalizedPrefix)) {
    return null;
  }

  const entityId = normalized.slice(normalizedPrefix.length).split('/')[0]?.trim();
  return entityId ? decodeURIComponent(entityId) : null;
}
