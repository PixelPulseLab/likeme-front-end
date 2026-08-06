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
