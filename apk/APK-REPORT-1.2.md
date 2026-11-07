# Surface Wars APK v1.2 — landscape-locked rebuild

Built 2026-10-30 ~19:39 PDT, after `game/LANDSCAPE-REPORT.md` landed
(2026-10-30 ~19:38 PDT). Packaging only: no `game/` files were edited
by this build; the landscape layout comes from the landscape-first
pass. Pipeline: `apk/build.sh` (direct SDK tools, no Gradle);
the v1.1 script is preserved as `apk/build-1.1.sh`.

## File

- **APK:** `~/workspace/your_files/Surface_Wars_v1.2.apk`
  (new filename; v1.1 and v1.0 were not overwritten)
- **Size:** 62,709,799 bytes (~59.8 MB)
- **SHA-256:** `5eee2bd9c4730b1e18572b75855967865cf0b91723d840b72a1c11acce1c9835`
- Size note, stated honestly: v1.2 is byte-identical in size to
  v1.1 (62,709,799 bytes). That is a coincidence of the
  asset-dominated archive, not a re-labelled v1.1 — the SHA-256
  differs, the badging shows version 1.2, and the packaged
  `index.html` contains the landscape markers that v1.1 lacks
  (v1.1 contains 0 occurrences of `rotate-hint`; v1.2 contains 1).

## Identity and signing

- Package: `com.skit.surfacewars` (unchanged, so it installs over
  v1.1 as an update)
- versionCode 3, versionName 1.2, minSdk 28, targetSdk 35
- **Debug-signed, not release signing.** The pre-existing debug
  keystore (`apk/debug.keystore`, same key as v1.0/v1.1) was reused,
  so the update path over v1.1 keeps working. Android/Play Protect
  will flag it as an unknown-developer install, as expected for a
  test APK.

## Landscape lock (the point of this build)

Source manifest (`apk/AndroidManifest.xml`) activity element:

```xml
<activity android:name=".MainActivity" android:exported="true"
    android:screenOrientation="landscape"
    android:configChanges="orientation|screenSize|keyboardHidden">
```

Verified in the PACKAGED manifest, not just the source
(`aapt2 dump xmltree --file AndroidManifest.xml` on the final APK):

- `android:screenOrientation = 0` — compiled constant 0 =
  `SCREEN_ORIENTATION_LANDSCAPE`
- `android:configChanges = 0x4a0` — orientation (0x80) +
  screen size (0x400) + keyboard hidden (0x20), as before
- Badging corroboration: `uses-feature:
  android.hardware.screen.landscape`, implied by the landscape
  orientation

The app therefore launches in landscape even if the phone is held
in portrait.

## Landscape layout markers in the packaged game

Checked in the packaged `assets/game/index.html` (each count = 1):

- `id="layout"` — landscape shell wrapper
- `id="side"` — right-side command panel in landscape
- `id="rotate-hint"` — portrait-only rotate pill
- `btn-rotate-dismiss` — "Continue in portrait" dismiss button

Packaged `assets/game/style.css` contains the
`orientation: landscape` media query and the `#layout` / `#side`
rules. The landscape layout itself (wide map, 300 px side panel,
order row always visible, 192×120 minimap, panels fitting ~390 px
height, portrait rotate hint) is documented in
`game/LANDSCAPE-REPORT.md`.

## Asset subset (same rules as v1.1)

- Game code: html/js/css only (no screenshots, reports, or tests)
- `sprites-90/units` 98, `sprites-90/structures` 46,
  `tiles-overlay/base` 42, `tiles-overlay/overlays` 123 (8 families),
  `animation/wrecks` 49, `animation/fx` 15,
  `animation/projectiles` 4, `animation/canopy` 6 — all `-512.png`
  only, **383 total**
- `verify_refs.py`: all referenced files present (49 catalog units,
  23 structures, both team colours, all overlay variants,
  FX/projectiles/canopy)
- Snapshot check: packaged game code matches the live `game/` tree
  for html/js/css; the only difference is `animation-sequence.gif`,
  which lives in `game/` but is excluded from every APK build by
  design (it is a report artifact, not game code)
- Live-tree tests re-run before this build: **93/93 pass**

## Verification on the final APK (all pass)

- `apksigner verify` — PASS
- `zipalign -c 4` — PASS
- `aapt2 dump badging` — `com.skit.surfacewars`, versionCode 3,
  versionName 1.2, minSdk 28, targetSdk 35, launchable
  `MainActivity`
- Unzip listing — `assets/game/index.html` and `classes.dex`
  present
- Packaged manifest dump — landscape lock confirmed (above)
- Older APKs untouched — v1.0 SHA-256
  `6e3acbe97a74994a352605f13e16bfc565135a26f542234e5cdf75890038edfc`,
  v1.1 SHA-256
  `acf88d35f5464536970637e96351984e48f220ce8d8b9bbfea137c8639c090df`,
  both unchanged from their deliveries

## Install / update on the Galaxy S25

Transfer the v1.2 APK, tap it, allow install from that source,
and proceed past the unknown-developer warning only if you expect
this file. Same package as v1.1, so it updates in place. The app
launches in landscape; the main menu offers Tutorial, and in
portrait the web layout would show the rotate pill — but the
installed app should never show portrait at all, since the
manifest locks it to landscape.

## Honest limits

- WebView wrapper of the web prototype, not a native engine port.
- **Not installed or run on a real phone from the sandbox.**
  Landscape launch on the S25, real-finger drag-pan, side-panel
  scroll feel, and S25 performance are unverified until the user
  installs it and reports back.
- Pinch was never finger-tested in any pass; Zoom buttons remain
  the verified zoom route.
- No commit, push, or publish.
