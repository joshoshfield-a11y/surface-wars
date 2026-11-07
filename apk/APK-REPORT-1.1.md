# Surface Wars APK v1.1 — Report

## Build identity
- Package: `com.skit.surfacewars` (unchanged from v1.0, so this installs as an update over v1.0)
- versionCode: 2, versionName: 1.1
- minSdk: 28, targetSdk: 35 (platform android-35)
- Signing: **debug-signed, not release signing**. The v1.0 debug keystore
  (`apk/debug.keystore`) was **reused** for this build (not regenerated), so the
  signing key matches v1.0. Android / Play Protect will still flag it as an
  unknown-developer install — expected for a debug-signed test APK.
- Wrapper: minimal Android WebView Activity, built with direct SDK tools
  (javac → aapt2 → d8 → zipalign → apksigner, no Gradle), reusing the proven
  v1.0 pipeline in `apk/build.sh` (v1.0 script preserved as `build-1.0.sh`).
  WebView settings unchanged from v1.0: JavaScript + DOM storage on, file
  access for local assets, WebView zoom controls off (the game handles its
  own pinch), screen kept on during play. Launcher icon reused from v1.0
  (blue-vs-red top-down mech motif); the tutorial changed no branding.
- Back button: exits the app (no WebView history on a single-page load);
  pause is via the in-game Pause/Menu button, as in v1.0.

## What is new in v1.1
- The interactive tutorial, built after the user's first real-phone feedback
  ("Movement controls and stuff don't make sense. Needs a clear tutorial").
  Main-menu button "Tutorial — learn the controls", 7 guided steps
  (look around, select, move, attack a held target, build a Scout Buggy,
  salvage a tutorial wreck, win-condition screen), red side held for the
  tutorial only, plus a current-mode indicator in the normal HUD and a
  rewritten phone-first How to Play. Gate file: `game/TUTORIAL-REPORT.md`
  (landed 2026-10-30 15:31 PDT); this APK was snapshotted only after that
  file existed, per the coordination instruction, and no `game/` files were
  edited by the packager.

## Output
- File: `~/workspace/your_files/Surface_Wars_v1.1.apk` (new filename;
  `Surface_Wars.apk` v1.0 was **not** overwritten — verified, same size and
  SHA-256 as at v1.0 delivery)
- Size: **62,709,799 bytes (~59.8 MB)**
- SHA-256: `acf88d35f5464536970637e96351984e48f220ce8d8b9bbfea137c8639c090df`

## Asset subset (same rules as v1.0; staged tree 62,733,067 bytes)
- Game code: 10 files, html/js/css only (no screenshots, reports, or tests)
- sprites-90 units: 98 `-512.png` files (49 catalog units × blue/red)
- sprites-90 structures: 46 `-512.png` files (23 structures × blue/red)
- tiles-overlay bases: 42, overlays: 123 (all 8 families)
- animation wrecks: 49, FX: 15, projectiles: 4, canopy: 6
- Total `-512.png` files in APK: **383**
- Tutorial asset note: the tutorial added **no new referenced asset files**
  — it reuses existing unit/structure/wreck sprites. `verify_refs.py`
  confirmed all referenced files present (units=49, structures=23).
  Snapshot diff of staged game code vs the live tree after the build:
  no differences (excluding png/gif/md, which are never packaged).

## Verification (all run on the final v1.1 APK, all pass)
- `apksigner verify`: PASS
- `zipalign -c 4`: PASS
- `aapt2 dump badging`: package `com.skit.surfacewars`, versionCode 2,
  versionName 1.1, minSdk 28, targetSdk 35, launchable
  `com.skit.surfacewars.MainActivity`
- Unzip listing: `assets/game/index.html` and `classes.dex` present
- Tutorial-presence check: the packaged `assets/game/index.html`
  contains all three tutorial markers — `mm-tutorial` (main-menu button),
  `tutorial-bar` (step banner with Skip/Next), and `tutorial-end`
  (win-condition screen). The tutorial is in the APK, not just claimed.

## Install / update note (Galaxy S25)
Transfer `Surface_Wars_v1.1.apk` to the phone and tap it. Same package as
v1.0, so it installs over v1.0 as an update. Allow install from that
source when prompted, and proceed past the unknown-developer warning
only if you expect this file. It opens straight into the main menu;
tap "Tutorial — learn the controls" to run the new tutorial.

## Honest limits
- WebView wrapper of the web prototype, not a native engine port.
- **Not installed or run on a real phone from the sandbox** — launch,
  touch feel, tutorial flow on a real finger, and S25 performance are
  unverified until the user installs it and reports back.
- No commit, push, or publish. Build tree: `~/workspace/surface-wars/apk/`
  (`build.sh` for v1.1, `build-1.0.sh` preserved, `verify_refs.py`,
  sources, staging, reused debug keystore).
