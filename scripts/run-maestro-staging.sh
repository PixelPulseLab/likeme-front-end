#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

export ENV_FILE_PATH="${ENV_FILE_PATH:-$ROOT_DIR/.env.staging}"
bash "$ROOT_DIR/scripts/assert-e2e-staging-env.sh"

MAESTRO_BIN="${MAESTRO_BIN:-$HOME/.maestro/bin/maestro}"
if [[ ! -x "$MAESTRO_BIN" ]]; then
  echo "❌ Maestro não encontrado em $MAESTRO_BIN" >&2
  exit 1
fi

TARGET="${1:-maestro/flows}"
EXTRA_ARGS=("${@:2}")

# Defaults de env para interpolação ${VAR} nos YAMLs (override via export)
: "${E2E_WELCOME_NAME:=Maria E2E}"
: "${E2E_ONBOARDING_NAME:=Joao E2E}"
: "${E2E_PRODUCT_ID:=e2e-seed-product}"
: "${E2E_COMMUNITY_ID:=e2e-seed-community}"
: "${E2E_PROTOCOL_PRODUCT_ID:=e2e-seed-protocol}"
: "${E2E_CHECKOUT_PRODUCT_ID:=e397f03c-ae1d-4a2c-b4c4-0f3adda15927}"
: "${E2E_CHECKOUT_PROTOCOL_PRODUCT_ID:=c733be06-fb9a-49af-b064-c4c45213143e}"
: "${E2E_CARD_CVV:=123}"
export E2E_WELCOME_NAME E2E_ONBOARDING_NAME E2E_PRODUCT_ID E2E_COMMUNITY_ID E2E_PROTOCOL_PRODUCT_ID
export E2E_CHECKOUT_PRODUCT_ID E2E_CHECKOUT_PROTOCOL_PRODUCT_ID E2E_CARD_CVV

MAESTRO_ENV_ARGS=(
  -e "E2E_WELCOME_NAME=${E2E_WELCOME_NAME}"
  -e "E2E_ONBOARDING_NAME=${E2E_ONBOARDING_NAME}"
  -e "E2E_PRODUCT_ID=${E2E_PRODUCT_ID}"
  -e "E2E_COMMUNITY_ID=${E2E_COMMUNITY_ID}"
  -e "E2E_PROTOCOL_PRODUCT_ID=${E2E_PROTOCOL_PRODUCT_ID}"
  -e "E2E_CHECKOUT_PRODUCT_ID=${E2E_CHECKOUT_PRODUCT_ID}"
  -e "E2E_CHECKOUT_PROTOCOL_PRODUCT_ID=${E2E_CHECKOUT_PROTOCOL_PRODUCT_ID}"
  -e "E2E_CARD_CVV=${E2E_CARD_CVV}"
)

# Gate default: exclui wip (avatar/anamnesis placeholder)
if [[ ${#EXTRA_ARGS[@]} -eq 0 && "$TARGET" == "maestro/flows" ]]; then
  EXTRA_ARGS=(--exclude-tags wip)
fi

echo "🚀 Maestro E2E staging → $TARGET ${EXTRA_ARGS[*]:-}"
exec "$MAESTRO_BIN" test "$TARGET" "${MAESTRO_ENV_ARGS[@]}" "${EXTRA_ARGS[@]}"
