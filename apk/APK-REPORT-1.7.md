# APK Report — Surface Wars v1.7 (12-hour improvement cycle, wave 7: docs + backup + APK)

- File: `~/workspace/your_files/Surface_Wars_v1.7.apk`
- Size: 72,779,664 bytes
- SHA-256: `a54a3580a8f28569ea8cfd05f7659e74f5726e699f50e8f022fc986b36760f49`
- Package: `com.skit.surfacewars`, versionCode 8 / versionName 1.7
- minSdk 28, targetSdk 35, MainActivity launcher, landscape feature
- Signing: SAME debug keystore as v1.0–v1.6 (signer cert SHA-256
  `1354ef2e3b33632a66758d3a530aae11d2b1b53885a167fa95f59eaef36b39f5`,
  identical to v1.6) — installs over v1.6 in place. Not release signing.
- Pipeline: SDK tools directly, no Gradle; build-tools 35.0.0,
  platform android-35, JDK 17 with `~/jdk17/bin` on PATH.
  Pre-edit `build.sh` (v1.6 pipeline, versionCode 7) preserved verbatim
  as `apk/build-1.6.sh` (SHA-256
  `6689e5a65c41a90d23fd7418577938fd9db8a25e9e0819a339e0a088cdd6a249`,
  same as pre-edit `build.sh`, still stamps versionCode 7 /
  versionName 1.6) and left untouched afterward; `build.sh` updated
  ONLY for versionCode 8 / versionName 1.7 / output name
  `Surface_Wars_v1.7.apk` (diff vs `build-1.6.sh` is version lines only).
- Pre-build gate: full suite 303/303 green (node --test
  tests/*.test.js, explicit file list) or STOP — passed.
  `apk/verify_refs.py` run before building: 0 missing
  (units 57, structures 23).
- This wave makes NO game content change: no balance, weapon, unit,
  skill, gear, map, or mechanic change. Docs + packaging only.
  No packaging bug was found in this wave, so no game file was
  edited here; the one packaging fix this cycle needed (Wave 5:
  `currency.js` added to the staging list) was already in
  `build.sh` before this wave and is kept, not re-applied.

## Bundle, re-derived (not copied from v1.6)

- Game files: 14, re-derived from `index.html`'s script tags
  (index.html, style.css, catalog.js, sim.js, sprites.js, view.js,
  animation.js, maps.js, render.js, weapons.js, hero.js,
  progression.js, currency.js, game.js). The 14th file is
  `currency.js` (Wave 4 Premium Store, loaded by index.html) —
  the file Wave 5 had to add to the old 13-file staging list.
  QA file `game/_wave2-harness.html`, all report MDs, all
  screenshots, `beta-wave2b/` / `beta-wave3/` / `beta12h/`
  captures excluded.
- Assets: 437 files — 430 `-512.png` + 7 UI icons.
  `-512` recount: units 98, structures 46, tiles-overlay base 42,
  overlays 123, unit wrecks 57 (49 baseline + 8 expansion-mech
  wrecks), fx 17, projectiles 4, canopy 6, structure-wrecks 21,
  mechs-expansion 16 (8 expansion mechs x blue + red, staged
  explicitly per class folder, never the whole ~63-chassis
  expansion tree). Growth over v1.6 (406 `-512` + 7 icons = 413)
  is exactly +24: the 16 expansion-mech files + the 8 new
  wrecks. The full assets tree was NOT bundled.
- Listing total: 458 files (437 assets + 14 game + classes.dex +
  launcher/res/meta entries).

## Independent re-verification on the APK itself

- `apksigner verify` PASS (v3 scheme, 1 signer; `--print-certs`
  matches the v1.6 cert above).
- `zipalign -c 4` PASS.
- Badging: v8/1.7/min 28/target 35, MainActivity, landscape
  feature (`android.hardware.screen.landscape` implied by the
  landscape activity), WAKE_LOCK permission.
- Packaged manifest: `screenOrientation=0`,
  `configChanges=0x4a0` (landscape lock, as v1.6).
- Listing: 458 files; `assets/game/index.html` + `classes.dex`
  present; ZERO absolute-path entries (the one `/home/` match in
  a raw grep is the unzip archive header line itself, not an
  entry); ZERO harness entries (no `_wave2-harness`, no
  `beta-wave*`, no `beta12h`, no `beta3` entries).
- Packaged game byte-identical to the live tree: all 14 files
  (`cmp` clean).
- Packaged markers: in packaged `index.html` — Twin Bridges 2,
  Forest Belt 1, `surfacewars.hero.v1` 0, Drop Back In 3,
  Command Mech 8, `runAiCombat` 0, Prototype 03 = 0,
  Tutorial II 6.
  Across all packaged game files — Twin Bridges 5, Forest Belt 3,
  `surfacewars.hero.v1` 4, Drop Back In 17, Command Mech 19,
  `runAiCombat` 5, Prototype 03 = 16 (JS/CSS comments and
  history strings only, never in the shipped HTML),
  Tutorial II 15.
  New-content markers, counted individually: every expansion
  mech id appears 3 times in packaged `sprites.js` (bastion,
  gatekeeper, deadeye, mortarjack, needlewing, longsight,
  javelin, raptor); wallet key `surfacewars.wallet.v1` appears
  3 times across packaged game files (currency.js, game.js).
- DOM storage ON in wrapper source
  (`setDomStorageEnabled(true)`, MainActivity.java:18) — hero
  persistence and the wallet both depend on it.
- Older APKs byte-identical after the build: v1.6 68,418,845 /
  `5eba3939…16ea835`; v1.5 66,271,617 / `46076e87…15c11c`;
  v1.4 62,755,060 / `a8ef371a…6599`; v1.3 62,717,991 /
  `27170798…eb487`; v1.2 62,709,799 / `5eee2bd9…c9835`;
  v1.1 62,709,799 / `acf88d35…c090df`; v1.0
  (`Surface_Wars.apk`, the original filename) 62,705,703 /
  `6e3acbe9…edfc`. v1.0–v1.6 were never overwritten; v1.7 is a
  new file only.

## What v1.7 carries over v1.6

- The whole 12-hour improvement cycle, waves 1–6 (see
  `AUTONOMOUS-LOOP.md`, 12-hour-cycle section, and
  `game/CONTROLS.md`, v1.7 section): tuned hero weapons (123 →
  125 named rows with the 2 Wave 4 premium rows), 8 new mechs
  (57 units), hero upgrades (10 skills, 16 gear rows, mastery
  ranks M1–M5), Salvage Credits + 4-pack Premium Store (earn
  only, no real-money purchase exists anywhere in this build),
  Tutorial II (6 steps, twin-stick + hero), and the Wave 6 full
  beta pass (303/303) with the tutorial-economy fix.
- NOT in v1.7 beyond that: no new balance tune (Wave 6 tried a
  Helios range retune, measured it byte-identical, and reverted
  it); no AI fielding change (exclusion FINAL, Wave 6 §2);
  no real-money checkout (not live, not claimed); no
  real-phone verification (user-side verdicts owed, as before).

## Waived gates, named (carried from Wave 6, not new)

- WAIVER-W6-VICTORY-PANEL: no played browser match reached blue
  victory in Wave 6 either (11 Wave 3 iterations + 1 Wave 6
  attempt). Defeat panels render repeatedly through the same
  `showVictory()` function; the victory title/stats lines
  remain unrendered in an unseeded browser run. (Wave 3's
  seeded-terminal-state run did render the victory panel
  through the shipped function — that closure stands, with its
  disclosed caveat that the victory itself was seeded.)
- WAIVER-W6-DRAW-PANEL: no browser run reached a draw terminal;
  sim draws exist and are pinned in existing tests.
- The Wave 6 hero-redeploy HP check stands as FAIL in its log
  with its driver-timing explanation (hero spawned at full HP
  and took 47 combat damage between landing and the read) — a
  check-design artifact, not a game defect, and not a waived
  game gate.
- Real-phone verification remains owed everywhere it was owed
  before (touch-stick is CDP-emulated, stress is sandbox-only,
  pinch is zoom-buttons-only). Nothing in this wave claims a
  real-phone result.

Nothing committed, pushed, merged, or published. Parent
independently re-verifies before presenting to the user —
this wave does not claim delivery.
