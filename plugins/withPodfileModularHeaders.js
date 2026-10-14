const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const REQUIRED_PODS = [
  "pod 'GoogleUtilities', :modular_headers => true",
  "pod 'FirebaseCoreInternal', :modular_headers => true",
  "pod 'FirebaseABTesting', :modular_headers => true",
  "pod 'FirebaseRemoteConfig', :modular_headers => true",
  "pod 'JWTDecode', :modular_headers => true",
  "pod 'SimpleKeychain', :modular_headers => true",
  "pod 'Auth0', '2.19.0', :modular_headers => true",
];

const RN_FIREBASE_ANALYTICS_NO_AD_ID = '$RNFirebaseAnalyticsWithoutAdIdSupport = true';

const POST_INSTALL_MARKER = '# likeme-podfile-post-install';
const FMT_XCODE26_MARKER = '# likeme-fmt-xcode26-workaround';

const FMT_XCODE26_SNIPPET = `
    ${FMT_XCODE26_MARKER} — fmt 11.0.2 + Clang Xcode 26 (react-native#55601)
    fmt_base = File.join(installer.sandbox.root, 'fmt', 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base)
      content = File.read(fmt_base)
      unless content.include?('likeme-xcode26-fmt-workaround')
        patched = content.gsub(
          /(#elif defined\\(__cpp_consteval\\)\\s*\\n#\\s*define FMT_USE_CONSTEVAL)\\s+1/m,
          "// likeme-xcode26-fmt-workaround\\n\\\\1 0"
        )
        if patched != content
          File.chmod(0644, fmt_base)
          File.write(fmt_base, patched)
        end
      end
    end
    installer.pods_project.targets.each do |target|
      next unless target.name == 'fmt'

      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
      end
    end
`;

const POST_INSTALL_SNIPPET = `
    ${FMT_XCODE26_SNIPPET}
    ${POST_INSTALL_MARKER}
    deployment_target = podfile_properties['ios.deploymentTarget'] || '16.4'
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        current = config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        next if current.nil?

        if Gem::Version.new(current.to_s) < Gem::Version.new(deployment_target.to_s)
          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = deployment_target
        end
      end
    end

    %w[Auth0 A0Auth0 JWTDecode SimpleKeychain].each do |pod_name|
      target = installer.pods_project.targets.find { |t| t.name == pod_name }
      next unless target

      target.build_configurations.each do |config|
        config.build_settings['DEFINES_MODULE'] = 'YES'
      end
    end
`;

function ensureRnFirebaseAnalyticsWithoutAdIdSupport(contents) {
  if (contents.includes('$RNFirebaseAnalyticsWithoutAdIdSupport')) {
    return contents;
  }
  if (!contents.includes('prepare_react_native_project!')) {
    return contents;
  }
  return contents.replace(
    'prepare_react_native_project!',
    `${RN_FIREBASE_ANALYTICS_NO_AD_ID}\n\nprepare_react_native_project!`,
  );
}

function ensureLikemePostInstall(contents) {
  if (contents.includes(POST_INSTALL_MARKER) && contents.includes(FMT_XCODE26_MARKER)) {
    return contents;
  }

  if (contents.includes(POST_INSTALL_MARKER) && !contents.includes(FMT_XCODE26_MARKER)) {
    return contents.replace(POST_INSTALL_MARKER, `${FMT_XCODE26_SNIPPET}\n    ${POST_INSTALL_MARKER}`);
  }

  const anchors = [':ccache_enabled => ccache_enabled?(podfile_properties),', ':mac_catalyst_enabled => false,'];

  for (const anchor of anchors) {
    const anchorIdx = contents.indexOf(anchor);
    if (anchorIdx === -1) {
      continue;
    }

    const slice = contents.slice(anchorIdx);
    const closing = slice.match(/\n\s*\)\s*\n/);
    if (!closing) {
      continue;
    }

    const insertPos = anchorIdx + closing.index + closing[0].length;
    return contents.slice(0, insertPos) + POST_INSTALL_SNIPPET + contents.slice(insertPos);
  }

  return contents;
}

function withPodfileModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf-8');
      const original = contents;

      contents = ensureRnFirebaseAnalyticsWithoutAdIdSupport(contents);
      contents = ensureLikemePostInstall(contents);

      const appName = typeof config.name === 'string' ? config.name : 'LikeMe';
      const targetMarker = `target '${appName}' do`;
      if (contents.includes(targetMarker)) {
        const missingPods = REQUIRED_PODS.filter((line) => !contents.includes(line));
        if (missingPods.length > 0) {
          const injectedBlock = `${targetMarker}\n  ${missingPods.join('\n  ')}\n`;
          contents = contents.replace(targetMarker, injectedBlock);
        }
      }

      if (contents !== original) {
        fs.writeFileSync(podfilePath, contents);
      }
      return config;
    },
  ]);
}

module.exports = withPodfileModularHeaders;
