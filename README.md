# SwORD Character Lab (GitHub Pages)

Browser-only character creation prototype for **Il Tempo della Spada**.

Current version: `1.0.0` (see `VERSION` and `docs/RELEASE_1.0.md`).

## Run locally

```bash
python3 -m http.server 4173
# then open http://localhost:4173
```

## Features currently implemented
- 9-step wizard structure inspired by Foundry creation flow.
- Local persistence (`localStorage`).
- Final progression step for PE spending and automatic Talenti unlock/progress.
- JSON import (Foundry-like actor) to continue character progression/editing.
- Foundry-like JSON export.
- PDF export using Foundry mapper + field map + template PDF.

## Maintenance
Use the drift checker to keep parity with Foundry:

```bash
./scripts/check-foundry-sync.sh
```

Detailed guide: `docs/FOUNDRY_SYNC.md`.
Step-by-step constraints: `docs/STEP_CONSTRAINTS.md`.
Release notes: `docs/RELEASE_1.0.md`.
