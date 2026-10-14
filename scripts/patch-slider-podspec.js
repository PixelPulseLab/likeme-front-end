/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const podspecPath = path.resolve(
  __dirname,
  '..',
  'node_modules',
  '@react-native-community',
  'slider',
  'react-native-slider.podspec',
);

if (!fs.existsSync(podspecPath)) {
  process.exit(0);
}

const archGuard = "if ENV['RCT_NEW_ARCH_ENABLED'] != '1'";
const targetLine = '  s.source_files = "ios/**/*.{h,m,mm}"';
const patchBlock = `${targetLine}
  ${archGuard}
    s.exclude_files = [
      "ios/RNCSliderComponentView.h",
      "ios/RNCSliderComponentView.mm",
    ]
  end`;

let source = fs.readFileSync(podspecPath, 'utf8');

if (source.includes('unless new_arch_enabled')) {
  source = source.replace(/unless new_arch_enabled/g, archGuard);
  fs.writeFileSync(podspecPath, source);
  process.exit(0);
}

if (source.includes(archGuard)) {
  process.exit(0);
}

if (!source.includes(targetLine)) {
  process.exit(0);
}

const patched = source.replace(targetLine, patchBlock);
fs.writeFileSync(podspecPath, patched);
