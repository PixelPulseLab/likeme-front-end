#!/usr/bin/env bash
# Fail hard se BACKEND_URL apontar para produção ou se host estiver fora da allowlist E2E.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE_PATH:-$ROOT_DIR/.env.staging}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ Arquivo de env não encontrado: $ENV_FILE" >&2
  exit 1
fi

while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  if [[ "$line" =~ ^(EXPO_PUBLIC_[A-Z0-9_]+|E2E_STAGING_TOKEN|E2E_LOGIN_EMAIL|E2E_LOGIN_NAME)=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"
    # Prefer vars já exportadas (permite override em CI/testes)
    if [[ -n "${!key:-}" ]]; then
      continue
    fi
    val="${BASH_REMATCH[2]}"
    val="${val%\"}"
    val="${val#\"}"
    export "$key=$val"
  fi
done < "$ENV_FILE"

BACKEND_URL="${EXPO_PUBLIC_BACKEND_URL:-}"
if [[ -z "$BACKEND_URL" ]]; then
  echo "❌ EXPO_PUBLIC_BACKEND_URL vazia em $ENV_FILE" >&2
  exit 1
fi

HOST="$(
  BACKEND_URL="$BACKEND_URL" node -e "
    const raw = process.env.BACKEND_URL || '';
    const withProto = /^https?:\\/\\//i.test(raw) ? raw : 'https://' + raw;
    try {
      console.log(new URL(withProto).hostname.toLowerCase());
    } catch {
      process.exit(2);
    }
  "
)" || {
  echo "❌ EXPO_PUBLIC_BACKEND_URL inválida: $BACKEND_URL" >&2
  exit 1
}

PROD_HOST="likeme-back-end-one.vercel.app"
STAGING_HOST="likeme-back-end-staging.vercel.app"
if [[ "$HOST" == "$PROD_HOST" ]]; then
  echo "❌ E2E staging bloqueado: backend é PRODUÇÃO ($HOST)" >&2
  exit 1
fi

ALLOWED=0
if [[ "$HOST" == "$STAGING_HOST" ]]; then ALLOWED=1; fi
if [[ "$HOST" == *pixel-pulse-labs.vercel.app ]]; then ALLOWED=1; fi
if [[ "$HOST" == "localhost" || "$HOST" == "127.0.0.1" ]]; then ALLOWED=1; fi
if [[ "$HOST" =~ ^192\.168\.[0-9]+\.[0-9]+$ ]]; then ALLOWED=1; fi
if [[ "$HOST" =~ ^10\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then ALLOWED=1; fi

if [[ "$ALLOWED" -ne 1 ]]; then
  echo "❌ E2E staging bloqueado: host fora da allowlist ($HOST)" >&2
  exit 1
fi

if [[ "${EXPO_PUBLIC_E2E_AUTH_BYPASS:-}" != "true" && "${EXPO_PUBLIC_E2E_AUTH_BYPASS:-}" != "1" ]]; then
  echo "⚠️  EXPO_PUBLIC_E2E_AUTH_BYPASS não está true em $ENV_FILE (Auth0 ainda pode disparar)" >&2
fi

echo "✅ E2E staging OK — backend=$HOST env=$ENV_FILE"
