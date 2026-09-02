const { withGradleProperties } = require('@expo/config-plugins');

module.exports = function withGooglePayEnvironment(config) {
  const environment = process.env.EXPO_PUBLIC_GOOGLE_PAY_ENVIRONMENT === 'PRODUCTION' ? 'PRODUCTION' : 'TEST';

  return withGradleProperties(config, (modConfig) => {
    const withoutExisting = modConfig.modResults.filter((item) => {
      return !(item.type === 'property' && item.key === 'GOOGLE_PAY_ENVIRONMENT');
    });
    withoutExisting.push({
      type: 'property',
      key: 'GOOGLE_PAY_ENVIRONMENT',
      value: environment,
    });
    modConfig.modResults = withoutExisting;
    return modConfig;
  });
};
