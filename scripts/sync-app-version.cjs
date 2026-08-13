/**
 * Sincroniza app.version.json → package.json, nativos, CHANGELOG.md e constantes TS.
 * Fonte única: edite apenas app.version.json e rode `npm run version:sync`.
 *
 * Uso:
 *   node scripts/sync-app-version.cjs          # aplica sync
 *   node scripts/sync-app-version.cjs --check  # falha se artefatos estiverem desatualizados
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const versionFilePath = path.join(projectRoot, 'app.version.json');
const changelogFilePath = path.join(projectRoot, 'CHANGELOG.md');
const generatedConstantsPath = path.join(projectRoot, 'src', 'constants', 'appVersion.generated.ts');
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageLockPath = path.join(projectRoot, 'package-lock.json');
const androidGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');
const iosInfoPlistPath = path.join(projectRoot, 'ios', 'LikeMe', 'Info.plist');
const iosPbxprojPath = path.join(projectRoot, 'ios', 'LikeMe.xcodeproj', 'project.pbxproj');

const isCheckMode = process.argv.includes('--check');

const CHANGELOG_SECTION_ORDER = [
  ['added', 'Adicionado'],
  ['changed', 'Alterado'],
  ['deprecated', 'Obsoleto'],
  ['removed', 'Removido'],
  ['fixed', 'Corrigido'],
  ['security', 'Segurança'],
];

const CHANGELOG_HEADER = `# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

`;

function normalizeChangelogSections(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  const sections = {};
  for (const [key] of CHANGELOG_SECTION_ORDER) {
    const items = raw[key];
    if (!Array.isArray(items)) {
      continue;
    }
    const normalized = items.map((item) => String(item ?? '').trim()).filter(Boolean);
    if (normalized.length > 0) {
      sections[key] = normalized;
    }
  }
  return sections;
}

function readAppVersion() {
  const raw = fs.readFileSync(versionFilePath, 'utf8');
  const data = JSON.parse(raw);

  const version = String(data.version ?? '').trim();
  const releasedAt = String(data.releasedAt ?? '').trim();
  const androidVersionCode = Number(data.android?.versionCode);
  const iosBuildNumber = Number(data.ios?.buildNumber);
  const changelogSections = normalizeChangelogSections(data.changelog);

  if (!version) {
    throw new Error('[sync-app-version] app.version.json: "version" é obrigatório.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(releasedAt)) {
    throw new Error('[sync-app-version] app.version.json: "releasedAt" deve ser YYYY-MM-DD.');
  }
  if (!Number.isInteger(androidVersionCode) || androidVersionCode < 1) {
    throw new Error('[sync-app-version] app.version.json: android.versionCode deve ser inteiro >= 1.');
  }
  if (!Number.isInteger(iosBuildNumber) || iosBuildNumber < 1) {
    throw new Error('[sync-app-version] app.version.json: ios.buildNumber deve ser inteiro >= 1.');
  }
  if (Object.keys(changelogSections).length === 0) {
    throw new Error(
      '[sync-app-version] app.version.json: "changelog" precisa de ao menos uma seção com itens (added, changed, fixed, etc.).',
    );
  }

  return {
    version,
    releasedAt,
    androidVersionCode,
    iosBuildNumber,
    iosBuildNumberText: String(iosBuildNumber),
    changelogSections,
  };
}

function formatVersionChangelogSection(appVersion) {
  const lines = [`## [${appVersion.version}] - ${appVersion.releasedAt}`, ''];

  for (const [key, title] of CHANGELOG_SECTION_ORDER) {
    const items = appVersion.changelogSections[key];
    if (!items?.length) {
      continue;
    }
    lines.push(`### ${title}`);
    for (const item of items) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

function buildChangelogMarkdownContent(appVersion, sourceContent) {
  const newSection = formatVersionChangelogSection(appVersion);
  const versionHeading = `## [${appVersion.version}]`;

  let content = sourceContent ?? CHANGELOG_HEADER;
  if (!content.startsWith('# Changelog')) {
    content = `${CHANGELOG_HEADER}${content.trim()}\n\n`;
  }

  const versionSectionStart = content.indexOf(versionHeading);
  if (versionSectionStart >= 0) {
    const nextVersionMatch = content.slice(versionSectionStart + versionHeading.length).match(/\n## \[/);
    const versionSectionEnd =
      nextVersionMatch?.index != null
        ? versionSectionStart + versionHeading.length + nextVersionMatch.index
        : content.length;

    content = `${content.slice(0, versionSectionStart).trimEnd()}\n\n${newSection}\n\n${content
      .slice(versionSectionEnd)
      .trimStart()}`.trimEnd();
  } else {
    const unreleasedIndex = content.indexOf('## [Unreleased]');
    if (unreleasedIndex >= 0) {
      const afterUnreleased = content.indexOf('\n', unreleasedIndex);
      content = `${content.slice(0, afterUnreleased + 1)}\n${newSection}\n\n${content.slice(afterUnreleased + 1).trimStart()}`;
    } else {
      content = `${content.trimEnd()}\n\n${newSection}\n`;
    }
  }

  return `${content.trimEnd()}\n`;
}

function buildAppVersionGeneratedContent(appVersion) {
  return `// Gerado por scripts/sync-app-version.cjs — não editar manualmente.
// Fonte: app.version.json
// Changelog: CHANGELOG.md (sem UI no app).

export const APP_VERSION = '${appVersion.version}' as const;
`;
}

function buildPackageJsonContent(appVersion) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  pkg.version = appVersion.version;
  return `${JSON.stringify(pkg, null, 2)}\n`;
}

function buildPackageLockContent(appVersion) {
  const lock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
  lock.version = appVersion.version;
  if (lock.packages?.['']) {
    lock.packages[''].version = appVersion.version;
  }
  return `${JSON.stringify(lock, null, 2)}\n`;
}

function buildAndroidGradleContent(appVersion) {
  let content = fs.readFileSync(androidGradlePath, 'utf8');
  content = content.replace(/versionCode\s+\d+/, `versionCode ${appVersion.androidVersionCode}`);
  content = content.replace(/versionName\s+"[^"]*"/, `versionName "${appVersion.version}"`);
  return content;
}

function buildIosInfoPlistContent(appVersion) {
  let content = fs.readFileSync(iosInfoPlistPath, 'utf8');
  content = content.replace(
    /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*(<\/string>)/,
    `$1${appVersion.version}$2`,
  );
  content = content.replace(
    /(<key>CFBundleVersion<\/key>\s*<string>)[^<]*(<\/string>)/,
    `$1${appVersion.iosBuildNumberText}$2`,
  );
  return content;
}

function buildIosPbxprojContent(appVersion) {
  let content = fs.readFileSync(iosPbxprojPath, 'utf8');
  content = content.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${appVersion.version};`);
  content = content.replace(
    /CURRENT_PROJECT_VERSION = [^;]+;/g,
    `CURRENT_PROJECT_VERSION = ${appVersion.iosBuildNumberText};`,
  );
  return content;
}

function readFileIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
}

function assertFileContent({ label, filePath, expected, optional = false }) {
  if (!fs.existsSync(filePath)) {
    if (optional) {
      return null;
    }
    return { label, filePath, reason: 'arquivo ausente' };
  }

  const actual = fs.readFileSync(filePath, 'utf8');
  if (actual !== expected) {
    return { label, filePath };
  }

  return null;
}

function checkAppVersionSync(appVersion) {
  const mismatches = [];

  const changelogSource = readFileIfExists(changelogFilePath) ?? CHANGELOG_HEADER;
  const changelogMismatch = assertFileContent({
    label: 'CHANGELOG.md',
    filePath: changelogFilePath,
    expected: buildChangelogMarkdownContent(appVersion, changelogSource),
  });
  if (changelogMismatch) {
    mismatches.push(changelogMismatch);
  }

  const generatedMismatch = assertFileContent({
    label: 'appVersion.generated.ts',
    filePath: generatedConstantsPath,
    expected: buildAppVersionGeneratedContent(appVersion),
  });
  if (generatedMismatch) {
    mismatches.push(generatedMismatch);
  }

  const packageJsonMismatch = assertFileContent({
    label: 'package.json (version)',
    filePath: packageJsonPath,
    expected: buildPackageJsonContent(appVersion),
  });
  if (packageJsonMismatch) {
    mismatches.push(packageJsonMismatch);
  }

  if (fs.existsSync(packageLockPath)) {
    const packageLockMismatch = assertFileContent({
      label: 'package-lock.json (version)',
      filePath: packageLockPath,
      expected: buildPackageLockContent(appVersion),
    });
    if (packageLockMismatch) {
      mismatches.push(packageLockMismatch);
    }
  }

  if (fs.existsSync(androidGradlePath)) {
    const androidMismatch = assertFileContent({
      label: 'android/app/build.gradle',
      filePath: androidGradlePath,
      expected: buildAndroidGradleContent(appVersion),
    });
    if (androidMismatch) {
      mismatches.push(androidMismatch);
    }
  }

  if (fs.existsSync(iosInfoPlistPath)) {
    const iosPlistMismatch = assertFileContent({
      label: 'ios/LikeMe/Info.plist',
      filePath: iosInfoPlistPath,
      expected: buildIosInfoPlistContent(appVersion),
    });
    if (iosPlistMismatch) {
      mismatches.push(iosPlistMismatch);
    }
  }

  if (fs.existsSync(iosPbxprojPath)) {
    const iosPbxMismatch = assertFileContent({
      label: 'ios/LikeMe.xcodeproj/project.pbxproj',
      filePath: iosPbxprojPath,
      expected: buildIosPbxprojContent(appVersion),
    });
    if (iosPbxMismatch) {
      mismatches.push(iosPbxMismatch);
    }
  }

  return mismatches;
}

function syncChangelogMarkdown(appVersion) {
  const source = readFileIfExists(changelogFilePath) ?? CHANGELOG_HEADER;
  fs.writeFileSync(changelogFilePath, buildChangelogMarkdownContent(appVersion, source), 'utf8');
}

function syncAppVersionGenerated(appVersion) {
  fs.writeFileSync(generatedConstantsPath, buildAppVersionGeneratedContent(appVersion), 'utf8');
}

function syncPackageJson(appVersion) {
  fs.writeFileSync(packageJsonPath, buildPackageJsonContent(appVersion), 'utf8');
}

function syncPackageLock(appVersion) {
  if (!fs.existsSync(packageLockPath)) {
    return;
  }
  fs.writeFileSync(packageLockPath, buildPackageLockContent(appVersion), 'utf8');
}

function syncAndroidGradle(appVersion) {
  fs.writeFileSync(androidGradlePath, buildAndroidGradleContent(appVersion), 'utf8');
}

function syncIosInfoPlist(appVersion) {
  fs.writeFileSync(iosInfoPlistPath, buildIosInfoPlistContent(appVersion), 'utf8');
}

function syncIosPbxproj(appVersion) {
  fs.writeFileSync(iosPbxprojPath, buildIosPbxprojContent(appVersion), 'utf8');
}

function runSync(appVersion) {
  syncPackageJson(appVersion);
  syncPackageLock(appVersion);
  if (fs.existsSync(androidGradlePath)) {
    syncAndroidGradle(appVersion);
  }
  if (fs.existsSync(iosInfoPlistPath)) {
    syncIosInfoPlist(appVersion);
  }
  if (fs.existsSync(iosPbxprojPath)) {
    syncIosPbxproj(appVersion);
  }
  syncChangelogMarkdown(appVersion);
  syncAppVersionGenerated(appVersion);

  const changelogItemCount = Object.values(appVersion.changelogSections).reduce(
    (total, items) => total + items.length,
    0,
  );

  console.log(
    `[sync-app-version] OK → ${appVersion.version} (${appVersion.releasedAt}, ${changelogItemCount} itens no changelog)`,
  );
  console.log(
    `[sync-app-version] Android ${appVersion.androidVersionCode}, iOS ${appVersion.iosBuildNumberText} · CHANGELOG.md e appVersion.generated.ts atualizados.`,
  );
  console.log('[sync-app-version] app.config.js lê app.version.json em tempo de execução.');
  console.log(
    `[sync-app-version] Jira: issues sem label v* em Awaiting Version / Em análise → v${appVersion.version} (./scripts/sync-jira-version-labels.mjs --apply)`,
  );
}

function runCheck(appVersion) {
  const mismatches = checkAppVersionSync(appVersion);
  if (mismatches.length === 0) {
    console.log(`[sync-app-version] check OK → ${appVersion.version} em sync com CHANGELOG.md e artefatos.`);
    return;
  }

  console.error('[sync-app-version] check falhou: artefatos desatualizados em relação a app.version.json:\n');
  for (const mismatch of mismatches) {
    const reason = mismatch.reason ? ` (${mismatch.reason})` : '';
    console.error(`  - ${mismatch.label}: ${path.relative(projectRoot, mismatch.filePath)}${reason}`);
  }
  console.error('\nRode: npm run version:sync');
  process.exit(1);
}

function main() {
  const appVersion = readAppVersion();

  if (isCheckMode) {
    runCheck(appVersion);
    return;
  }

  runSync(appVersion);
}

main();
