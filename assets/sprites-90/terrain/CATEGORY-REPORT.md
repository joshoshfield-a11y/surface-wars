# Terrain tiles (90° set) — category report

Category: TERRAIN TILES only. Work confined to
`~/workspace/surface-wars/assets/sprites-90/terrain/` only.
The old set under `~/workspace/surface-wars/assets/sprites/` was not
touched, overwritten, or copied from. No game code edited, nothing
committed, pushed, published, or packaged.

## Method (sprite-batch-QC skill, adapted for tiles)

- Main pass: ONE grid image generated with `media.generate_image`
  (5 columns × 4 rows = 20 cells, row-major, explicit flat-overhead
  lock in the prompt: camera directly overhead at 90°, no perspective,
  no 3/4/diagonal/isometric view, no tilted camera, no angled shading).
- Full-bleed tiles: NO keying — sliced cells copied through untouched
  via the `tile` command of a local copy of `key_and_sheet.py`
  (copied into this folder as `key_and_sheet.py`; the old folder's
  tool was not modified), plus a 512×512 LANCZOS copy with a `-512`
  suffix for every tile.
- Raws + prompt records preserved in `raw/` and never edited in
  place. Flawed first-pass cells preserved in `raw-flawed/`.
- Contact sheet built from the `-512` copies (labeled, dark `#141414`
  backdrop, 5 columns) and visually inspected tile by tile for strict
  top-down flatness and no stray text/characters.

Style: original tiles only, pixel-RTS spirit (readable flat ground,
industrial scrap/wasteland look). No screenshot copied, no Rusted
Warfare sprites copied. No text, letters, numbers, UI, or watermarks
in any shipped tile.

## Tiles completed: 20 / 20 (40 files + sheet)

| # | Tile | Full-size file | Game-size file |
|---|------|---------------|----------------|
| 1 | open_wasteland | `terrain/open_wasteland.png` | `terrain/open_wasteland-512.png` |
| 2 | broken_asphalt_road | `terrain/broken_asphalt_road.png` | `terrain/broken_asphalt_road-512.png` |
| 3 | urban_ruins | `terrain/urban_ruins.png` | `terrain/urban_ruins-512.png` |
| 4 | industrial_complex | `terrain/industrial_complex.png` | `terrain/industrial_complex-512.png` |
| 5 | rocky_highlands | `terrain/rocky_highlands.png` | `terrain/rocky_highlands-512.png` |
| 6 | canyon_ravine | `terrain/canyon_ravine.png` | `terrain/canyon_ravine-512.png` |
| 7 | marsh_contaminated_pool | `terrain/marsh_contaminated_pool.png` | `terrain/marsh_contaminated_pool-512.png` |
| 8 | frozen_irradiated_zone | `terrain/frozen_irradiated_zone.png` | `terrain/frozen_irradiated_zone-512.png` |
| 9 | desert_flats_dunes | `terrain/desert_flats_dunes.png` | `terrain/desert_flats_dunes-512.png` |
| 10 | forested_overgrown_ruins | `terrain/forested_overgrown_ruins.png` | `terrain/forested_overgrown_ruins-512.png` |
| 11 | abandoned_military_base | `terrain/abandoned_military_base.png` | `terrain/abandoned_military_base-512.png` |
| 12 | underground_facility_entrance | `terrain/underground_facility_entrance.png` | `terrain/underground_facility_entrance-512.png` |
| 13 | river_water_shallow_crossing | `terrain/river_water_shallow_crossing.png` | `terrain/river_water_shallow_crossing-512.png` |
| 14 | crater_field | `terrain/crater_field.png` | `terrain/crater_field-512.png` |
| 15 | grass | `terrain/grass.png` | `terrain/grass-512.png` |
| 16 | dirt | `terrain/dirt.png` | `terrain/dirt-512.png` |
| 17 | bridge | `terrain/bridge.png` | `terrain/bridge-512.png` |
| 18 | forest | `terrain/forest.png` | `terrain/forest-512.png` |
| 19 | water | `terrain/water.png` | `terrain/water-512.png` |
| 20 | rock | `terrain/rock.png` | `terrain/rock-512.png` |

Contact sheet: `terrain/terrain-sheet.png` (1328×1176, 20 tiles, 5 cols).
Main grid raw: `terrain/raw/grid.png` (1760×1408), prompt in
`terrain/raw/prompt.txt`, sliced cells in `terrain/raw/cells/`.
Regen grid raw: `terrain/raw/regen-grid.png`, prompt in
`terrain/raw/regen-prompt.txt`, cells in `terrain/raw/regen-cells/`.
Full-size tiles from the main grid are 338×338; the two regenerated
tiles are 1076×1076 (different source resolution — the `-512` copies
are uniform 512×512, so game-size use is unaffected).

## Rejected / regenerated classes

- `canyon_ravine` — REJECTED first pass: the winding gorge's dark
  wall shading read as a tilted cliff face, failing the flat-ground
  gate (not shipped with a note). Regenerated with a simplified,
  flatter prompt (flat map pattern: cracked earth + one thin dark
  winding crack line, no depth, no cliff walls). FINAL: PASS — flat
  cracked earth with a thin winding crack, inspected individually.
  First-pass cell preserved in `raw-flawed/canyon_ravine-cell.png`.
- `forested_overgrown_ruins` — REJECTED first pass: content miss —
  it came out as plain sand dunes with no forest and no ruins
  (near-duplicate of `desert_flats_dunes`). Regenerated with a
  simplified prompt (mossy floor + flat round tree canopies seen
  from directly above + broken flat stone wall lines, no sand).
  FINAL: PASS — flat canopies + broken walls, distinct from both
  `desert_flats_dunes` and the gameplay `forest` tile (which is
  denser canopy with no walls). Inspected individually.
  First-pass cell preserved in `raw-flawed/forested_overgrown_ruins-cell.png`.

No other class was rejected. No class is FAILED/MISSING: all 20
tiles shipped.

## Honest gaps / limitations

- SEAMLESS TILING NOT VERIFIED — do not treat these as seamless.
  Tiles were generated as grid cells (plus a 2-cell regen grid), not
  as wrap-around textures, and the slicer trims a 2% inset, so
  neighbouring repeats do not share a continuous edge. Edge cleanup
  / seam work is needed before use as repeating tiles. This was not
  tested with a 2×2 repeat render.
- `bridge` reads as a flat top-down deck cross-junction (two spans
  crossing), not a single-direction span. It is strictly flat and
  was kept, but a single-span variant may be wanted for straight
  river crossings.
- `river_water_shallow_crossing`'s stone ford is again a fairly
  symmetrical cross shape rather than a single natural crossing
  line; it still reads clearly as a shallow stone ford.
- `rocky_highlands` vs gameplay `rock` are similar in palette
  (both grey rock) but distinct in content: highlands are
  brown-grey slabs + boulders; `rock` is flat grey cracked slabs.
  Likewise `grass` (scrub grass, no trees) vs `dirt` (bare brown
  earth) vs `open_wasteland` (cracked dirt + scrap) are distinct
  but muted — check at in-game zoom.
- Tiles are single static textures: no variants, no transitions
  between terrain types, no seasonal/time-of-day variants.
- Nothing was playtested in-game; readability was judged on the
  contact sheet and the two individual regen tiles only, not at
  actual in-game zoom on a phone screen.
- Tiles are NOT yet wired into the prototype (game still uses
  canvas placeholders); this task covered asset files only.
