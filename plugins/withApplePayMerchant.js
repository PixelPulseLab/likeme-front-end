const { withEntitlementsPlist } = require('@expo/config-plugins');

module.exports = function withApplePayMerchant(config) {
  const merchantIds = config.ios?.entitlements?.['com.apple.developer.in-app-payments'];

  return withEntitlementsPlist(config, (modConfig) => {
    if (Array.isArray(merchantIds) && merchantIds.length > 0) {
      modConfig.modResults['com.apple.developer.in-app-payments'] = merchantIds;
    }
    return modConfig;
  });
};
