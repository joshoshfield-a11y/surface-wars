# Wave-2 Graphics Upgrade Report — Surface Wars

Date: 2026-10-31 (sandbox run). Builder: wave-2 graphics upgrade subagent.
Scope: in-game graphics only (`game/` code + new art under `assets/`).
No APK built. Nothing committed, pushed, merged, or published.
No sim / economy / AI / balance file was edited (see §8).

## 1. What was verified from wave 1 (real browser, before/after)

Wave-1's 100 regenerated files were rendered in-game through the real
`drawScene` code, with a second server that falls back to
`assets/_audit-backup-2026-10-31/` for every asset the backup holds, so
before/after pairs run identical code and differ only in art.

- **De-mirrored bases — CONFIRMED in-game.** Before shots show repeating
  symmetric kaleidoscope motifs in grass and dirt; after shots show natural
  noise texture. Pairs: `harness-ground-before-z1.png` /
  `harness-ground-after-z1.png` and the same pair at `z05`.
- **Command-core accent-only reds — CONFIRMED.** The red core renders as a
  neutral body with a red accent ring and small red dots, matching the blue
  core's pattern (`crop-ground-east-after.png` vs `crop-ground-east-before.png`).
  Bunker red renders as a flat red block in both before and after at game
  scale (no visible change at that scale).
- **Wall-red dots — file-verified, game-scale caveat.** The wall-red file is
  a horizontal strip with 9 red dots; the new dots are visibly larger than
  the old ones (`wall-red-new-256.png` vs `wall-red-old-256.png`, same 9
  clusters, same bbox). In-game the wall renders as a team-colour block,
  because the renderer draws every structure square by radius while the wall
  asset is a 7.5:1 strip — a pre-existing aspect mismatch, not changed by
  wave 2. The dots do not read as dots at game scale.
- **Wave-1 mechs/ wiring gap — FOUND, not fixed silently.** No `mechs/`
  reference exists in `game/*.js`, and MD5s differ between `mechs/` and the
  wired `units/` files. Wave-1's rampart-red silhouette fix and
  lancer/longshot dilation therefore do NOT reach the game. Detail:
  the wired `units/rampart_fortress-red` already matches its own blue
  silhouette (verified on `rampart-wiring-sheet.png`), so there is no
  in-game rampart defect — but the wave-1 fix is still unwired. The wired
  lancer/longshot thin chassis was NOT dilated by wave 1, which is why
  wave 2 treats it render-side (§5). Replacing the wired unit sprites
  outright was deliberately NOT done without a wiring decision from the
  coordinator.

## 2. Code changes

- `game/render.js` — DPR helpers + ground bake + structure wrecks +
  thin-chassis treatment + damage decals + blob-shadow offset + baked glow
  sprites + HP-bar/ring minima + canopy far-zoom alpha polish. Now
  Node-exported for tests (same pattern as `animation.js`/`sprites.js`).
- `game/animation.js` — pure additions only: `damageTier`,
  `damageDecal`, `THIN_CHASSIS_TYPES`, `thinChassisTreatment`. Existing
  `damageSmoke` untouched.
- `game/sprites.js` — `STRUCTURE_WRECK_ART` (15 entries),
  `structureWreckPath` / `structureWreckStem`, `iconPath`; preload list
  extended with all wrecks, decals, icons.
- `game/game.js` (rendering/HUD parts only) — DPR canvas sizing with CSS
  game logic; `structureWrecks` render layer fed from the pre/post diff;
  FX fixed pool (steal-oldest past 96); order icons prepended once at
  init; hero badge font 11px → 12px; drop-button label swaps preserve
  the prepended icon (bug found by the playthrough: `textContent`
  assignment was wiping both Drop Back In icons; fixed, re-probed 8/8).
- `game/style.css` — menu/HUD polish only: overlay-box `#202020`/`#777`,
  padding 22px, gap 12px; button text `#f2f2f2`; new `.cmd-icon` 18×18px.
  No new screens, no new buttons, no dead buttons.
- `game/_wave2-harness.html` (NEW, verification-only, not referenced by
  `index.html`, not packaged) — renders synthetic scenes through the real
  `drawScene` with the real asset paths; sets `window.__ready` /
  `window.__missing`.

### DPR-capped canvas

Backing store = CSS size × `min(devicePixelRatio, 2)`; all game logic
(camera, taps, stick zones, viewTiles, clamp, selection) uses CSS sizes.
Smoothing policy kept: on below zoom 1, off at/above zoom 1, high quality
while on. Verified numerically in-browser at 844×390 (DPR 2: CSS 544×311
→ backing 1088×622), 390×844 portrait (390×358 → 780×648), 932×430
landscape (632×370 → 1264×788). No layout regression: menu, match start,
minimap, tray all render at all three sizes.

### Pre-rendered static ground layer

Bases + edge shading + bridge deck + neighbour-computed overlays bake once
to an offscreen canvas at 64 px/tile and blit per frame as one `drawImage`
of the visible window. Re-bake only when `groundBakeKey` changes (map
dimensions + terrain + sorted overlay entries). Incomplete bakes are NOT
cached, so a frame with an unready image retries instead of freezing a
hole. Water stays per-frame (shimmer cycles with sim time); canopy stays
per-frame (zoom-dependent alpha). Fallback: when no bake is available
(Node, no document, incomplete), the original per-frame path runs
unchanged. Known difference, disclosed: baked edge shading scales with
zoom (4 bake-px), whereas the old per-frame edges were a fixed 2 screen px.

### FX / lighting / shadow / canopy

- FX pool: after the duration filter, `effects` is capped at 96 by
  stealing the oldest. No per-frame allocation for glow.
- Glow sprites: one cached radial-gradient sprite per kind (muzzle
  `#ffd76a`, explosion `#ff9a3c`, fire `#ff6a2a`), drawn with additive
  `'lighter'` at 0.5/0.6 alpha, size es×1.4, over existing frame sprites.
  Dust/smoke deliberately NOT glowed (normal alpha). No per-frame
  gradients, no `shadowBlur` anywhere (rule kept).
- Blob shadows: still drawn ellipses; fixed directional offset changed
  from (2,3)×zoom to (3,4)×zoom (light from upper-left).
- Canopy: far-zoom alpha 0.78 → 0.82 below 0.6×, 0.88 → 0.92 below 0.8×,
  inside the existing canopy-tile system; no new terrain types. The
  far-zoom simplification itself (dust/smoke FX and smallest-unit HP bars
  hidden below 0.6×) is intact.

## 3. Art generated (media pipeline → flood-fill key → trim/re-center → -512)

Pipeline script: `assets/_wave2-work/key_and_slice.py` (OpenCV flood fill
from borders through near-black pixels, so dark interior detail survives).
Raw generations: `assets/_wave2-work/raw/`. Every final file was viewed on
a contact sheet against a dark backdrop.

### Damage decals — 2 (1 light + 1 heavy), both passing QC

- `assets/animation/fx/damage_light.png` + `-512.png`
- `assets/animation/fx/damage_heavy.png` + `-512.png`
- QC note: the first light scorch failed keying (flood fill ate the dark
  interior through edge notches, leaving faint orange lines). Per the
  sprite-batch skill's one simplified regeneration pass, a second scorch
  was generated (solid filled interior, ember flecks) and keyed cleanly
  (bbox 1264×1271, opaque 1,027,542). The flawed v1 raw is kept at
  `assets/_wave2-work/raw-flawed/` for the record. Sheet:
  `assets/_wave2-work/decals-sheet.png`.
- Drawn over the unit sprite, rotating with it, size ur×2.2, alpha 0.9,
  gated by `!farZoom && showFX`, on top of the existing smoke tiers.
  Thresholds: ≥50% none, 25–50% light, <25% heavy (50% and 25% exact
  boundaries tested).

### Structure wrecks — 13 stems (12 dedicated + 1 generic), covering all 23 types

Under `assets/animation/structure-wrecks/`, each full + `-512.png`.
Generated as two 2×3 grids plus one single mound; all cells separated
cleanly, keyed, viewed on `assets/_wave2-work/wrecks-sheet.png`.
Team-neutral rubble (not team-coloured).

Dedicated (15 types): `command_core_wreck`; `turret_wreck` shared by
light/heavy/aa/missile turret (same silhouette family); `bunker_wreck`;
`wall_wreck` (correctly a thin line, bbox 612×93); `light_factory_wreck`;
`scrap_extractor_wreck`; `power_plant_wreck`; `research_lab_wreck`;
`repair_depot_wreck`; `radar_station_wreck`; `ammo_depot_wreck`;
`shield_generator_wreck`.

Generic `rubble` (8 types, stated explicitly, not hidden):
advanced_reactor, vehicle_factory, mech_bay, aircraft_hangar, heavy_plant,
salvage_processor, logistics_hub, experimental_facility.

Honest art note: wreck piles carry the slight relief angle inherent to
generated rubble; rubble has no facing, so this is acceptable, but it is
not pixel-perfect flat 90° for the turret barrel diagonal.

Render layer: `anim.structureWrecks`, mirroring the unit-wreck pattern
(rotate by `rot`, size `(radius||1)×TILE×zoom`), fed from the pre/post
diff in `game.js` (radius = catalog footprint/2, rot = id×53 mod 360°).
Persistent for the match, cleared on newGame, never a sim entity, never
blocks movement, never selectable. No removal rule beyond match reset
(the sim has no wreck cleanup; the render layer matches that).

### UI icons — 7, all passing QC, supplementing (never replacing) text

Under `assets/ui-icons/`, 128×128 PNG, solid backgrounds, NOT keyed
(used as small button images): `move`, `attack-move`, `hold`, `patrol`,
`salvage`, `guard`, `drop-back-in`. Viewed on
`assets/_wave2-work/icons-sheet.png`: all clean, readable, no text.
Hold reads as a hand inside a shield (acceptable as hold/stop);
attack-move is crosshair + arrow. Patrol/salvage raws have small white
corner pixels at full size — negligible at 18px button size. Text labels
untouched everywhere. All 8 button slots carry icons in the live game
(6 tray + 2 Drop Back In), verified by DOM probe after the label-swap fix.

## 4. Tests

- New `tests/graphics-wave2.test.js`: 14 tests, all passing — DPR cap
  value/pass-through; bake key stable for identical inputs, changing on
  terrain change, overlay variant change/add, dimension change, and
  overlay-order independent; bake tile 64; damage-tier boundaries (50%
  none, 49% light, 25% light, 24% heavy, 0 heavy, maxHp 0 none); decal
  mapping + both files on disk; all 23 structures map to a wreck file on
  disk; dedicated 15 vs generic 8, turret sharing, 15 map keys; HP bars
  ≥28×4 at zooms 0.5/1/2 with exact cases; ring widths 2/2/4 px at
  0.5/1/2; thin-chassis treatment only at zoom ≤1 and only
  lancer/longshot; all 7 icon files on disk.
- Full suite: `node --test tests/*.test.js` → **230 pass, 0 fail**
  (216 pre-existing + 14 new). No old test file was changed.
- Syntax checks passed for `render.js`, `animation.js`, `sprites.js`,
  `game.js`.
- Not unit-testable (stated honestly): hero badge 12px clarity, because
  `game.js` is not Node-exported — it is code-visible and visible in
  screenshots; drop-icon preservation is DOM behavior, verified by the
  browser probe (8/8) rather than a unit test.

## 5. Thin-chassis treatment (rendering aid, NOT sprite art)

For `lancer_mech` / `longshot_mech` only (hero base chassis included),
at zoom ≤ 1 only: team-tinted underlay disc (alpha 0.35, radius
ur×1.15 / ur×0.85) + darker outline ring (alpha 0.55, `#111`, lineWidth
max(1.5, 2×zoom)) beneath the sprite. Draw size UNCHANGED, sim scale
untouched, no stat change. Verified: at zoom 1 both mechs show the disc
and the medium_tank control does not (`harness-thin-z1.png`); at zoom 2
neither mech shows it (`harness-thin-z2-fixed.png`); at 0.5 the discs
read at small scale (`harness-thin-z05.png`).

## 6. Headless browser playthrough (real Chromium, real input, 0 page errors)

Driver: `assets/_wave2-work/playthrough.py` (Playwright, local HTTP
servers on 8901 live / 8902 backup-fallback). Flow: menu → Play First Map
→ zoom 0.5×/1×/2× → portrait 390×844 → landscape 932×430 (canvas==stage
asserted at all three) → Forest Belt via pause menu → harness scenes →
live attack run (Select All → attack-move → 6 canvas drags east → click
east → 30s + 90s). Result: **22 screenshots, 0 console errors, 0 page
errors.** Live combat proven: Iron Eden 5 vs Xandria 6 from 9v10,
Wrecks 14, tick 1986, a damaged live unit (partial HP bar) and a unit
wreck on field (`real-attack-90s.png`). A live-match structure kill was
NOT reached in the time box (cores still alive); the harness wreck shot
stands as the structure-wreck render evidence, and this is stated, not
papered over.

## 7. Screenshots viewed (all under `assets/_wave2-work/shots/` unless noted)

Real game: `real-menu-844x390.png` (menu polish, tray icons behind
overlay); `real-first-spawn.png` (spawn view, 6 tray icons, minimap,
de-mirrored ground); `real-zoom-05.png`, `real-zoom-1.png`,
`real-zoom-2.png` (zoom series, HP minima); `real-portrait-390x844.png`,
`real-landscape-932x430.png` (layout intact); `real-forest-belt.png`
(Third Map running); `real-icons-fixed.png` (Drop Back In icon present
after the label-swap fix); `real-attack-30s.png`, `real-attack-90s.png`
(live combat, damage, unit wreck).
Harness before/after: `harness-ground-before-z1.png`,
`harness-ground-after-z1.png`, `harness-ground-before-z05.png`,
`harness-ground-after-z05.png` (de-mirroring); `crop-ground-before-structs.png`,
`crop-ground-after-structs.png` (command core + wall); `crop-ground-east-before.png`,
`crop-ground-east-after.png` (bunker red, core red accents, forest/rock
bands); `harness-wall-before-z2.png`, `harness-wall-after-z2.png`,
`crop-wall-before.png`, `crop-wall-after.png` (wall blue/red blocks).
Damage/HP: `harness-damage-light-heavy.png`, `crop-damage-row.png`
(light scorch vs heavy cracked plate + smoke + bars); `harness-hp-z05.png`,
`harness-hp-z1.png`, `harness-hp-z2-fixed.png` (bars at all zooms).
Wreck: `harness-structure-wreck.png`, `crop-wreck-row.png` (command-core
rubble + small turret wreck).
Thin: `harness-thin-z05.png`, `harness-thin-z1.png`,
`harness-thin-z2-fixed.png` (treatment on ≤1, off at 2; tank control).
QC sheets: `assets/_wave2-work/decals-sheet.png`,
`assets/_wave2-work/wrecks-sheet.png`,
`assets/_wave2-work/icons-sheet.png`,
`assets/_wave2-work/rampart-wiring-sheet.png`,
`assets/_wave2-work/wall-red-old-256.png`,
`assets/_wave2-work/wall-red-new-256.png`.
Superseded framing (kept for honesty, not used as evidence):
`harness-thin-z2.png` and `harness-hp-z2.png` framed the units at the
bottom edge (camera math, not a render bug); re-shot framed as
`harness-thin-z2-fixed.png`, `harness-thin-z2-tank.png`,
`harness-hp-z2-fixed.png`.

## 8. Files changed / not changed

Changed: `game/render.js`, `game/animation.js`, `game/sprites.js`,
`game/game.js` (rendering/HUD only), `game/style.css`;
new: `game/_wave2-harness.html`, `tests/graphics-wave2.test.js`,
`assets/animation/fx/damage_light(.png,-512.png)`,
`assets/animation/fx/damage_heavy(.png,-512.png)`,
13 `assets/animation/structure-wrecks/*(.png,-512.png)`,
7 `assets/ui-icons/*.png`; work notes under `assets/_wave2-work/`
(pipeline script, harness driver, screenshots, QC sheets).
NOT edited: `sim.js`, `hero.js`, `progression.js`, `weapons.js`,
`catalog.json` (read only), `CONTROLS.md`, `UPGRADE-LOOP.md`,
`AUTONOMOUS-LOOP.md`, `apk/`, `scrap-dungeon/`, `voxbox-amberfall/`,
any old test file. No APK built. No git commit/push/merge/publish
(the tree is not a git checkout).

## 9. Performance notes (honest limits)

No frame-time or FPS numbers are claimed: sandbox headless Chromium
numbers are NOT phone FPS, and no phone run exists. What is structural,
not measured: the ground layer goes from per-tile per-frame image draws
to one blit per frame plus a re-bake only on map/overlay change; glow
goes from per-frame gradient creation to one cached sprite per kind;
FX are capped at 96 with steal-oldest. Cost to watch on phone: the bake
canvas for an 80×50 map at 64 px/tile is 5120×3200 (~65 MB backing);
if the S25 struggles, the bake scale (currently 64) is the knob, not the
bake itself. The far-zoom simplification below 0.6× is unchanged.

## 10. Honest gaps (nothing waived silently)

1. **No real-phone verification.** Finger pinch, thumb ergonomics, and
   S25 performance remain user-side verdicts. All browser evidence is
   headless desktop Chromium emulation.
2. **Wave-1 mechs/ unwired** (§1): rampart-red fix and lancer/longshot
   dilation do not reach the game; the wired lancer/longshot sprites
   were not replaced (coordinator decision needed, not a silent swap).
3. **Structure wrecks partial:** 8 of 23 types use the generic rubble
   decal (listed in §3); 4 turret types share one turret wreck. Wreck art
   carries slight relief angle, not pixel-perfect flat 90°.
4. **Wall aspect:** wall strip art is drawn square by the pre-existing
   radius-based structure draw, so wall-red dots do not read as dots
   in-game (file-level enlargement verified).
5. **Icons:** solid backgrounds (not keyed); patrol/salvage raws have
   small white corner pixels at full size, negligible at 18px.
6. **Baked edges** scale with zoom vs the old fixed 2 screen px (§2).
7. **Canopy far-zoom alpha** changed slightly (0.78→0.82, 0.88→0.92);
   far-zoom FX/bar hiding itself is unchanged. At zoom 0.5 the smallest
   units' (radius <0.5) HP bars remain hidden by the far-zoom rule; the
   28×4 minimum applies to bars that are drawn.
8. **Hero badge** clarity is code-visible only (12px font), not
   unit-tested (§4). **Live structure kill** not reached in the sandbox
   time box (§6). **No perf numbers** claimed (§9).
