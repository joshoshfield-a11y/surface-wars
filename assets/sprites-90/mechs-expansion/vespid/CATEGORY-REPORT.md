# Vespid-class — Expansion Category Report (agile stealth/recon mechs)

- Scope: VESPID-CLASS ONLY, under `~/workspace/surface-wars/assets/sprites-90/mechs-expansion/vespid/`.
  Nothing else was touched: not `sprites/`, not `sprites-90/mechs/`, not
  `sprites-90/units/`, not `sprites-90/weapons/`, not `tiles-overlay/`, not
  any other `mechs-expansion/` subfolder, no game code, nothing committed,
  pushed, published, or packaged.
- These are NEW chassis, distinct from the existing `vespid` in
  `sprites-90/mechs/` — that file was not overwritten, copied, or modified.
- Method (same as the `sprites-90/mechs` set, per its CATEGORY-REPORT.md):
  two 4×2 grid images on pure black, one blue and one red, sliced (4, 2)
  with a standalone copy of the keying tool kept in this folder
  (`key_and_sheet.py` — the original in `sprites-90/mechs/` was not
  modified), flood-fill keyed from the borders through near-black
  (max < 48, so dark interior detail survives), soft alpha falloff,
  trimmed and re-centred on a transparent square canvas with even padding,
  full size + 512×512 LANCZOS `-512` copy.
- Media calls used: 2 (1 blue grid + 1 red grid). No regeneration calls
  were needed — see Rejected / regenerated below.
- Raws + prompt records: `raw/grid-blue.png` / `raw/grid-blue.webp` /
  `raw/prompt-blue.txt`, `raw/grid-red.png` / `raw/grid-red.webp` /
  `raw/prompt-red.txt`, sliced cells in `raw/cells-blue/` and
  `raw/cells-red/`, plus the media tool's original files in `raw/`.
  Raws were never edited in place.
- Contact sheet: `vespid-sheet.png` (16 labeled items, blue + red for all 8,
  dark #141414 backdrop, built from the `-512` copies, 4 columns).
  Visually inspected by the builder: clean transparency on the dark
  backdrop, no text/characters/UI/watermarks on the sprites, silhouettes
  readable at game size, consistent industrial scrap-steel family style,
  strict top-down throughout, reds visibly distinct from blues side by side.
- RED VARIANTS ARE SEPARATELY GENERATED, NOT CHANNEL SWAPS. Every red
  carries a large bright red centre disc plus red trim and lights.
  Measured on shared opaque pixels of the `-512` copies, mean R-minus-B
  is +33 to +79 on reds vs −9 to −24 on blues — the team read is
  unmistakable at game size, not a tint shift. No R/B swap was used.
- Verification: all 32 sprite files exist, all `-512` copies are exactly
  512×512, all full-size files are square transparent canvases with
  non-empty alpha bboxes (full-size sides 369–626 px, varying by chassis).

## Sprites (all paths under `~/workspace/surface-wars/assets/sprites-90/mechs-expansion/vespid/`)

| Slug | Description | Blue | Blue 512 | Red | Red 512 |
|---|---|---|---|---|---|
| needlewing | Sleek dart-like arrow hull, pointed nose at top, narrow swept wings, vertical barrel, blue centre ring | `needlewing.png` | `needlewing-512.png` | `needlewing-red.png` | `needlewing-red-512.png` |
| ghoststep | Very low-profile flat stealth mech, smooth rounded low hull, faint blue stealth panel lines | `ghoststep.png` | `ghoststep-512.png` | `ghoststep-red.png` | `ghoststep-red-512.png` |
| flicker | Nimble small scout, compact dart hull with small sensor fins, vertical centre barrel, blue centre ring | `flicker.png` | `flicker-512.png` | `flicker-red.png` | `flicker-red-512.png` |
| longsight | Sensor spire mech, round plated hull, tall thin vertical sensor mast with dish at top, blue centre ring | `longsight.png` | `longsight-512.png` | `longsight-red.png` | `longsight-red-512.png` |
| threadrunner | Wire-thin extremely narrow fast runner hull, long and slim, vertical antenna (narrowest sprite in the set) | `threadrunner.png` | `threadrunner-512.png` | `threadrunner-red.png` | `threadrunner-red-512.png` |
| jackrabbit | Light leaping mech, compact hull with small leg pods tucked flat underneath, vertical centre barrel, blue centre ring | `jackrabbit.png` | `jackrabbit-512.png` | `jackrabbit-red.png` | `jackrabbit-red-512.png` |
| nightglass | Dark glass stealth mech, smooth dark glossy angular faceted hull, blue glass panels, blue centre ring | `nightglass.png` | `nightglass-512.png` | `nightglass-red.png` | `nightglass-red-512.png` |
| wraithrunner | Ghostly pale runner, slim elongated hull with a faint wispy halo, blue centre ring | `wraithrunner.png` | `wraithrunner-512.png` | `wraithrunner-red.png` | `wraithrunner-red-512.png` |

Count: 8 blue + 8 red = 16 distinct sprites (32 files counting full-size + `-512`).

## Rejected / regenerated classes

NONE. No class was rejected and no regeneration pass was run.

- Blue grid, first pass: all 8 cells are strict flat 90° top-down — no
  bipeds, no side/front/3/4 views, no diagonal barrels (all barrels,
  masts, and spikes point straight up), no cell-border bleed, no text.
  Passed as-is.
- Red grid, first pass: all 8 cells are likewise strict top-down with
  vertical barrels and no bleed, and every red is visibly distinct from
  its blue counterpart on the final sheet. Passed as-is.
- `raw-flawed/` exists but is empty: no flawed raws were moved there,
  because there were no flawed classes to record.

## Honest gaps / notes

- **Red silhouettes diverge from blue for some classes.** Because the reds
  were generated separately (deliberately, to avoid an identical-swap
  failure), red flicker is a rounder hull while blue flicker is a dart,
  and red ghoststep is flatter/wider than blue ghoststep. Both teams read
  unambiguously as the same class, but the two teams' drawings are not
  the same outline. Same, to a lesser degree, for the other classes.
- **Needlewing's swept wings are diagonal hull edges, not a diagonal view.**
  The hull is a flat top-down dart; its wings sweep back at an angle as a
  plan-view shape, and its barrel points straight up. Not rejected.
- **Threadrunner is extremely thin** (opaque bbox only ~46–56 px wide on
  the full-size canvas). It reads as a wire-thin runner by design, but at
  small game sizes it will be fainter than the other chassis; in-game
  scaling/minimum-width handling is a game-data decision, not a file fix.
- **Wraithrunner keeps a faint wispy halo** after keying (the ghostly
  glow around the pale hull survives the near-black flood fill). It reads
  as intended ghostliness on the dark sheet, not as a background box.
- **Relative size is not preserved across classes.** Every sprite is
  centred on its own square canvas and the `-512` copy is always
  512×512, so threadrunner and nightglass end up the same pixel size in
  the `-512` files; in-game scaling must come from game data, not these files.
- **No animation, damage, or wreck frames; no faction skins beyond
  blue/red team markings.** Single stills only, as specified.
- **No real-browser/phone playtest.** QC is visual inspection of the
  contact sheet and grids only, plus the alpha/dimension checks above.
- **FAILED / MISSING: none.** All 8 chassis × 2 teams delivered.
