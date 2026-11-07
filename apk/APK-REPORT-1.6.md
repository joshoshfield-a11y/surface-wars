# APK Report — Surface Wars v1.6 (wave 3)

- File: `~/workspace/your_files/Surface_Wars_v1.6.apk`
- Size: 68,418,845 bytes
- SHA-256: `5eba3939b995677365802fa340415b65487d195e83d1ffbd57437372816ea835`
- SUPERSEDES an earlier same-version build (SHA-256
  `12e84c3f…646e8`, same size) built before the wave-3
  `game.js` viewTiles fix; that build never left the sandbox
  (parent had not presented it), so rebuilding under the same
  versionCode 7 / versionName 1.6 / filename is correct and its
  SHA/size are replaced by the values above everywhere. The
  rebuilt APK carries the viewTiles fix (packaged `game.js:732`
  `updateViewTiles()` in `newGame`) plus the CONTROLS.md
  viewTiles entry; packaged game is byte-identical to the live
  tree, all 13 files.
- Package: `com.skit.surfacewars`, versionCode 7 / versionName 1.6
- minSdk 28, targetSdk 35, MainActivity launcher, landscape feature
- Signing: SAME debug keystore as v1.0–v1.5 (signer cert SHA-256
  `1354ef2e3b33632a66758d3a530aae11d2b1b53885a167fa95f59eaef36b39f5`,
  identical to v1.5) — installs over v1.5 in place.
- Pipeline: SDK tools directly, no Gradle; build-tools 35.0.0,
  platform android-35, JDK 17 with `~/jdk17/bin` on PATH.
  Pre-edit `build.sh` (v1.5 pipeline, versionCode 6) preserved verbatim
  as `apk/build-1.5.sh` (SHA-256 `92bd1613…5f`, same as pre-edit
  `build.sh`); `build.sh` updated only for versionCode 7 /
  versionName 1.6 / output name `Surface_Wars_v1.6.apk`.
- Pre-build gate: full suite 242/242 green (node --test
  tests/*.test.js, explicit file list) or STOP — passed.

## Bundle, re-derived (not copied from v1.5)

- Game files: 13, same explicit list as v1.5 (index.html, style.css,
  catalog.js, sim.js, sprites.js, view.js, animation.js, maps.js,
  render.js, weapons.js, hero.js, progression.js, game.js).
  QA file `game/_wave2-harness.html`, all report MDs, all
  screenshots, `beta-wave2b/` and `beta-wave3/` captures excluded.
- Assets: 413 files — 406 `-512.png` + 7 UI icons.
  `-512` recount: units 98, structures 46, tiles-overlay base 42,
  overlays 123, unit wrecks 49, fx 17, projectiles 4, canopy 6,
  structure-wrecks 21 (all 23 catalog types map to a dedicated
  stem — 20 distinct stems, since the 4 turret types share
  `turret_wreck` — plus the `rubble` fallback file, which no
  type now falls back to; see `game/sprites.js`
  STRUCTURE_WRECK_ART and `game/GRAPHICS-WAVE3-REPORT.md`).
  Note: `verify_refs.py` run against the stale v1.5 staging tree
  reported 8 missing structure-wreck stems; those files exist in
  the source tree and the build re-stages everything before
  running `verify_refs.py` inside the build (0 missing at build
  time). The full ~949 MB assets tree was NOT bundled.

## Coordinator re-verification on the APK itself

- `apksigner verify` PASS (1 signer; `--print-certs` matches the
  v1.5 cert above). Note: apksigner needs `~/jdk17/bin` on PATH;
  a bare-shell run fails with `java: not found` — that is an
  environment PATH fact, not a signature problem.
- `zipalign -c 4` PASS.
- Badging: v7/1.6/min 28/target 35, MainActivity, landscape
  feature (`android.hardware.screen.landscape` implied by the
  landscape activity).
- Packaged manifest: `screenOrientation=0`,
  `configChanges=0x4a0` (landscape lock, as v1.5).
- Listing: 433 files; `assets/game/index.html` + `classes.dex`
  at the archive root present; ZERO absolute-path entries;
  ZERO harness entries (no `_wave2-harness`, no `beta-wave*`,
  no `beta3` entries).
- Packaged game byte-identical to the live tree: all 13 files
  (`cmp` clean).
- Packaged markers: in packaged `index.html` — Twin Bridges 2,
  Forest Belt 1, `surfacewars.hero.v1` 0, Drop Back In 2,
  Command Mech 6, `runAiCombat` 0, Prototype 03 = 0.
  Across all packaged game files — Twin Bridges 5, Forest Belt 3,
  `surfacewars.hero.v1` 3 (progression.js 2, game.js 1),
  Drop Back In 10, Command Mech 14, `runAiCombat` 5
  (sim.js 4, game.js 1), Prototype 03 = 16 (JS/CSS comments and
  history strings only, never in the shipped HTML).
- DOM storage ON in wrapper source
  (`setDomStorageEnabled(true)`, MainActivity.java:18) — Phase C
  hero persistence depends on it.
- Older APKs byte-identical after the build: v1.5 66,271,617 /
  `46076e87…15c11c`; v1.4 62,755,060 / `a8ef371a…6599`;
  v1.3 62,717,991 / `27170798…eb487`; v1.2 62,709,799 /
  `5eee2bd9…c9835`; v1.1 62,709,799 / `acf88d35…c090df`;
  v1.0 (`Surface_Wars.apk`, the original filename) 62,705,703 /
  `6e3acbe9…edfc`.

## What v1.6 carries over v1.5

- Wave-3 graphics: structure sprites actually display (opaque
  team block now fallback-only, thin team frame for ready
  sprites); all 23 structure types on dedicated wreck art;
  flatter turret/bunker/wall wrecks; all 7 UI icons keyed to
  transparency; combat_drone-red + vespid_scout-red fully
  painted; warden protrusion fixed.
- Wave-3 beta/balance: hero-death wreck + info-panel HP refresh
  browser-proven; victory + draw panels rendered through the
  shipped `showVictory` function in a seeded-terminal-state
  browser run; NO balance tune (evidence: scripted competent
  play wins; browser losses are driver play).
- Wave-3 late fixes in the rebuilt APK: minimap-centring
  viewTiles bug fixed in `game.js` `newGame`
  (`updateViewTiles()` after the zoom reset — minimap centring
  and viewport rectangle were ~2.4 tiles off after a tutorial
  zoom + map switch; finger/mouse taps never affected); full
  beta pass 44/44 green (rerun 6, fresh `beta3-checks.json`),
  including the first-ever green twin-stick driving + Esc +
  selection-preserved checks and the hero re-drop preservation
  check at 200 -> 200. Two beta-check fixes were harness-only
  (west drives; no game change): the old east drives sent
  fragile units into enemy fire and measured combat damage as
  if it were a control/preservation failure (probed: hero
  161 -> 128 stored across the read/release window, 38 -> dead
  in 0.2 s; spawn HP == stored HP exactly, so preservation was
  never broken).
- NOT in v1.6: no new units/weapons/maps/mechanics; 43 derived
  reds remain (named); 8 old angled wrecks remain (named);
  no real-phone verification (user-side verdicts owed).

Nothing committed, pushed, merged, or published. Parent
independently re-verifies before presenting to the user —
coordinator does not claim delivery.
