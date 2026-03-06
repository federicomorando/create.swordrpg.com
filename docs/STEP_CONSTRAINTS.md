# Step Constraints and Frontend-Only Adaptation

This project runs on GitHub Pages (no backend). Some creation steps need explicit client-side constraints and a few controlled simplifications.

## Step-by-step decisions

1. `Ceto`
- Keep as-is (pure selection).

2. `Caratteristiche`
- Enforce exact total `54` before moving forward.

3. `Cultura`
- Require both traits and both extra-die picks.
- Keep trait restrictions local (no server validation).

4. `Derivate`
- Computed preview only; values are re-derived again during export.

5. `Abilita`
- Enforce exact `6` punti mestiere.
- Free picks use Foundry-like budget based on `Mens` and ceto-distance costs.
- Training slots required as in Foundry:
  - `2` skills at grade 3
  - `8` skills at grade 2

6. `Valori`
- Enforce exact `3` points and only allowed axes from selected culture traits.

7. `Retaggio` (critical)
- Events are now structured objects (not plain strings):
  - `type`, `note`, `mode`, `picks`, `valoreKey`
- Event-specific constraints are enforced client-side:
  - Pick counts
  - Mode-dependent picks (`Apprendistato`)
  - Required valore selection (`Percorso spirituale`)
- `Esperienza` now requires extra training slot choices (`1x grado 3`, `2x grado 2`).
- Retaggio points now follow Foundry-style formula:
  - `3 + mod(Gratia) + Tentazione + Intraprendente - costo Ceto`

8. `Equipaggiamento`
- Require wealth roll before advancing.
- Block over-budget purchases via validation.

## Export-related constraints

- JSON export is a Foundry-like actor payload generated from browser state.
- Event effects are applied in export (extraDice, fama/spirito/riflessi bonus, retaggio flags, valori update from `Percorso spirituale`).
- PDF export uses Foundry's same mapper/field map/template copied locally.
- Because no Foundry runtime exists in browser, adapter fields are computed in `src/export/foundry-adapter.mjs`.

## Why this is necessary

Without backend/Foundry runtime checks, malformed state could otherwise be exported.
The step-gating and structured events are required to keep data quality acceptable in a pure frontend deployment.
