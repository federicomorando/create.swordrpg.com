# Release 1.5.0

Date: 2026-03-06

## Highlights
- Mobile-first UI refresh with improved spacing, typography, and navigation ergonomics.
- Sticky mobile footer navigation (`Indietro` / `Avanti`) with safe-area support.
- Swipeable step navigation on mobile plus explicit current-step label.
- Accessibility improvements:
  - stronger keyboard focus states,
  - ARIA labels for increment/decrement controls,
  - `aria-current` on active step,
  - polite live validation warning messages,
  - reduced-motion support.
- Mobile quick summary card with key build metrics (points, budget, PE).
- Header actions redesigned:
  - mobile hamburger-style actions menu,
  - action icons for export/import/reset,
  - desktop inline actions preserved.
- Visual clarity improvements in abilities and valori sections:
  - emphasized divider for "Abilita libere",
  - disabled valori rows and controls now clearly styled in light gray.

## Compatibility Notes
- No schema changes to saved character data (`localStorage`) were introduced in this release.
- Existing JSON import/export behavior is unchanged.
