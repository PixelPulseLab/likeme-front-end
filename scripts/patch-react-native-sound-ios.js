/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const packageRoot = path.resolve(__dirname, '..', 'node_modules', 'react-native-sound');
const soundMmPath = path.join(packageRoot, 'ios', 'RNSound.mm');
const soundIndexPath = path.join(packageRoot, 'src', 'index.ts');

if (!fs.existsSync(soundMmPath)) {
  process.exit(0);
}

function readNewArchEnabled() {
  const propsPath = path.resolve(__dirname, '..', 'ios', 'Podfile.properties.json');
  if (!fs.existsSync(propsPath)) {
    return false;
  }
  try {
    const props = JSON.parse(fs.readFileSync(propsPath, 'utf8'));
    return props.newArchEnabled === true || props.newArchEnabled === 'true';
  } catch {
    return false;
  }
}

const newArchMarker = 'options:(JS::NativeSoundIOS::SoundOptionTypes &)options';
const legacyLine =
  'RCT_EXPORT_METHOD(prepare:(NSString *)fileName key:(double)key options:(NSDictionary *)options callback:(RCTResponseSenderBlock)callback ) {';
const newArchImport = '#ifdef RCT_NEW_ARCH_ENABLED\n#import <RNSoundSpec/RNSoundSpec.h>\n#endif\n';

let source = fs.readFileSync(soundMmPath, 'utf8');
const newArchEnabled = readNewArchEnabled();

if (!newArchEnabled && source.includes(newArchMarker)) {
  source = source.replace(
    /RCT_EXPORT_METHOD\(prepare:\(NSString \*\)fileName key:\(double\)key options:\(JS::NativeSoundIOS::SoundOptionTypes &\)options callback:\(RCTResponseSenderBlock\)callback \) \{/,
    legacyLine,
  );
  fs.writeFileSync(soundMmPath, source);
}

if (newArchEnabled && source.includes(newArchMarker) && !source.includes('#import <RNSoundSpec/RNSoundSpec.h>')) {
  source = source.replace('#import "RNSound.h"\n', `#import "RNSound.h"\n${newArchImport}`);
  fs.writeFileSync(soundMmPath, source);
}

// RN 0.76+ expõe __turboModuleProxy mesmo com newArchEnabled=false; o Spec iOS quebra prepare (SIGSEGV).
const turboBlockOld = `const SoundModule = global.__turboModuleProxy
  ? IsAndroid
    ? require("./NativeSoundAndroid").default
    : require("./NativeSoundIOS").default
  : NativeModules.RNSound;`;

const turboBlockNew = `const SoundModule =
  global.__turboModuleProxy && IsAndroid
    ? require("./NativeSoundAndroid").default
    : NativeModules.RNSound;`;

if (fs.existsSync(soundIndexPath)) {
  let indexSource = fs.readFileSync(soundIndexPath, 'utf8');
  if (indexSource.includes(turboBlockOld)) {
    indexSource = indexSource.replace(turboBlockOld, turboBlockNew);
    fs.writeFileSync(soundIndexPath, indexSource);
  }
}
