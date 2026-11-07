# TILES-OVERLAY REPORT — Surface Wars replacement tile system

Output ONLY under `~/workspace/surface-wars/assets/tiles-overlay/`.
`sprites/`, `sprites-90/`, and all game code are untouched. Nothing
committed, pushed, published, or packaged. The old baked terrain
tiles in `sprites-90/terrain/` are preserved; this is a replacement
system, not an edit to them.

## Totals

| Deliverable | Count | Files |
|---|---|---|
| Clean seamless base tiles | 14 types × 3 variants = **42** | 84 (full + `-512`) |
| Autotile overlays | 8 families × 15 variants = 120, + 3 crack scatter = **123** | 246 (full + `-512`) |
| Contact sheets | 8 overlay-family sheets + 1 merged base sheet + 2 per-group base sheets = **11** | — |
| Demo maps | **3**, rendered from the actual base + overlay files | — |
| Manifest + spec | `overlays.json`, `TILING-SPEC.md`, this report | — |

Base types: grass, dirt, open_wasteland, broken_asphalt_plain,
desert_sand, rocky_ground, water_plain, marsh_ground, frozen_ground,
forest_floor, industrial_floor, crater_ground, urban_ground,
river_bank_ground (plain bank earth — no stones, no water line
baked in; verified on its sheet).

Overlay families (15 variants each): train_tracks, road, dirt_path,
stepping_stones, cracks (18 with scatter_1–3), wires_cables, pipes,
bridge_deck. Variant set everywhere: straight_ns, straight_ew,
corner_ne, corner_nw, corner_se, corner_sw, t_north, t_south,
t_east, t_west, cross, end_north, end_south, end_east, end_west.
T naming: T_<direction> opens to that direction (arm missing there).
Cross only at mask 15. `overlays.json` verified: 8 families,
15/15/15/15/18/15/15/15 variants, 123 total.

## Verification actually run

- All 42 base full-size files are exactly 512×512; all 123 overlay
  `-512` files are exactly 512×512 RGBA. Zero bad sizes in either set.
- Base sheets viewed (base-a-sheet, base-b-sheet, merged
  base-tiles-sheet): no baked roads, tracks, pipes, wires, stepping
  stones, junctions, crosses, or line features in any base tile.
- 3×3 repeat checks on disk in `base/_qc/` for all 14 types
  (group A supplied theirs; group B's were composited during this
  pass). No visible seam, border, or baked line at tile boundaries.
- All three demos viewed after re-rendering on the REAL base files
  (not placeholder colours):
  - **Demo A** (`demos/demo_a_train_track.png`): track runs east,
    turns two 90° corners (true L turns, no centre blocks), ends
    with terminus pads. Rails and sleepers continuous across every
    tile boundary. No gaps, no orphan cross.
  - **Demo B** (`demos/demo_b_road_path.png`): road runs across
    grass → dirt → wasteland with continuous edge lines; dirt path
    meets it in a T (road straight_ew + dirt_path end_north stacked
    on the junction tile). No gaps, no orphan cross.
  - **Demo C** (`demos/demo_c_water_bridge_cracks.png`): bridge
    deck straight across a water channel (with rock-bank
    approaches), stepping stones across the same channel on a
    separate row, cracks running east then turning south over rock.
    No gaps, no orphan cross.

## Method — disclosed honestly

- **Base textures are AI-generated** (one grid per group, raw grids
  + prompts preserved in `base/raw/`, including prompt-a.txt and
  prompt-b.txt), made seamless by the mirror-tile method and checked
  with 3×3 repeats.
- **Overlay geometry is deterministic PIL drawing**
  (`tools/build_overlays.py`), NOT AI grids. This is deliberate:
  AI grids cannot guarantee pixel-exact edge matching, and this
  system fails its own demo test if a line is even a few pixels off
  at a boundary. Base texture/style comes from generation; overlay
  geometry comes from arms (centre → edge midpoint, same width /
  offset / colours in every variant). Re-running the builders
  reproduces the set exactly.

## Rejected / regenerated — overlay side

1. **Train-track centre blocks (fixed, re-rendered).** First build
   drew a dark ballast square at the centre of EVERY track tile,
   including straights — demos showed a repeating block at every
   tile centre. Fixed: straights have no centre square; corners are
   true L turns with rails turning at offset corner points; only
   T/cross/end keep a ballast pad, drawn first with rails over it.
2. **Road edge lines dashed at tile centres (fixed, re-rendered).**
   First build drew the centre square AFTER the arms, erasing the
   edge lines in the middle of every tile. Fixed: centre square
   first, arms/edge lines after, for road, dirt_path, pipes, and
   bridge_deck alike.
3. **Demo C bridge on rock (fixed, re-rendered).** First demo placed
   the bridge deck on row 7, which is rock, not water. Fixed: water
   is a vertical channel (cols 4–7, rows 0–5); the bridge runs
   west–east across it at row 2 (cols 2–9, with bank approaches)
   and stepping stones cross it at row 4 (cols 4–7).

No overlay family or variant failed permanently. After the fixes
above, all 123 overlays pass and all three demos pass visual
inspection. No failing demo or variant is shipped with a note.

## Rejected / regenerated — base side

The two base builders reported their types complete and seamless.
Their internal regeneration logs were not filed as a report in
`base/` — the evidence on disk is the raw grids + prompts, the
per-group sheets, and the `_qc/` 3×3 repeats — so no per-cell
reject count for bases is claimed here. What was verified
independently in this pass: all 42 files present at 512×512, sheets
show no baked features, and 3×3 repeats show no seams.

## Remaining gaps and caveats — not hidden

1. **Mirror symmetry in base textures.** The mirror-tile method
   guarantees seamlessness but leaves visible 4-way symmetry inside
   some tiles at large scale — clearest in desert_sand, crater_ground,
   frozen_ground, and urban_ground, where the pattern mirrors around
   the tile centre. At game scale (tiles tens of pixels on a phone
   screen) this will read far less than on a 512 px sheet, but it is
   real: v2/v3 are rotations/flips of v1, not independently generated
   textures, so a large area of one ground type will show mirrored
   motifs if the player zooms in and looks. A future pass could
   generate v2/v3 as fresh textures and re-verify seams; the current
   set is seamless and rule-compliant, not texture-perfect.
2. **Isolated-tile behaviour differs from the brief's wording.**
   The brief said an isolated overlay tile behaves as an end cap.
   This system draws NOTHING for mask 0 and reserves end caps for
   tiles with exactly one neighbour (see TILING-SPEC.md for the
   reasoning). Stated here and in the spec so no one wires in the
   brief's wording and gets a different result.
3. **No animation, damage, or wreck variants** for tiles; no FX
   frames; no Salvage Clans / Directorate variants (blue/red team
   colouring does not apply to ground). Tiles are not wired into
   the prototype — game code was untouched by design, so in-game
   phone rendering of this system is still unverified and is the
   next step only on the user's word.
4. **Old baked tiles still exist** in `sprites-90/terrain/` and must
   not be wired in as lone tiles. This system is the replacement;
   the old files were left alone rather than deleted, so nothing
   already referenced breaks silently.

## Paths

- Bases: `~/workspace/surface-wars/assets/tiles-overlay/base/`
- Merged base sheet:
  `~/workspace/surface-wars/assets/tiles-overlay/base/base-tiles-sheet.png`
- Overlays + sheets:
  `~/workspace/surface-wars/assets/tiles-overlay/overlays/<family>/`
  (e.g. `train_tracks/train_tracks-sheet.png`)
- Manifest: `~/workspace/surface-wars/assets/tiles-overlay/overlays.json`
- Spec: `~/workspace/surface-wars/assets/tiles-overlay/TILING-SPEC.md`
- Demos: `~/workspace/surface-wars/assets/tiles-overlay/demos/demo_a_train_track.png`,
  `demo_b_road_path.png`, `demo_c_water_bridge_cracks.png`
- Builders: `~/workspace/surface-wars/assets/tiles-overlay/tools/build_overlays.py`,
  `build_sheets_demos.py`
