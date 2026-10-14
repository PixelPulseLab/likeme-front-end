/* eslint-disable no-new-func -- config.js da 8x8 é script executável; o loadConfig worklet do SDK quebra no Metro */
import { loadScript } from '@jitsi/react-native-sdk/react/features/base/util/loadScript.native';
import logger from '@jitsi/react-native-sdk/react/features/base/lib-jitsi-meet/logger';

export * from '@jitsi/react-native-sdk/react/features/base/lib-jitsi-meet/functions.any';

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
    logger.info(`Config loaded from ${url}`);
    return config;
  } catch (err) {
    logger.error(`Failed to load config from ${url}`, err);
    throw err;
  }
}
