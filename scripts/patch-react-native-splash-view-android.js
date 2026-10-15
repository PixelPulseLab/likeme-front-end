const fs = require('fs');
const path = require('path');

const splashRoot = path.resolve(__dirname, '..', 'node_modules', 'react-native-splash-view', 'android');

const targets = [
  path.join(splashRoot, 'src', 'oldarch', 'java', 'com', 'splashview', 'SplashViewModuleOld.kt'),
  path.join(splashRoot, 'src', 'newarch', 'java', 'com', 'splashview', 'SplashViewModuleNew.kt'),
];

const broken = 'currentActivity?.let { SplashView.showSplashView(it) }';
const fixed = 'reactApplicationContext.currentActivity?.let { SplashView.showSplashView(it) }';

for (const filePath of targets) {
  if (!fs.existsSync(filePath)) {
    continue;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  if (source.includes(fixed)) {
    continue;
  }
  if (!source.includes(broken)) {
    console.warn('[patch-react-native-splash-view-android] padrão inesperado em', filePath);
    continue;
  }

  fs.writeFileSync(filePath, source.replace(broken, fixed));
}
