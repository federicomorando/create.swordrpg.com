#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FOUNDRY_PATH="${FOUNDRY_PATH:-/home/federico/Claude-Code/foundry}"
FOUNDRY_SWORD="$FOUNDRY_PATH/sword"

if [[ ! -d "$FOUNDRY_SWORD" ]]; then
  echo "ERROR: Foundry path not found: $FOUNDRY_SWORD" >&2
  echo "Set FOUNDRY_PATH to the correct folder, e.g.:" >&2
  echo "  FOUNDRY_PATH=/path/to/foundry ./scripts/check-foundry-sync.sh" >&2
  exit 1
fi

echo "== SwORD Foundry Sync Check =="
echo "Project: $PROJECT_ROOT"
echo "Foundry: $FOUNDRY_PATH"
echo

echo "[1/5] External JS imports used by Foundry runtime modules"
imports=$(rg -n '^import .* from ["\x27]([^./][^"\x27]*)["\x27]' "$FOUNDRY_SWORD/module" --pcre2 || true)
if [[ -z "$imports" ]]; then
  echo "- No external package imports found in sword/module (runtime is mostly native + Foundry globals)."
else
  echo "$imports"
fi
echo

echo "[2/5] Foundry API coupling scan"
foundry_refs=$(rg -n 'foundry\.|game\.|Hooks\.|ChatMessage|Actor\.create|Item\.create|ui\.notifications' "$FOUNDRY_SWORD/module" || true)
if [[ -z "$foundry_refs" ]]; then
  echo "- No Foundry runtime API references detected."
else
  count=$(printf "%s\n" "$foundry_refs" | wc -l | tr -d ' ')
  echo "- Found $count Foundry-coupled references in sword/module."
  printf "%s\n" "$foundry_refs" | sed -n '1,25p'
  if [[ "$count" -gt 25 ]]; then
    echo "- ... (truncated, run with rg directly for full list)"
  fi
fi
echo

echo "[3/5] Ported module checksum comparison"
compare_file() {
  local src="$1"
  local dst="$2"
  local label="$3"

  if [[ ! -f "$src" ]]; then
    echo "- $label: MISSING source in Foundry ($src)"
    return
  fi
  if [[ ! -f "$dst" ]]; then
    echo "- $label: MISSING local port ($dst)"
    return
  fi

  local src_hash dst_hash
  src_hash=$(sha256sum "$src" | awk '{print $1}')
  dst_hash=$(sha256sum "$dst" | awk '{print $1}')

  if [[ "$src_hash" == "$dst_hash" ]]; then
    echo "- $label: OK (hash match)"
  else
    echo "- $label: CHANGED"
    echo "  Foundry: $src_hash"
    echo "  Local:   $dst_hash"
  fi
}

compare_file "$FOUNDRY_SWORD/module/engine/sword-check.mjs" "$PROJECT_ROOT/src/lib/sword-check.mjs" "Engine check resolver"
compare_file "$FOUNDRY_SWORD/module/data/cultures.mjs" "$PROJECT_ROOT/src/lib/cultures.mjs" "Culture definitions"
compare_file "$FOUNDRY_SWORD/module/data/equipment.mjs" "$PROJECT_ROOT/src/lib/equipment.mjs" "Equipment library"
compare_file "$FOUNDRY_SWORD/module/pdf/pdf-mapper.mjs" "$PROJECT_ROOT/src/lib/pdf/pdf-mapper.mjs" "PDF mapper"
compare_file "$FOUNDRY_SWORD/module/pdf/pdf-field-map.json" "$PROJECT_ROOT/src/lib/pdf/pdf-field-map.json" "PDF field map"
compare_file "$FOUNDRY_SWORD/module/pdf/vendor/pdf-lib.min.mjs" "$PROJECT_ROOT/src/lib/pdf/vendor/pdf-lib.min.mjs" "PDF lib vendor"
compare_file "$FOUNDRY_SWORD/assets/TdS-scheda-editabile.pdf" "$PROJECT_ROOT/src/assets/TdS-scheda-editabile.pdf" "PDF template"

echo

echo "[4/5] Wizard flow drift (step labels + action names)"
if [[ -f "$FOUNDRY_SWORD/templates/apps/creation-wizard.hbs" ]]; then
  step_lines=$(rg -n 'Step [0-9]|wizard|data-action=' "$FOUNDRY_SWORD/templates/apps/creation-wizard.hbs" | sed -n '1,50p' || true)
  if [[ -n "$step_lines" ]]; then
    echo "$step_lines"
  else
    echo "- Could not extract wizard markers."
  fi
else
  echo "- creation-wizard.hbs not found in Foundry project."
fi

echo
echo "[5/5] Export adapter parity checks"

if [[ -f "$PROJECT_ROOT/src/export/foundry-adapter.mjs" ]]; then
  if rg -q 'stateToFoundryCharacterJSON' "$PROJECT_ROOT/src/export/foundry-adapter.mjs"; then
    echo "- JSON exporter entrypoint found: stateToFoundryCharacterJSON"
  else
    echo "- JSON exporter missing: stateToFoundryCharacterJSON"
  fi
else
  echo "- JSON exporter file missing: src/export/foundry-adapter.mjs"
fi

if [[ -f "$PROJECT_ROOT/src/export/exporters.mjs" ]]; then
  if rg -q 'exportCharacterPDF' "$PROJECT_ROOT/src/export/exporters.mjs"; then
    echo "- PDF exporter entrypoint found: exportCharacterPDF"
  else
    echo "- PDF exporter missing: exportCharacterPDF"
  fi
else
  echo "- PDF exporter file missing: src/export/exporters.mjs"
fi

echo
echo "Suggested manual verification:"
echo "- Open app, click 'Export JSON (Foundry)' and import into Foundry actor directory."
echo "- Open app, click 'Export PDF' and verify mapped fields in a PDF reader."
echo

echo "Done. If any module is CHANGED, review differences and adapt src/main.js behavior accordingly."
