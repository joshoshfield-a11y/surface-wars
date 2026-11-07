# Surface Wars — Graphics Audit + Regeneration Report (Workstream 1)

Date: 2026-10-31. Scope: `~/workspace/surface-wars/assets/` ONLY.
No game code, no tests, no APK, no other project was touched. Nothing
committed, pushed, published, or packaged. `game/sprites.js` and
`game/render.js` were read only (for item (g)) and are unchanged.

## Bottom line

- All seven audit items (a)–(g) were re-verified with measurements,
  not assumed. Six are fixed in the shipped tree; (f) is only partly
  mitigated (named below, not waived).
- 100 files replaced, all under their ORIGINAL filenames — the
  coordinator needs NO mapping changes and NO game-code wiring.
- Old files for every replaced class are preserved in
  `assets/_audit-backup-2026-10-31/` (100 files, same relative paths).
- The mirror-tile problem is fixed for ALL 14 base types, not just the
  six worst, and both crack-carrying bases are regenerated clean.
- No gate was waived. Every regenerated asset keeps strict 90°
  overhead, Iron Eden = blue / Xandria = red, and the existing
  naming/slug scheme.

## Audit findings per item

### (a) Red Rampart silhouette divergence — VERIFIED, FIXED
- Evidence (old): blue `rampart.png` 568x568, bbox 420x486, opaque
  152,674; red 591x591, bbox 386x506, opaque 116,725. Resampled to
  512x512, silhouette IoU = **0.588**. Visually: blue is square-plated
  with a blue ring centre; old red is round-plated with a red disc.
- Fix: fresh generation editing the blue sprite (prompt in
  `_audit-work/gen/PROMPTS.md`), flood-fill keyed, trimmed, re-centered
  (1508x1508), LANCZOS `-512`. New IoU vs blue = **0.878**; the
  remaining gap is detail-level redraw difference, not a different
  silhouette class (square plates, centre ring, barrel-up, yellow
  corner accents all match). Red-dominant pixels: 11,604 at 512.
- Files: `sprites-90/mechs/rampart-red.png`, `rampart-red-512.png`.

### (b) wall-red minimal — VERIFIED, FIXED (dots enlarged, same 9)
- Evidence (old): at 512, team marking = exactly **9 clusters**
  (blue: 9 cyan clusters of 73–86 px, 708 px total; red: 9 red clusters
  of 123–136 px, 1,150 px total, 4.8% of opaque). The wall is a thin
  horizontal strip, so at game size the dots were ~1–2 px.
- Fix: red dot mask dilated (21x21 elliptical kernel, fill only where
  originally opaque). New: still exactly 9 clusters, sizes 237–245 px,
  **2,165 px total (~1.9x area)**, same positions, no new geometry.
- Files: `sprites-90/structures/wall-red.png`, `wall-red-512.png`.
  (Blue wall untouched; cyan-on-grey already reads better than red.)

### (c) command_core / bunker reds shifting whole-body — VERIFIED with a correction, FIXED
- Evidence: against a like-for-like resize of each blue, pixels changed
  by >20: command_core old red **15.5%** (accent regions + a weak warm
  cast over the dark body — the prior report's "whole-body" wording
  overstated this one); bunker old red **74.2%** (true whole-body
  reddish-brown, confirmed visually: pinkish-brown body).
- Fix: accent-only reds derived from blue — pixels with blue-excess
  (B − max(R,G) > 60 and B > 100, i.e. ring/lights/trim, ~11% of opaque)
  get R↔B swapped; body greys are byte-identical to blue. New changed
  fractions: command_core **12.9%**, bunker **13.3%**. Visually both
  now read as "the blue building with red markings" instead of a brown
  building.
- Files: `sprites-90/structures/command_core-red.png` (+`-512`),
  `bunker-red.png` (+`-512`). An earlier loose threshold (B−R>15)
  caught body pixels too and was rejected; the 60-excess mask is the
  shipped one (bimodal distribution: body excess median 12–13, accent
  excess 90th percentile 77–81).

### (d) Base-tile mirror symmetry — VERIFIED (worse than reported), FIXED for all 14 types
- Evidence (old): EVERY base v1 is EXACTLY mirror-symmetric —
  flip-LR / flip-UD correlation = **1.000 for all 14 types** (prior
  report said "some tiles"; it is all of them). 3x3 repeats show
  kaleidoscope diamonds, clearest in crater_ground, desert_sand,
  frozen_ground, urban_ground, open_wasteland, marsh_ground as listed.
  Note on a prior-report claim: v2/v3 are NOT pixel-exact transforms of
  v1 (best-transform mean abs diff 7.4–34.5) — each variant was itself
  mirror-tiled, which is the actual defect.
- Fix (non-mirror method, attempted and successful for all 14 types):
  off-center 512x512 crops from the project's own raw generated grids
  (`tiles-overlay/base/raw/grid-a|b|bb1|bb2.png`, the grids the shipped
  tiles were built from), made seamless by offset-blend
  (S = (1−w)·T + w·roll(T,256,256), raised-cosine w; the GIMP
  "make seamless" construction). Off-center crops break the raw cells'
  symmetry axis, so the blend does not reintroduce mirroring (a
  centered offset-blend of a mirrored tile would — tested in analysis,
  avoided by construction).
- Verification per installed tile: seam ratio (edge-column diff /
  interior-column diff) 0.84–1.74, i.e. edge steps at interior-noise
  level; 1:1 seam crops (desert, water, grass) show no seam at the tile
  corner junction; 3x3 repeats show no kaleidoscope motifs.
- Honest caveat on the metric: flip-correlation stays elevated for
  smooth textures (desert 0.93–0.95, water 0.88–0.91, river_bank
  0.72–0.75, grass 0.64, frozen 0.42–0.45) because smooth dune ripples,
  water, and fine grain correlate under flips by nature. The defect
  being fixed is mirrored MOTIFS in repeats, and those are gone
  visually; the correlation number alone cannot distinguish a smooth
  texture from a mirrored one. Crater tiles still repeat their large
  crater features once per tile (inherent to tiling; the v1/v2/v3 hash
  rotation in `sprites.js` mitigates it in-game).
- Files: all 42 base full files + 42 `-512` files under
  `tiles-overlay/base/` (14 types × 3 variants × 2). RGB 512x512,
  matching the old format.

### (e) Fine cracks in open_wasteland / broken_asphalt_plain bases — VERIFIED crack-like, REGENERATED CLEAN (decision made as instructed)
- Evidence: open_wasteland v1 carries a dense crack network across the
  whole tile (visible at a glance). broken_asphalt_plain v1 carries
  short thin dark fracture lines among the speckle (confirmed on a 2x
  centre crop and a dark-line emphasis image) — these ARE crack-like,
  distinct from round speckle pits, so the "leave them" branch does not
  apply. Cracks belong only in the `cracks` overlay family, which is
  untouched.
- Fix: two fresh generations with explicit no-crack prompts (see
  `_audit-work/gen/PROMPTS.md`), crops (0,0)/(544,544)/(1088,1088),
  offset-blend seamless. New tiles viewed: dusty dirt with speckle +
  pebbles, and uniform grey asphalt speckle — no crack lines, no
  baked lines of any kind, no roads/paths/tracks.
- Files: `tiles-overlay/base/open_wasteland_v{1,2,3}.png` (+`-512`),
  `broken_asphalt_plain_v{1,2,3}.png` (+`-512`).
- Note: the old baked `sprites-90/terrain/` tiles (including cracked
  `open_wasteland.png` there) were NOT deleted or edited, per the
  replacement-system design — they must still not be wired as lone
  tiles (pre-existing caveat, unchanged).

### (f) Thin chassis reading faint at small sizes — VERIFIED, PARTLY MITIGATED (not fully fixed — see Remaining)
- Evidence: at full res, median interior half-thickness (distance
  transform) is 5 px for lancer and 6 px for longshot, with opaque
  fractions 0.101 / 0.108 (vs 0.31–0.47 for other mechs). Lancer's
  catalog size is 0.55, so at zoom 1 it draws ~35 px from a 512 file:
  its barrel is ~1 px. The 35 px / 70 px comparison sheet shows lancer
  as a near-invisible sliver at 35 px and faint at 70 px.
- Mitigation shipped: 3 px edge-color dilation on lancer + longshot,
  blue and red (alpha dilated, new ring pixels filled from neighbouring
  opaque colours; identity preserved). Opaque at 512: lancer
  25,952→33,321; lancer-red 31,804→36,347; longshot 27,521→33,878;
  longshot-red 39,253→45,320. At 70 px the dilated sprites read
  clearly better; at 35 px they are only marginally better.
- Files: `sprites-90/mechs/lancer.png` (+`-512`, +`-red` variants),
  `longshot.png` (+`-512`, +`-red` variants).

### (g) `-512` files not preserving relative class scale — VERIFIED, NO FIX NEEDED (by design)
- Read-only check of `game/sprites.js` + `game/render.js` (NOT edited):
  unit draw size = `u.radius * TILE * zoom` (TILE = 32),
  structure draw size = `s.radius * TILE * zoom`, base tiles draw at
  `TILE * zoom`. Sprite file dimensions never enter the size
  computation; `-512` files are uniform 512 px sources and in-game
  scale comes entirely from sim/catalog data. The `-512` non-scale is
  therefore harmless and needs no mapping change. (The renderer's
  existing crisp-scaling rule — smoothing off at zoom ≥ 1, high
  quality smoothing below — plus drawn blob shadows, already matches
  the researched best practice for this 2D WebView game; no game-code
  change was made or is proposed from this workstream.)

## Whole-set audit (beyond items (a)–(g))

- Counts re-verified on disk: sprites-90 mechs 16 variants / 32 files,
  units 98 / 196, weapons 270 / 540, terrain 20 / 40, structures 46 /
  92 (total 450 / 900, matching SPRITES-90-REPORT); mechs-expansion 63
  chassis (31 additional + 8 each bulwark/longshot/striker/vespid) /
  252 files; animation wrecks 49 / 98, FX 15 / 30, projectiles 4 / 8,
  canopy 6 / 12; tiles-overlay bases 42 / 84, overlays 123 / 246.
- Scan of 650 full-size sprites: zero near-empty sprites; the only
  "near-solid" flags are the 20 full-bleed terrain tiles, which are
  opaque by design. All 815 `-512` files are exactly 512x512.
- Expansion + animation sets were audited by count/size/transparency
  only; no regeneration was ordered for them, and expansion stays
  sprites-only per the loop scope (catalog addition without
  balance/testing would break the quality bar).

## Files regenerated (100, all original filenames — no mapping changes)

| Group | Files |
|---|---|
| Base tiles, 14 types × v1/v2/v3, full + `-512` | 84 |
| `sprites-90/mechs/rampart-red` full + `-512` | 2 |
| `sprites-90/structures/command_core-red`, `bunker-red`, `wall-red`, full + `-512` each | 6 |
| `sprites-90/mechs/lancer`, `lancer-red`, `longshot`, `longshot-red`, full + `-512` each | 8 |
| **Total replaced** | **100** |

Backup: `assets/_audit-backup-2026-10-31/` — 100 files, same relative
paths. Working material (scripts, raw generations, QC sheets, metrics):
`assets/_audit-work/` (incl. `gen/PROMPTS.md` with all prompts/methods).

## Contact sheets viewed (by this auditor)

- `_audit-work/audit-sheet1-pairs.png` — rampart/wall/command_core/
  bunker blue-vs-red pairs (audit evidence).
- `_audit-work/audit-sheet2-thin-tiles.png` — lancer/longshot at full
  and 64 px; open_wasteland / broken_asphalt / desert_sand /
  crater_ground singles + 3x3 repeats (crack + mirror evidence).
- `_audit-work/broken-asphalt-center2x.png`,
  `broken-asphalt-darklines.png` — crack evidence for (e).
- `_audit-work/raw-grid-a-800.png`, `raw-grid-b-800.png`,
  `raw-grid-bb1-800.png`, `raw-grid-bb2-800.png` — raw-cell sources.
- `_audit-work/open-wasteland-gen-800.png`,
  `broken-asphalt-gen-800.png` — fresh clean textures (no cracks).
- `_audit-work/newtiles-sheet.png` — all 7 first-wave tiles, v1 single
  + v1/v2/v3 3x3 repeats.
- `_audit-work/newtiles-sheet2.png` — remaining 7 types, same layout.
- `_audit-work/seamcheck-desert_sand.png`,
  `seamcheck-water_plain.png` (1:1 crops straddling the tile-corner
  junction — no seam visible) + numeric seam checks for grass.
- `_audit-work/sprite-fixes-sheet.png` — new rampart-red, accent-only
  reds, enlarged wall dots, lancer/longshot old-vs-dilated at 35 px,
  70 px, and full size.
- Note: faint gridlines visible inside the small 3x3 sheet cells are a
  downscale/paste artifact of the sheet builder (66 px sub-tiles in a
  200 px cell), not tile seams — proven by the native-resolution seam
  crops and seam-ratio metrics above.

## Research used (recorded)

- Skills read (only these SKILL.md files): `local_sprite_batch_qc`
  (generate → slice → flood-fill key → contact-sheet QC → one
  simplified regeneration pass), `local-imagen`, `local-nanobanana`.
  The imagen/nanobanana scripts require a `GEMINI_API_KEY`, absent in
  this sandbox; no key was requested or used. Generation instead ran
  through the available media pipeline (3 calls; the reserved 4th call
  went unused because no class needed the extra regeneration pass).
- Web research: canvas `imageSmoothingEnabled` / DPR crisp-scaling
  practice (confirms the existing `render.js` rule, no change made);
  offset-blend / GIMP "make seamless" construction (used for tiles);
  resize-algorithm trade-offs (LANCZOS downscale from larger masters,
  kept); blob-shadow lighting for top-down 2D (already implemented in
  `render.js` as drawn ellipses, no change made). No external
  tools/assets were downloaded.

## Provenance / licenses

No third-party assets were downloaded and no other game's art, names,
stats, or sprites were copied. Regenerated art derives from (a) this
project's own previously generated art (raw grids, blue sprites) or
(b) three fresh generations made for Surface Wars in this session.
Nothing here carries a third-party license. The legacy
`assets/sprites/` set was not touched (reference-only).

## Mapping changes needed by the coordinator

NONE. Every replaced file keeps its original path and filename, so
`game/sprites.js` paths (`unitPath`, `structurePath`, `basePath`,
`overlayPath`) resolve unchanged. The 7 newly de-mirrored base types
that are already wired (grass, dirt, water_plain, forest_floor,
rocky_ground) keep their palette families because they come from the
same raw cells as the originals; the other 7 types (incl.
open_wasteland, broken_asphalt_plain, desert_sand, crater_ground,
frozen_ground, urban_ground, marsh_ground) are available to the
third-map work under their existing names.

## Remaining items (not hidden, not waived)

1. **(f) thin chassis at zoom-1 size (PARTIAL).** Lancer/longshot are
   still faint at ~35 px draw size. Dilation helps at zoom ≥ 2 but a
   real fix needs either game-side treatment (minimum display size,
   outline ring, or team-colour underlay — wave-2 in-game graphics
   work, game code, not this workstream) or a fresh thicker generation
   with hero approval (lancer is the hero base chassis). Do not claim
   (f) fixed.
2. **Pre-existing sprite notes, unchanged:** warden-red's small bottom
   protrusion; vespid's pointed-prong hull; ammo_depot / logistics_hub
   yards keying transparent between parts; light_factory /
   logistics loose islands; thin-by-nature weapons (corrosion_needle,
   leech_harpoon, the_negotiator) kept slim; `sprites-90/terrain/`
   bridge cross-junction and river ford symmetrical cross (old baked
   tiles, superseded by the overlay system — do not wire as lone
   tiles).
3. **In-game / phone verification of the new art has NOT been done.**
   Game code was untouched by design; the coordinator's wave-2 /
   parent-verification step must confirm the new tiles and sprites in
   a real browser/phone run before the APK is presented.
4. **Process note (fixed, recorded):** the first install script
   misnamed the wall file (`wall-red-red.png`) and stopped before the
   wall + lancer/longshot installs. The install was re-run for the
   remaining 10 files and every installed file was re-verified
   (wall-red team pixels 2,165 in 9 clusters; dilated opaque counts
   match the pre-install measurements). Final installed state is as
   reported above.

## Gates waived

NONE. 90° overhead held on all regenerated art; team colours held
(blue Iron Eden / red Xandria); naming/slug scheme held; no game,
test, APK, or other-project files touched; nothing committed, pushed,
published, or packaged.
