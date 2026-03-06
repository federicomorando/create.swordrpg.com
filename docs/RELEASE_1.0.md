# Release 1.0.0

Date: 2026-03-06

## Included
- Browser-only 8-step character creation flow for Il Tempo della Spada.
- Foundry-inspired constraints for Step 5 and Step 7.
- Foundry-like JSON export.
- PDF export using Foundry mapper, field map, and original template.
- GitHub Pages workflow + custom domain setup (`create.swordrpg.com`).
- UI cleanup: export/reset actions moved to top-right header; debug check indicator removed from footer.

## Post-1.0 updates (same day)
- Wizard extended to 9 steps with final `Progressione` step for PE spending.
- Foundry-aligned Talenti logic reused in browser (`src/lib/talents.mjs` + `src/lib/progression.mjs`).
- JSON/PDF exports updated to include progression results (`system.pe`, upgraded skills, talents/effects).
- Header action added for `Import JSON` to continue editing existing characters (especially PE/Talenti).

## Known Notes
- GitHub Pages `Enforce HTTPS` is still false because GitHub certificate provisioning was not ready at check time.
- Public HTTPS is already active via Cloudflare.
