# Mechs — 90° Category Report (spec §7 chassis)

- Scope: MECHS ONLY. Nothing else in `sprites-90/` was touched, nothing in
  the old `assets/sprites/` set was touched, copied, or overwritten, no game
  code was edited, nothing committed, pushed, published, or packaged.
- Method (per sprite-batch-QC skill): two 4×2 grid images on pure black,
  one blue and one red, sliced (4, 2) with a standalone copy of the keying
  tool kept in this folder (`key_and_sheet.py` — the old folder's tool was
  not modified), flood-fill keyed from the borders through near-black
  (max < 48, so dark interior detail survives), soft alpha falloff,
  trimmed and re-centred on a transparent square canvas with even padding,
  full size + 512×512 LANCZOS `-512` copy.
- Media calls used: 2 (1 blue grid + 1 red grid). No regeneration calls
  were needed — see Rejected / regenerated below.
- Raws + prompt records: `raw/grid-blue.png` / `raw/grid-blue.webp` /
  `raw/prompt-blue.txt`, `raw/grid-red.png` / `raw/grid-red.webp` /
  `raw/prompt-red.txt`, sliced cells in `raw/cells-blue/` and
  `raw/cells-red/`, plus the media tool's original files/JSON in `raw/`.
  Raws were never edited in place.
- Contact sheet: `mechs-sheet.png` (16 labeled items, blue + red for all 8,
  dark #141414 backdrop, built from the `-512` copies, 4 columns).
  Visually inspected by the builder: clean transparency on the dark
  backdrop, no text/characters/UI/watermarks, silhouettes readable at
  game size, consistent industrial scrap-steel family style, strict
  top-down throughout, reds visibly distinct from blues side by side.
- RED VARIANTS ARE SEPARATELY GENERATED, NOT CHANNEL SWAPS. Every red
  carries a large red centre marking and/or red trim and lights
  (bulwark-red, rampart-red, scrapjack-red, warden-red: big red centre
  discs; scout-red/lancer-red/longshot-red/vespid-red: red lights, dots,
  and centre markings). No R/B swap was used on any sprite.
  Honest numeric caveat: mean R-minus-B over opaque pixels is only
  +10 to +17 on reds because most pixels are dark steel in both teams;
  the team read comes from the large red markings, which are unmistakable
  on the sheet at game size, not from a whole-hull tint.

## Sprites (all paths under `~/workspace/surface-wars/assets/sprites-90/mechs/`)

| Slug | Description | Blue | Blue 512 | Red | Red 512 |
|---|---|---|---|---|---|
| scout | Small fast recon — compact oval top-down hull, small round sensor dish, blue centre ring | `scout.png` | `scout-512.png` | `scout-red.png` | `scout-red-512.png` |
| lancer | Lean mobile assault — narrow hull, short barrel pointing straight up | `lancer.png` | `lancer-512.png` | `lancer-red.png` | `lancer-red-512.png` |
| bulwark | Heavy frontline armour — broad round plated hull, blue centre ring | `bulwark.png` | `bulwark-512.png` | `bulwark-red.png` | `bulwark-red-512.png` |
| longshot | Long-barrel artillery — tall hull, one very long cannon barrel pointing straight up, fully inside its cell | `longshot.png` | `longshot-512.png` | `longshot-red.png` | `longshot-red-512.png` |
| rampart | Massive siege — huge wide armoured hull (blue: square-plated; red: round-plated, see gaps) | `rampart.png` | `rampart-512.png` | `rampart-red.png` | `rampart-red-512.png` |
| vespid | Agile skirmisher — light angular hull, twin small guns pointing straight up | `vespid.png` | `vespid-512.png` | `vespid-red.png` | `vespid-red-512.png` |
| scrapjack | Modular salvage — flat hull of mismatched bolted plates, hazard stripes | `scrapjack.png` | `scrapjack-512.png` | `scrapjack-red.png` | `scrapjack-red-512.png` |
| warden | Autonomous heavy — flat hull, large central sensor dome | `warden.png` | `warden-512.png` | `warden-red.png` | `warden-red-512.png` |

Count: 8 blue + 8 red = 16 distinct sprites (32 files counting full-size + `-512`).

## Rejected / regenerated classes

NONE. No class was rejected and no regeneration pass was run.

- Blue grid, first pass: all 8 cells are strict flat 90° top-down — no
  bipeds, no side/front/3/4 views, no diagonal barrels, no cell-border
  bleed (Longshot's long barrel stayed inside its cell, unlike the old
  set's grid), no text. Passed as-is.
- Red grid, first pass: all 8 cells are likewise strict top-down with
  vertical barrels and no bleed, and every red is visibly distinct from
  its blue counterpart on the final sheet. Passed as-is.
- `raw-flawed/` exists but is empty: no flawed raws were moved there,
  because there were no flawed classes to record.

## Honest gaps / notes

- **Red Rampart silhouette diverges from blue Rampart.** Because the reds
  were generated separately (deliberately, to avoid the old set's
  identical-swap failure), red Rampart is a round-plated heavy hull while
  blue Rampart is a square-plated one. Both read as a massive siege mech
  and both are unambiguously red/blue, but the two teams' Ramparts are
  not the same drawing. Same, to a lesser degree, for the other classes:
  red variants share the class silhouette language, not an exact outline.
- **Relative size is not preserved across classes.** As in the old set,
  every sprite is centred on its own square canvas and the `-512` copy is
  always 512×512, so Scout and Rampart end up the same pixel size in the
  `-512` files; in-game scaling must come from game data, not these files.
- **Warden-red has a small vertical protrusion at the bottom edge** (a
  short barrel/turret line, vertical, not diagonal). It reads top-down and
  was not rejected; flagged here rather than hidden.
- **Vespid's hull ends in two pointed prongs at the bottom.** Still a flat
  top-down shape, not a side view; reads as an angular skirmisher hull.
- **No animation, damage, or wreck frames; no Salvage Clans / Directorate
  skins.** Single stills only, as specified.
- **No real-browser/phone playtest.** QC is visual inspection of the
  contact sheet only, plus the alpha/dimension checks above (all 32
  sprite files are 512×512 for `-512` copies, full-size files are square
  transparent canvases with non-empty alpha bboxes).
- **FAILED / MISSING: none.** All 8 chassis × 2 teams delivered.
