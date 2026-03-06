# Foundry Sync and Export Compatibility

This project intentionally reuses SwORD logic from:
- `/home/federico/Claude-Code/foundry/sword/module/data/*`
- `/home/federico/Claude-Code/foundry/sword/module/pdf/*`
- `/home/federico/Claude-Code/foundry/sword/assets/TdS-scheda-editabile.pdf`

## Goal
Keep this GitHub Pages app aligned with Foundry when Foundry evolves, especially for:
1. Runtime logic/data parity.
2. JSON export parity (Foundry-like actor JSON).
3. PDF export parity (same mapper + field map + template style).
4. Progression parity (PE spending and Talenti unlock/progress).

## One-command drift check
From repo root:

```bash
./scripts/check-foundry-sync.sh
```

If Foundry is in a different folder:

```bash
FOUNDRY_PATH=/path/to/foundry ./scripts/check-foundry-sync.sh
```

## What the check script validates
1. External runtime libraries in Foundry `sword/module` imports.
2. How much logic is still tied to Foundry APIs (`game`, `Hooks`, etc.).
3. SHA256 checksums for mirrored files in this project.
4. Wizard flow/action drift in `creation-wizard.hbs`.
5. Presence of JSON/PDF export entrypoints in this project.
6. Mirrored talent/progression source checks (where available).

## Export formats in this project
- JSON export entrypoint: `src/export/foundry-adapter.mjs`
  - Function: `stateToFoundryCharacterJSON(state)`
  - Output: Foundry-like actor document JSON.
- PDF export entrypoint: `src/export/exporters.mjs`
  - Function: `exportCharacterPDF(state)`
  - Uses `src/lib/pdf/pdf-mapper.mjs` copied from Foundry.
  - Uses same field map and same blank PDF template copied from Foundry.

## Update procedure when Foundry changes
1. Run sync check script.
2. If a mirrored file is `CHANGED`, inspect diff and recopy/adapt.
3. Re-run app and perform manual parity checks:
   - Export JSON and inspect fields (`system`, `skills`, `items`).
   - If Step 9 is used, inspect `system.pe`, `system.talents`, and upgraded skill grades.
   - Export PDF and verify key fields (name, ceto, caratteristiche, abilita, equip, valori).
   - JSON import a Foundry-like actor and verify PE/Talenti editing works without creation-step blockers.
4. Commit both code and this documentation if workflow changed.

## Files that should usually stay mirrored bit-by-bit
- `src/lib/sword-check.mjs`
- `src/lib/cultures.mjs`
- `src/lib/equipment.mjs`
- `src/lib/talents.mjs`
- `src/lib/pdf/pdf-mapper.mjs`
- `src/lib/pdf/pdf-field-map.json`
- `src/lib/pdf/vendor/pdf-lib.min.mjs`
- `src/assets/TdS-scheda-editabile.pdf`

## Files expected to differ (adapter layer)
- `src/main.js`
- `src/export/foundry-adapter.mjs`
- `src/export/exporters.mjs`
- `src/lib/progression.mjs`

These files bridge browser-only app state to Foundry-like structures.
