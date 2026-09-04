#!/usr/bin/env bash
# Build / archive / export Production no CI (sem conta Apple no Xcode).
# Manual com P12 + perfil App Store. Automatic tenta criar certificado Development e estoura a cota da equipe.
set -euo pipefail

ACTION="${1:?Uso: ci-xcode-production.sh build|archive|export}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/ios"

TEAM_ID="${IOS_DEVELOPMENT_TEAM:-VS752K4DT8}"

USE_MANUAL_SIGNING=false
SIGNING_ARGS=()
XCODE_PROVISIONING=()
XCODE_AUTH=()

if [[ -n "${IOS_PROVISIONING_PROFILE_UUID:-}" ]]; then
  USE_MANUAL_SIGNING=true
  PROFILE_SPECIFIER="${IOS_PROVISIONING_PROFILE_NAME:-${IOS_PROVISIONING_PROFILE_UUID}}"
  SIGNING_ARGS=(
    "DEVELOPMENT_TEAM=${TEAM_ID}"
    CODE_SIGN_STYLE=Manual
    "CODE_SIGN_IDENTITY=${IOS_CODE_SIGN_IDENTITY:-Apple Distribution}"
    "PROVISIONING_PROFILE_SPECIFIER=${PROFILE_SPECIFIER}"
  )
  echo "Assinatura CI: manual (perfil ${PROFILE_SPECIFIER})"
elif [[ -n "${ASC_API_KEY_PATH:-}" && -f "${ASC_API_KEY_PATH}" ]]; then
  XCODE_PROVISIONING=( -allowProvisioningUpdates )
  XCODE_AUTH=(
    -authenticationKeyPath "$ASC_API_KEY_PATH"
    -authenticationKeyID "${ASC_API_KEY_ID:-74BTTLL273}"
    -authenticationKeyIssuerID "${ASC_API_ISSUER_ID:-f4a624c3-e2af-4ad0-a365-f60b90c2dc9d}"
  )
  SIGNING_ARGS=(
    "DEVELOPMENT_TEAM=${TEAM_ID}"
    CODE_SIGN_STYLE=Automatic
  )
  echo "Assinatura CI: Automatic + App Store Connect API Key (sem perfil App Store no runner)"
else
  echo "::error::Configure IOS_PROVISIONING_PROFILE_BASE64 (perfil App Store Distribution) no GitHub." >&2
  exit 1
fi

write_manual_export_plist() {
  local profile_ref="${IOS_PROVISIONING_PROFILE_NAME:-${IOS_PROVISIONING_PROFILE_UUID:-}}"
  if [[ -z "$profile_ref" ]]; then
    echo "::error::Perfil manual necessário mas IOS_PROVISIONING_PROFILE_UUID/NAME ausente." >&2
    return 1
  fi
  mkdir -p "$PWD/build"
  EXPORT_PLIST="$PWD/build/ExportOptions-CI.plist"
  cat > "$EXPORT_PLIST" <<EPLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>method</key>
	<string>app-store-connect</string>
	<key>teamID</key>
	<string>${TEAM_ID}</string>
	<key>signingStyle</key>
	<string>manual</string>
	<key>signingCertificate</key>
	<string>Apple Distribution</string>
	<key>provisioningProfiles</key>
	<dict>
		<key>app.likeme.com</key>
		<string>${profile_ref}</string>
	</dict>
	<key>uploadSymbols</key>
	<true/>
</dict>
</plist>
EPLIST
  echo "ExportOptions: manual (perfil ${profile_ref})"
}

xcode_optional_args() {
  XCODE_OPTIONAL_ARGS=()
  if ((${#XCODE_PROVISIONING[@]} > 0)); then
    XCODE_OPTIONAL_ARGS+=("${XCODE_PROVISIONING[@]}")
  fi
  if ((${#XCODE_AUTH[@]} > 0)); then
    XCODE_OPTIONAL_ARGS+=("${XCODE_AUTH[@]}")
  fi
}

xcode_build_args() {
  xcode_optional_args
  # bash 3.2 + set -u: "${arr[@]}" em array vazio aborta.
  if ((${#XCODE_OPTIONAL_ARGS[@]} > 0)); then
    XCODE_BUILD_ARGS=("${XCODE_OPTIONAL_ARGS[@]}" "${SIGNING_ARGS[@]}")
  else
    XCODE_BUILD_ARGS=("${SIGNING_ARGS[@]}")
  fi
}

run_export_archive() {
  local export_plist="$1"
  local export_log
  export_log="$(mktemp)"
  xcode_optional_args
  set +e
  if ((${#XCODE_OPTIONAL_ARGS[@]} > 0)); then
    xcodebuild \
      -exportArchive \
      -archivePath "$PWD/build/LikeMe.xcarchive" \
      -exportPath "$PWD/build/export" \
      -exportOptionsPlist "$export_plist" \
      "${XCODE_OPTIONAL_ARGS[@]}" \
      2>&1 | tee "$export_log"
  else
    xcodebuild \
      -exportArchive \
      -archivePath "$PWD/build/LikeMe.xcarchive" \
      -exportPath "$PWD/build/export" \
      -exportOptionsPlist "$export_plist" \
      2>&1 | tee "$export_log"
  fi
  local status="${PIPESTATUS[0]}"
  set -e

  if [[ "$status" -ne 0 ]]; then
    if grep -q "Cloud signing permission error" "$export_log" 2>/dev/null; then
      echo "::warning::ASC API Key sem permissão de assinatura na nuvem (Certificates/Profiles no App Store Connect)." >&2
    fi
    if grep -q "No profiles for" "$export_log" 2>/dev/null; then
      echo "::warning::Nenhum perfil App Store automático para app.likeme.com." >&2
    fi
  fi
  rm -f "$export_log"
  return "$status"
}

case "$ACTION" in
  build)
    xcode_build_args
    xcodebuild \
      -workspace LikeMe.xcworkspace \
      -scheme LikeMe \
      -configuration Production \
      -destination 'generic/platform=iOS' \
      -sdk iphoneos \
      "${XCODE_BUILD_ARGS[@]}" \
      build
    ;;
  archive)
    xcode_build_args
    xcodebuild \
      -workspace LikeMe.xcworkspace \
      -scheme LikeMe \
      -configuration Production \
      -destination 'generic/platform=iOS' \
      -archivePath "$PWD/build/LikeMe.xcarchive" \
      "${XCODE_BUILD_ARGS[@]}" \
      archive
    ;;
  export)
    mkdir -p "$PWD/build/export"
    export_status=0

    if [[ "$USE_MANUAL_SIGNING" == true ]]; then
      write_manual_export_plist
      run_export_archive "$EXPORT_PLIST" && export_status=0 || export_status=$?
    else
      echo "ExportOptions: $PWD/ExportOptions-AppStore.plist (signingStyle automatic)"
      if run_export_archive "$PWD/ExportOptions-AppStore.plist"; then
        export_status=0
      elif [[ -n "${IOS_PROVISIONING_PROFILE_UUID:-}" ]]; then
        echo "Export automático falhou — tentando export manual com perfil instalado..."
        write_manual_export_plist
        run_export_archive "$EXPORT_PLIST" && export_status=0 || export_status=$?
      else
        export_status=1
      fi
    fi

    if [[ "$export_status" -ne 0 ]]; then
      echo "::error::Export falhou. Atualize IOS_PROVISIONING_PROFILE_BASE64 com o perfil App Store do mesmo certificado do P12." >&2
      exit "$export_status"
    fi

    if [[ ! -f "$PWD/build/export/LikeMe.ipa" ]]; then
      echo "::error::Export concluiu sem gerar ios/build/export/LikeMe.ipa" >&2
      exit 1
    fi
    echo "IPA gerado: ios/build/export/LikeMe.ipa"
    ;;
  *)
    echo "::error::Ação inválida: ${ACTION} (use build, archive ou export)" >&2
    exit 1
    ;;
esac
