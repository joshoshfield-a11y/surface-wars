# Terrain tiles — category report

Category: Terrain tiles, spec section 5. Work confined to
`~/workspace/surface-wars/assets/sprites/terrain/` only. No game code
touched, no other sprite category touched, nothing committed, pushed,
or published.

## Method (per sprite-batch-QC skill, terrain rule)

- ONE grid image generated with `media.generate_image` (1 media call
  used of the 4-call task maximum; no regeneration calls were needed).
- Full-bleed tiles: NO keying, NO recolor — sliced cells copied through
  untouched via the shared script's `tile` command, plus a 512×512
  LANCZOS copy with a `-512` suffix.
- Raw grid, its exact prompt, and the sliced cells are preserved in
  `raw/` and were never edited in place.
- Contact sheet built from the `-512` copies with the script's `sheet`
  command (labeled, dark `#141414` backdrop, 4 columns) and read back
  and inspected tile by tile.

Style: strict 90° top-down pixel art, industrial scrap / ruined-surface
aesthetic, muted terrain colours with scrap detail, readable at
zoom-out. Original art only — the user's RTS reference screenshot was
used as spirit/style inspiration only, was NOT passed as an image input
to any generation call, and no assets, UI, text, or Rusted Warfare
sprites were copied. No text, letters, numbers, UI, or watermarks
appear in any tile.

## Files

- Grid raw: `terrain/raw/grid.png` (1600×1600, converted from the
  generator's original `terrain/raw/media-generation-grid-0-*.webp`,
  also preserved in `raw/`)
- Prompt record: `terrain/raw/prompt.txt` (exact prompt used)
- Sliced raw cells: `terrain/raw/cells/cell-r{R}c{C}.png`
  (384×384 each after the script's 2% inset trim)
- Contact sheet: `terrain/terrain-sheet.png` (1064×1176, 14 tiles, 4 cols)

## Tiles completed: 14 / 14

Row-major order, as specified:

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

Empty cells: the last 2 grid cells (row 4, columns 3–4) came out as
plain solid BLACK, exactly as prompted. They were discarded — no tile
files were produced for them. Their sliced raws remain in
`terrain/raw/cells/cell-r3c2.png` and `cell-r3c3.png` for the record
only. No `raw-flawed/` directory was created (see below).

## QC findings

Inspected every tile on `terrain-sheet.png` for clean appearance, no
stray text/characters, and consistent family style. Result: PASS for
all 14. Each tile is distinct and readable at game size: cracked
wasteland with scrap, broken asphalt with faded yellow markings,
rubble/foundations, piped industrial concrete, rocky high ground,
cliff gorge, toxic marsh pools, glowing frozen ground, sand dunes,
overgrown forest floor with trees and broken walls, cracked base
pads, circular bunker hatch, river with stone ford, cratered field.
No tile shows text, UI, watermarks, or bleed into a neighbour.

## Flawed / regenerated classes: NONE

No class met the contamination bar (text, wrong content, unreadable,
bleeding into a neighbour), so no raw was moved to `raw-flawed/` and
no second-pass regeneration was run. This is the honest outcome, not
a skipped step: the single grid pass read clean.

Minor, non-blocking observations (not flaws, left as-is rather than
spending a regeneration on them):
- `river_water_shallow_crossing`: the stone ford forms a fairly
  symmetrical cross shape rather than a single natural crossing line.
  It still reads clearly as a shallow stone ford.
- `canyon_ravine`: the gorge shading leans slightly cliff-face in
  feel, but it reads as a top-down ravine at game size.
- `desert_flats_dunes`: the smoothest, lowest-detail tile of the set;
  still clearly distinct sand/dune terrain.

## Honest gaps / limitations

- Grid-sliced tiles may NOT tile seamlessly edge-to-edge: each cell
  was generated as part of one picture, not as a wrap-around texture,
  and the slicer's 2% inset trim means neighbouring tiles do not share
  a continuous edge. They will need edge cleanup / seam work before
  use as repeating tiles.
- Tiles are single static textures (no variants, no transitions
  between terrain types, no seasonal/time-of-day variants).
- Nothing was playtested in-game; readability was judged on the
  contact sheet only, not at actual in-game zoom on a phone screen.
- No tile was regenerated, so the one simplified second pass allowed
  by the skill remains unused and available if the parent wants any
  of the minor observations above reworked.
