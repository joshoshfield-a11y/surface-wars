# Surface Wars — Animation Sprites Report (Part 1)

Date: 2026-10-30. Scope was Part 1 ONLY: the missing wreck, FX, projectile,
and forest-canopy sprites. No game code was edited, nothing under
`assets/sprites/`, `assets/sprites-90/`, or `assets/tiles-overlay/` was
modified (read-only inputs, style reference only), `~/workspace/scrap-dungeon/`
was not touched, and nothing was committed, pushed, published, or packaged.

Pre-existing state: `assets/animation/` did NOT exist before this pass, so
no wreck/FX/projectile/canopy sprites were found already present — nothing
was skipped as pre-existing. Everything below is new, under
`assets/animation/` only.

## Method (same QC as the sprites-90 set)

Generate on pure black → flood-fill key from the borders (near-black < 48,
dark interior detail survives) → soft alpha falloff → trim and re-centre on
a transparent square canvas → full size + 512x512 LANCZOS `-512` copy.
Grids of 6 (3x2) plus single-sprite generations; flawed cells copied to
`raw-flawed/` and regenerated once with a simplified prompt. One labeled
contact sheet per category on a dark (#141414) backdrop, visually inspected.
Raws and prompt records preserved in `raw/` (`PROMPTS.md`,
`catalog-units.json`, the 16 generation images). QC tool:
`tools_key_and_sheet.py` (copy of the sprites-90 tool); `process.py` is the
slice/key driver for this set.

Style lock in every prompt: strict flat 90° top-down plan view, camera
directly overhead, no perspective, no 3/4 view, no side view, no diagonal
camera angle, pixel-art matching the sprites-90 units (dark metal, muted
palette). No diagonal/side/3-4 view, text, or failure was shipped.

## Totals

| Category | Distinct sprites | Files (full + -512) | Contact sheet |
|---|---:|---:|---|
| Wrecks (team-neutral) | 49 | 98 | `wrecks-sheet.png` |
| FX | 15 | 30 | `fx-sheet.png` |
| Projectiles (nose-up) | 4 | 8 | `projectiles-sheet.png` |
| Forest canopy | 6 | 12 | `canopy-sheet.png` |
| **Total new** | **74** | **148** | |

## 1. Wrecks — 49, one per catalog unit

Files: `wrecks/<unit-id>_wreck.png` + `-512` copy. Ids read from
`data/catalog.json` and verified on disk: **exact match, 0 missing, 0 extra**.
Each wreck is recognisably derived from its unit's footprint/shape but
clearly destroyed: broken hull, scattered debris, darkened/burnt metal, no
intact turret, no intact barrel pointing up, no live team colour.
Size class is carried in the full-size files: canvas side is scaled to
`320 + catalog_size*380` (scout 0.3–0.4 → 434–472px; colossus 1.2 → 776px).
`-512` copies normalise size, as in sprites-90, so in-game scaling must
still come from the catalog size. Visual only — no economy code exists in
this pass, and none was added.

## 2. FX — 15 (30 files)

`fx/`: smoke_1/2/3 (light wisp → medium puff → heavy dark billow),
fire_1/2/3 (small → medium → large, yellow core), muzzle_1/2/3 (small →
large bright starburst, barrel-tip sized), explosion_1/2/3/4 (small fireball
→ medium with smoke rim → large orange/red fireball → final dispersing dark
smoke with dying embers), dust_1/2 (small tan puff → larger spreading puff).

## 3. Projectiles — 4 (8 files), all nose-up

`projectiles/`: kinetic_tracer (thin bright cyan-white bolt), missile
(small grey rocket, red tip, fins, exhaust glow), energy_bolt (blue-white
orb with trail below), flame (teardrop fireball, point up). Drawn nose-up
so code can rotate them along travel.

## 4. Forest canopy — 6 (12 files)

`canopy/`: canopy_single (one small cluster of 3–4 crowns, centred),
canopy_dense (full tile of overlapping crowns), canopy_edge_n/s/e/w
(half-cluster tiles, foliage flush to the named edge only).
Designed to sit OVER the `forest_floor_v1/v2/v3` bases from tiles-overlay.
Foliage reads as overhead tree crowns, not side-view trees.
Edge anchoring verified numerically on the `-512` copies: named half
0.71–0.72 opaque, opposite half exactly 0.00 opaque for all four edges.

## Rejected / regenerated (all PASS on second pass)

Grid-boundary bleed / oversize cells found on sheet inspection and by
connected-component analysis (a detached fragment far outside the sprite's
own footprint, at a cell edge):

- drone_carrier_wreck — grid-06 carrier was wider than its cell; its right
  end was sliced off into the recon cell. Regenerated single, compact with
  margins. PASS: complete wide deck, no truncation.
- recon_aircraft_wreck — carried the carrier's sliced-off fragment at its
  left edge. Regenerated single. PASS: clean slim jet wreck, no fragment.
- smoke_3 — oversize: cloud touched the grid's right edge and its left lobe
  bled into smoke_2's cell. Regenerated single with margins. PASS.
- muzzle_3 — oversize: spike tips clipped at the grid's top/right edges.
  Regenerated single with margins. PASS.
- explosion_3 — oversize: fireball touched the grid's right edge.
  Regenerated single with margins. PASS.
- smoke_2, fire_2, muzzle_2, explosion_2 — neighbour-bleed fragments from
  the oversize sprites above (detached blobs 58–155px clear of each sprite's
  own mass, at the cell edge). Regenerated singles with margins. PASS:
  re-analysis shows remaining detached components are all inside each
  sprite's own footprint (own embers/sparks), none at an edge.

Flawed originals preserved in `raw-flawed/` (9 files). No sprite was
rejected twice, and no category was silently skipped.

## Verification (run on final disk state)

- Counts: wrecks 49 full + 49 `-512`; fx 15 + 15; projectiles 4 + 4;
  canopy 6 + 6.
- Every `-512` file is exactly 512x512 RGBA with transparent corners
  (all four corners alpha 0) — 0 failures across all 74.
- Wreck ids exactly match the 49 catalog ids — 0 missing, 0 extra.
- All four contact sheets viewed: labels readable, no diagonal, side,
  3/4, or text failures shipped.

## Honest gaps and caveats

- Regenerated singles (9 sprites) are simpler / slightly different in
  rendering detail than their grid siblings (e.g. regen smoke_2 is two-tone,
  regen explosion_3 is spikier than the round grid fireballs); they read
  clean at game size and keep their frame progressions.
- Plan-view part angles: several wrecks have parts angled IN the plan view
  (e.g. radar dish horizontal, mech legs splayed, gunship rotors as an X).
  These are rotations of parts seen from directly overhead, not a tilted
  camera — same judgement as the sprites-90 units report.
- storm_lance_wreck and interceptor_drone_wreck are the darkest/smallest
  wrecks; they read as rubble masses at sheet size and will read smaller
  in game. They were kept (not failures), but are the weakest reads in
  the set.
- canopy_dense crowns are scalloped at the tile edges (round crowns, not a
  solid rectangle): opaque fraction 0.705, bbox inset ~7% on the `-512`
  copy. Tiled dense blocks will show small scallop gaps at joins, which
  reads as natural canopy, not as a hard seam — but it is not a
  pixel-perfect full-bleed tile.
- Canopy generator note: the canopy grid arrived as a free arrangement
  rather than strict equal cells, but each tile's foliage fell inside its
  equal 3x2 cell; canopy cells were sliced at 0% inset (edge foliage must
  not be clipped) and each tile's foliage re-anchored flush to its named
  edge on a 640px square canvas (single centred, dense full-cell).
- Wiring: these sprites are NOT wired into any game code (out of scope for
  Part 1). File names and the manifest are the handoff for the wiring pass.
- The legacy `assets/sprites/` set is NOT included in
  `ALL-SPRITES-INDEX.md` totals; the index covers sprites-90, tiles-overlay,
  and this animation set (see the index header).
