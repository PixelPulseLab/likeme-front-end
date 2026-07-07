#!/bin/sh
echo "🧪 Rodando npm test antes do push..."
if ! npm test -- --no-coverage --watchAll=false --forceExit; then
  echo "❌ Push bloqueado: testes falharam. Corrija antes de fazer push."
  exit 1
fi
echo "✅ Testes OK."
