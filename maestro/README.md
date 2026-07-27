# Testes E2E com Maestro (staging, sem Auth0)

Suíte alinhada ao app atual: bypass E2E só com `.env.staging` + allowlist de backend.
**Produção é bloqueada** (`scripts/assert-e2e-staging-env.sh` + `isE2eAuthBypassEnabled`).

## Boas práticas aplicadas

| Prática | Como |
|---------|------|
| Seletores por `id` / testID | Prefixo `e2e.*` — não depender de copy i18n |
| Uma jornada por flow | Smoke, hub, welcome, profile… separados |
| Subflows DRY | `shared/bootstrap-*.yaml` via `runFlow` |
| Estado limpo | `launchApp: clearState + clearKeychain` + `permissions: all: allow` |
| Sem sleep cego | Nada de `waitForAnimationToEnd` em cascata; `assertVisible` / `extendedWaitUntil` |
| Tags | `smoke`, `critical`, `hub`, `onboarding`, `wip`… |
| Env params | `-e E2E_PRODUCT_ID=…` (defaults no runner) |
| WIP fora do gate | tag `wip` excluída por default |

Referências: [selectors](https://docs.maestro.dev/maestro-flows/flow-control-and-logic/how-to-use-selectors), [commands](https://docs.maestro.dev/api-reference/commands).

## Pré-requisitos

1. Maestro CLI (`~/.maestro/bin/maestro`)
2. Simulador iOS com o app (`appId: app.likeme.com`)
3. Build com staging:

```bash
npm run ios:staging
```

4. `.env.staging` com `EXPO_PUBLIC_E2E_AUTH_BYPASS=true` e backend preview (nunca produção).

## Estrutura

| Pasta | Uso |
|-------|-----|
| `flows/` | Asserts (gate) |
| `shared/` | Subflows de bootstrap |
| `export/` | Screenshots |
| `archive/` | Legados |
| `config.yaml` | Workspace (exclui `wip`) |

## Comandos

```bash
npm run test:e2e:staging      # flows/ (exclui wip)
npm run test:e2e:smoke        # --include-tags smoke
npm run test:e2e:critical     # smoke + hub críticos
npm run test:e2e:hub
npm run test:e2e:onboarding
npm run test:e2e:welcome
```

Seeds opcionais:

```bash
E2E_PRODUCT_ID=uuid E2E_COMMUNITY_ID=uuid npm run test:e2e:staging
```

## Bootstrap sem Auth0

- Botão **Continuar E2E** (`e2e.unauth.e2eContinue`) — onboarding completo → Summary
- `likeme://e2e/bootstrap` → Welcome
- `likeme://e2e/bootstrap?completeOnboarding=1` → Summary

## Seeds staging

| Var | Uso |
|-----|-----|
| `EXPO_PUBLIC_E2E_STAGING_TOKEN` | JWT descartável (APIs) |
| `E2E_PRODUCT_ID` / `E2E_COMMUNITY_ID` / `E2E_PROTOCOL_PRODUCT_ID` | Deep links |

## Android

Package: `com.likeme.app` — flows atuais são iOS.
