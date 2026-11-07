# Bulwark-class — Expansion Mechs Report (90° top-down)

- Scope: BULWARK CLASS ONLY, under `~/workspace/surface-wars/assets/sprites-90/mechs-expansion/bulwark/`.
  Nothing else was touched: no files in `sprites/`, `sprites-90/mechs/`, `sprites-90/units/`,
  `sprites-90/weapons/`, `tiles-overlay/`, or any other `mechs-expansion/` subfolder, no game code
  edited, nothing committed, pushed, published, or packaged. The existing `rampart` in
  `sprites-90/mechs/` was NOT overwritten — `rampart_mk2` here is a new, separate chassis.
- Method (same as `sprites-90/mechs/CATEGORY-REPORT.md`): two 4×2 grid images on pure black,
  one blue and one red, sliced (4, 2) with a standalone copy of the keying tool kept in this
  folder (`key_and_sheet.py` — the original in `sprites-90/mechs/` was not modified),
  flood-fill keyed from the borders through near-black (max < 48, so dark interior detail
  survives), soft alpha falloff, trimmed and re-centred on a transparent square canvas with
  even padding, full size + 512×512 LANCZOS `-512` copy.
- Media calls used: 2 (1 blue grid + 1 red grid). No regeneration calls were needed —
  see Rejected / regenerated below.
- Raws + prompt records: `raw/grid-blue.png` / `raw/grid-red.png`, the media tool's original
  files in `raw/`, `raw/prompt-blue.txt` / `raw/prompt-red.txt`, sliced cells in
  `raw/cells-blue/` and `raw/cells-red/`. Raws were never edited in place.
- Contact sheet: `bulwark-sheet.png` (16 labeled items, blue + red for all 8, dark #141414
  backdrop, built from the `-512` copies, 4 columns). Visually inspected by the builder:
  clean transparency on the dark backdrop, no text/characters/UI/watermarks inside the sprites,
  silhouettes readable at game size, consistent heavy scrap-steel family style, strict top-down
  throughout, reds visibly distinct from blues side by side.
- RED VARIANTS ARE SEPARATELY GENERATED, NOT CHANNEL SWAPS. Every red carries a large red
  centre disc/ring plus red lights and red trim. No R/B swap was used on any sprite.
- Verification: all 32 sprite files exist; every `-512` copy is exactly 512×512 RGBA with a
  non-empty alpha bbox; full-size files are square transparent canvases (541–613 px).

## Sprites (all paths under `~/workspace/surface-wars/assets/sprites-90/mechs-expansion/bulwark/`)

| Slug | Description | Blue | Blue 512 | Red | Red 512 |
|---|---|---|---|---|---|
| rampart_mk2 | Upgraded rampart — broad wide hull with extra armour plating, central barrel straight up | `rampart_mk2.png` | `rampart_mk2-512.png` | `rampart_mk2-red.png` | `rampart_mk2-red-512.png` |
| bastion | Fortress-wall mech — massive rectangular walled hull with battlement-like plating | `bastion.png` | `bastion-512.png` | `bastion-red.png` | `bastion-red-512.png` |
| ironclad | Riveted iron hull — broad round hull covered in rivets and iron plates | `ironclad.png` | `ironclad-512.png` | `ironclad-red.png` | `ironclad-red-512.png` |
| goliath | Massive brute — huge bulky hull with heavy corner armour blocks | `goliath.png` | `goliath-512.png` | `goliath-red.png` | `goliath-red-512.png` |
| gatekeeper | Wide shield-wall mech — very wide flat hull with a large frontal shield plate | `gatekeeper.png` | `gatekeeper-512.png` | `gatekeeper-red.png` | `gatekeeper-red-512.png` |
| redoubt | Bunker-like mech — low wide domed bunker hull with thick segmented walls | `redoubt.png` | `redoubt-512.png` | `redoubt-red.png` | `redoubt-red-512.png` |
| breakwater | Coastal heavy — broad hull with wave-breaker plating and anchor details | `breakwater.png` | `breakwater-512.png` | `breakwater-red.png` | `breakwater-red-512.png` |
| dreadnought | Colossal dreadnought — largest hull, massive layered armour, twin short barrels straight up | `dreadnought.png` | `dreadnought-512.png` | `dreadnought-red.png` | `dreadnought-red-512.png` |

Count: 8 blue + 8 red = 16 distinct sprites (32 files counting full-size + `-512`).

## Rejected / regenerated classes

NONE. No class was rejected and no regeneration pass was run.

- Blue grid, first pass: all 8 cells are strict flat 90° top-down — no bipeds, no side/front/3/4
  views, no diagonal barrels, no cell-border bleed, no text. Passed as-is.
- Red grid, first pass: all 8 cells are likewise strict top-down with vertical barrels and no
  bleed, and every red is visibly distinct from its blue counterpart on the final sheet.
  Passed as-is.
- `raw-flawed/` exists but is empty: no flawed raws were moved there, because there were no
  flawed classes to record.

## Honest gaps / notes

- **Red silhouettes diverge from blue silhouettes.** Because the reds were generated separately
  (deliberately, to avoid an identical-swap failure), each red shares its class's silhouette
  language, not an exact outline — e.g. red Bastion is a flatter walled square vs. blue Bastion's
  raised battlement hull, and red Goliath's corner blocks are rounder. Both teams read clearly
  as the same class, but they are not the same drawing.
- **Blue vs. red render style differs slightly.** The blue grid renders more painterly/detailed,
  the red grid slightly flatter/more graphic. Team read is unambiguous in both cases; a future
  pass could re-render one grid for stylistic parity, but nothing was rejected on this ground.
- **Dreadnought-red centre detail.** Red Dreadnought carries two dark circular details at its
  centre (twin muzzle-like discs) that blue Dreadnought does not have; its top twin barrels are
  still vertical and the hull is still flat top-down, so it was not rejected — flagged here
  rather than hidden.
- **Breakwater anchor details** (both teams) are flat decorative hull markings seen from above,
  not side-view elements; they read as coastal insignia/plating.
- **Relative size is not preserved across classes.** As in the main set, every sprite is centred
  on its own square canvas and the `-512` copy is always 512×512, so Rampart_mk2 and Dreadnought
  end up the same pixel size in the `-512` files; in-game scaling must come from game data,
  not these files.
- **No animation, damage, or wreck frames; no faction skins beyond blue/red.** Single stills only.
- **No real-browser/phone playtest.** QC is visual inspection of the grids and contact sheet
  only, plus the alpha/dimension checks above.
- **FAILED / MISSING: none.** All 8 chassis × 2 teams delivered.
