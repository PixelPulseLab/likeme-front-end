// Não chamar `dotenv` no topo: o Jest define `NODE_ENV=test` antes do Babel; um `.env` com
// `NODE_ENV=development` sobrescrevia e quebrava o preset de testes (AST inválido no Jest).

const moduleResolverPlugin = [
  'module-resolver',
  {
    root: ['./src'],
    alias: {
      '@': './src',
      '@/assets': './assets',
      '@/components': './src/components',
      '@/screens': './src/screens',
      '@/navigation': './src/navigation',
      '@/services': './src/services',
      '@/constants': './src/constants',
      '@/types': './types',
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.svg'],
  },
];

module.exports = function (api) {
  api.cache.using(() => process.env.NODE_ENV ?? 'development');
  const isTest =
    process.env.NODE_ENV === 'test' ||
    (typeof process.env.JEST_WORKER_ID === 'string' && process.env.JEST_WORKER_ID !== '') ||
    process.argv.some((arg) => String(arg).replace(/\\/g, '/').endsWith('/jest-cli/bin/jest.js')) ||
    process.argv.some((arg) => String(arg).replace(/\\/g, '/').endsWith('/jest/bin/jest.js'));

  if (isTest) {
    return {
      presets: ['module:@react-native/babel-preset'],
      plugins: [moduleResolverPlugin],
    };
  }

  require('dotenv').config();

  return {
    presets: ['babel-preset-expo'],
    plugins: [moduleResolverPlugin, 'react-native-worklets-core/plugin'],
  };
};
