# APK Report — Surface Wars v1.8 (menu-consolidation + movement-controls pass)

- File: `~/workspace/your_files/Surface_Wars_v1.8.apk`
- Size: 72,783,760 bytes
- SHA-256: `e6ed4570678503041bbe5971813765b1fcc6f124e593d316834b65e1872f1eed`
- Package: `com.skit.surfacewars`, versionCode 9 / versionName 1.8
- minSdk 28, targetSdk 35, MainActivity launcher, landscape feature
- Signing: SAME debug keystore as v1.0–v1.7 (signer cert SHA-256
  `1354ef2e3b33632a66758d3a530aae11d2b1b53885a167fa95f59eaef36b39f5`,
  identical to v1.7) — installs over v1.7 in place. Not release signing.
- Pipeline: SDK tools directly, no Gradle; build-tools 35.0.0,
  platform android-35, JDK 17 with `~/jdk17/bin` on PATH.
  Pre-edit `build.sh` (v1.7 pipeline, versionCode 8) preserved verbatim
  as `apk/build-1.7.sh` (SHA-256
  `906cf7338b50bdacc05c91a7e52a6b45fb82807c09cbbdac32ef5f697c3756e6`,
  same as pre-edit `build.sh`, still stamps versionCode 8 /
  versionName 1.7) and left untouched afterward; `build.sh` updated
  ONLY for versionCode 9 / versionName 1.8 / output name
  `Surface_Wars_v1.8.apk` (diff vs `build-1.7.sh` is version lines only).
- Pre-build gates: full suite 318/318 green (node --test
  tests/*.test.js — 303 baseline + 15 new `tests/controls18.test.js`)
  or STOP — passed. `apk/verify_refs.py` run before building:
  0 missing (units 57, structures 23).
- This wave makes NO mechanic, balance, AI, map, cost, stat, or
  save-format change. UI/input/docs only: menu grouping, touch Select
  mode, next-tap feedback line, drag-rect draw, panels-strip
  tap-through fix. `CONTROLS.md` updated to match (new v1.8 section,
  Menus/Camera/Selection tables, new Feedback-line section).
  No localStorage key changed, no id removed, no entry removed.

## Bundle, re-derived (not copied from v1.7)

- Game files: 14, re-derived from `index.html`'s script tags
  (index.html, style.css, catalog.js, sim.js, sprites.js, view.js,
  animation.js, maps.js, render.js, weapons.js, hero.js,
  progression.js, currency.js, game.js). QA harness HTML, all report
  MDs, all screenshots, `beta-wave*/beta12h` captures excluded.
- Assets: 437 files — 430 `-512.png` + 7 UI icons (same counts as
  v1.7: units 98, structures 46, tiles-overlay base 42, overlays 123,
  unit wrecks 57, fx 17, projectiles 4, canopy 6, structure-wrecks 21,
  mechs-expansion 16). The full assets tree was NOT bundled.
- Listing total: 458 files (437 assets + 14 game + classes.dex +
  launcher/res/meta entries) — identical structure to v1.7.
- v1.7 APK untouched: `~/workspace/your_files/Surface_Wars_v1.7.apk`
  still 72,779,664 bytes, SHA-256
  `a54a3580a8f28569ea8cfd05f7659e74f5726e699f50e8f022fc986b36760f49`.

## Independent re-verification on the APK itself

- `apksigner verify` PASS (v3 scheme, 1 signer; `--print-certs`
  cert SHA-256 matches v1.7 exactly — same keystore, installs over
  v1.7 in place).
- `zipalign -c 4` PASS.
- Badging: package `com.skit.surfacewars`, versionCode 9 /
  versionName 1.8, minSdk 28, targetSdk 35, MainActivity launcher,
  landscape feature, WAKE_LOCK.
- Packaged game files byte-identical to the live tree: 14/14 via
  `cmp` after unzipping `assets/game/*` from the APK.
- No harness/report/screenshot/beta entries (the only non-asset PNG
  in the listing is the launcher icon in `res/`); zero absolute-path
  entries.

## Headless smoke (Playwright, Chromium 1248, served from the repo root)

40/40 checks passed, landscape 800×390 + portrait 390×800:
boot to main menu; main-menu sections Play / Difficulty / Learn /
Customize / Store / Settings; How to Play, Settings, Loadout, Store
each opened and returned to the main menu; First Map start; feedback
hint at match start; feedback strip passes taps to the canvas
(elementFromPoint at its centre returns the canvas — the pre-fix
probe on the unmodified tree returned the strip itself); tap selects
1 unit + info panel; Hold hint states the tap fallback; Patrol hint
states the first point; overflow row toggles all visible; Select hint
states drag-select; real CDP touch drag-select selects 3 units in
landscape (dashed yellow drag rect photographed mid-drag) and 1 unit
in portrait (single-unit info panel — the portrait drag rect covers
one spawn tile at phone width); build panel opens on a core tap
(camera centred via minimap, then canvas-centre tap); pause sections
Match / Switch map / Options; portrait tray starts collapsed with the
Select toggle still visible; zero failed asset requests in both
orientations (183 tracked requests in a network dump, 0 >= 400,
0 requestfailed).
- One console line in the landscape run only: "Failed to load
  resource: 404" with NO tracked response >= 400 and NO requestfailed
  anywhere in the dump — the browser's implicit favicon.ico fetch
  (index.html declares no icon; favicon fetches bypass CDP Network
  events). Pre-existing, not a game asset failure; the
  response-based asset gate is clean in both orientations.
- Harness note: synthetic PointerEvents do NOT drive this game's
  drag (pointerdown calls setPointerCapture, which throws for a
  non-active synthetic pointer id and aborts the handler) — the
  smoke run uses real CDP touch events, which is the faithful path.
  Synthetic-event drag-select "failures" in a harness are a harness
  artifact, not a game bug (proven: same drag via CDP selects 3).

## Waived gates, named (carried from Wave 6, not new)

- Victory panel never rendered in an unseeded browser run; draw
  panel never reached in browser; hero-redeploy HP check stands as
  FAIL in its log as a check-design artifact, not a game defect.
- Real-phone verification owed everywhere (touch-stick
  CDP-emulated, pinch zoom-buttons-only): real-phone touch,
  ergonomics, and the drag-select feel on a physical phone are still
  the user's verdict, never claimed from sandbox emulation.

## What v1.8 changes over v1.7 (player-facing)

1. Main menu: six labeled sections on one screen (Play, Difficulty,
   Learn, Customize, Store, Settings). Same buttons, same taps.
2. Pause menu: three labeled sections (Match, Switch map, Options).
   Same actions.
3. Command tray: new always-visible "View & selection" row holding
   Paths, Minimap, Pan, Select (new), Add Select. Primary orders
   unchanged and always visible.
4. Touch Select mode (default OFF): touch drag draws a selection
   rectangle instead of panning; drag rectangle now drawn for mouse
   and touch (was invisible before).
5. Feedback line always states what the next tap will do for the
   current mode/selection/toggles; transient messages show 3 s,
   then the hint returns.
6. Panels strip no longer swallows map taps (feedback strip passes
   through; panels stay interactive).
7. Docs: `game/CONTROLS.md` v1.8 section + updated tables.
