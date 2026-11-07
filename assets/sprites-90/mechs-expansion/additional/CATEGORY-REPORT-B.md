# Additional Families — PART B Category Report (15 chassis)

- Scope: PART B ONLY, under `~/workspace/surface-wars/assets/sprites-90/mechs-expansion/additional/`.
  Sibling Part A files in the same folder (different slugs, `additional-sheet-a.png`,
  `raw-a/`, `raw-flawed-a/`) were NOT touched. Nothing in `sprites/`,
  `sprites-90/mechs/`, `sprites-90/units/`, `sprites-90/weapons/`, `tiles-overlay/`,
  any other `mechs-expansion` subfolder, or any game code was touched. Nothing
  committed, pushed, published, or packaged.
- Method (per the `sprites-90/mechs` CATEGORY-REPORT.md): two 4x2 grids per team
  on pure black (blue: 8 + 7 + 1 empty cell; red: 8 + 7 + 1 empty cell), sliced
  (4, 2) with a standalone copy of the keying tool kept in this folder
  (`key_and_sheet.py` — copied from `sprites-90/mechs/`, original unmodified),
  flood-fill keyed from the borders through near-black (max < 48), soft alpha
  falloff, trimmed and re-centred on a transparent square canvas with even
  padding, full size + 512x512 LANCZOS `-512` copy, flat in `additional/`.
- Media calls: 4 grid calls + 3 regeneration calls (see below). No other calls.
- Raws + prompt records: `raw-b/` (4 grid webps, 3 regeneration webps, sliced
  cells in `raw-b/cells-blue1|blue2|red1|red2/`, `raw-b/prompts-b.txt`). Raws
  were never edited in place. Flawed original cells: `raw-flawed-b/`.
- Contact sheet: `additional-sheet-b.png` (30 labeled items, 5 columns, dark
  #141414 backdrop, built from the `-512` copies). Visually inspected:
  clean transparency, no text/characters/UI/watermarks in the sprites,
  silhouettes readable at game size, consistent industrial scrap-steel family
  style, strict top-down throughout, reds visibly distinct from blues.
- RED VARIANTS ARE SEPARATELY GENERATED, NOT CHANNEL SWAPS. Every red carries
  a large red centre disc/marking and/or red trim and lights. No R/B swap
  was used on any sprite.

## Sprites (all paths under `.../mechs-expansion/additional/`)

| Slug | Description | Blue | Blue 512 | Red | Red 512 |
|---|---|---|---|---|---|
| dronewright | Drone-carrier: wide rectangular hull, six docked drone pods around the edges, blue centre ring | `dronewright.png` | `dronewright-512.png` | `dronewright-red.png` | `dronewright-red-512.png` |
| bastille | Fortress: huge square blocky hull, four corner turret domes with straight-up barrels, blue centre ring (REGENERATED, see below) | `bastille.png` | `bastille-512.png` | `bastille-red.png` | `bastille-red-512.png` |
| glass_cannon | Fragile heavy-gun: small narrow hull, one enormous cannon barrel straight up, glassy side panels | `glass_cannon.png` | `glass_cannon-512.png` | `glass_cannon-red.png` | `glass_cannon-red-512.png` |
| furnace_knight | Furnace-armoured knight: angular shield hull, glowing orange furnace core, blade straight up | `furnace_knight.png` | `furnace_knight-512.png` | `furnace_knight-red.png` | `furnace_knight-red-512.png` |
| coilrunner | Coilgun runner: long slim arrow hull, glowing coil rings along a straight-up barrel | `coilrunner.png` | `coilrunner-512.png` | `coilrunner-red.png` | `coilrunner-red-512.png` |
| salvage_titan | Giant salvage: very large round hull of mismatched bolted plates, claw arm folded flat on top | `salvage_titan.png` | `salvage_titan-512.png` | `salvage_titan-red.png` | `salvage_titan-red-512.png` |
| signal_ghost | Electronic-warfare ghost: sleek pale flat hull, two antenna dishes, faint outline panels | `signal_ghost.png` | `signal_ghost-512.png` | `signal_ghost-red.png` | `signal_ghost-red-512.png` |
| tunnelfox | Tunnelling scout: small fox-head pointed hull, drill cone straight up, small side fins | `tunnelfox.png` | `tunnelfox-512.png` | `tunnelfox-red.png` | `tunnelfox-red-512.png` |
| siege_walker | Siege walker: heavy rectangular hull on four flat track pads, short mortar barrel straight up | `siege_walker.png` | `siege_walker-512.png` | `siege_walker-red.png` | `siege_walker-red-512.png` |
| plague_engine | Biohazard engine: round hull, biohazard trefoil, three vent stacks | `plague_engine.png` | `plague_engine-512.png` | `plague_engine-red.png` | `plague_engine-red-512.png` |
| stormcaller | Storm weapon: triangular hull, lightning-coil arcs, tall Tesla mast straight up | `stormcaller.png` | `stormcaller-512.png` | `stormcaller-red.png` | `stormcaller-red-512.png` |
| chronomancer | Time-themed: circular clock-face hull with tick marks only, dial hand straight up (REGENERATED blue, see below) | `chronomancer.png` | `chronomancer-512.png` | `chronomancer-red.png` | `chronomancer-red-512.png` |
| graveyard | Graveyard/scrap-horde: irregular sprawling scrap-pile hull, tombstone-shaped blocks on the rim | `graveyard.png` | `graveyard-512.png` | `graveyard-red.png` | `graveyard-red-512.png` |
| expansion_colossus | Colossal: gigantic wide octagonal hull, eight heavy segments, massive central dome. Slug is `expansion_colossus` precisely because `colossus_engine` already exists in `sprites-90/units/`; that file was NOT overwritten or touched | `expansion_colossus.png` | `expansion_colossus-512.png` | `expansion_colossus-red.png` | `expansion_colossus-red-512.png` |
| scrap_saint | Holy-scrap: cross-shaped hull, glowing halo ring, ornate scrap trim | `scrap_saint.png` | `scrap_saint-512.png` | `scrap_saint-red.png` | `scrap_saint-red-512.png` |

Count: 15 blue + 15 red = 30 distinct sprites (60 files counting full-size + `-512`).
All 60 verified: square RGBA canvases, non-empty alpha bbox, every `-512` file
exactly 512x512.

## Rejected / regenerated cells

- **bastille blue + bastille red (grid originals) — REJECTED, regenerated.**
  The grid cells' corner turret barrels were diagonal (~45°, pointing at the
  corners), violating the strict straight-up barrel rule. Original cells moved
  to `raw-flawed-b/bastille-blue-grid.png` and `raw-flawed-b/bastille-red-grid.png`.
  Regenerated as single sprites with turret domes whose barrels point straight
  up only; inspected and passed. No diagonal barrel shipped.
- **chronomancer blue (grid original) — REJECTED, regenerated.** The grid cell's
  clock face carried numerals (text characters). Original cell moved to
  `raw-flawed-b/chronomancer-blue-grid-numerals.png`. Regenerated as a single
  sprite with tick marks only, no numerals/digits/text; inspected and passed.
  (Chronomancer red from the grid already used tick marks only and was kept.)
- No other cell was rejected. All other first-pass cells are strict flat 90°
  top-down with vertical-only barrels and no cell-border bleed.

## Honest gaps / notes

- **Red/blue silhouettes diverge (separate generation, by design).** Most
  visible: dronewright-red's six pods float detached around the hull while
  blue's pods touch it; signal_ghost is round in blue but elongated-oval in
  red; salvage_titan's claw reads differently between teams. All read as the
  same class and are unambiguously team-coloured, but the teams are not the
  same drawing.
- **Relative size is not preserved across classes.** Every sprite is centred
  on its own square canvas and every `-512` copy is 512x512, so e.g.
  tunnelfox and expansion_colossus end up the same pixel size in `-512`
  files; in-game scaling must come from game data, not these files.
- **Stormcaller lightning arcs are FX, not barrels** — they arc diagonally
  around the hull, but the mast/barrel itself is vertical. Not a barrel-rule
  violation; flagged so a later QC pass does not mistake arcs for barrels.
- **Bastille blue/red are single-sprite regenerations, not grid cells** —
  they are larger source images (1629px / 1421px square after keying) than the
  grid-sliced sprites; their `-512` copies are consistent with the rest.
- **No animation, damage, or wreck frames; no faction skins beyond blue/red.**
  Single stills only, as specified.
- **No real-browser/phone playtest.** QC is visual inspection of the grids,
  the regenerations, and the final contact sheet, plus the alpha/dimension
  checks above.
- **FAILED / MISSING: none.** All 15 chassis x 2 teams delivered.
