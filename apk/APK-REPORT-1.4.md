# Surface Wars APK v1.4 — Report

## File

- **APK:** `~/workspace/your_files/Surface_Wars_v1.4.apk` (new filename; v1.3, v1.2, v1.1, and v1.0 untouched)
- **Size:** 62,755,060 bytes (~59.9 MB)
- **SHA-256:** `a8ef371a2464eec8e15f9fa96741201ed8ba672623ccbcaee367853bc6066599`
- **Package:** `com.skit.surfacewars` (unchanged — installs over v1.3 as an update)
- **Version:** versionCode 5, versionName 1.4, minSdk 28, targetSdk 35
- **Signing: debug-signed, not release signing.** The same debug keystore as
  v1.0–v1.3 was reused — proven, not assumed: the v1.4 signer certificate
  SHA-256 digest (`1354ef2e3b33632a66758d3a530aae11d2b1b53885a167fa95f59eaef36b39f5`)
  matches v1.3's exactly, so the update path keeps working. Android /
  Play Protect will flag it as an unknown-developer install, as expected
  for a test APK.

## What is new in v1.4 (vs v1.3)

This build snapshots the current game tree after four passes that v1.3
predates:

1. **Deadlock draw fix (Generation Cycle 3):** a match can no longer stall
   forever in a target-class deadlock. When neither side can damage the
   other and neither side can produce new units, the match ends in a
   declared draw after a 600-tick (30 sim second) grace
   (`DEADLOCK_GRACE_TICKS = 600` in the packaged `sim.js`). No weapon
   damage, range, or target class was changed to achieve this.
2. **Twin-stick manual control (Phase A):** take over any selected armed
   player unit with twin sticks (left stick moves, right stick aims and
   auto-fires), firing only at the nearest enemy that passes every normal
   firing gate and lies within a 30° aim cone. Release returns the unit to
   RTS orders with a hold order.
3. **Hero mech + loadout + gear (Phase B):** the player's default starting
   mech, "Command Mech" (placeholder name), replaces the west roster's
   lancer_mech entry but starts in reserve — opening field is 9v10, not
   10v10. Drop Back In is its only entry, dropping core-adjacent after a
   2-second telegraph; voluntary redeploy is free after a 10-second
   cooldown, death redeploy costs 200 scrap after 30 seconds, and a dead
   Command Core blocks both paths. Between-match loadout over the seven
   catalog slots, using the twelve family templates and all 123 named
   weapon rows. (Phase B shipped tier-1 gear only; Phase C below lifts
   that lock by level.)
4. **Progression persistence + skills + upgrades (Phase C):** hero level,
   XP, skills, and gear unlocks persist across matches on the same device
   under the record key `surfacewars.hero.v1`, surviving app restarts.
   XP from hero killing blows (10% of victim cost, minimum 10), hero
   salvages (10 each), wins (+100), draws (+0 bonus, kill/salvage XP still
   counted), losses (+25); level curve runs level 2 at 100 cumulative XP
   to level 10 at 4,500. Eight skills (Dash, Salvage Sense, Overdrive,
   Field Repair, Targeting Computer, Shockwave Slam, Reinforced Frame,
   Rally Signal), one equipped active shown as Ability 1, free respec
   between matches. Gear tiers unlock by level (tier 2 at levels 4–6,
   tier 3 at 7+). Field heroes read `CMD N` as a level badge.

Also carried over from v1.3: landscape-first layout (wide map, right-side
command panel) and the landscape lock (below).

## Build method

Packaging only — no `game/*.html/js/css` files were edited in this pass.
Same proven pipeline as v1.3 (`apk/build.sh`, `verify_refs.py`, direct SDK
tools: javac → aapt2 → d8 → zipalign → apksigner, no Gradle). The v1.3
pipeline is preserved as `apk/build-1.3.sh` (the previous `build.sh`
copied before editing); `build.sh` was updated to versionCode 5 /
versionName 1.4 / output `Surface_Wars_v1.4.apk` only.

Pre-build gate: tests re-run from `~/workspace/surface-wars/` with the
explicit file list — **159 pass, 0 fail**.

Snapshot discipline: the game tree was snapshotted into `apk/assets/`
by `build.sh` and the packaged `assets/game/` set was diffed against the
live `game/` tree after packaging — **identical, no diffs** (see below).

## Game file list — re-derived, not copied from v1.3

Phase B added `hero.js` and `weapons.js`; Phase C added `progression.js`.
The packaged game set is therefore **13 files** (was 10 in v1.3):

| File | Role |
|---|---|
| `index.html` | Page shell, menus, panels, control strip |
| `style.css` | Layout, landscape shell, panels |
| `animation.js` | Bob, dust, muzzle, smoke, wreck FX |
| `catalog.js` | Generated catalog mirror |
| `game.js` | Shell: input, menus, hero state, loadout, record |
| `hero.js` | Reserve state machine, Drop Back In |
| `maps.js` | First Map, Twin Bridges, Test Map |
| `progression.js` | Hero record, XP curve, skills, validator |
| `render.js` | Canvas rendering |
| `sim.js` | Fixed-timestep sim, AI, deadlock detector |
| `sprites.js` | Sprite path resolution |
| `view.js` | Camera, zoom, stick zones, pure helpers |
| `weapons.js` | 12 baselines, 123 named rows, gear, validator |

Screenshots, reports, and tests are excluded from every APK build by
design.

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

## WebView settings — verified in the wrapper source

`apk/src/com/skit/surfacewars/MainActivity.java` was read before
packaging (not assumed from earlier builds):

- JavaScript on, **DOM storage on** — Phase C hero persistence depends on
  this in the APK; it is on
- File access for local assets on, WebView zoom controls off (the game
  keeps its own pinch handling), screen kept on during play
- `WAKE_LOCK` permission in the manifest
- Back button goes back only if WebView history exists; on this
  single-page load there is none, so back exits the app (unchanged)

Launcher icon: the v1.3 icon (blue-vs-red top-down mech motif) reused,
not regenerated or substituted.

## Packaged-game markers — checked individually in the APK

Extracted from the finished APK and counted per file:

| Marker | File | Count |
|---|---|---|
| `Twin Bridges` | `assets/game/index.html` | 2 |
| `runAiCombat` (red combat AI) | `assets/game/sim.js` | 3 |
| `DEADLOCK_GRACE_TICKS = 600` (draw fix) | `assets/game/sim.js` | 1 |
| `neither side can win` (draw panel) | `assets/game/game.js` | 1 |
| `surfacewars.hero.v1` (progression record) | `assets/game/progression.js` | 2 |
| `Drop Back In` | `assets/game/index.html` | 2 |
| `Drop Back In` | `assets/game/game.js` | 6 |
| `Command Mech` | `assets/game/index.html` | 6 |
| `Command Mech` | `assets/game/game.js` | 5 |
| Page title | `assets/game/index.html` | `<title>Surface Wars</title>` |
| `Prototype 03` | `assets/game/index.html` | 0 |

Snapshot check: packaged `assets/game/` (13 files above) diffed against
the live `game/` tree — **identical, no diffs**.

## Assets — same subset rules as v1.3

Game html/js/css only; all images `-512.png` only, **383 total** (no new
art was added in Cycle 3 or Phases A/B/C — counts re-verified, not
copied):

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
present (`verify_refs: all referenced files present`), including files
referenced by the new hero/progression code (no new referenced asset
files were added by those passes — the hero reuses existing mech art).

## Verification — all pass

- `apksigner verify` — PASS (run again independently after the build)
- `zipalign -c 4` — PASS (run again independently after the build)
- `aapt2 dump badging` — `com.skit.surfacewars`, versionCode 5,
  versionName 1.4, minSdk 28, targetSdk 35, launchable
  `com.skit.surfacewars.MainActivity`, landscape screen feature,
  `WAKE_LOCK` permission
- Unzip listing — `assets/game/index.html` + `classes.dex` present;
  **zero entries under an absolute path** (the v1.0 dex bug is absent —
  the one `/home/` match in the raw listing is the unzip header line
  itself, not an archive entry)
- Packaged manifest — `screenOrientation = 0` (LANDSCAPE),
  `configChanges = 0x4a0` (see above)
- Packaged markers — all present per the table above; no "Prototype 03"
  in the packaged `index.html`
- Same signing certificate as v1.3 (SHA-256 digest matches) — v1.4
  installs over v1.3 in place
- Prior APKs byte-identical after this build (sizes + SHAs unchanged):
  - v1.0 `Surface_Wars.apk` — 62,705,703 bytes —
    `6e3acbe97a74994a352605f13e16bfc565135a26f542234e5cdf75890038edfc`
  - v1.1 `Surface_Wars_v1.1.apk` — 62,709,799 bytes —
    `acf88d35f5464536970637e96351984e48f220ce8d8b9bbfea137c8639c090df`
  - v1.2 `Surface_Wars_v1.2.apk` — 62,709,799 bytes —
    `5eee2bd9c4730b1e18572b75855967865cf0b91723d840b72a1c11acce1c9835`
  - v1.3 `Surface_Wars_v1.3.apk` — 62,717,991 bytes —
    `27170798e72e95865dff182b8f5f22943d7660f45fd3ea35b469f3f0d99eb487`

## Install on the Galaxy S25

Transfer the v1.4 APK, tap it, allow install from that source, proceed past
the unknown-developer warning only if you expect this file. It updates
v1.3 in place and launches in landscape. The main menu offers Tutorial,
Play First Map, Play Second Map — Twin Bridges, and Hero Loadout —
Command Mech.

## Honest limits

- WebView wrapper, not a native engine port, and **not installed or run on
  a real phone from the sandbox** — S25 landscape launch, real-finger
  touch, performance, and twin-stick thumb ergonomics are unverified
  until the user installs it and reports back.
- Pinch was never finger-tested in any pass; Zoom buttons remain the
  verified zoom route.
- **Hero persistence across the update install is unverified from the
  sandbox.** A fresh v1.4 install starts the hero at level 1, since v1.3
  had no progression record — that is expected, not a bug. Whether an
  in-place update over v1.3 preserves the APK's own storage on the S25 is
  a device behaviour the sandbox cannot observe; if progress ever resets
  after an update, that is the first thing to report. Note also that hero
  progress lives in the APK's own storage, separate from the web build —
  phone progress does not appear on laptop and vice versa, and clearing
  app data loses it permanently with no recovery.
- The Twin Bridges air-only endgame stall from Cycle 2 is fixed in this
  build by the Cycle 3 draw rule (draw after the 600-tick grace), not by
  a weapon change.
- Twin-stick and hero balance numbers (aim cone, cooldowns, XP values,
  skill effects) are proposed judgement from Phases A/B/C, not
  playtested feel; headless match comparisons are behaviour checks, not
  a human balance verdict.

No commit, push, or publish.
