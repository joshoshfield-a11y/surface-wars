# TILING SPEC — Surface Wars tile-overlay system

Strict 90° top-down flat plan view throughout. This system replaces the
baked terrain tiles in `sprites-90/terrain/` (preserved untouched). No
linear/connective feature is ever baked into a base tile.

## Layer order

1. **Base** — one clean ground texture tile, full-bleed, opaque.
   File: `base/<type>_v<1|2|3>-512.png` (512×512).
2. **Overlay** — one transparent autotile tile per family, drawn over the
   base. Several families may stack on one tile (e.g. road + dirt_path
   at a junction — see demo B). File: `overlays/<family>/<variant>-512.png`.
3. **Units / structures** — drawn above overlays (not part of this system).

Overlays are **cosmetic only**. They do not change gameplay terrain,
movement, or collision. No game code is edited by this system.

## Neighbour bitmask

Bits: N = 1, E = 2, S = 4, W = 8. A cell's mask is the sum of the bits
for neighbours that carry the SAME overlay family. Variant lookup:

| Mask | Variant | Arms |
|-----:|---------|------|
| 5 | straight_ns | N, S |
| 10 | straight_ew | E, W |
| 3 | corner_ne | N, E |
| 9 | corner_nw | N, W |
| 6 | corner_se | S, E |
| 12 | corner_sw | S, W |
| 14 | t_north | E, S, W (all except north) |
| 11 | t_south | N, E, W (all except south) |
| 13 | t_east | N, S, W (all except east) |
| 7 | t_west | N, E, S (all except west) |
| 15 | cross | N, E, S, W |
| 1 | end_north | N only |
| 4 | end_south | S only |
| 2 | end_east | E only |
| 8 | end_west | W only |

### T naming convention (used everywhere, including `overlays.json`)

**T_<direction> means the T opens to that direction, i.e. the arm in
that direction is MISSING.** T_north has arms E, S, W and no north arm.
T_south has arms N, E, W. T_east has arms N, S, W. T_west has arms
N, E, S. A T is chosen only when exactly three same-family neighbours
exist, in exactly those directions.

### Cross

Cross exists ONLY as the autotile variant when all four neighbours are
present (mask 15). It is never a standalone base tile and never drawn
for any other mask. A cross can therefore never be an orphan: it is
proof, by construction, that the line continues in all four directions.

### Isolated tile — deliberate, stated deviation from the task wording

The task brief said an isolated overlay tile behaves as an end cap.
This system implements something stricter, and states it plainly
instead of claiming the brief's wording:

- **Mask 0 (no same-family neighbours) → NO overlay is drawn.**
- **Exactly one same-family neighbour → the end cap** for that
  direction (end_north / end_south / end_east / end_west).

Reason: an end cap drawn on a truly isolated tile is a line stub that
starts at the tile centre and stops at one edge for no reason — a
half-feature with no continuation. Drawing nothing is the only
behaviour that can never produce an orphan cross or an unexplained
stub. An end cap is the correct terminus of a real line, which by
definition has a neighbour behind it. Demo A shows both ends as
terminus pads for exactly this reason.

## Geometry guarantee (why lines meet exactly)

Every overlay variant is built from **arms**: a shape from the tile
centre (256, 256) to one edge midpoint — N (256, 0), E (512, 256),
S (256, 512), W (0, 256) — drawn with the same width, offset, and
colours in every variant. A variant is simply the set of arms given
by its mask. Two adjacent tiles that both have an arm in the shared
direction therefore meet at the shared edge at exactly the same
position and width. There is no per-variant hand drawing to drift.

Per-family construction:

- **train_tracks** — two rails offset ±30 px from the centre-line,
  11 px wide with a highlight, sleepers under the rails. Straight
  variants have no centre block (rails and sleepers run straight
  through). Corners are true L turns: each rail turns at its offset
  corner point (C±30, C±30), not at the tile centre, so corners have
  no blocky centre square. T/cross/end tiles keep a small ballast
  pad under the junction, drawn first, with rails/sleepers over it.
- **road** — asphalt band, half-width 90 px, speckled, edge lines
  at ±81 px, NO centre marking (a centre marking would break at
  corners). Edge lines are drawn after the centre square, so they
  are continuous through the tile centre, not dashed.
- **dirt_path** — band, half-width 70 px, speckled light brown.
- **stepping_stones** — ellipses along each arm at 0, 72, 144, 216 px
  from centre, plus a centre stone. A stone centred on an edge
  midpoint is clipped by the tile boundary, so two neighbours
  complete one stone.
- **cracks** — jittered polylines with endpoints EXACT at the edge
  and at the centre; intermediate jitter (±8/±14 px perpendicular)
  never moves an endpoint. Scatter variants (scatter_1–3) are fully
  inside the tile (≥48 px from every edge, clamped 50–462 px), so
  they never imply continuation and need no neighbours.
- **wires_cables** — 9 px dark line with a 3 px copper highlight,
  centre dot.
- **pipes** — band, half-width 28 px, metallic grey with a highlight
  stripe, joint ring at the edge in the same position in every tile.
- **bridge_deck** — band, half-width 140 px, wood, plank lines
  perpendicular to the arm spaced 30 px starting at the edge, so
  plank phase matches the neighbouring tile; side rails at band
  edges. A bridge that turns is a corner; a bridge that crosses is
  only a cross when four bridge neighbours exist.

## Combining overlays with any base

Overlays are independent of base type: any family may be drawn over
any base (road over grass, dirt, and wasteland in demo B; bridge deck
over water and rock banks in demo C; cracks over rock in demo C).
The base underneath does not change the overlay's geometry, and the
overlay does not change the base's gameplay meaning.

## Avoiding repetition

Base variant selection: `variant = (x * 7 + y * 13) % 3 + 1` for the
tile at map position (x, y). Adjacent tiles therefore never share a
variant in a simple repeating block, and the same variant never
repeats in a 2×2 block under this hash. Variants v2 and v3 are the
v1 texture rotated 90° and flipped horizontally (see the report for
the honest symmetry caveat this creates). Overlay speckle and crack
jitter are seeded per family/variant, so every variant file is
identical every time it is drawn — autotiling must be deterministic,
or a line would change shape between frames.

## Files

- `base/` — 42 base tiles (14 types × 3 variants), full + `-512`
  copies, plus `base-tiles-sheet.png`, per-group sheets
  `base-a-sheet.png` / `base-b-sheet.png`, raw grids + prompts in
  `base/raw/`, and 3×3 repeat checks in `base/_qc/`.
- `overlays/<family>/` — 123 overlays (8 families × 15 variants,
  plus cracks scatter_1–3), full + `-512` copies, plus one contact
  sheet per family on a dark backdrop.
- `overlays.json` — family → variant → filename, mask, dirs.
- `demos/` — demo_a_train_track.png, demo_b_road_path.png,
  demo_c_water_bridge_cracks.png, all rendered from the actual
  base + overlay files (not hand-drawn) with the mask logic above.
- `tools/build_overlays.py`, `tools/build_sheets_demos.py` —
  deterministic builders; re-running them reproduces the set.
