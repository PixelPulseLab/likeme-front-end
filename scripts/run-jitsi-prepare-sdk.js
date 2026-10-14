/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const { spawnSync } = require('child_process');

function runJitsiPrepareSdk() {
  let jitsiRoot;
  try {
    jitsiRoot = path.dirname(require.resolve('@jitsi/react-native-sdk/package.json'));
  } catch {
    return;
  }

  const prepareScript = path.join(jitsiRoot, 'prepare_sdk.js');
  const result = spawnSync(process.execPath, [prepareScript], {
    cwd: jitsiRoot,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    console.warn('[run-jitsi-prepare-sdk] prepare_sdk.js terminou com código', result.status);
  }
}

runJitsiPrepareSdk();
