# Testes E2E com Maestro (staging, sem Auth0)

Suíte alinhada ao app atual: bypass E2E só com `.env.staging` + allowlist de backend.
**Produção é bloqueada** (`scripts/assert-e2e-staging-env.sh` + `isE2eAuthBypassEnabled`).

## Boas práticas aplicadas

| Prática | Como |
|---------|------|
| Seletores por `id` / testID | Prefixo `e2e.*` — não depender de copy i18n |
| Uma jornada por flow | Smoke, hub, welcome, profile… separados |
| Subflows DRY | `shared/launch-app.yaml` + `shared/bootstrap-*.yaml` via `runFlow` |
| Estado limpo | `launchApp: clearKeychain` + `permissions: all: allow` |
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

4. `.env.staging` com `EXPO_PUBLIC_E2E_AUTH_BYPASS=true` e backend de staging (nunca produção).

O Metro precisa subir com `ENV_FILE_PATH` apontando para `.env.staging` (é o que `npm run ios:staging` faz); com `.env` o bypass fica desligado e o app manda o Maestro para a tela do Auth0.

`clearState` não é usado nos flows: em build de dev client ele descarta o dev server salvo e o app trava no launcher do Expo ("No development servers found"). O `shared/launch-app.yaml` limpa keychain, dispensa o modal do dev menu e o prompt de permissões; a sessão é sobrescrita pelo seed do bootstrap E2E.

O app aponta para o alias estável `https://likeme-back-end-staging.vercel.app`. Alias de branch (`…-git-<branch>-…`) fica preso ao último commit daquela branch e pode ficar meses desatualizado em relação ao banco de staging — o login quebra com `P2021 table does not exist`. Para apontar o alias a um deployment novo:

```bash
vercel alias set <deployment-url> likeme-back-end-staging.vercel.app
```

## Estrutura

| Pasta | Uso |
|-------|-----|
| `flows/` | Asserts (gate) |
| `flows/checkout/` | Pedido real (fora do gate) |
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
npm run test:e2e:login         # sessão Duda (JWT staging)
npm run test:e2e:checkout     # pedido real (Pagarme sandbox); fora do gate
```

Seeds opcionais:

```bash
E2E_PRODUCT_ID=uuid E2E_COMMUNITY_ID=uuid npm run test:e2e:staging
```

## Bootstrap sem Auth0

- Deep link `likeme://e2e/bootstrap?completeOnboarding=1&token=…&email=…` — onboarding completo → Summary
- `likeme://e2e/bootstrap` → Welcome
- Botão **Continuar E2E** (`e2e.unauth.e2eContinue`) ainda existe na build staging, mas o bootstrap autenticado usa o deep link

Conta de staging dos testes de login/checkout: `duda@pixelpulselab.dev` (user `5521d990-1b22-4ee6-af47-20cabb7aa0d8`). JWT e e-mail ficam em `.env.staging` (`EXPO_PUBLIC_E2E_STAGING_TOKEN`, `EXPO_PUBLIC_E2E_STAGING_EMAIL`). O Auth0 Management API não aceita `client_credentials` neste client — não dá para criar senha Auth0 por aqui; a sessão E2E é o JWT do backend.

`npm run test:e2e:login` prova a sessão: entra pelo deep link, abre o menu de perfil e confere `${E2E_LOGIN_EMAIL}` na conta logada.

## Seeds staging

| Var | Uso |
|-----|-----|
| `EXPO_PUBLIC_E2E_STAGING_TOKEN` / `E2E_STAGING_TOKEN` | JWT da conta Duda (APIs autenticadas) |
| `EXPO_PUBLIC_E2E_STAGING_EMAIL` / `E2E_LOGIN_EMAIL` | `duda@pixelpulselab.dev` |
| `EXPO_PUBLIC_E2E_STAGING_NAME` / `E2E_LOGIN_NAME` | `Duda Weber` |
| `E2E_PRODUCT_ID` / `E2E_COMMUNITY_ID` / `E2E_PROTOCOL_PRODUCT_ID` | Deep links |
| `E2E_CHECKOUT_PRODUCT_ID` | Produto físico de staging para checkout pago/recusado |
| `E2E_CHECKOUT_PROTOCOL_PRODUCT_ID` | Protocolo de staging para assinatura no checkout |
| `E2E_CARD_CVV` | `123` aprova; `651` recusa no simulador PSP |

Checkout real (`maestro/flows/checkout/`) não entra em `test:e2e:staging`: cobra Pagarme sandbox e dispara e-mail transacional. Requer `EXPO_PUBLIC_E2E_STAGING_TOKEN` válido.

```bash
npm run test:e2e:checkout
```

## Android

Package: `com.likeme.app` — flows atuais são iOS.
