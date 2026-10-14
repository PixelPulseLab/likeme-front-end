/* eslint-disable no-new-func -- config.js da 8x8 é script executável; o loadConfig worklet do SDK quebra no Metro */
export * from '@jitsi/react-native-sdk/react/features/base/lib-jitsi-meet/functions.any';

async function loadScript(url: string, timeoutMs: number, skipEval: boolean): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (response.status !== 200) {
      throw new Error(`loadScript error: ${response.statusText}`);
    }
    const text = await response.text();
    if (skipEval) {
      return text;
    }
    throw new Error('loadScript skipEval=false não suportado no stub LikeMe');
  } finally {
    clearTimeout(timer);
  }
}

function parseConfigText(configText: string): Record<string, unknown> {
  const runConfigScript = new Function(
    `${configText}\n; return (typeof config !== "undefined" ? config : globalThis.config);`,
  );
  const configObj = runConfigScript();

  if (configObj == null || typeof configObj !== 'object') {
    throw new Error('config is not an object');
  }

  return configObj as Record<string, unknown>;
}

export async function loadConfig(url: string): Promise<object> {
  try {
    const configText = await loadScript(url, 10 * 1000, true);
    const config = parseConfigText(String(configText));
    return config;
  } catch (err) {
    console.error(`[Jitsi] Failed to load config from ${url}`, err);
    throw err;
  }
}
