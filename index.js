import 'expo/src/Expo.fx';
import { Platform } from 'react-native';

// `package.json` main é `index.js` com extensão — o Metro não resolve `index.web.js`.
// Na web o entry é só o catálogo do DS; o app nativo continua em `index.native.js`.
if (Platform.OS === 'web') {
  const { registerRootComponent } = require('expo');
  const DesignSystemWebApp = require('./src/dev/DesignSystemWebApp').default;
  registerRootComponent(DesignSystemWebApp);
} else {
  require('./index.native');
}
