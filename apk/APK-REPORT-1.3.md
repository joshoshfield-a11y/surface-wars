# Surface Wars APK v1.3 — Report

## File

- **APK:** `~/workspace/your_files/Surface_Wars_v1.3.apk` (new filename; v1.2, v1.1, and v1.0 untouched)
- **Size:** 62,717,991 bytes (~59.8 MB)
- **SHA-256:** `27170798e72e95865dff182b8f5f22943d7660f45fd3ea35b469f3f0d99eb487`
- **Package:** `com.skit.surfacewars` (unchanged — installs over v1.2 as an update)
- **Version:** versionCode 4, versionName 1.3, minSdk 28, targetSdk 35
- **Signing: debug-signed, not release signing.** The same debug keystore as
  v1.0/v1.1/v1.2 was reused, so the update path keeps working. Android /
  Play Protect will flag it as an unknown-developer install, as expected
  for a test APK.

## What is new in v1.3 (vs v1.2)

This build snapshots the current game tree after three cycles that v1.2
predates:

1. **Title fix (Loop 1, marketing loop):** the in-game title is now simply
   "Surface Wars" — no stale "Prototype 03" label.
2. **Second Map "Twin Bridges" (Generation Cycle 1):** an 80×50 map with a
   central lake, two bridges, and land corridors around the lake's north
   and south ends, selectable from the main menu alongside the First Map.
3. **Real red combat AI (Generation Cycle 2):** the red side no longer runs
   the demo attack-move script. It defends its core, groups units before
   attacking, chooses targets, and retreats damaged units, using the same
   scrap economy, costs, and rules as the player — no free units, no free
   scrap, no extra vision.

Also carried over from v1.2: landscape-first layout (wide map, right-side
command panel) and the landscape lock (below).

## Build method

Packaging only — no `game/*.html/js/css` files were edited in this pass.
Same proven pipeline as v1.2 (`apk/build.sh`, `verify_refs.py`, direct SDK
tools: javac → aapt2 → d8 → zipalign → apksigner, no Gradle). The v1.2
pipeline is preserved as `apk/build-1.2.sh`; `build.sh` was updated to
versionCode 4 / versionName 1.3 / output `Surface_Wars_v1.3.apk` only.

Pre-build gate: tests re-run from `~/workspace/surface-wars/` with the
explicit file list — **110 pass, 0 fail**.

## Landscape lock — proven in the packaged manifest

Source manifest `apk/AndroidManifest.xml` retains
`android:screenOrientation="landscape"` and
`android:configChanges="orientation|screenSize|keyboardHidden"`. Verified
by dumping the manifest out of the finished APK
(`aapt2 dump xmltree --file AndroidManifest.xml`):

- `screenOrientation = 0` — compiled constant 0 = `SCREEN_ORIENTATION_LANDSCAPE`
- `configChanges = 0x4a0` — orientation + screen size + keyboard hidden
- Badging corroboration: `uses-feature: android.hardware.screen.landscape`,
  implied by the landscape orientation

The app launches in landscape even if the phone is held in portrait.

## Packaged-game markers — checked individually in the APK

Extracted from the finished APK and counted per file:

| Marker | File | Count |
|---|---|---|
| `Twin Bridges` | `assets/game/index.html` | 2 |
| `Twin Bridges` | `assets/game/maps.js` | 1 |
| `Second Map` | `assets/game/index.html` | 4 |
| `runAiCombat` (red combat AI) | `assets/game/sim.js` | 3 |
| `id="layout"` (landscape shell) | `assets/game/index.html` | 1 |
| `id="side"` (right-side command panel) | `assets/game/index.html` | 1 |
| `id="rotate-hint"` (portrait-only pill) | `assets/game/index.html` | 1 |
| `Prototype 03` | `assets/game/index.html` | 0 |
| Page title | `assets/game/index.html` | `<title>Surface Wars</title>` |

Snapshot check: packaged `assets/game/` (html/js/css, 10 files) diffed
against the live `game/` tree — **identical, diff exit 0**. (Screenshots,
reports, and tests are excluded from every APK build by design.)

## Assets — same subset rules as v1.2

Game html/js/css only; all images `-512.png` only, **383 total**:

| Category | Count |
|---|---|
| Units (`sprites-90/units`) | 98 |
| Structures (`sprites-90/structures`) | 46 |
| Tile bases (`tiles-overlay/base`) | 42 |
| Overlays (`tiles-overlay/overlays`) | 123 |
| Wrecks (`animation/wrecks`) | 49 |
| FX (`animation/fx`) | 15 |
| Projectiles (`animation/projectiles`) | 4 |
| Canopy (`animation/canopy`) | 6 |
| **Total** | **383** |

`verify_refs.py` ran during the build and confirmed all referenced files
present, including files referenced by the title, Twin Bridges, and AI
passes (no new referenced asset files were added by those passes).

WebView settings, unchanged from v1.2: JavaScript + DOM storage on, file
access for local assets, WebView zoom controls off (the game keeps its own
pinch handling), screen kept on during play, WAKE_LOCK permission. Same
launcher icon as v1.2.

## Verification — all pass

- `apksigner verify` — PASS
- `zipalign -c 4` — PASS
- `aapt2 dump badging` — `com.skit.surfacewars`, versionCode 4,
  versionName 1.3, minSdk 28, targetSdk 35, launchable
  `com.skit.surfacewars.MainActivity`, landscape screen feature
- Unzip listing — `assets/game/index.html` + `classes.dex` present
- Packaged manifest — `screenOrientation = 0` (LANDSCAPE),
  `configChanges = 0x4a0` (see above)
- Packaged markers — all present per the table above; no "Prototype 03"
  in the packaged `index.html`
- Prior APKs byte-identical after this build (SHAs unchanged):
  - v1.0 `Surface_Wars.apk` — `6e3acbe97a74994a352605f13e16bfc565135a26f542234e5cdf75890038edfc`
  - v1.1 `Surface_Wars_v1.1.apk` — `acf88d35f5464536970637e96351984e48f220ce8d8b9bbfea137c8639c090df`
  - v1.2 `Surface_Wars_v1.2.apk` — `5eee2bd9c4730b1e18572b75855967865cf0b91723d840b72a1c11acce1c9835`

## Install on the Galaxy S25

Transfer the v1.3 APK, tap it, allow install from that source, proceed past
the unknown-developer warning only if you expect this file. It updates
v1.2 in place and launches in landscape. The main menu offers Tutorial,
Play First Map, and Play Second Map — Twin Bridges.

## Honest limits

- WebView wrapper, not a native engine port, and **not installed or run on
  a real phone from the sandbox** — S25 landscape launch, real-finger
  drag-pan, side-panel scroll feel, performance, and the new AI's
  real-finger feel are unverified until the user installs it and reports
  back.
- Pinch was never finger-tested in any pass; Zoom buttons remain the
  verified zoom route.
- **Twin Bridges air-only endgame stall (known limit from Generation
  Cycle 2) is still present in this build:** if both cores die and only
  air drones remain, their guns only hit ground/structure, so no order can
  make them damage each other and the match can stall. Fixing it requires
  a weapon-class or victory-rule design decision, which was outside Cycle
  2's one-system fence and is queued for a later cycle.
- The AI's retreat behaviour is test-proven but was not observed in
  headless matches (Cycle 2 report); match results against a scripted
  stand-in are a behaviour comparison, not a human balance verdict.

No commit, push, or publish.
