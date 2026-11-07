# Surface Wars — Beta + Bug Hunt, Wave 1 (report-only)

Wave-1 beta child of the autonomous completion loop. No game code, asset,
or APK file was edited in this wave. New files created by this wave:
`tests/beta-wave1.test.js` (19 tests), `tests/beta-wave1b.test.js`
(17 tests), and this report. The browser driver used for the
playthroughs is scratch only (`/tmp/beta-playthrough.py`, Python +
Playwright/Chromium, not a repo file) so the repo gains no unreviewed
harness; screenshots live in `/tmp/beta-wave1/` (ephemeral — every
measurement that matters is also printed in this report).

Baseline re-verified this wave: **211/211 tests pass**
(`node --test tests/*.test.js`). That total is the 159 baseline tests
+ 19 beta-wave1 tests + 17 beta-wave1b tests + 16 gameplay-child tests
(`gameplay-difficulty`, `gameplay-thirdmap`, landed from the sibling
workstream during this wave). No beta file touched any other file, and
no existing test was changed. Nothing was pushed, published, or
committed.

Browser playthrough score: **49/55 checks ok** (driver run 503 s wall,
headless Chromium, desktop + mobile emulation). The 6 non-passing
checks are dissected in §1d — four are driver-sequencing gaps, two are
expected non-applicable measurements, and none is a confirmed game
bug. The one genuinely unproven browser area is the full-match panel
path (§1b): virtual time did not accelerate the page, so the browser
never reached a victory/defeat/draw panel.

## 1. Playthrough results

### 1a. Browser, desktop 1280×800, real input events (mouse/keyboard) — PASS except §1d

- Main menu navigation: PASS (main menu visible on load; pause →
  quit returns to it).
- Tutorial, every step advanced by doing the action (never Next):
  PASS, all 7 steps. Look (Zoom +), Select (tap blue unit), Move (tap
  open ground), Attack (tap the held red target), Build (tap core,
  queue Scout Buggy, scrap 500 → 420, 8 s build completes), Salvage
  (select unit, tap wreck, 32 scrap), Win screen (tutorial-end
  overlay after salvage collection). Then "Play a real game" starts a
  fresh First Map at 9v10, scrap 500.
- Tap fall-through guard probe: TIMING-INCONCLUSIVE, not a failure.
  The probe click landed 0.49 s after the panel appeared — outside
  the 350 ms guard window — so the Scout queued legitimately (scrap
  420). The guard itself (buttons ignore clicks within 350 ms of a
  canvas tap or panel appearance) was proven in the mobile-first
  finish and is covered by the panel-guard code path; this run's
  probe simply did not land inside the window.
- First Map start, hero 9v10, tick advances: PASS (9 blue / 10 red,
  scrap 500, tick advancing across checks to 4936 in the long run).
- Hero toggle off → 10v10 + Drop Back In hidden: PASS (menu status
  line reads "Hero off (original 10v10)"; field 10v10; drop button
  not visible).
- Test Map → 10v10, no hero: PASS (field 10v10, drop button hidden).
- Queue toggle: PASS (status shows "Mode: move (Queue)").
- Group assign/recall: PASS (assign → deselect → recall → Selected: 1).
- Guard mode: PASS (status "Mode: guard" after tapping Guard).
- Hero loadout → drop → drive/fire → release → cooldown → re-drop,
  same HP: PASS. Loadout opens with summary "Level 1 | HP 200 |
  Speed 6 | Vision 8 | Weapons: Twin-Bore Autogun". Drop Back In
  visible, drop lands after the 3 s telegraph in control
  ("controlling", strip "HP: 200 / 200 | Weapon range: 6 tiles").
  Ability button label with nothing equipped reads "No ability
  equipped" (a reason, not a dead button). Release → "Drop ready in
  10s"; after the cooldown the button returns and the re-drop lands
  at the same HP. (HP was 200/200 throughout because the hero took no
  damage; exact-HP preservation across withdrawal is proven at sim
  level in §4, 40 stays 40.)
- Twin-stick desktop: PASS. Take Control via info panel → body
  `controlling`, control strip visible, command tray hidden,
  info/build panels `display:none` (panels cannot cover stick zones).
  WASD W moves the unit north (canvas bytes change, camera follows).
  Mouse aim east + held fire leaves the game still controlling, no
  crash. Esc releases control → unit holds, selection preserved
  ("Selected: 1", no longer controlling).
- Twin-stick structure rule: the driver's structure check failed for
  a driver reason (§1d), but the game rule is proven by code:
  `game.js` adds `#info-take-control` only inside the
  `ent.kind === 'unit'` branch and only for weaponed player units;
  the structure branch renders name/HP/armour/role and never adds
  the button. Structures cannot be controlled, by construction.
- NOT proven in this browser run (driver stopped at the rally step,
  §1d): rally-set feedback text, Zoom − ×10 clamp to 0.40, Zoom 1×
  reset, pause-freezes-sim. Rally mechanics are proven at sim level
  (§4); zoom limits are enforced on every zoom route per CONTROLS.md
  and the 3.0 cap was hit by the CDP pinch (§2); pause-freeze is a
  shell property (the sim loop does not step while the pause menu is
  open). All four need a corrected driver re-run, not a game fix.

### 1b. Browser, virtual-time accelerated matches — DID NOT COMPLETE (method failure, not a game failure)

Virtual time was CDP `Emulation.setVirtualTimePolicy: advance` with a
3,600,000 ms budget and a 240 s wall poll — the game code is
unmodified; only the clock was to run faster. It did not accelerate
this page: after the full budget the game sat at tick 4936 (≈247 sim
seconds, i.e. roughly real-time progress over the 240 s wall window),
mid-match at 6v6, no panel. The page uses a frame-driven loop that
virtual time did not speed up in this harness.

Consequences, stated plainly:
- Full First Map match to a victory/defeat/draw panel **in the
  browser: UNPROVEN**. The match-to-panel path is proven at sim
  level (§1c) and the panel DOM exists (`showVictory`, draw branch),
  but the browser rendering of a victory/defeat/draw panel (title +
  stats) was never displayed in this wave. This must be covered
  before the APK is presented — e.g. a harness that drives the sim
  headlessly to a terminal state and then renders the panel, or a
  real-time browser run long enough for a match to end.
- Progression two-match arc **in the browser: UNPROVEN** (menu XP
  line after a real match, spending a point in loadout, match-2
  ability key, quit-mid-match earns no XP). The module-level arc is
  proven in §4 (win +100, kill XP, level-up, respec, draw XP,
  corruption validation); the shell half (localStorage write at the
  panel, reload survival, reset notice) is unproven.
- Corruption reset **in the browser: UNPROVEN** for the same reason
  (garbage `surfacewars.hero.v1` → reset notice + level 1 was never
  displayed). Record validation itself is proven in §4.
- Hero death → redeploy terms **in the browser: PASS** (this check
  did not need a full match): driving east with D held + mouse aim +
  held fire killed the controlled hero; the drop button then read
  "Drop ready in 30s" (death cooldown), and the sim-level death
  terms (200 scrap after the timer) are proven in §4.

### 1c. Sim-level full matches (node, scripted blue stand-in + real red AI)

These prove the match-to-panel path end to end where the browser
cannot be driven through a whole match in real time without
acceleration:

- First Map, balanced AI: **win for Iron Eden, 1068 ticks (53 sim s)**,
  red left 0, blue left 8, wrecks created 24
  (`node scripts/ai-match.js balanced first`, pre-existing harness).
- Twin Bridges, balanced AI: **draw, 4819 ticks (241 sim s)**,
  2 units left per side, wrecks created 30 — the Cycle 3 draw panel
  path (`node scripts/ai-match.js balanced second`). A draw panel in
  the browser shows both sides' survivors instead of a winner's
  count (code path `showVictory`, draw branch); the browser draw
  panel itself was not reached (§1b).
- Draw rule at sim level, plus tutorial exclusion: covered by
  `beta-wave1.test.js` §15 (air-only/weaponless coreless sides draw
  after the 600-tick grace; a living core anywhere prevents the draw;
  tutorial games never draw).

### 1d. The 6 non-passing browser checks — all diagnosed, none a confirmed game bug

1. `desktop-controls-flow` (rally step): DRIVER sequencing gap. The
   driver tapped Guard (mode = guard), then clicked the core
   expecting the build panel. In Guard mode, tapping a friendly
   structure guards it — documented shipped behaviour (CONTROLS.md:
   "tapping a friendly unit/structure not itself selected in Guard
   mode guards IT") — so no build panel opened and `.rally-btn`
   never existed. The driver never reset mode to Move first. No game
   fix; a re-run must click Move before selecting the core. Side
   effect: the checks after rally in the same block (zoom clamp,
   zoom reset, pause freeze) never ran — see §1a gaps.
2. `twinstick-structure-no-take-control`: DRIVER camera-assumption
   bug. After WASD driving, the camera had followed the controlled
   unit north, so the driver's fixed screen coordinates for the core
   (which assumed camera 0,14) no longer hit the core; the click
   selected a weaponed unit instead, whose info panel legitimately
   carries Take Control. The game rule (structures never get the
   button) is proven by the `game.js` branch structure (§1a).
3. `mobile-emulation-portrait-390x844`: DRIVER sequencing gap. The
   driver tried to click "Continue in portrait" while the main-menu
   overlay still covered the screen, so the overlay intercepted the
   click. The rotate hint itself is proven non-blocking (§2:
   `pointer-events: none`). The dedicated 390×844 portrait layout
   measurements never ran — see §2 gaps.
4. `mobile-layout-landscape-844x390-tray-toggle`: EXPECTED
   NON-APPLICABLE, not a failure. In landscape `#btn-cmd-more` is
   `display: none` by design (the extra row is forced visible);
   Playwright correctly timed out waiting for a hidden button.
5. `mobile-layout-landscape-932x430-tray-toggle`: same as (4).
6. `virtual-full-match-to-panel`: METHOD failure, see §1b. Virtual
   time did not accelerate the page's frame loop.

## 2. Mobile emulation measurements

Viewports measured: 844×390 landscape, 932×430 landscape, plus
post-flip portrait layouts. Every measurement below is
`overflowX = 0`, canvas backing size == stage client size, minimum
visible button height 44 px, zero buttons under 44 px:

| Viewport / state | Canvas == stage | OverflowX | Min btn | Buttons |
|---|:---:|:---:|---:|---:|
| 844×390 in-game | 544×311 == 544×311 | 0 | 44 | 38 |
| 844×390 panel open | 544×311 == 544×311 | 0 | 44 | 40 |
| 844×390 panel closed | 544×311 == 544×311 | 0 | 44 | 38 |
| 844×390 minimap toggled off | minimap `display:none` | 0 | — | — |
| 844×390 flipped to portrait | 390×443 == 390×443 | 0 | 44 | 17 |
| 932×430 in-game | 632×370 == 632×370 | 0 | 44 | 38 |
| 932×430 panel open | 632×370 == 632×370 | 0 | 44 | 40 |
| 932×430 panel closed | 632×370 == 632×370 | 0 | 44 | 38 |
| 932×430 minimap toggled off | minimap `display:none` | 0 | — | — |
| 932×430 flipped to portrait | 430×531 == 430×531 | 0 | 44 | 17 |

Gaps: the dedicated 390×844 portrait run never measured (driver
sequencing, §1d item 3). The flipped-to-portrait rows above are
supporting evidence for portrait layout (no overflow, 44 px floor,
canvas == stage after an orientation flip), not a substitute for a
clean 390×844 portrait run. The landscape tray toggle is not
applicable by design (§1d items 4–5); the portrait tray toggle was
not measured either, for the same driver reason.

Known in advance from code + CSS (verified by reading, not by tapping):
- In landscape `#btn-cmd-more` is `display: none` by design (the extra
  row is forced visible), so a tray-toggle measurement in landscape
  is not applicable — the toggle exists only in portrait.
- The rotate hint pill has `pointer-events: none` (only its dismiss
  button takes events), so it cannot block a map tap by construction
  (also proven in emulation: `pointer-events=none`).
- The minimap's backing store is always 192×120 while its displayed
  size is 132×83 (phone) / 192×120 (landscape) / 160×100 (desktop);
  tap mapping uses `getBoundingClientRect`, i.e. the displayed box,
  so the backing/display mismatch does not misplace minimap taps.

### Pinch/zoom — what emulation can and cannot prove

CDP-synthesized two-point touch drove the pinch handler in
emulation: zoom moved 1.0 → 3.0 (the cap). That proves the handler
responds to touch events. It does NOT prove finger pinch on a real
phone. **Finger pinch on a real phone is NOT proven by this wave.**
The Zoom buttons are the verified phone route (CONTROLS.md). Do not
claim pinch works until a real-phone playtest.

## 3. Bug list (wave 1)

### BUG-LOW-1 — Hero voluntary-cooldown sentinel collides with tick 0 (latent, real play unreachable)
- Repro: set a hero's `withdrawTick` to 0 (withdraw at tick 0) and call
  `canDrop` — the `withdrawTick > 0` gate treats it as "never
  withdrawn", so the hero drops immediately with no 10 s cooldown.
  Found because the first draft of the beta withdraw test withdrew at
  tick 0 and the cooldown assertion failed.
- Why it is latent, not a gameplay bug: a real hero cannot withdraw at
  tick 0 — the drop telegraph alone is 40 ticks, and release only
  happens after landing, so the earliest real withdrawal is tick ≥ 41.
  A match restart also resets the hero object. No player-visible
  effect was found.
- Severity: Low. Proposed fix: `game/hero.js`, `canDrop` — replace the
  `withdrawTick > 0` sentinel with an explicit flag (e.g. initialise
  `withdrawTick` to -1 in `startMatch` and test `>= 0`), plus a
  regression test withdrawing at tick 0. The beta test works around
  it by withdrawing at tick 500 and is marked as such in a comment.

### BUG-LOW-2 — Info/wreck panels go stale while open (HP, wreck value, time left)
- Repro (code-read, not yet browser-proven): open a unit's info panel,
  let that unit take damage in a fight, and watch the panel — its
  "HP: X / max" does not change. Same for a wreck panel's "Salvage
  value now" and "Time left" while the wreck decays.
- Root cause: `game/game.js`, `updatePanels` rebuilds panels only when
  its signature changes, and the signature covers selection, wreck id,
  scrap, production-queue `remainingTicks`, mode, rally, control state,
  and tutorial state — but not the selected entity's HP, nor the
  wreck's current value / expiry tick. The build panel's queue
  progress stays live precisely because `remainingTicks` IS in the
  signature. The status bar, drop-button labels, and ability button
  all refresh every frame, so the panels are the outlier.
- Severity: Low (cosmetic; canvas HP bars and the status bar stay
  live, and any scrap/queue/mode change refreshes the panel). But the
  wreck case is the sharper one: a player deciding whether a wreck is
  still worth walking to reads a frozen value.
- Proposed fix: `game/game.js`, `updatePanels` — add the selected
  entity's HP (and, for wrecks, `value` + `expiresTick`) to the
  signature, or bucket a panel refresh every 20 ticks. Regression
  test at shell level is browser-only; a sim-level test cannot reach
  `updatePanels` (it is closure state in `game.js`).

### Observation OBS-1 — Core-death queue refund is deferred, not instant (not filed as a bug)
- `game/sim.js`, `processProduction`: when the Command Core dies
  mid-queue, the refund fires only when the head item's timer expires
  and the core lookup fails — not in the tick the core dies. The
  full backlog IS refunded (proven in §4), but the scrap is
  unavailable for up to the head item's remaining build time.
  CONTROLS.md says "whole queue refunded" without specifying timing,
  so this is a wave-2 decision (instant refund vs deferred), not a
  spec violation. Flagged so it is conscious, not an oversight.

### No other bugs found in wave 1
The following were investigated and cleared (evidence in §4):
tap fall-through guard, panels covering stick zones, tray/minimap
toggles, orientation changes, group buttons, queue toggle, guard/rally
orders, hero toggle off, Test Map hero exclusion, tutorial hold, red
AI isolation from manual/hero state, production cancel/full refund,
salvage decay and collection, patrol loops, formation offsets, hero
auto-collect, hero kill-XP attribution, field repair / shockwave /
rally / overdrive effects, AI defend/attack/fall-back/last-stand
transitions, AI economy caps. Anything in §7 marked unproven is a
gap, not a clearance.

## 4. Cleared items (evidence)

Sim-level, `tests/beta-wave1.test.js` (19/19 pass):

- Tutorial hold — 2000 tutorial ticks: red scrap stays 500, red queue
  stays empty, no red order kind changes, no winner declared.
- Red AI never reads manual state — deterministic twin runs (First
  Map, 60 ticks): red orders, positions, HP, economy, and AI mode are
  identical with a blue unit under manual control vs not. Plus a
  source check: `runAiEconomy`/`runAiCombat` in `game/sim.js` contain
  no `.manual` or `isHero` reference.
- Red AI never reads hero state — same twin-run design with the
  `isHero` flag flipped on a blue lancer: identical red behaviour.
  (The AI does see blue units as ordinary visible targets — that is
  no-fog information, not hidden-state reading.)
- Hero roster — `Hero.applyRoster` removes exactly the west lancer:
  10 → 9 blue field units, red untouched at 10.
- Hero withdraw — exact HP kept (40 stays 40), no wreck, no scrap
  moved, unit absent from field lists; voluntary redeploy free after
  200 ticks, blocked before.
- Hero death terms — 600-tick cooldown, then 200 scrap; with <200
  scrap after the timer the binding reason is scrap (the timer does
  not reset, the debt does not grow); dead core blocks; no drop tile
  blocks; telegraph cancel returns a dead hero to `dead`, never to
  reserve.
- Hero wreck value — 152 scrap (40% of 380) via a real sim kill.
- Guard — unit travels to the point, holds, and returns after
  displacement; guard-target point follows a moving friendly unit.
- Rally — produced unit moves to the rally point on spawn; rally
  clamps to the map.
- Queue toggle — Shift and Queue button both append; an unappended
  order replaces and clears the queue (`View.queueAppend` + sim).
- Group buttons — assign stores a copy and switches off after one
  tap; recall returns a copy; unassigned group recalls empty.
- Twin-stick cone — live fire: 29° aim fires, 31° aim fires nothing;
  cone constant is 30° (`MANUAL_AIM_CONE_DEG`).
- Progression two-match arc — win (+100) + hero kill XP (+30) = 130 XP
  → level 2, 1 point; Dash bought at gate 2; JSON round-trip
  re-validates; loss (+25) → 155 XP, still level 2, wins unchanged;
  free respec returns the point, clears skills + ability, XP untouched.
- Draw XP — draw bonus is 0, kill/salvage XP still count, wins
  unchanged, matches played +1.
- Corruption — null, non-object, wrong schema, level/XP mismatch,
  negative XP, unknown skill, non-boolean `heroEnabled` all fail
  `validateRecord`; the default record validates; skill gates
  enforced (Dash needs level 2, Salvage Sense level 3).
- Skills — Dash sets a cooldown, immediate reuse refused, usable again
  after the 8 s cooldown; seed set is exactly 8 skills (5 active
  sharing the single ability slot).
- Deadlock — air-only coreless sides deadlock and draw after the
  600-tick grace; a living core prevents the draw; tutorial games
  never draw.
- Hero-off / Test Map shape — a `heroEnabled: false` record validates;
  the Test Map scenario opens 10v10 with its lancer present (nothing
  removed), which is the module-level half of the exclusion; the
  shell half (Drop Back In hidden) is proven in §1a.

Sim-level, `tests/beta-wave1b.test.js` (17/17 pass):

- Production cancel refunds the full cost, including the in-progress
  item (scrap 500 → 200 on queue → 500 on cancel).
- Core death refunds the whole queued backlog (scrap back to 500,
  queue empty) once the head item's timer expires — see OBS-1 for
  the deferred timing.
- Red AI economy obeys the same caps as the player: queue ≤ 3,
  per-type live + queued ≤ 3, scrap never negative (400 ticks, First
  Map).
- Wreck value decays linearly: scout wreck 32 → 16 at exactly half
  life (1200 ticks), gone at 2400 ticks.
- Salvage collection pays the current decayed value (not the base
  value) and removes the wreck.
- Patrol loops A → B → A: the order never completes into hold, the
  unit stays out on its loop.
- Formation move gives 4 distinct destinations centred on the target.
- Hero auto-collect: a manually controlled hero within 1.5 tiles of
  a wreck collects it (decayed scrap + 10 hero XP, 1 salvage); an
  army manual unit in the same position does not collect.
- Hero kill-XP attribution: hero killing blow on a scout (cost 80)
  grants 10 XP (floor 8, raised by the 10 minimum); hero destroying
  a 0-cost Command Core grants 0, never the minimum.
- Field repair restores 60 HP capped at max HP, then cools down 30 s.
- Shockwave slam damages enemy units within 2 tiles, never
  structures, never units outside the radius.
- Rally signal boosts allies within 8 tiles only (enemies and distant
  allies untouched), 30 s cooldown.
- Overdrive sets its 5 s window and 20 s cooldown; passive skill ids
  and unknown skill ids are refused by `activateSkill`.
- AI defend: 3+ blue units within 25 tiles of the red core switch the
  AI to defend.
- AI attack: with 10 combat units the AI leaves gather for attack at
  the first thinks and issues attack-move orders.
- AI fall-back: a sub-35% HP red unit with a near enemy, >8 tiles
  from its core, guards the core ring and is flagged `aiFellBack`.
- AI last stand: core dead after an earlier think sends survivors
  attacking; a game that never had a core keeps the AI inert.

Methodology notes from batch 2 (kept so the tests are not misread):
- Early drafts of the wreck/salvage/hero-collect tests failed
  because killing the only unit of a faction eliminates that faction
  and `step()` then early-returns on the winner, freezing decay and
  collection. That is correct sim behaviour, not a bug; the tests
  now carry keep-alive extras (a far-away core, an unarmed drone).
- Radius skills (`shockwave_slam`, `rally_signal`) read the spatial
  grid, which is empty on a fresh game; calling them between steps
  without a prior step (or `rebuildGrid`) finds nothing. Also
  correct behaviour — in real play the grid is fresh from the last
  step — and the tests now step/rebuild first.

Browser-level clearances: §1a (desktop flows, hero flow, twin-stick
desktop), §1b hero-death terms, §2 (landscape emulation, minimap
toggle, orientation flips, rotate-hint non-blocking, CDP pinch
response).

## 5. Stress (SANDBOX numbers only — never phone FPS)

`node scripts/stress.js` (pre-existing harness: 64×40 all-grass,
medium tanks attack-moving at each other, 300 ticks each):

| Units | Avg ms/tick | p95 ms/tick | Max ms/tick | Alive at end | Projectiles |
|------:|------------:|------------:|------------:|-------------:|------------:|
| 100 | 1.649 | 4.800 | 61.467 | 65 | 11 |
| 300 | 2.996 | 5.303 | 65.885 | 205 | 28 |
| 500 | 5.306 | 41.881 | 85.060 | 342 | 49 |

Read honestly: averages scale roughly linearly and stay far under the
50 ms tick budget (20 ticks/s) on this sandbox; p95/max spikes at 500
units (41.9/85.1 ms) show combat-heavy ticks can exceed one tick's
budget in bursts. These are sandbox CPU numbers with no rendering
load comparable to a phone GPU and no thermal throttling — they say
nothing about S25 frame rate. Sustained-fire phone performance under a
full battle remains unmeasured (see §7).

## 6. Waived gates (named, with reasons — no silent waivers)

- Real-phone playtest (all touch ergonomics, finger pinch, S25 frame
  rate, install/update persistence): WAIVED for wave 1 — sandbox has
  no phone; this is a user-side step for wave 2 / packaging. Nothing
  in this report claims phone behaviour.
- Browser full-match victory/defeat/draw panels: NOT waived — left
  UNPROVEN (§1b). The real-time waiver originally planned (replace
  with virtual time) did not work: virtual time failed to accelerate
  this page, so neither the real-time nor the virtual-time route
  reached a panel. This must be covered before the APK is presented.
- Audio: not applicable — the game has no audio and no sound toggle
  by design.
- Difficulty settings: not covered by this wave's browser run — the
  gameplay child's difficulty work (8 tests in
  `tests/gameplay-difficulty.test.js`) landed after the browser run.
  Its sim-level tests pass in the 211 total; its menu behaviour was
  not driven in a browser here.

## 7. Honest gaps (everything phone-unverifiable from the sandbox)

- Every phone-only claim: finger pinch zoom, thumb ergonomics of the
  stick zones, 44 px feel under real thumbs, landscape side-panel
  reachability, S25 FPS under a full battle with sustained twin-stick
  fire, and APK WebView DOM-storage persistence of
  `surfacewars.hero.v1` across an update install.
- Browser panel rendering (victory/defeat/draw title + stats DOM):
  UNPROVEN (§1b). Sim-level match-to-panel path proven (§1c); the
  browser panel itself was never displayed this wave.
- Browser progression shell half: UNPROVEN (§1b) — menu XP line after
  a real match, spending a point in loadout, match-2 ability key,
  quit-mid-match earns no XP, corruption reset notice. Module-level
  progression proven (§4).
- Browser rally-set feedback, Zoom − ×10 clamp to 0.40, Zoom 1×
  reset, pause-freezes-sim: UNPROVEN — the driver stopped at the
  rally step (§1d item 1). Rally mechanics proven at sim level;
  zoom caps are code-enforced and the 3.0 cap was hit by CDP pinch;
  pause-freeze is a shell property. All four need a corrected driver
  re-run (reset mode to Move before selecting the core).
- Dedicated 390×844 portrait layout run: UNPROVEN — the driver tried
  to dismiss the rotate hint under the main-menu overlay (§1d item
  3). Flipped-to-portrait measurements (§2) are supporting evidence
  only. The portrait tray toggle is likewise unmeasured.
- Panel staleness (BUG-LOW-2) is code-read, not browser-reproduced;
  wave 2 should reproduce it in-browser before fixing, or fix on the
  strength of the signature analysis and re-verify.
- The tutorial salvage step has a real time pressure the sandbox run
  did not stress: the tutorial wreck decays over 120 s, so a slow
  player who takes over 2 minutes to reach the salvage step finds the
  wreck expired and the step uncompletable by doing (Next still
  rescues them — no trap — but the by-doing path breaks). Worth a
  wave-2 decision: refresh the tutorial wreck's timer on entering the
  salvage step, or leave it as a soft time challenge. Not filed as a
  bug in wave 1 because Next exists and the step is completable that
  way; flagged here so it is a conscious decision, not an oversight.
- Twin-stick phone landscape (touch sticks, 844×390): the task asked
  for a phone-landscape twin-stick playthrough; the sandbox ran
  twin-stick on desktop (WASD + mouse) and mobile emulation for
  layout only. Touch-stick driving on an emulated phone viewport was
  not exercised — the stick zones are code-defined (left 40% /
  right 40% of canvas width, bottom 60% of height, middle 20%
  stick-free) and the desktop path proves the control machinery, but
  two-thumb touch driving remains a real-phone item.
