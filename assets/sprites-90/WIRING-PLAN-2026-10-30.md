# Surface Wars — Wiring sprites-90 into Prototype 01 (plan, not yet executed)

Date: 2026-10-30. Status: DRAFT, awaiting the user's word. No game code changed.
Supersedes: the old-set rework spec at `assets/sprites/REWORK-90DEG-2026-10-30.md`
(that spec targeted the first `sprites/` set; the new `sprites-90/` set is a
complete replacement with 0 failed/missing, so the old rework list is obsolete).

## Source set (verified on disk 2026-10-30)
- `assets/sprites-90/` — 450 distinct variants / 900 files, verified by count:
  mechs 16, units 98, weapons 270, terrain 20, structures 46
  (full-size + `-512` copies per variant; all sampled `-512` files 512x512 RGBA).
- Report: `assets/sprites-90/SPRITES-90-REPORT.md`. Contact sheets: one per
  category under `assets/sprites-90/<category>/*-sheet.png`.
- Prototype 01 still renders canvas placeholder silhouettes:
  `game/render.js` header ("PLACEHOLDER art") and `game/index.html` note
  ("Placeholder canvas art only — final sprites come later").

## Wiring scope, in order (smallest verifiable slice first)
1. **Units actually spawned in Prototype 01** (`game/sim.js` spawnScenario):
   scout_buggy, medium_tank, heavy_tank, bulwark_mech, lancer_mech,
   longshot_mech, flak_tank — blue (Iron Eden) and red (Xandria).
2. **Structures actually spawned:** command_core, blue and red.
3. **Terrain:** the river+bridge test map's ground types mapped to the 6
   gameplay tiles (grass, dirt, bridge, forest, water, rock) first;
   the 14 biome tiles are catalogued for later maps, not wired yet.
4. **Everything else** (remaining 42 units, 22 structures, 135 weapon
   templates) is mapped by slug in the catalog, not rendered, until a
   later milestone needs it — weapon templates are mounted modules, not
   standalone units, so they wire with their carrier unit, not alone.

## Rules the wiring pass must obey
- **Scale comes from game data, never from the 512 files.** Every `-512`
  copy is 512x512 regardless of class (a Scout and a Rampart are the same
  pixel size); draw size must come from the catalog/sim unit radius.
- **Strict 90° only.** The sprites-90 gate already rejected diagonal/side/3-4
  art; the wiring pass must not reintroduce rotation that reads as a tilted
  camera. In-plan-view rotations already flagged in the report (salvage_team
  crane arm, gunship rotor X, EW antenna fans) are overhead rotations, not
  camera tilt, and may stay.
- **Team colour by file, not by script recolor.** The old set's R/B channel
  swap made siege_cannon-red identical to blue; sprites-90 reds were
  separately generated or hue-shifted and side-by-side verified — use the
  `-red` files as-is.
- **No commit, push, publish, or APK in this pass.** Working tree only,
  same as Prototype 01 and the sprite batches.

## Known gaps carried into wiring (do not silently accept)
- Terrain tiling unverified: tiles were not generated as wrap-around
  textures; seam/transition work is still owed before repeating use.
- `bridge` is a cross-junction of two spans, not a single-direction span;
  `river_water_shallow_crossing` ford is a symmetrical cross, not a single
  natural line. Either accept the junction look on the test map or rework
  those two tiles before wiring terrain.
- Red Rampart's silhouette diverges from blue Rampart (round-plated vs
  square-plated); both read as a massive siege mech and are unambiguously
  team-coloured, but they are not the same drawing.
- wall-red is minimal (9 cyan dots -> 9 red dots); command_core and bunker
  reds shift whole-body reddish-brown rather than trim-only.
- Still not generated: animation frames, damage states, wreck variants,
  projectile/FX frames, UI icons; no Salvage Clans / Directorate skins.
- No phone or real-browser playtest of the sprites in game yet — wiring
  verification is sandbox-only until he runs it on the S25.

## User's choice (the only decision this plan needs)
A) Wire the slice above (7 spawned units + command_core + gameplay terrain)
   into Prototype 01 now, accepting the flagged gaps as listed.
B) Fix the two terrain tiles (bridge single span, ford single line) first,
   then wire.
C) Leave the prototype on canvas placeholders until a later milestone.
