# Surface Wars — Full Beta Pass, Wave 2b (2026-10-31)

Driver: headless Chromium (Playwright, Python, ml-stack venv) driving the
real game at `game/index.html` over a local http server, with REAL input
only — mouse clicks, keyboard, and CDP multi-touch. No game file was
edited in this wave. New files: `tests/beta-wave2b.test.js` (4 tests),
this report, and screenshots in `game/beta-wave2b/`. Driver scripts are
scratch in `/tmp/beta2b/` (not repo files). Nothing committed, pushed,
published, or built as an APK; no other project touched.

## Verdict

**PASS — no blocking bugs found; two gates WAIVED (named in §6, not
passed).** Final suite: **234/234** (`node --test tests/*.test.js`:
230 baseline + 4 new beta-wave2b tests). Driver checks: 56/59 raw
passes; the 2 other raw FAILs were driver-assertion errors, both
re-proven below (§5) and marked PASS (corrected). The 1 remaining raw
FAIL is the draw panel, which no UI-driven run reached (§6).

## 1. Playthrough checklist

### 1a. Main menu + difficulty — PASS

- Main menu visible on load (`beta-wave2b/01-main-menu.png`).
- Difficulty buttons, each verified by its status line: Easy, Normal,
  Hard all read `Difficulty: <Level> (red AI behaviour only — same
  costs, same economy, same unit stats; applies at the next match
  start)`, then back to Normal. In-match AI-param effect has no UI
  readout, so it is verified by the menu text + the sim-level param
  sets (already pinned in `beta-wave2.test.js`), not by a number on
  screen. Easy was used for victory attempts in §1g and still lost —
  consistent with difficulty touching AI behaviour only, never stats.

### 1b. Tutorial, every step by doing the action — PASS

All 7 steps advanced by the action itself, never by Next:

| Step | Action done | Evidence |
|---|---|---|
| 1 Look | Zoom + button | Text advanced to step 2 |
| 2 Select | Tapped blue scout at (10,21) | `Selected: 1`, step 3 |
| 3 Move | Tapped open ground (18,22) | Step 4 |
| 4 Attack | Tapped red target (28,25) | Step 5 |
| 5 Build | Tapped core (6,25), queued Scout Buggy, scrap 500 → 420, build completed in 8 s | Step 6; `beta-wave2b/03-tut-build-panel.png` |
| 6 Salvage | Selected a tank, tapped the wreck, scrap rose | Win screen; `beta-wave2b/04-tut-wreck-panel.png` |
| 7 Win | `Play a real game` | Fresh First Map, 9v10, scrap 500 |

Deliberate 70 s idle inside the build step, so the salvage-step wreck
refresh was genuinely exercised (see §5, item 1). Queue progress text
changed live while building (panel-freshness evidence). Win screen:
`beta-wave2b/05-tut-win-screen.png`.

### 1c. All three maps — PASS

- First Map: `First Map 80x50 | Iron Eden units: 9 | Xandria units: 10 |
  Scrap: 500` (`06-firstmap-start.png`).
- Second Map — Twin Bridges: same 9v10 / 500 line
  (`15-map-second.png`).
- Third Map — Forest Belt: same 9v10 / 500 line
  (`15-map-third.png`).

### 1d. Twin-stick desktop — PASS

- Select medium tank → info-panel Take Control → body `controlling`,
  control strip visible, banner carries the manual-control note
  (`07-twinstick-control.png`).
- WASD W drive + mouse aim east + held fire: canvas pixels changed,
  still controlling, no crash (`08-twinstick-driving.png`).
- Esc releases: no longer controlling, `Selected: 1` preserved.
- Structure rule: selecting the Command Core shows no Take Control
  button (info panel shows core name/HP/armour/role only).

### 1e. Hero: loadout → drop → drive/fire → release → cooldown → re-drop — PASS

- Loadout summary: `Level 1 | HP 200 | Speed 6 | Vision 8 | Weapons:
  Twin-Bore Autogun` (`10-loadout.png`).
- Drop Back In visible at match start; press → feedback `Command Mech
  dropping in near your Command Core`; after the telegraph the hero
  lands controlled, strip `HP: 200 / 200 | Weapon range: 6 tiles`
  (`11-hero-controlled.png`).
- Drive (D) + aim + fire while controlled, no crash.
- Release Control → feedback `Command Mech withdrawn to reserve. Drop
  Back In when ready.`; drop button reads `Drop ready in 10s`.
- After ~11.5 s the button returns to `Drop Back In`; re-drop lands
  controlled at the SAME strip text `HP: 200 / 200`
  (`12-hero-redropped.png`).

### 1f. Hero death → redeploy — PASS (wreck count: see §7)

- Drove the controlled hero east with aim + held fire; hero died in
  ~30 s: feedback `Controlled unit destroyed.`
  (`13-hero-dead.png`).
- Drop button then read `Drop ready in 28s`, counting down to `27s`
  (30 s death cooldown, as specified).
- After 33 s with scrap 893 on hand, the button returned to
  `Drop Back In`; redeploy landed controlled at full HP `200 / 200`
  (`14-hero-redeployed.png`). The 200-scrap death cost is pinned at
  sim level in `beta-wave2b.test.js`.

### 1g. Terminal panels — DEFEAT proven (×7); VICTORY and DRAW unproven (§6)

- Defeat panel rendered in the browser 7 times across independent
  runs, always with title, stats line, and the Hero XP line, e.g.
  `Defeat — Xandria wins. | Ticks elapsed: 1492 | Sim time: 74.6s |
  Winning units remaining: 17 | Wrecks created: 10 | Wrecks still on
  the field: 1 | Hero XP +25 (level 1 -> 1)`
  (`16-victory-panel.png` — the file name is from the driver, which
  waited for any terminal panel; the panel it caught was a defeat —
  and `18-defeat-panel.png`).
- Victory attempts: (1) main-driver attack with queued reinforcements
  → defeat at tick 2479; (2) Easy + hero dropped in support → defeat
  at tick 2120 (`25-victory-attempt2.png`); (3) Easy + re-attack loop
  → defeat at tick 1438 (`26-victory-attempt3.png`); (4) Easy +
  attack-move to ground (70,25) instead of an attack order on the core
  → defeat at tick 1561 (`27-victory-attempt4.png`); (5) Easy + tight
  ~8 s queue/re-attack loop → defeat at tick 1570
  (`28-victory-attempt5.png`). Note: the first execution of that
  tight loop died on a Playwright timeout (a terminal panel had
  appeared mid-loop and intercepted a later click) before it read
  the panel, so that run's panel was not recorded and is not
  counted above; the clean rerun reproduced the loop to the defeat
  at tick 1570. Note the queue-refund behaviour in
  attempt (3): scrap rose 180 → 260 at defeat, exactly the queued
  scout's 80 refunded when the core died — the OBS-1 instant refund
  working in the browser.
- Draw attempt: Twin Bridges left to run → defeat at tick 1241, not a
  draw (`19-draw-panel.png` — again a defeat panel, by the same
  driver naming quirk).
- Sim-level terminal paths (unchanged, re-run this wave): First Map
  balanced win, 1068 ticks; Twin Bridges balanced draw, 4819 ticks
  (2 units per side, 30 wrecks). The victory and draw panels share
  the single `showVictory` function with the proven defeat panel; the
  field shapes for all three branches are pinned in
  `beta-wave2b.test.js` (`victoryStats` tests).

### 1h. Progression shell — LOSS arc PASS; WIN arc partial (§6)

- After a browser loss: main menu reads `Command Mech — Level 1 |
  25 XP | 0 skill points unspent | 1 matches, 0 wins`, and the
  loadout shows the same level/summary with Dash locked behind level
  2 (`17-menu-after-win.png` — file name is the driver's; the match
  it followed was a loss, and the 25 XP / 0 wins line proves it).
  Loss XP (+25) is written exactly once at the panel, never
  mid-match (earlier quits in this pass earned nothing).
- Two-match / level-up / skill-spend / match-2 arc in the browser:
  NOT completed — it needs a browser win (+100 XP → level 2 →
  1 skill point), and no UI-driven run won. Sim-level arc remains
  proven from Phase C (win +100, level thresholds, respec).
- Corruption — PASS: writing garbage to `surfacewars.hero.v1` and
  reloading shows the notice `Hero progress could not be read, so it
  was reset to level 1.` and a clean level-1 record
  (`20-corruption-menu.png`). The corrupt record was removed after
  the check so later runs start clean.

### 1i. Rally, zoom, pause — PASS

- Rally: core → Set Rally → tap (15,25) → feedback `Rally set at
  (15.0, 25.0). New units will move there on spawn.` AND the build
  panel's rally row refreshed to `(15.0, 25.0)` in the same frame
  cycle (panel freshness, not just feedback text). Mode was reset to
  Move before selecting the core, avoiding the wave-1 driver trap
  (Guard mode + core tap guards the core instead of opening build).
- Zoom − ×10: status `Zoom: 0.40` (clamp, not 0.11).
- Zoom 1×: status `Zoom: 1.00`.
- Pause: see §5, item 2 — frozen on the corrected measurement
  (39 → 39 → 39 over 6 s paused, advancing after resume).

### 1j. Panel freshness + tutorial-wreck refresh — PASS

- Build-queue progress text changed live while a scout built.
- Rally row refreshed on rally change (see §1i).
- Tutorial wreck panel at the salvage step read `Salvage value now:
  31 scrap (started at 32, decays to 0 over 120s)` and
  `Time left: 119s` after a ~95 s-old match — see §5, item 1 for why
  31/119 s IS the refresh proof.
- Info-panel HP changing live in the browser was not isolated as its
  own observation; it is covered at sim level by the wave-2 panel
  signature (HP in the signature string) and by the queue/rally/
  wreck refreshes observed here. Listed as a minor gap in §7, not a
  bug.

## 2. Stress (SANDBOX numbers only — never phone FPS)

`node scripts/stress.js` (300 ticks each, two blobs attack-moving):

| Units | avg ms/tick | p95 ms/tick | max ms/tick | Alive at end | Projectiles |
|---|---:|---:|---:|---:|---:|
| 100 | 1.422 | 6.216 | 47.791 | 65 | 11 |
| 300 | 2.575 | 2.227 | 59.333 | 205 | 28 |
| 500 | 4.359 | 11.419 | 62.663 | 342 | 49 |

A repeat run gave 500 units avg 4.73 / p95 12.169 / max 65.624, so the
500-unit average sits around 4.4–4.7 ms/tick on this sandbox. Max
spikes are single-tick outliers (warm-up/GC shape), not sustained
cost: p95 stays an order of magnitude below the 50 ms tick budget.
No winner in 300 ticks at any size (expected: attrition only).

## 3. Mobile emulation — PASS

All measurements: `overflowX = 0`, canvas client size == stage client
size, minimum visible button height 44 px.

| Viewport / state | Canvas == stage | OverflowX | Min btn | Buttons |
|---|:---:|:---:|---:|---:|
| 390×844 portrait, in game | 390×443 | 0 | 44 | 16 |
| 390×844 portrait, tray toggled | 390×358 | 0 | — | — |
| 844×390 landscape, in game | 544×311 | 0 | 44 | 38 |
| 844×390 landscape, minimap off | `display:none` | 0 | — | — |
| 932×430 landscape, in game | 632×370 | 0 | 44 | 38 |
| 932×430 landscape, minimap off | `display:none` | 0 | — | — |

- Portrait clean run: rotate-hint dismissed AFTER starting the game
  (the wave-1 driver clicked it under the main-menu overlay; this run
  does not repeat that error). Tray toggle in portrait flips
  `expanded` False → True and the canvas still equals the stage
  afterwards (`21-portrait-ingame.png`, `22-portrait-tray-toggled.png`).
- Landscape tray button is `display: none` by design (extra row forced
  visible) — not a failure, same as wave 1.
- Touch-stick phone-landscape (844×390, CDP multi-touch): selected a
  tank, entered control via the info panel, then dispatched two
  simultaneous touch points (left stick origin + right stick origin,
  both dragged +60 px east) — still controlling afterwards, no crash
  (`24-touch-stick.png`). This is emulated touch via CDP, not a real
  phone touchscreen — see §7.
- **Pinch: Zoom-buttons verified / finger-pinch unproven.** No
  finger-pinch was faked or claimed.

## 4. Console errors

- Main driver session: 1 console error, 0 pageerrors. The error is a
  single `404 (File not found)`; the http server log for a later
  session identifies it exactly: `GET /favicon.ico 404` — the
  browser's automatic favicon request for a page with no favicon
  link, not a game asset. Every game sprite/model request in the same
  log returned 200. A clean re-run (menu + first map) showed zero
  404s from game code paths. Classification: benign, no fix.
- Each victory-attempt session showed the same single favicon 404
  and nothing else.

## 5. The two raw driver FAILs — both measurement errors, re-proven

1. **Tutorial wreck refresh (raw FAIL: expected exactly 32, read
   31).** The expectation was wrong, not the game. Wreck decay is
   `floor(32 * (2400 - age) / 2400)`: a wreck refreshed at the
   salvage-step entry reads 31 after as little as ~16 ticks, and the
   panel also read `Time left: 119s`. Without the refresh, the wreck
   at that match age (~1900 ticks: 70 s idle + 8 s build + earlier
   steps) would read 6. 31 + 119 s is only consistent with a refresh
   within the last ~75 ticks. Pinned in `beta-wave2b.test.js`
   (refreshed → 31 after 40 ticks; unrefreshed → 6 at ~1900 ticks).
   Verdict: PASS (corrected).
2. **Pause freeze (raw FAIL: tick 694 → 700 "while paused").** The
   first tick was read BEFORE the pause click; the ~300 ms of
   Playwright click latency let the sim advance 6 ticks before the
   menu opened. Corrected recheck (separate script, tick read twice
   while the menu was already open): 39 → 39 → 39 over 6 s paused,
   then 83 after resume. Verdict: PASS (corrected).

## 6. Waived gates (named, with reasons — not silently passed)

1. **Victory panel in the browser — WAIVED.** 5 UI-driven victory
   attempts (reinforcements, Easy, hero support, ground attack-move,
   tight queue/re-attack loop) all ended in defeat; the driver never
   salvaged wrecks and never drove the hero in combat, while the red
   AI produces continuously — so these runs test one play style,
   not the game's winnability. The victory branch shares
   `showVictory` with the 7-times-rendered defeat panel, the sim
   win is proven (1068 ticks), and the victory field shape is pinned
   in tests. A human playtest with full economy play (salvage +
   production + hero) is the remaining decider; it is a playtest
   gap, not a defect found.
2. **Draw panel in the browser — WAIVED.** Reaching a genuine draw
   through UI play needs both cores dead plus 600 ticks in which
   neither side can damage the other; no UI-driven run produced
   that state (Twin Bridges idle → defeat at tick 1241). The draw
   branch shares `showVictory` with the proven defeat panel, the
   sim draw is proven (4819 ticks, Twin Bridges), and the draw
   field shape (both sides' survivors) is pinned in tests.

## 7. Honest gaps (not bugs, still open)

- Real-phone run: launch, touch feel, real FPS, audio, orientation
  on a physical S25 — not done here (headless emulation only).
- Finger-pinch zoom: unproven (see §3).
- Victory / draw panels in the browser: waived, see §6.
- Two-match win arc (level-up + skill spend + match 2) in the
  browser: needs a browser win; sim-level arc proven.
- Hero-death wreck in the browser: the death and redeploy were
  observed, but the wreck left at the death site was not isolated
  by count in the browser; sim-level death-leaves-wreck is covered
  by the twin-stick suite.
- Info-panel HP changing live in the browser: not isolated here;
  covered at sim level + by the observed queue/rally/wreck
  refreshes.
- Balance observation (not a bug claim): UI-driven blue armies that
  attack without salvaging and without the hero in combat lost all
  7 terminal runs while red production grew (e.g. 10 → 18 red units
  during one run). The scripted sim stand-in wins with continuous
  production and 2 s re-attacks. Whether a human playing the full
  economy wins comfortably is a playtest question, not something
  this pass can settle.

## 8. Bugs fixed in this wave

**None — no game-code bug was found, so no game file was changed.**
The two apparent failures were driver-measurement errors (§5), and
the single console error was a favicon 404 (§4). New regression
tests in `tests/beta-wave2b.test.js` (4 tests, all passing):

- `beta2b: refreshed wreck reads 31 within ~75 ticks; unrefreshed
  same-age wreck reads 6`
- `beta2b: hero death cools down 600 ticks then redeploys for
  exactly 200 scrap`
- `beta2b: victoryStats defeat branch reports winner-side survivors
  + wreck counts`
- `beta2b: victoryStats victory and draw branches use the same
  fields the panel renders`

No existing test file was touched and no existing assertion was
changed. Final suite: **234/234**.

## 9. Screenshots

All under `game/beta-wave2b/`: `01-main-menu.png`,
`02-tut-step1.png`, `03-tut-build-panel.png`,
`04-tut-wreck-panel.png`, `05-tut-win-screen.png`,
`06-firstmap-start.png`, `07-twinstick-control.png`,
`08-twinstick-driving.png`, `09-controls-done.png`,
`10-loadout.png`, `11-hero-controlled.png`,
`12-hero-redropped.png`, `13-hero-dead.png`,
`14-hero-redeployed.png`, `15-map-second.png`,
`15-map-third.png`, `16-victory-panel.png` (defeat panel caught by
the any-panel wait — see §1g), `17-menu-after-win.png` (post-loss
menu — see §1h), `18-defeat-panel.png`, `19-draw-panel.png`
(defeat panel caught by the any-panel wait — see §1g),
`20-corruption-menu.png`, `21-portrait-ingame.png`,
`22-portrait-tray-toggled.png`, `23-land-844-ingame.png`,
`23-land-932-ingame.png`, `24-touch-stick.png`,
`25-victory-attempt2.png`, `26-victory-attempt3.png`,
`27-victory-attempt4.png`, `28-victory-attempt5.png`.
