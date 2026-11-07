# Tutorial Report — Surface Wars (game/ only)

Built in response to the first real-phone feedback (played via the APK):
"Movement controls and stuff don't make sense. Needs a clear tutorial."
The old help text was a wall of text, keyboard-heavy, and the mode
system was genuinely confusing: the active mode persists, a tap means
different things depending on mode and selection, touch drag pans
instead of selecting, building only works via the Command Core, and
salvage only works with units selected plus a wreck tapped. This pass
fixes the teaching, not just the text.

## What shipped

### 1. Interactive tutorial (main deliverable)

- **Entry:** a prominent **Tutorial** button on the main menu, next to
  Play — one tap from the main menu. A second entry, "Start the
  Tutorial", sits at the bottom of the rewritten How to Play panel.
- **Scenario:** the First Map layout (80×50) with the red side HELD.
  A tutorial flag (`state.tutorial`, set only by the Tutorial button)
  gates BOTH the red demo attack-move driver (frame loop in
  `game.js`) and the red AI economy (`sim.js` step gate). The player
  is never attacked while learning. The flag never leaks into normal
  games: Skip / Back to menu / Play a real game clear it, and Reset /
  Restart inside a tutorial restarts the tutorial from step 1 with a
  fresh held-red scenario rather than silently dropping the player
  into a live game.
- **Banner:** while the tutorial runs, a persistent gold banner shows
  the step AND what the next tap will do in plain words, e.g.
  "Tutorial 3 of 7 — Move: Tap open ground to move your selected unit.
  A dashed line shows its path. Next tap: tap open ground to move."
  When no unit is selected on the move/salvage steps, or the core is
  not selected on the build step, the banner adds a dynamic hint
  ("No unit selected — tap a blue unit first." /
  "Tap the pulsing Command Core.").
- **Highlights:** a pulsing yellow ring + centre dot is drawn on the
  thing to tap next (first blue unit, ground point, red target, core,
  wreck). Camera frames each step's point on entry — at 30% of view
  height, not centre (see "Bugs found by verification" below).
- **Skip / Next on every step:** Skip exits to the main menu; Next
  advances without doing the action. No step traps the player.

### Step list and how auto-advance is detected

| # | Step | One-sentence instruction | Advance detected when |
|---|---|---|---|
| 1 | Look around | Drag the ground to pan, or tap Zoom + to zoom in. | Camera moved > 1 tile or zoom changed > 0.02 (pure `tutorialAdvance`, `view.js`) |
| 2 | Select a unit | Tap a blue unit to select it. | ≥ 1 player unit selected |
| 3 | Move | Tap open ground to move your selected unit. A dashed line shows its path. | A move / attack-move order is issued |
| 4 | Attack | Tap the pulsing red target to attack it. It cannot shoot back. | An attack order is issued on the tutorial target |
| 5 | Build | Tap your Command Core, then tap Scout Buggy to build one. | A Scout Buggy exists that did not exist at step start (production completing, not just queueing) |
| 6 | Salvage | Select a unit, then tap the pulsing wreck to collect its scrap. It starts at 32 scrap and shrinks over 120 seconds. | Player scrap rises vs step start (actual collection, not the order) |
| 7 | Win condition | Screen only — never auto-advances. "Win by wiping out every red unit and structure. Lose if your core and all your units are gone." | Buttons: Play a real game / Back to menu |

Tutorial scenario details (all tutorial-only, none in normal games):

- Attack target: a red **salvage_team** at (28,25) — catalog weapons:
  none, so it truly cannot shoot back. Placed at (28,25) deliberately
  OUT of every blue base unit's auto-engage range (see bug 2 below).
- Move-guidance point: open ground at (18,22), near the player's base.
- Tutorial wreck: a sim-shaped wreck record at (18,28) —
  typeId `scout_buggy`, faction `xandria`, baseValue 32 = floor(0.4 ×
  80 scrap), value 32 at start, expires 2400 ticks (120 s) after
  tutorial start. Same fields the sim's own `createWreck` uses.
- Step 7 freezes the sim (tutorial-end flag in `simRunning()`), so the
  win screen is readable, not a live battle behind glass.

### 2. Normal-game clarity (small, high-value)

- The phone top bar now shows the current mode: `Scrap | Blue | Red |
  Tick | Zoom | Move` (short names via `View.modeShort`: Move, Atk-Move,
  Hold, Patrol, Salvage, Guard). Desktop already showed `Mode: <mode>`.
  The mode system is never invisible again. The HUD was otherwise
  untouched.
- The in-game help span under the tray was rewritten to match: mode
  indicator + "New here? Tap Tutorial on the main menu."

### 3. How to Play rewritten

The wall of text is replaced by short, phone-first sections — Goal,
Select, Move, Attack, Build, Salvage, Camera, Groups and Queue — each
1–3 short sentences, tap/drag/pinch first, keyboard only as a
secondary note at the end of the "Not in this slice" section. The
"Not in this slice" list is unchanged and accurate (research, fog,
campaign, multiplayer, structure placement, Power/Components/Supplies,
Salvage Clans/Directorate, transport, repair, difficulty; red combat
is still a demo attack-move script with the same scrap economy).

## Files changed (game/ only)

- `game/view.js` — `TUTORIAL_STEPS` (7 entries), pure
  `tutorialAdvance(stepId, before, now)`, `modeShort(mode)`; all
  exported via `SWView`. No sim code touched here.
- `game/sim.js` — only: `tutorial: false` in `createGame` state, and
  the AI-economy think gated on `!state.tutorial`. No balance, stats,
  damage, or economy numbers changed.
- `game/game.js` — tutorial state machine (`startTutorial`,
  `setupTutorialScenario`, `enterTutorialStep`, `updateTutorialBar`,
  `tutorialHighlight`, `checkTutorialAdvance`, `exitTutorial`,
  order-flag hooks in `orderSelected`, demo-driver gate, tutorial-end
  freeze in `simRunning()`, mode indicator in the phone status line,
  compact info panel during tutorial steps (see bug 1), selection
  clear on entering the salvage step (see bug 3).
- `game/index.html` — Tutorial button (main menu + How to Play),
  tutorial bar (step text + Skip + Next), tutorial-end overlay,
  rewritten How to Play, rewritten in-game help span.
- `game/style.css` — tutorial bar + end overlay styling (44 px
  targets, phone-safe).
- `game/CONTROLS.md` — Tutorial section, phone top-bar mode note,
  main-menu row updated.
- `tests/tutorial.test.js` — new (see Verification).
- Screenshots in `game/` (see below). No art, no `sprites/`,
  `sprites-90/`, `tiles-overlay/`, `assets/animation/`, no
  `~/workspace/scrap-dungeon/`, no commit/push/publish/APK in this
  pass.

## Verification

### Tests: 88/88 pass, 0 fail

`node --test tests/*.test.js` from `~/workspace/surface-wars/` (explicit
file list — the directory form does not resolve in this Node version).
83 pre-existing tests untouched and passing + 5 new in
`tests/tutorial.test.js`:

- 7 steps, each with title, one-sentence instruction (≤ 130 chars),
  and tap hint.
- `tutorialAdvance` per-step cases: each step advances only on its own
  action (incl. look advancing on pan OR zoom, win never advancing,
  unknown step ids rejected).
- `modeShort` names, all ≤ 8 chars for the phone bar.
- Tutorial-flag isolation: a tutorial game run 40 ticks queues nothing
  red and red scrap stays 500; a normal game run 40 ticks queues /
  spends as before (red AI economy intact).

### Headless browser, real taps, 390 px phone + desktop

Headless Chromium, 390×844 touch viewport, driven with real taps
(Playwright touchscreen + button clicks), plus a 1280×800 desktop run.
Every step was advanced by doing the action, not by pressing Next:

1. Main menu → Tutorial → Zoom + / Zoom 1× advanced step 1.
2. Tapped the scout at (10,21) → step 3 (move).
3. Tapped open ground (18,22) → step 4 (attack), dashed path drawn.
4. Tapped the red target (28,25) → step 5 (build).
5. Tapped the Command Core, queued Scout Buggy (scrap 500 → 420),
   waited for the 8 s spawn → step 6 (salvage).
6. Tapped a blue medium tank (12,27), then the wreck (18,28) → scrap
   collected (420 → 446 in the final run; 26, not 32, because the wreck
   had decayed for ~20 s — the step text says "starts at 32", which is
   the honest number) → step 7 win screen.
7. Win screen → Back to menu → Play First Map: normal-game phone
   status reads `Scrap: 500 | Blue: 10 | Red: 10 | Tick: 16 |
   Zoom: 1.00 | Move` — mode indicator present, tutorial flag gone
   (Red: 10, not the tutorial's 11).

Screenshots (all in `game/`, viewed by the builder):

- `tut-menu.png`, `tut-step1-look.png`, `tut-step2-select.png`,
  `tut-step3-move.png`, `tut-step4-attack.png`,
  `tut-step5-build.png`, `tut-step6-salvage.png`,
  `tut-step7-win.png`, `tut-normal-mode.png`,
  `tut-desktop-step1.png`.

### Bugs found by verification (all fixed in this pass)

1. **Info panel ate map taps (real bug, tutorial-exposing).** On a
   phone the full info panel covers ~70% of the short canvas, and the
   step's tap point landed underneath it — taps hit the panel, not the
   map (proven with `elementFromPoint` + a capture-phase pointer
   listener: zero canvas pointer events). Fix, tutorial-only: while a
   step has a map target, the info panel collapses to name + HP +
   Close (wreck panels untouched, so their salvage button and hint
   stay). Normal games keep the full panel. Camera framing also puts
   each step's point at 30% of view height instead of centre, so the
   point clears the panel even before collapsing.
2. **Attack target shot dead before it could be tapped (real bug).**
   First placement (20,25) was inside the blue heavy tank's (range 7)
   and longshot's (range 18) auto-engage envelopes — hold units
   auto-fire on enemies in range, so "held" alone does not protect a
   target. The target died ~tick 30 and the attack tap selected its
   wreck instead. Fix: target moved to (28,25) — 19 from the longshot
   (range 18), 14 from the nearest other blue unit (range 7). Status
   then reads Red: 11 with the target alive until tapped.
3. **Build panel covered the salvage step.** Entering step 6 left the
   core's production panel open over the map. Fix: entering the
   salvage step clears the selection (closing the panel); the banner
   already tells the player to tap a blue unit first.

## Honest gaps — what the tutorial does NOT teach

- Patrol, Guard, groups, queue, rally, and attack-move are NOT taught
  as steps; they are in the rewritten How to Play only (Groups and
  Queue section). Teaching them would bloat the core path past the
  point a first-time phone player stays with it. The core path —
  select, move, attack, build, salvage, win condition — is the whole
  loop a new player needs for a first real game.
- Pan is taught as "drag to pan" in step 1's text, but the verification
  run advanced step 1 with the Zoom buttons (drag-pan was not driven
  in emulation; the pan code path itself is unchanged from the
  mobile-first finish, where touch drag pans by design). A real-phone
  check of drag-pan inside the tutorial is still owed.
- Pinch zoom is mentioned in How to Play but not exercised in the
  tutorial (same standing limit as before: pinch was never
  finger-tested; Zoom buttons are the verified phone zoom route).
- No phone playtest of the tutorial itself yet — all screenshots are
  headless desktop Chromium at phone size. The APK rebuild containing
  this tutorial is a separate step on the user's word.
- The tutorial does not teach that ground units cannot cross water
  (bridge-only crossing is in How to Play's Move section and in the
  map itself, not as a step).
