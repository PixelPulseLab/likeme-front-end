// Deve carregar antes de qualquer teste importar RNGH (mocks internos do pacote).
require('react-native-gesture-handler/jestSetup');

// Mock para react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');

// Defaults de ambiente para evitar warnings ruidosos nos testes
process.env.EXPO_PUBLIC_AUTH_PROXY_URL = process.env.EXPO_PUBLIC_AUTH_PROXY_URL || 'http://localhost/mock-auth-proxy';
process.env.EXPO_PUBLIC_AUTH_PROXY_PROJECT = process.env.EXPO_PUBLIC_AUTH_PROXY_PROJECT || 'likeme-front-end-test';

// Mock para expo-linear-gradient (evita carregar expo-modules-core ESM no Jest)
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...props }) => React.createElement(View, props, children),
  };
});

// Mock para expo-blur (ESM no Jest)
jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BlurView: (props) => React.createElement(View, props),
  };
});

// Mock para expo-image (puxa expo-modules-core ESM em tempo de teste)
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Image = React.forwardRef((props, ref) => React.createElement(View, { ...props, ref }));
  Image.prefetch = jest.fn(() => Promise.resolve());
  Image.clearMemoryCache = jest.fn(() => Promise.resolve());
  Image.clearDiskCache = jest.fn(() => Promise.resolve());
  return { Image };
});

// Mock para expo-calendar (ESM + módulo nativo)
jest.mock('expo-calendar', () => ({
  EntityTypes: { EVENT: 'event', REMINDER: 'reminder' },
  CalendarAccessLevel: { OWNER: 'owner', EDITOR: 'editor', ROOT: 'root' },
  SourceType: { LOCAL: 'local' },
  requestCalendarPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getDefaultCalendarAsync: jest.fn(() => Promise.resolve({ id: 'mock-calendar' })),
  getCalendarsAsync: jest.fn(() =>
    Promise.resolve([{ id: 'mock-calendar', allowsModifications: true, accessLevel: 'owner' }]),
  ),
  createCalendarAsync: jest.fn(() => Promise.resolve('mock-calendar')),
  createEventAsync: jest.fn(() => Promise.resolve('mock-event')),
}));

// Mock para color-matrix (ESM + módulo nativo; no Jest só precisa passar o children)
jest.mock('react-native-color-matrix-image-filters', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Passthrough = ({ children, style }) => React.createElement(View, { style }, children);
  return {
    Grayscale: Passthrough,
    ColorMatrix: Passthrough,
  };
});

// Mock para expo-auth-session
jest.mock('expo-auth-session', () => ({
  AuthRequest: jest.fn(),
  ResponseType: {},
  useAuthRequest: jest.fn(),
}));

// Mock para AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock para expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {},
  },
}));

jest.mock('expo-application', () => ({
  nativeApplicationVersion: null,
  nativeBuildVersion: null,
}));

// Mock para expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/',
  cacheDirectory: 'file:///mock/cache/',
}));

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///mock/',
  cacheDirectory: 'file:///mock/cache/',
  downloadAsync: jest.fn().mockResolvedValue({ uri: 'file:///mock/cache/file' }),
  getContentUriAsync: jest.fn().mockResolvedValue('content://mock/file'),
}));

jest.mock('react-native-video', () => {
  const React = require('react');
  const { View } = require('react-native');
  return React.forwardRef((props, ref) =>
    React.createElement(View, { testID: 'post-card-embedded-video', ...props, ref }),
  );
});

// Mock global para react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const ReactNative = require('react-native');
  return {
    SafeAreaView: ReactNative.View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Mock para @react-native-community/datetimepicker
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return jest.fn((props) => React.createElement(View, { testID: 'DateTimePicker', ...props }));
});

jest.mock('@/hooks/i18n', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      if (params) {
        return Object.entries(params).reduce((acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)), key);
      }
      return key;
    },
  }),
}));

const React = require('react');
const ReactNative = require('react-native');

// TouchableOpacity anima opacidade via Animated + native driver; no react-test-renderer isso estoura em fireEvent.press.
// O export de `react-native` usa getter; atribuição direta não substitui — precisa `defineProperty`.
const TestFriendlyTouchableOpacity = React.forwardRef((props, ref) => {
  const { activeOpacity: _activeOpacity, tvParallaxProperties: _tvParallaxProperties, ...pressableProps } = props;
  return React.createElement(ReactNative.Pressable, { ...pressableProps, ref });
});

Object.defineProperty(ReactNative, 'TouchableOpacity', {
  configurable: true,
  enumerable: true,
  writable: true,
  value: TestFriendlyTouchableOpacity,
});

jest.mock('@google/react-native-make-payment', () => ({
  PaymentRequest: jest.fn().mockImplementation(() => ({
    canMakePayment: jest.fn(() => Promise.resolve(false)),
    show: jest.fn(() => Promise.reject(new Error('Google Pay mock'))),
  })),
}));
