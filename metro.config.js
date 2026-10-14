// Carrega variáveis de ambiente do .env antes de processar o código
// Isso garante que process.env.EXPO_PUBLIC_* esteja disponível durante o build do Metro
require('dotenv').config();

const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');
const { resolve: resolveMetroModule } = require('metro-resolver');

const config = getDefaultConfig(__dirname);

const jitsiSdkRoot = path.dirname(require.resolve('@jitsi/react-native-sdk/package.json'));
const jitsiNodeModules = path.join(jitsiSdkRoot, 'node_modules');
const JITSI_SDK_PATH_SEGMENT = `${path.sep}@jitsi${path.sep}react-native-sdk${path.sep}`;
const REACT_NAVIGATION_PREFIX = '@react-navigation/';
const jitsiReactNativeSoundStub = path.resolve(__dirname, 'src/infrastructure/jitsi/jitsiReactNativeSoundStub.ts');
const jitsiLibJitsiMeetFunctionsNative = path.resolve(
  __dirname,
  'src/infrastructure/jitsi/jitsiLibJitsiMeetFunctions.native.ts',
);

const libJitsiMeetFunctionsPattern = /lib-jitsi-meet\/functions(\.native)?$/;

// Enable SVG transformer so `import Logo from './logo.svg'` works
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

const previousResolveRequest = config.resolver.resolveRequest;

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
  resolveRequest: (context, moduleName, platform) => {
    const originModulePath = context.originModulePath ?? '';
    const isFromJitsiSdk =
      originModulePath.startsWith(`${jitsiSdkRoot}${path.sep}`) || originModulePath.includes(JITSI_SDK_PATH_SEGMENT);

    if (moduleName === 'react-native-sound') {
      return { type: 'sourceFile', filePath: jitsiReactNativeSoundStub };
    }

    const normalizedModule = moduleName.replace(/\\/g, '/');
    if (moduleName === './functions.native' && originModulePath.includes(`${path.sep}lib-jitsi-meet${path.sep}`)) {
      return { type: 'sourceFile', filePath: jitsiLibJitsiMeetFunctionsNative };
    }
    if (libJitsiMeetFunctionsPattern.test(normalizedModule)) {
      return { type: 'sourceFile', filePath: jitsiLibJitsiMeetFunctionsNative };
    }

    if (isFromJitsiSdk && moduleName.startsWith(REACT_NAVIGATION_PREFIX)) {
      const nestedPackageDir = path.join(jitsiNodeModules, moduleName);
      if (fs.existsSync(nestedPackageDir)) {
        try {
          const filePath = require.resolve(moduleName, { paths: [jitsiNodeModules] });
          return { type: 'sourceFile', filePath };
        } catch {
          // fall through to default resolver
        }
      }
    }

    if (previousResolveRequest) {
      return previousResolveRequest(context, moduleName, platform);
    }

    return resolveMetroModule(context, moduleName, platform);
  },
  alias: {
    'react-native-sound': jitsiReactNativeSoundStub,
    '@': path.resolve(__dirname, 'src'),
    '@/assets': path.resolve(__dirname, 'assets'),
    '@/components': path.resolve(__dirname, 'src/components'),
    '@/screens': path.resolve(__dirname, 'src/screens'),
    '@/navigation': path.resolve(__dirname, 'src/navigation'),
    '@/services': path.resolve(__dirname, 'src/services'),
    '@/constants': path.resolve(__dirname, 'src/constants'),
    '@/types': path.resolve(__dirname, 'types'),
  },
};

// Configuração específica para resolver assets com aliases
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
