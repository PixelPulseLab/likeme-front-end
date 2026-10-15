# CI/CD — Build e submit para lojas

Workflow em `build.yml`: testes → aprovação manual → build Android (Gradle) + iOS (Xcode) → submit Play Store / App Store Connect.

**Builds via Gradle (Android) e Xcode (iOS).** Versões vêm de `app.version.json` (fonte única).

## Configuração

### Environment `store-submit`

1. **Settings** → **Environments** → **New environment**
2. Nome: `store-submit`
3. **Required reviewers** com quem pode aprovar o envio para lojas

O job **Aprovar envio para lojas** pausa até aprovação; builds e submits seguem depois.

### Secrets (repositório)

**Android (build + assinatura)**

| Secret | Notas |
|--------|--------|
| `ANDROID_KEYSTORE_BASE64` | Keystore upload key (base64, uma linha) |
| `ANDROID_KEYSTORE_STORE_PASSWORD` | Senha do keystore |
| `ANDROID_KEYSTORE_KEY_PASSWORD` | Senha da chave |
| `ANDROID_KEYSTORE_KEY_ALIAS` | Alias da chave (ex. UUID da upload key) |

**Android (submit Play Store)**

| Secret | Notas |
|--------|--------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Service account com acesso à Play Console |

**iOS (build + submit)**

| Secret | Notas |
|--------|--------|
| `IOS_CERTIFICATE_P12_BASE64` | Certificado de distribuição |
| `IOS_CERTIFICATE_PASSWORD` | Senha do P12 |
| `KEYCHAIN_PASSWORD` | Senha temporária do keychain no runner |
| `IOS_PROVISIONING_PROFILE_BASE64` | Perfil App Store (opcional; fallback manual só no export) |
| `ASC_API_KEY_P8` | Conteúdo do `.p8` App Store Connect |
| `ASC_API_KEY_ID` | ID da chave (ex. `74BTTLL273`) |
| `ASC_API_ISSUER_ID` | Issuer UUID (Integrations) |

## Versões (`app.version.json`)

Antes de cada release, **incremente manualmente**:

- **Android:** `android.versionCode` — inteiro **maior** que o último publicado na Play (consulte Play Console → Versões).
- **iOS:** `ios.buildNumber` — maior que o último na App Store Connect.

Depois edite só `app.version.json` e rode `npm run version:sync` (o CI roda isso automaticamente antes do Gradle/Xcode).

## Fluxo do workflow

1. **Cancel previous waiting runs** — `force_cancel` de runs anteriores (inclui Waiting por aprovação do `store-submit`; o `cancel-in-progress` nativo não cobre esse estado)
2. **Test & Lint** — `npm run lint`, `npm test`
3. **Aprovar envio para lojas** — gate manual (`store-submit`)
4. **Build Android** — Gradle `bundleRelease` + keystore dos secrets
5. **Build iOS** — Xcode 26, archive + export IPA
6. **Submit Android** — faixa `internal` na Play Store
7. **iOS App Store Pipeline** — validate + upload via ASC API

## Pontos frágeis (release 1.23+ / Jitsi)

| Fase | O que acontece | Falha típica | Mitigação no repo |
|------|----------------|--------------|-------------------|
| `npm ci` → `postinstall` | Patches RN/Jitsi; `prepare_sdk.js` só se SDK veio do monorepo jitsi-meet | `ENOENT ../images` no npm registry | `run-jitsi-prepare-sdk.js` pula se `images/` + módulos Android já existem no pacote |
| Android Gradle | `@jitsi/react-native-sdk` exige `rootProject.ext.gradlePluginVersion` | Config project | `android/build.gradle` `ext { gradlePluginVersion, compileSdk… }` |
| Android Kotlin | `react-native-splash-view` (dep Jitsi) + RN 0.85 | `currentActivity` | `patch-react-native-splash-view-android.js` no postinstall |
| Android bundle | Metro ~5k módulos + Hermes bytecode | `hermesc` / OOM no runner | Bundle isolado, Gradle serializado, `NODE_OPTIONS` alto |
| iOS `npm ci` | Antes: `pod install` no postinstall **e** de novo após prebuild | Clone git Firebase (`curl 56`) | `SKIP_IOS_POD_INSTALL=true` no job iOS; `ios:pod-install:store` só após `ci-revopush-prebuild.sh` |
| Gate de qualidade | pre-push: `version:check` + testes + `npm run build` | TS quebrado só na loja | CI **Test & Lint** roda `npm run build` (tsc + lint) |

### Ordem iOS no CI (importante)

1. `npm ci` (sem CocoaPods)
2. `version:sync`, certificados, ASC key, perfil
3. `ci-revopush-prebuild.sh ios` — `expo prebuild --no-install`
4. `npm run ios:pod-install:store`
5. Xcode build → archive → export

### Ordem Android no CI

1. `npm ci` (postinstall aplica patches + Jitsi prepare)
2. `version:sync`, `ci-revopush-prebuild.sh android`, keystore
3. Validar/chmod `hermesc` em `node_modules/hermes-compiler/hermesc/linux64-bin/` (RN 0.85)
4. `:app:createBundleReleaseJsAndAssets` (serializado)
5. `:app:bundleRelease` (assinatura via secrets)

### O pre-push **não** compila nativo

Hook Husky: versão, Jest, typecheck + lint. **Não** roda Gradle nem Xcode. Erros nativos só aparecem no job **Build Android / Build iOS**. Após mudar deps nativas (Jitsi, Firebase, Expo SDK), vale `./gradlew :app:bundleRelease` local ou re-run do workflow.

### Upgrades de `@jitsi/react-native-sdk` / React Native

Revisar: README do SDK (Android `gradlePluginVersion`, permissões), scripts em `scripts/patch-*`, e se novos módulos Kotlin usam APIs removidas do RN (padrão `reactApplicationContext.currentActivity`).
