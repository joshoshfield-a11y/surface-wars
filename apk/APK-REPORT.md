# Surface Wars — APK Report

## Deliverable

- **APK:** `~/workspace/your_files/Surface_Wars.apk`
- **Size:** 62,705,703 bytes (~60 MB)
- **SHA-256:** `6e3acbe97a74994a352605f13e16bfc565135a26f542234e5cdf75890038edfc`
- **App name:** Surface Wars
- **Package:** `com.skit.surfacewars`
- **Version:** versionCode 1, versionName 1.0
- **minSdk 28, targetSdk 35** (compile SDK 35, platform android-35, build-tools 35.0.0)
- **Signing: DEBUG-SIGNED, not release signing.** A fresh debug keystore was
  generated for this build (`apk/debug.keystore`, alias `surfacewars`). Expect
  Android / Play Protect to flag it as an unknown-developer install — that is
  normal for a debug-signed test APK.

## What it is

A minimal Android WebView wrapper around the web prototype — **not a native
engine port**. One full-screen Activity (`MainActivity.java`): JavaScript on,
DOM storage on, file access allowed for local assets, WebView zoom controls
disabled (the game handles its own pinch zoom), screen kept on during play
(`FLAG_KEEP_SCREEN_ON`). It loads `file:///android_asset/game/index.html`.

**Back button:** the code calls `webView.goBack()` only if there is WebView
history; the game is a single page load, so in practice Back exits the app.
Pause is via the in-game Pause / Menu button, not the Back button.

**Launcher icon:** freshly generated 512×512 PNG (blue-vs-red top-down mech
motif on a dark grid). Not a screenshot, not a game sprite.

## Coordination

The mobile-first builder was still editing `game/` when this task started.
Per the brief, this build **waited** until
`game/MOBILE-FIRST-REPORT.md` appeared (2026-10-30 21:29 UTC) and only then
snapshotted the game tree. The snapshot was diff-checked against the live
tree after the build: `index.html` and `game.js` match the current tree.
No `game/*.html/js/css` file was edited by this packaging task.

## Asset subset (NOT the whole 757 MB assets tree)

Bundled staging tree is 61 MB (`apk/assets/`). Game code: 10 files
(`game/*.html, *.js, *.css` only — no screenshots, reports, or tests).

| Contents in APK | Count |
|---|---|
| `assets/game/` (html/js/css) | 10 |
| `assets/assets/sprites-90/units/` (`*-512.png`, blue + red) | 98 |
| `assets/assets/sprites-90/structures/` (`*-512.png`, blue + red) | 46 |
| `assets/assets/tiles-overlay/base/` (`*-512.png`) | 42 |
| `assets/assets/tiles-overlay/overlays/` (all 8 families, `*-512.png`) | 123 |
| `assets/assets/animation/wrecks/` (`*-512.png`) | 49 |
| `assets/assets/animation/fx/` (`*-512.png`) | 15 |
| `assets/assets/animation/projectiles/` (`*-512.png`) | 4 |
| `assets/assets/animation/canopy/` (`*-512.png`) | 6 |
| **Total APK entries** | **400** |

Excluded by design: full-res sprite files, `sprites-90/mechs/`,
`weapons/`, `mechs-expansion/`, all contact sheets, the legacy `sprites/`
set, and all `game/*.png` screenshots.

## Reference verification (before packaging)

`apk/verify_refs.py` ran against the staged tree and passed: **all
referenced files present, 0 missing.** It resolves the game's own reference
rules — unit/structure ids from `game/catalog.js` (49 units, 23 structures,
both team colours), wreck per unit, terrain bases (5 types × variants 1–3),
all 8 overlay families × all 15 autotile variants, 15 FX names, 4 projectiles,
6 canopy tiles, plus the game code files themselves.

## Verification commands run (all pass on the final APK)

- `apksigner verify Surface_Wars.apk` → **PASS**
- `zipalign -c 4 Surface_Wars.apk` → **PASS**
- `aapt2 dump badging` → package `com.skit.surfacewars`, versionCode 1,
  versionName 1.0, minSdk 28, targetSdk 35, label `Surface Wars`,
  launchable activity `com.skit.surfacewars.MainActivity`
- Unzip listing → `assets/game/index.html` present, `classes.dex` present,
  counts as in the table above.
- `dexdump` → class `Lcom/skit/surfacewars/MainActivity;` present in the dex.

## Build bug caught and fixed during verification (honest record)

The first successful-looking build had a real defect: `aapt add` was given
an absolute path, so the dex landed in the APK as
`/home/hatch/.../classes.dex` instead of `classes.dex` — Android would never
have loaded it and the app would not have launched. The listing check caught
it; `build.sh` now adds the dex by relative name from inside the output
directory, and the shipped APK was rebuilt and re-verified with a proper
`classes.dex` entry. The first (broken) APK was never delivered.

Also fixed along the way: `d8` initially failed for missing `java` on PATH
(build now exports JDK 17's bin), and the dex is built with
`--lib android.jar` after a desugaring warning on the first dex pass.

## Rebuild

- Build tree: `~/workspace/surface-wars/apk/` (`build.sh`, `verify_refs.py`,
  `src/`, `res/`, `AndroidManifest.xml`, `assets/` staging, `out/`)
- Rebuild: `bash ~/workspace/surface-wars/apk/build.sh` (re-signs with the
  existing `debug.keystore`; delete it to regenerate)
- Toolchain: JDK 17, `~/android-sdk` build-tools 35.0.0, platform android-35.
  No Gradle — `sdkmanager` is broken in this sandbox, so the SDK tools were
  driven directly (javac → aapt2 → d8 → zipalign → apksigner).

## Install on the Galaxy S25

1. Get `Surface_Wars.apk` onto the phone (download / file transfer).
2. Tap the file. When Android asks, allow installing from this source
   (this app / browser / Files, as prompted).
3. If Play Protect warns about an unknown developer, that is the debug
   signature — it is expected for this test build; proceed only if you
   expect this file from this build.
4. Launch "Surface Wars" from the app drawer. It opens straight into the
   game's main menu, full screen.

## Honest limits

- This is a WebView wrapper of the web prototype, not a native engine port.
- **It has NOT been installed or run on a real phone.** No device install
  is possible from the sandbox, so launch behaviour, touch feel, and
  performance on the S25 are unverified until the user installs it and
  reports back.
- No commit, push, or publish was done. This is a local file only.
