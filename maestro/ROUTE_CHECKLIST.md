# Checklist de rotas RootNavigator × Maestro (staging)

Legenda: OK = flow assertivo · DL = deep link · UI = só abertura de tela · SKIP = fora de escopo

| Rota | Cobertura | Flow |
|------|-----------|------|
| Loading | OK | smoke-launch |
| Unauthenticated | OK | smoke / bootstrap |
| Authenticated | OK | bootstrap |
| Welcome | OK | welcome-screen, onboarding-flow |
| AppPresentation | UI (pós Welcome) | onboarding-flow |
| PrivacyPolicies | UI | onboarding-flow |
| Register | UI | onboarding-flow |
| Plans | SKIP (fora do fluxo ativo) | — |
| InterestCategories | seed completo | interest-categories |
| Home / Summary | OK | hub-nav, smoke |
| Activities | OK | activities, hub-nav |
| Community / CommunityList | OK | community, hub-nav |
| PostDetail | DL (precisa seed) | deep-links |
| Marketplace | OK | marketplace-browse |
| ProductDetails | DL | deep-links |
| AffiliateProduct | DL | deep-links |
| ProviderProfile | DL | deep-links |
| Cart / Checkout | UI parcial | cart-checkout-ui |
| OrderDetail | SKIP sem seed | — |
| Profile + menu | IDs | profile |
| UserProfileHome / edits / Settings | via menu IDs | profile |
| DeleteAccount | SKIP destrutivo | — |
| SubscriptionList / Protocol* | DL + seed | protocol, deep-links |
| Cancel* | SKIP confirm | — |
| Chat* | SKIP flag off | — |
| Anamnesis* / Avatar* | wip | avatar-anamnesis |
| ForcedUpdate / Error | SKIP | — |
| AppLoading | transitória | — |

## Tags Maestro

| Tag | Flows |
|-----|-------|
| `smoke` / `critical` | smoke-launch, hub-nav |
| `hub` | activities, community, marketplace, hub-nav |
| `onboarding` / `welcome` | welcome, onboarding, interest-categories |
| `wip` | avatar-anamnesis (excluído do gate default) |

## Seeds (env no runner)

| Var | Default | Uso |
|-----|---------|-----|
| `E2E_WELCOME_NAME` | Maria E2E | welcome-screen |
| `E2E_ONBOARDING_NAME` | Joao E2E | onboarding-flow |
| `E2E_PRODUCT_ID` | e2e-seed-product | deep-links |
| `E2E_COMMUNITY_ID` | e2e-seed-community | deep-links |
| `E2E_PROTOCOL_PRODUCT_ID` | e2e-seed-protocol | protocol / deep-links |

## Travas prod

```bash
# Deve falhar:
EXPO_PUBLIC_BACKEND_URL=https://likeme-back-end-one.vercel.app/ \
  bash scripts/assert-e2e-staging-env.sh

# Deve passar:
bash scripts/assert-e2e-staging-env.sh
```
