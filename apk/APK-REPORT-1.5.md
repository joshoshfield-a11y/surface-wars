# Surface Wars APK v1.5 — Report

- **APK:** `~/workspace/your_files/Surface_Wars_v1.5.apk` (new filename; v1.0–v1.4 untouched)
- **Version:** versionCode 6, versionName 1.5, minSdk 28, targetSdk 35
- **Package:** `com.skit.surfacewars` — same package and same debug keystore
  (`apk/debug.keystore`) as v1.4, so v1.5 installs over v1.4.
- **Size / SHA-256:** 66,271,617 bytes /
  `46076e878560bb901cc0eb0fe933c87eab5b1e8c1ed14faea98045c4b815c11c`
- **Built:** 2026-10-31 (evening PDT) from `~/workspace/surface-wars/`, SDK tools
  directly, no Gradle. No commits, no pushes, no publishing of any kind.
  No other project was touched.

## Pre-build gate: PASS

`node --test tests/*.test.js` from `~/workspace/surface-wars/` (explicit file
list, 24 test files): **234 pass, 0 fail** (230 baseline + 4 beta-wave2b).
The build proceeded only because the gate was all-green.

## Pipeline (v1.4 pipeline, SDK tools directly)

- build-tools 35.0.0, platform android-35, JDK 17 (`~/jdk17/bin` on PATH),
  `_JAVA_OPTIONS="-Djava.net.preferIPv4Stack=true"`.
- Compile `MainActivity.java` → aapt2 compile/link → d8 dex → aapt add
  `classes.dex` by relative name from inside `out/` (the v1.0 absolute-path
  bug stays fixed — see verification below) → zipalign → apksigner with the
  existing `apk/debug.keystore`.
- **build-1.4.sh note (honest correction to the task brief):** no
  `apk/build-1.4.sh` existed on disk before this build — v1.4 was built by
  `build.sh` itself (identical SHA before editing:
  `c3252362ccba8905b16a05b46f055cfc3e13bce5dd558a1c57c654e0e2ed03c0`).
  That pre-edit `build.sh` was copied verbatim to `apk/build-1.4.sh` first,
  and `build-1.4.sh` was not modified afterward (still contains
  `--version-code 5` / `Surface_Wars_v1.4.apk`). `build.sh` is now the v1.5
  pipeline.
- **Changes to `build.sh` for v1.5 (and why):**
  1. `--version-code 6 --version-name 1.5`, output `Surface_Wars_v1.5.apk`.
  2. Game snapshot is now an **explicit 13-file list** instead of the
     `game/*.html/*.js/*.css` glob: the glob would also have bundled
     `game/_wave2-harness.html`, a QA harness that `index.html` never loads.
     Bundle = only what the game actually loads.
  3. Two new staging sections for wave-2 art the game references but v1.4
     never bundled (see "What is new" below).
- **`verify_refs.py` extended for v1.5:** damage decals, all 13
  structure-wreck stems, and all 7 UI icons are now checked, and the game-file
  loop skips `_wave2-harness.html` (the deliberate exclusion above) instead
  of flagging it. Result: `verify_refs: all referenced files present`
  (units=49, structures=23), 0 missing.

## What is new in v1.5 (vs v1.4)

The game code itself is the wave-2 tree (Twin Bridges, Third Map / Forest
Belt, difficulty wiring, red combat AI, draw handling, hero persistence,
Twin-Stick phases A–C). The packaging change vs v1.4 is the asset bundle,
re-derived from the live tree rather than copied from v1.4:

| Asset set | v1.4 | v1.5 |
|---|---|---|
| `sprites-90/units/*-512.png` (49 plain + 49 `-red`, incl. wired-sprite fix reds) | 98 | 98 |
| `sprites-90/structures/*-512.png` (23 plain + 23 `-red`) | 46 | 46 |
| `tiles-overlay/base/*-512.png` (14 bases × 3 variants) | 42 | 42 |
| `tiles-overlay/overlays/*/*-512.png` (8 families; cracks carries 3 extra scatter variants) | 123 | 123 |
| `animation/wrecks/*-512.png` (unit wrecks) | 49 | 49 |
| `animation/fx/*-512.png` | 15 | **17** (+ `damage_light`, `damage_heavy` decals) |
| `animation/projectiles/*-512.png` | 4 | 4 |
| `animation/canopy/*-512.png` | 6 | 6 |
| `animation/structure-wrecks/*-512.png` | **0 (missing in v1.4)** | **13** (12 dedicated + generic `rubble`) |
| `ui-icons/*.png` (plain .png, no -512 suffix) | **0 (missing in v1.4)** | **7** (move, attack-move, hold, patrol, salvage, guard, drop-back-in) |
| **Total `-512.png`** | 383 | **398** |
| **Total asset files** | 383 | **405** |

- Game files bundled: **13** — `index.html`, `style.css`, `catalog.js`,
  `sim.js`, `sprites.js`, `view.js`, `animation.js`, `maps.js`, `render.js`,
  `weapons.js`, `hero.js`, `progression.js`, `game.js`. Exactly the files
  `index.html` loads (verified from its `src`/`href` attributes).
- **Not bundled, by design:** the full ~949 MB `assets/` tree (only the
  405-file subset above), all `game/*.md` report files, all `game/*.png`
  screenshots, `game/beta-wave2b/` captures, and `game/_wave2-harness.html`.
  The packaged APK contains zero `harness` entries.
- **v1.4 gap this closes:** v1.4 shipped without structure wrecks, damage
  decals, or UI icons even though `sprites.js` preloads them
  (`structureWreckPath`, `fxPath('damage_light'/'damage_heavy')`,
  `iconPath`). The game fell back gracefully (still sprites / text labels),
  so v1.4 was playable, but those three wave-2 art sets never displayed.
  v1.5 is the first build that actually contains them.

## Wrapper (unchanged from v1.4, verified in source)

`apk/src/com/skit/surfacewars/MainActivity.java`:

- `setJavaScriptEnabled(true)`, **`setDomStorageEnabled(true)`** (hero
  persistence depends on this — confirmed ON),
  `setAllowFileAccess(true)`, `setAllowContentAccess(true)`.
- Zoom controls off: `setBuiltInZoomControls(false)`,
  `setDisplayZoomControls(false)`, `setSupportZoom(false)`.
- Screen kept on: `FLAG_KEEP_SCREEN_ON`; `WAKE_LOCK` permission in the
  manifest.
- Loads `file:///android_asset/game/index.html`.
- Back button: goes back in WebView history if there is any, otherwise the
  default Activity behaviour (exit). The game is a single page, so in
  practice there is no WebView history and Back exits — this is the v1.4
  wrapper verbatim, not a new back-button handler.

## Verification — all run on the APK itself

| Check | Result |
|---|---|
| `apksigner verify` | **PASS** — Verifies, 1 signer, APK Signature Scheme v3 (same scheme profile as v1.4: v1 false, v2 false, v3 true, v3.1/v4 false) |
| Signer certificate vs v1.4 | **IDENTICAL** — SHA-256 `1354ef2e3b33632a66758d3a530aae11d2b1b53885a167fa95f59eaef36b39f5`, DN `CN=Surface Wars Debug, OU=Debug, O=Skit, C=US` — v1.5 updates over v1.4 |
| `zipalign -c 4` | **PASS** |
| `aapt2 dump badging` | package `com.skit.surfacewars`, versionCode **6**, versionName **1.5**, minSdk **28**, targetSdk **35**, label `Surface Wars`, launchable-activity `com.skit.surfacewars.MainActivity`, feature `android.hardware.screen.landscape` |
| Packaged manifest (`aapt2 dump xmltree --file AndroidManifest.xml`) | `screenOrientation=0`, `configChanges=0x4a0`, `minSdkVersion=28`, `targetSdkVersion=35`, `WAKE_LOCK` present — landscape lock exactly as specified |
| Unzip listing | **425 entries**; `assets/game/index.html` present, `classes.dex` present, **ZERO absolute-path entries** (no `/home/...` entries — the v1.0 bug class stays fixed) |
| Packaged game diff vs live tree | **All 13 files byte-identical** to `game/` (diff, per file) |
| Packaged markers (counted individually in the packaged files) | `Twin Bridges` in index.html: 2; `Third Map` in index.html: 3; `Forest Belt` in index.html: 1; difficulty wiring: 5 case-insensitive hits in index.html (Easy/Normal/Hard menu buttons + status) plus `difficulty` variable in game.js; `runAiCombat` in sim.js: 4; draw handling: `neither side can win` in game.js: 1, `DEADLOCK_GRACE_TICKS` in sim.js: 4; `surfacewars.hero.v1` in progression.js: 2; `Drop Back In`: index.html 2, game.js 6; `Command Mech`: index.html 6, game.js 5; `<title>Surface Wars</title>`: 1; `Prototype 03` in index.html: **0** |
| Packaged asset counts | `-512.png`: **398**; UI icons: **7**; total `assets/assets/`: **405**; `assets/game/`: **13** — matches the re-derived live-tree counts exactly |
| `verify_refs.py` (extended) | **0 missing** |

## Older APKs — confirmed untouched after the build

| File | Bytes | SHA-256 |
|---|---|---|
| `Surface_Wars_v1.4.apk` | 62,755,060 | `a8ef371a2464eec8e15f9fa96741201ed8ba672623ccbcaee367853bc6066599` — matches the pre-build baseline exactly |
| `Surface_Wars_v1.3.apk` | 62,717,991 | `27170798e72e95865dff182b8f5f22943d7660f45fd3ea35b469f3f0d99eb487` |
| `Surface_Wars_v1.2.apk` | 62,709,799 | `5eee2bd9c4730b1e18572b75855967865cf0b91723d840b72a1c11acce1c9835` |
| `Surface_Wars_v1.1.apk` | 62,709,799 | `acf88d35f5464536970637e96351984e48f220ce8d8b9bbfea137c8639c090df` |
| `Surface_Wars.apk` (v1.0, original filename) | 62,705,703 | `6e3acbe97a74994a352605f13e16bfc565135a26f542234e5cdf75890038edfc` |

No `Surface_Wars_v1.0.apk` filename exists; v1.0 is `Surface_Wars.apk`
above. All sizes and hashes were re-checked after the v1.5 build copied
out — nothing older changed.

## Gaps / honest limits

- **Not proven on a real phone.** As with v1.4: launch, touch controls,
  Twin-Stick feel, hero persistence across the update install, and frame
  rate are the user's on-device verdicts. The headless checks above prove
  packaging, signing, manifest, and content — not runtime behaviour.
- **Signing is debug, not release.** Same debug keystore as v1.4; release
  signing remains a user-side step, as before.
- **Back-button wording:** the task brief said "back button exits"; the
  shipped (v1.4-verbatim) wrapper exits only when there is no WebView
  history, and goes back otherwise. Single-page game ⇒ exits in practice.
  Flagged here rather than silently rewriting the wrapper.
- **v1.4's missing art was a silent gap, not a crash:** the game falls back
  to still sprites and text labels when art is absent, which is why v1.4
  played fine without wrecks/decals/icons. v1.5 closes it; no v1.4
  behaviour claim is revised retroactively beyond that.
- **Not delivered to the user.** This report goes to the coordinator for
  independent re-verification before any user-facing delivery.
