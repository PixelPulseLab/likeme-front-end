/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const functionsNativePath = path.resolve(
  __dirname,
  '..',
  'node_modules',
  '@jitsi',
  'react-native-sdk',
  'react',
  'features',
  'base',
  'lib-jitsi-meet',
  'functions.native.ts',
);

const marker = 'workletContext.createRunAsync';

if (!fs.existsSync(functionsNativePath)) {
  process.exit(0);
}

let source = fs.readFileSync(functionsNativePath, 'utf8');
if (!source.includes(marker)) {
  process.exit(0);
}

const replacement = `import { loadScript } from '../util/loadScript.native';

import logger from './logger';

export * from './functions.any';

function parseConfigText(configText: string): Record<string, unknown> {
    const configObj = eval(
        '(function(){\\n'
        + configText
        + '\\n; return (typeof config !== "undefined" ? config : globalThis.config); })()'
    );

    if (configObj == null || typeof configObj !== 'object') {
        throw new Error('config is not an object');
    }

    return configObj as Record<string, unknown>;
}

export async function loadConfig(url: string): Promise<Object> {
    try {
        const configText = await loadScript(url, 10 * 1000, true);
        const config = parseConfigText(String(configText));

        logger.info(\`Config loaded from \${url}\`);

        return config;
    } catch (err) {
        logger.error(\`Failed to load config from \${url}\`, err);

        throw err;
    }
}
`;

fs.writeFileSync(functionsNativePath, replacement);
