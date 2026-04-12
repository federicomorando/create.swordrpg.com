# SwORD Character Lab

Browser-based character creation for **Il Tempo della Spada**.

Live at: [create.swordrpg.com](https://create.swordrpg.com)

Current version: `1.6.0`

## Run locally

```bash
npm install
npm run dev       # Vite dev server with hot reload
npm run build     # Production build to dist/
npm run preview   # Preview the production build
```

## Architecture

The site is built with [Vite](https://vite.dev) and imports game rules
from [`@federicomorando/sword-engine`](https://github.com/federicomorando/sword-engine)
via npm. PDF export uses [`pdf-lib`](https://pdf-lib.js.org/).

Deployment: GitHub Pages via `.github/workflows/pages.yml` (builds with
Vite, deploys `dist/`).

## Features

- 9-step character creation wizard
- Local persistence (`localStorage`)
- PE (Progression Experiences) spending with automatic talent unlock
- JSON import (Foundry-compatible actor) to continue character editing
- Foundry-compatible JSON export
- PDF export using field-mapped template

## Related projects

- [sword-engine](https://github.com/federicomorando/sword-engine) — game rules library (npm dependency)
- [GM-MCP](https://github.com/federicomorando/gm-mcp) — AI game-master platform with Character MCP
- [Foundry VTT system](https://github.com/federicomorando/foundry) — the VTT implementation

## Documentation

- `docs/STEP_CONSTRAINTS.md` — step-by-step creation constraints
- `docs/FOUNDRY_SYNC.md` — historical Foundry sync notes (now superseded by sword-engine npm imports)
- `docs/CACHE_BUSTING.md` — now handled by Vite content hashing
- `docs/RELEASE_1.5.md`, `docs/RELEASE_1.0.md` — historical release notes
