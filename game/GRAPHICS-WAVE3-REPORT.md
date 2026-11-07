# Wave-3 Graphics Report — Surface Wars

Date: 2026-10-31 (sandbox run, evening PDT). Builder: wave-3 graphics subagent.
Scope: remaining named visual limits from v1.5, in task order. No APK built.
Nothing committed, pushed, merged, or published. No other project touched.
No new units, weapons, maps, or mechanics. No game-logic file edited
(sim.js, game.js gameplay logic, maps.js, hero.js, progression.js,
weapons.js untouched); the only game-code edits are rendering-side
(render.js, sprites.js mapping/preload), which the task owns.

Baseline: suite 234/234, APK v1.5 (versionCode 6) as briefed.
Final suite: **239/239** (234 baseline + 5 new wave-3 tests; one old
wave-2 test updated explicitly, see §8).

Skills: `local_sprite_batch_qc` read and followed (generate on black,
flood-fill key, contact-sheet QC, one simplified regeneration pass
equivalent: the flat-4 grid is the second pass for wrecks; failed red
cells were NOT re-run — the gate, not a retry loop, decides).

Generation calls used: 4 total (the media pipeline's per-response
allowance): (1) 2×4 grid of the 8 new wrecks, (2) 2×2 grid of flat
turret/bunker/wall/command-core wrecks, (3) 3×3 grid of 9 red hulls,
(4) 3×3 grid of 9 more red hulls. All other wave-3 art is derivation
or keying of existing project art, disclosed as such.

## 0. Headline finding (a bug, found by this wave, fixed in scope)

**In v1.5, NO non-core structure sprite ever displayed in game.**
`game/render.js` drew the structure sprite and then, for every
non-core structure, unconditionally drew an opaque team-colour block
(fillRect, faction colour) plus a black centre square over it. The
before screenshots prove it: `before-structs-blue-z1.png` /
`before-structs-red-z1.png` show every non-core structure as a flat
team block; only command_core (which takes the pulse-dot branch, not
the block branch) shows its art. This is why wall-red dots "did not
read" — the wall sprite was never visible at all, not because of its
strip aspect (see §3 for the corrected aspect analysis). Wave-2's
"aspect mismatch" framing is superseded by this finding. The fix is
render-side (§3) and is the single largest visual change of wave 3:
all 23 structures now show their art in game.

## 1. Structure wrecks: the generic 8 are closed

New dedicated wrecks (one 2×4 generation, flood-fill keyed, sliced,
viewed on `assets/_wave3-work/staged-new8-sheet.png`):

| type | new wreck stem | reads as |
|---|---|---|
| advanced_reactor | advanced_reactor_wreck | cracked reactor ring + ember flecks |
| vehicle_factory | vehicle_factory_wreck | assembly-line plates, wheels, girders |
| mech_bay | mech_bay_wreck | shattered mech frame limbs + plates |
| aircraft_hangar | aircraft_hangar_wreck | torn wing panels + fuselage sections |
| heavy_plant | heavy_plant_wreck | furnace chunks, pipes, heavy slabs |
| salvage_processor | salvage_processor_wreck | scrap piles, crushed cubes, conveyor fragments |
| logistics_hub | logistics_hub_wreck | broken crates, containers, supply boxes |
| experimental_facility | experimental_facility_wreck | shattered lab panels, glass, instruments |

`game/sprites.js` `STRUCTURE_WRECK_ART` now maps all 23 types (20
stems; 4 turret types still share `turret_wreck`), preload list
extended with the 8 new stems, and the generic `rubble` file remains
on disk only as an unused fallback stem. **Zero types now fall back
to generic rubble.** In-game proof: `after-wrecks-z1.png` — the 8
former-rubble slots now show distinct piles; the before shot
(`before-wrecks-z1.png`) shows them as identical brown circles.

## 2. Wreck relief angle: moved toward flat where identity survives

Attempt: a 2×2 flat generation (viewed on
`assets/_wave3-work/staged-flat4-sheet.png`, game-size comparison on
`assets/_wave3-work/flat-vs-old-gamesize.png` at 64 px and 32 px).

- **Installed:** turret, bunker, wall flats (over the existing stem
  names; originals in `assets/_wave3-backup/`). Turret flat reads
  MORE clearly at game size than the old rubble blob (flat ring +
  horizontal barrel vs diagonal barrel + debris). Bunker flat is a
  flat slab pile, flatter than the old side-faced block, same mass
  at 32 px. Wall flat is a cleaner thin line, same as old at 32 px.
- **Rejected, with reason:** command_core flat — its blue disc
  accents read as Iron Eden faction colour on a team-neutral wreck
  at 64 px and 32 px, a faction-misread risk worse than the relief
  it removes. Old command_core wreck kept.
- **Stay angled, with reasons (the other 8 old wrecks):**
  light_factory (truss diagonals), scrap_extractor (crane truss),
  power_plant (sphere), research_lab / repair_depot / ammo_depot /
  shield_generator (panel-and-frame debris), radar_station (dish).
  In each case the angled element IS the type cue: flattening it
  would erase what makes the wreck identifiable as that structure,
  and at game size these already read as rubble piles, not as
  angled camera views (rubble has no facing). A further flat pass
  would trade identity for a rule the eye cannot verify at 32 px.
  The 8 new wrecks (§1) were generated flat from the start, so the
  set as a whole is flatter than v1.5 even though these 8 stay.

## 3. Wall-red dots: renderer fix, decision recorded explicitly

**Decision: renderer fix, NO aspect change.** Measured facts:
wall `-512` bbox is 442×55 inside the 512 canvas (aspect 8.0:1);
the square `drawImage` scales the whole canvas uniformly, so the
strip inside stays a strip — the aspect was never distorted, and
no aspect value was changed silently or otherwise. The dots were
invisible because §0's team block covered the sprite entirely.

Fix (`game/render.js`, structure loop only): the team block is now
fallback-only (drawn when no structure image is ready); a ready
sprite gets only a thin team-colour frame (lineWidth max(1, zoom))
so faction still reads at small scale. Command_core keeps its pulse
dot in both branches. Fallback appearance when an image is missing
is byte-for-byte the old block behaviour.

Measured dot geometry (wall footprint 1 → radius 0.5):
zoom 1 draw 32 px → strip ~3.4 px tall, each red dot ~1 px
(9 clusters, 237–245 px each at 512) — dots cannot read at zoom 1
by geometry, and no draw-size change was made to fake it (that
would misrepresent the footprint). Zoom 2 draw 64 px → strip
~6.9 px, dots ~2 px — they do read.

Verified in game (real drawScene, same harness, identical code):
`after-wall-z2.png` shows the blue wall as a dotted strip and the
red wall as a red-dotted strip (previously both were solid blocks);
`after-wall-z1.png` shows the strips as thin lines inside their
frames, dots not individually resolvable, exactly as predicted.
Unit tests pin both branches with a recording fake canvas
(fallback block drawn once when the image is missing; zero team
fills and one team frame when it is present).

## 4. UI icons: transparent backgrounds, same wiring

All 7 icons keyed to transparency (flood-fill from borders through
the background colour; patrol re-keyed against its dark blue after
its border median picked a white edge strip; small corner-touching
stray components removed). Filenames, `iconPath`, and preload paths
are unchanged — `verify_refs`-style wiring still resolves, and the
live game still shows all 8 button slots (6 tray + 2 Drop Back In).

Measured (128 px files): all 7 have transparent corners (alpha 0)
and non-square opaque bboxes — the remaining solid shapes are the
symbols themselves (disc, shields, gear, arrows), not backgrounds:
move 77×77, attack-move 113×113, hold 88×104, patrol 93×79,
salvage 93×94, guard 98×108, drop-back-in 50×99.
Transparent fractions: move 0.86, attack-move 0.39, hold 0.59,
patrol 0.89, salvage 0.74, guard 0.53, drop-back-in 0.80.
Viewed on dark and light backdrops
(`assets/_wave3-work/after-icons-dark.png`,
`after-icons-light.png`) and in the live game
(`game/graphics-wave3/after-tray-icons.png`): icons render without
square blocks, text labels unchanged, all 8 slots present.

## 5. Fully painted red hulls: per-unit generation pass, gate enforced

Method: two 3×3 grids from the blue `-512` sprites as references,
each cell keyed, trimmed, and bbox-aligned to its blue sprite
(exactly the wave-2 lancer/rampart alignment method), then gated on
**both** silhouette IoU ≥ 0.85 vs blue **and** red-dominant fraction
(R > 120, R > B + 30) ≥ 0.30 — the second clause is what makes a
hull "fully painted" rather than derived-markings (derived reds
measure 0.055–0.216 red-dominant). Installed only on a pass; the
original derived file stays for every failure, named below.

| unit | IoU (-512) | red frac (gen / derived) | verdict |
|---|---|---|---|
| combat_drone | 0.8793 | 0.330 / 0.150 | PASS, installed |
| vespid_scout | 0.8731 | 0.586 / 0.103 | PASS, installed |
| scout_buggy | 0.6333 | 0.490 / 0.142 | FAIL (silhouette) |
| medium_tank | 0.7689 | 0.561 / 0.127 | FAIL |
| heavy_tank | 0.8157 | 0.623 / 0.095 | FAIL |
| bulwark_mech | 0.5911 | 0.420 / 0.128 | FAIL |
| flak_tank | 0.5854 | 0.626 / 0.100 | FAIL |
| gunship | 0.4086 | 0.152 / 0.145 | FAIL |
| storm_lance | 0.6551 | 0.401 / 0.206 | FAIL |
| breach_walker | 0.4367 | 0.348 / 0.100 | FAIL |
| colossus_engine | 0.4445 | 0.346 / 0.142 | FAIL |
| drone_swarm | 0.7131 | 0.315 / 0.216 | FAIL |
| ew_mech | 0.3788 | 0.278 / 0.163 | FAIL (also below red bar) |
| interceptor_drone | 0.5708 | 0.451 / 0.118 | FAIL |
| missile_carrier | 0.5388 | 0.450 / 0.108 | FAIL |
| mortar_carrier | 0.8205 | 0.347 / 0.135 | FAIL (closest miss) |
| rocket_battery | 0.6411 | 0.305 / 0.055 | FAIL |
| titan_breaker | 0.5301 | 0.452 / 0.134 | FAIL |

Visual check: `assets/_wave3-work/reds-grid1-sheet.png` and
`reds-grid2-sheet.png` (blue vs generated vs derived per unit).
The failure mode is consistent and honest: generation paints red
well (most red fractions 0.30–0.62) but drifts the silhouette
(narrower hulls, lost rotors, reshaped mechs — bulwark's generated
cell is a visibly different mech). Cell order was verified against
the sheets (no mixups); failures are genuine drift, not assignment
errors. Full-size files for the 2 passes were aligned from the same
grid cells (upscaled, game loads `-512` only): combat_drone full
IoU 0.8494 — 0.0006 below the gate on the reference-only file,
disclosed, not rounded up; the gate decision rests on the
game-loaded `-512` (0.8793). Vespid full IoU 0.8572.

**Remaining derived reds (43, named, not waived):** the 16 failures
above, plus 27 not attempted in this pass (generation budget: 4
calls total, 2 grids = 18 units): bridge_layer, command_carrier,
command_walker, construction_vehicle, decoy_drone, demolition_crawler,
drone_carrier, ew_skirmisher, experimental_artillery, fast_raider,
field_repair_mech, heavy_railgun, longshot_mech, mobile_foundry,
radar_scout, recon_aircraft, recovery_crawler, repair_scout,
rocket_artillery_mech, salvage_team, shield_projector, siege_cannon,
siege_engineer, strike_bomber, supply_carrier, transport_aircraft,
warden_platform. Plus, for completeness: lancer_mech and
rampart_fortress are already genuine generations (wave 2), and
combat_engineer / sensor_drone keep their original (non-derived)
reds, both ≥ 0.85. Fully painted hulls for the remaining 43 need
single-unit generations (the grid route caps at ~0.82 for most
shapes); that is a future pass, not a correction to this one.

## 6. Older pre-existing notes: checked, closed or re-named

- **Warden-red bottom protrusion — CLOSED by fix.** It was a
  single detached 8 px speck at (126, 408) in the `-512` file,
  present identically in blue and red (derivation copies alpha).
  Removed from blue and red, both sizes (full: 9 px speck); both
  files now have exactly 1 connected component, blue-vs-red IoU
  still 1.0000. Originals backed up.
- **Vespid prongs — CLOSED as non-defect.** Two symmetric side
  pods (~170 px each at y = 144) are part of the blue design,
  identical in red (IoU 1.0000); they are not a red-divergence
  defect and redesigning the blue silhouette is out of scope.
- **Transparent structure yards — CLOSED as non-defect.**
  ammo_depot's yard is a frame + 4 large crates (~3,580 px each)
  and logistics_hub's yard is a building + many ~425 px crates;
  ground showing between separate yard objects is correct
  top-down yard layout, not a keying hole. No files changed.
- **Loose-island crates — SPLIT.** light_factory's 18 detached
  edge specks (≤ 150 px at `-512`, ≤ 1,373 px at full size) were
  noise, not crates: removed from blue and red, both sizes; the
  file now has 1 component, IoU still 1.0000. The logistics/ammo
  crates above are kept as design (previous bullet).
  Additionally noted (not in the task's crate wording, recorded
  for completeness): rocket_artillery_mech carries two symmetric
  detached pods (~1,250 px each) below its hull in BOTH factions,
  preserved exactly by derivation — a design feature, not a
  keying flaw; removing them would alter the silhouette, so they
  stay, named here.

## 7. Game-size QC (all viewed, real drawScene harness)

Harness: `/tmp` scratch page served virtually as
`/game/_wave3-harness.html` alongside the unmodified tree (no
harness file left in the tree), Playwright headless Chromium,
0 page errors, 0 missing images on every shot. Before/after pairs
run identical code and differ only in art/code listed in §9.

- Structures blue/red at zoom 1: before = blocks; after = real art
  with thin team frames for all 23, both factions.
- Wall at zoom 2: before = blocks; after = dotted strips, blue and
  red. Wall at zoom 1: after = thin strips, dots sub-pixel (as
  predicted in §3).
- Wrecks at zoom 1: before = 8 identical rubble circles; after =
  8 distinct piles + flat turret/bunker/wall.
- Tray icons in the live First Map game: before = square blocks;
  after = symbols only, text unchanged, 8/8 slots.
- Reds at zoom 1 (all 49 blue-vs-red pairs across 3 shots):
  combat_drone and vespid reds now read as fully red hulls; all
  other pairs unchanged (derived), silhouettes matching.

## 8. Tests

- New `tests/graphics-wave3.test.js` (5 tests): structure-sprite
  visibility both branches (fake-canvas recording), all-23
  dedicated wreck mapping + files on disk, all 7 icon paths on
  disk, generated-red list pins combat_drone + vespid_scout only.
- **Old test changed, explicitly:** `tests/graphics-wave2.test.js`
  §4 asserted the 8 types as generic rubble; wave 3's §1 makes
  that expectation false by design, so the test now asserts all
  23 dedicated, with a comment stating the change and pointing
  here. No other old test was touched; the wave-2 "all 23 map to
  a file" test is unchanged and still passes.
- Full suite (explicit file list, 25 files): **239 pass, 0 fail**
  (234 baseline + 5 new). Run after every checkpoint; no failing
  tree was left standing at any point except the single expected
  wave-2 expectation above, which was updated, not waived.

## 9. Files changed, file by file

- `game/render.js` — structure loop only (§3): team block now
  fallback-only; ready sprites get a thin team frame; command_core
  pulse dot preserved in both branches. No sim, camera, or
  sizing logic touched; no aspect value changed.
- `game/sprites.js` — `STRUCTURE_WRECK_ART` + comment (8 new
  mappings, 23 keys total) and preload stem list (+8 stems).
  No path scheme changed; no filename changed.
- `tests/graphics-wave3.test.js` — NEW (5 tests).
- `tests/graphics-wave2.test.js` — §4 only, explicit wave-3
  update (§8).
- `assets/animation/structure-wrecks/` — 8 NEW stems (full +
  `-512` each) + turret/bunker/wall flats installed over existing
  stem names (full + `-512` each). `rubble` untouched.
- `assets/ui-icons/` — all 7 keyed to transparency, same names.
- `assets/sprites-90/units/` — combat_drone-red + vespid_scout-red
  replaced (full + `-512` each) with generated hulls; warden
  blue+red speck-cleaned (full + `-512` each).
- `assets/sprites-90/structures/` — light_factory blue+red
  speck-cleaned (full + `-512` each).
- `assets/_wave3-backup/` — NEW: originals of every replaced file
  (77 files) + `MANIFEST.txt` (SHA-256). The existing
  `assets/_wave2-wired-backup/` was NOT touched (verified: its
  directory mtime predates this session).
- `assets/_wave3-work/` — NEW: work material only (raw generations,
  staged files, QC scripts, sheets, flat-vs-old comparison).
- `game/graphics-wave3/` — NEW: before/after screenshots (17
  files: structs blue/red, wrecks, wall z1/z2, reds 0–2, tray).
- `game/GRAPHICS-WAVE3-REPORT.md` — this file.
- NOT edited: sim.js, game.js, maps.js, hero.js, progression.js,
  weapons.js, animation.js, style.css, index.html, tests/beta-*,
  scripts/beta-*, apk/, AUTONOMOUS-LOOP.md, RESUME.md, CONTROLS.md,
  UPGRADE-LOOP.md, scrap-dungeon/, voxbox-amberfall/, any other
  project. (Note: beta-wave3 files under game/ and scripts/
  appeared during this session from a concurrent sibling agent;
  they are not mine and were not touched.)

## 10. Bugs for the coordinator (not fixed outside scope)

1. **§0 renderer overlay (FIXED here, in scope):** v1.5 shipped
   with all non-core structure art invisible behind team blocks.
   If v1.5 is re-verified, this is the headline correction.
2. **No gameplay bug found.** No sim/economy/AI issue was
   encountered; none was fixed in game logic (none was in scope).
3. **Harness note, not a game bug:** the wave-2 harness's
   `anim.overlayMap = null` falls back to the demo track/road
   sets, so harness shots show a demo track line through the
   scene. It is identical before/after and does not affect any
   verdict here.

## 11. Boundaries kept

No commit, push, merge, publish, or store action. No APK built
(deliberately: the task says do not build one). No file outside
`~/workspace/surface-wars/` was written except `/tmp` scratch
(harness, drivers, manifest staging). No other project directory
was written (verified by mtime scan: zero files under
scrap-dungeon/ or voxbox-amberfall/ newer than session start).
No religious language in any new or edited file (scanned).
Iron Eden = blue, Xandria = red throughout; strict 90° top-down
held on all generated art; no linear feature was baked into a
base tile (wreck/structure art only; tile overlays untouched).
No new units, weapons, maps, or mechanics. One old test changed,
explicitly justified in §8. Every visual change has a viewed
before/after screenshot listed in §7 (or, for the red grids, a
viewed contact sheet in §5).
