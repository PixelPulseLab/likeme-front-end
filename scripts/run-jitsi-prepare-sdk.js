const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function jitsiSdkAssetsPresent(jitsiRoot) {
  const markers = [
    path.join(jitsiRoot, 'images'),
    path.join(jitsiRoot, 'android', 'src', 'main', 'java', 'org', 'jitsi', 'meet', 'sdk', 'AppInfoModule.java'),
  ];
  return markers.every((filePath) => fs.existsSync(filePath));
}

function jitsiMonorepoSourcesPresent(jitsiRoot) {
  return fs.existsSync(path.join(jitsiRoot, '..', 'images'));
}

function runJitsiPrepareSdk() {
  let jitsiRoot;
  try {
    jitsiRoot = path.dirname(require.resolve('@jitsi/react-native-sdk/package.json'));
  } catch {
    return;
  }

  if (jitsiSdkAssetsPresent(jitsiRoot)) {
    return;
  }

  if (!jitsiMonorepoSourcesPresent(jitsiRoot)) {
    const message =
      '[run-jitsi-prepare-sdk] SDK sem assets e sem monorepo jitsi-meet (../images); reinstale @jitsi/react-native-sdk';
    if (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true') {
      console.error(message);
      process.exit(1);
    }
    console.warn(message);
    return;
  }

  const prepareScript = path.join(jitsiRoot, 'prepare_sdk.js');
  const result = spawnSync(process.execPath, [prepareScript], {
    cwd: jitsiRoot,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    const message = `[run-jitsi-prepare-sdk] prepare_sdk.js terminou com código ${result.status}`;
    if (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true') {
      console.error(message);
      process.exit(result.status ?? 1);
    }
    console.warn(message);
    return;
  }

  if (!jitsiSdkAssetsPresent(jitsiRoot)) {
    const message = '[run-jitsi-prepare-sdk] prepare_sdk.js terminou mas assets do SDK ainda ausentes';
    if (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true') {
      console.error(message);
      process.exit(1);
    }
    console.warn(message);
  }
}

runJitsiPrepareSdk();
