# Surface Wars — Prototype 03 Report

Scope: cleanup + remaining controls + red AI economy, in
`~/workspace/surface-wars/` only (game code, tests, docs). No changes
to `sprites/`, `sprites-90/`, `tiles-overlay/`, `assets/animation/`,
or `~/workspace/scrap-dungeon/`. No commit, push, publish, or APK.
Every old test still passes except ONE documented expectation change
(see below). No category silently skipped.

## 1. Cleanup (done first)

- **Stale version line fixed.** The Command Core info panel no longer
  shows "elimination in Prototype 01". The catalog itself was NOT
  edited (so the generated `game/catalog.js` mirror stays in sync);
  instead `view.js` gained `stripVersionRef()`, and the panel runs
  the structure description through it before display. Verified in a
  live screenshot: the panel reads "Role: Faction command structure.
  Losing it is elimination." (`p03-rally.png`). The same pass also
  updated the other player-facing P02-era strings that P03 made false:
  page title/header and the main-menu paragraph now say Prototype 03,
  the main-menu "player-side only" line now describes the red economy,
  and the How to Play panel now says red combat is a demo script but
  red economy matches the player's (plus Guard/Rally/group-button
  entries). The generated `game/catalog.js` header still says version
  "prototype01" — a data-version string, not player-facing text;
  changing it without regenerating the catalog would diverge the
  mirror, so it is left alone and noted here.
- **On-screen group buttons (1–9 + Assign toggle).** Interaction
  chosen: **Assign mode, not long-press** — tap "Assign Group: Off"
  to turn Assign on, tap a number button (1–9) to assign the current
  selection (Assign switches itself off after that one tap), tap the
  number again to recall. Long-press was rejected: it is undiscoverable
  on desktop, timing-sensitive on touch, and conflicts with drag-pan.
  The pure helper `View.groupButtonAction()` carries the logic so it
  is unit-tested; keyboard groups (`Ctrl+1..9` / `1..9`) are unchanged
  and still work. Screenshot `p03-groups.png` shows the row plus the
  feedback "Group 1 assigned (10 selected)" after Select All → Assign
  → 1. A real interaction bug was found and fixed during this pass:
  the first guard banner text was two lines long and overflowed the
  single-line (28 px) banner over the toolbar; the banner is now one
  short line and the full Guard-vs-Hold explanation lives in
  CONTROLS.md.

## 2. Remaining controls

- **Guard order (sim + UI).** `Sim.issueOrder` accepts
  `{kind:'guard', x, y}` or `{kind:'guard', guardTargetId, x, y}`.
  The unit first moves to the point, then holds there, engages enemies
  in weapon range (target acquisition includes guard), and returns to
  the point if displaced after arriving. Guarding a friendly
  unit/structure: the point follows it while alive and freezes at its
  last position if it dies (the UI only offers this for friendly
  targets that are not themselves selected; the sim trusts the order).
  Guard points are shared, not formation-offset — formation offsets
  would give each guard a different point, which is not what Guard
  means. Selected guards draw a yellow ring + dashed line to the point
  (or to the guarded entity's current position); unselected guards
  draw no marker, like paths. **Guard vs Hold:** Hold stops units
  where they stand and never returns after displacement; Guard moves
  TO a point, defends it, and returns. Documented in CONTROLS.md and
  in the How to Play panel. Screenshot `p03-guard.png` shows the Guard
  button active, the one-line banner, and yellow dashed guard lines
  from the selected cluster toward the guard point.
- **Rally point (sim + UI).** `Sim.setRally(state, faction, coreId,
  x, y)` stores a rally on a Command Core only (wrong faction,
  unknown core, non-core structure, or dead core → `{ok:false}`),
  clamped to the map, NOT passability-checked (a ground unit rallied
  into water holds next to the core, like an unreachable move order).
  On spawn, `processProduction` gives a rallied core's unit a move
  order to the rally point instead of idle hold. UI: the core's
  production panel shows the rally coordinates (or "none") and a
  **Set Rally** button; rally mode ends after one tap, and the panel
  signature now includes the rally so the panel refreshes when it
  changes. The rally marker (team-coloured ring + dashed line from
  the core) draws for both factions' cores — a rally point is a
  visible order, not hidden information — but only the player's core
  has a Set Rally button, and the red AI never sets a rally (its
  produced units idle next to its core; tested). Screenshot
  `p03-rally.png` shows the panel ("Rally: (16.0, 25.0) — new units
  move there on spawn"), the feedback "Rally set at (16.0, 25.0)",
  and the blue rally ring + dashed line.

## 3. Red AI economy (the main new mechanic)

Sim-side in `Sim.runAiEconomy`, called from `step()` once per sim
second (every 20 ticks), after production and wreck decay, before the
victory check — so it works in headless tests, not just the browser.
Xandria's combat behaviour is UNCHANGED: the demo attack-move driver
in `game.js` still issues combat orders; this loop only adds
production + salvage decisions on top.

Rules (simple, documented, fair — also in CONTROLS.md):

- **Starting scrap: 500**, same as the player (Prototype 02 gave
  Xandria 0). Same catalog costs/times, same producible filter
  (roster ∩ zero Power AND zero Components — 14 units for Xandria),
  same salvage fraction (0.4) and decay (120 s). NO free scrap, NO
  free units, NO extra vision.
- **Production:** only while its Command Core is alive; only if its
  queue holds fewer than **AI_QUEUE_CAP = 3** items; queue the
  CHEAPEST affordable producible unit whose live + already-queued
  count is below **AI_PER_TYPE_CAP = 3**. Counting queued units too
  makes the per-type cap a real ceiling, not a hint a backlog could
  push past. `queueProduction` re-checks core/producible/affordability,
  so a failed AI attempt can never corrupt scrap or the queue.
- **Salvage:** each idle (Hold order, empty order queue) red unit may
  be sent to at most one wreck, each wreck gets at most one salvager,
  only within **AI_SALVAGE_RANGE = 15 tiles** of that unit, and only
  while the wreck is still worth something (value > 0). Units already
  salvaging, moving, or fighting are never retargeted by this pass.
- **Queue cap:** 3 items, enforced before every queue attempt and
  asserted at every sampled tick in tests.

Interaction with the demo combat driver, stated plainly: the driver
issues attack-move to idle Hold-order red units every 40 ticks, so a
red unit that FINISHES salvaging may be combat-ordered before the next
AI think tick. A unit MID-salvage is never retargeted (its order is
not Hold), so salvage in progress is never interrupted by either loop.

## 4. The one old-test change (explicit, not silent)

`tests/prototype02.test.js`, test "economy: player starts with 500
scrap, xandria with 0" asserted `Sim.scrapOf(s, 'xandria') === 0`.
Prototype 03 requires Xandria to start at 500, so those two cannot
both stand. Resolution chosen: **option (a) — change the sim default
for Xandria to 500 and update that one assertion**, with a comment in
the test marking it as the ONLY Prototype 02 expectation changed in
P03. Option (b) (keep the default at 0 and set 500 only via the
game's `opts.scrap` override) was rejected: it would leave the sim's
default economy asymmetric and make the AI's behaviour depend on the
browser shell passing an option, which is exactly what "sim-side"
must not mean. Full suite passes afterwards (see §6).

## 5. Verification

- **Tests: 80/80 pass, 0 fail** (`node --test` with the explicit file
  list; the directory form still fails on this Node version — a
  runner issue, not a code failure):
  `node --test tests/sim.test.js tests/view.test.js tests/firstmap.test.js tests/catalog.test.js tests/animation.test.js tests/sprites.test.js tests/prototype02.test.js tests/prototype03.test.js`
  New file `tests/prototype03.test.js` (15 tests): guard move-and-hold,
  guard engage-without-chasing + Hold-does-not-return contrast, guard
  return-after-displacement, guard-follows-friendly-unit,
  guard-keeps-last-point-after-target-death, rally set/clamp/reject,
  rally spawn-moves-to-point, no-rally idles, AI spends-and-produces
  with queue cap sampled every 20 ticks, AI scrap conservation
  (scrap + queued costs + spawned costs = 500 exactly; player scrap
  and queue untouched), AI salvages a nearby wreck for the decayed
  value, AI ignores out-of-range wrecks + does nothing without a
  core, AI gets no rally, `stripVersionRef`, `groupButtonAction`
  (assign/recall/empty/keyboard-unchanged).
- **Two test failures during the run were test bugs, not sim bugs,
  and were fixed in the tests:** (1) the guard-dead-target test
  asserted the last point equalled the ward's spawn tile, but
  separation nudges the ward slightly, so the correct assertion is
  that the point is UNCHANGED after death — fixed to record the point
  before killing the ward; (2) the conservation test used
  `Sim.unitDef`, which the sim does not export — fixed to read costs
  from the catalog, as the game shell does.
- **Screenshots (headless Chromium via Playwright, local server,
  viewed by the builder):**
  - `game/p03-groups.png` — Groups row (Assign + 1–9), feedback
    "Group 1 assigned (10 selected)", 10-selected panel. Real clicks.
  - `game/p03-guard.png` — Guard button active, one-line banner,
    yellow dashed guard lines toward the guard point. Real clicks.
  - `game/p03-rally.png` — stale line gone from the info panel,
    rally coordinates + Set Rally button in the build panel, blue
    rally ring + dashed line, "Rally set at (16.0, 25.0)" feedback.
    Real clicks.
  - `game/p03-red-base.png` — east area at tick 577 of a live game
    (6 Iron Eden / 5 Xandria units, 12 wrecks). This is CONTEXT, not
    proof: mid-battle, a newly produced red unit is indistinguishable
    from a scenario survivor, so red production and salvage are
    TEST-verified (above), not screenshot-proven. No staged
    screenshot was made for them.
- **Docs updated to match the game exactly:** `game/CONTROLS.md`
  (now Prototype 03: Guard and Rally sections, AI economy rules and
  caps, on-screen group buttons, corrected Known Limits and
  Still-NOT-IMPLEMENTED lists), the in-game How to Play panel, main
  menu, title, and header.

## 6. Files changed

- `game/sim.js` — guard order (apply + step branch + target
  acquisition), rally (`setRally`, spawn-to-rally), AI economy
  (`runAiEconomy`, constants, exports), Xandria starting scrap 500.
- `game/view.js` — `stripVersionRef`, `groupButtonAction` (pure,
  tested); keyboard groups untouched.
- `game/render.js` — guard markers (selected guards only) and rally
  markers (any core with a rally), display only.
- `game/game.js` — Guard button/mode, guard-target taps, rally mode
  + Set Rally button + panel-signature fix, on-screen group buttons
  + Assign toggle, sanitised structure description, updated header
  comment.
- `game/index.html` — Guard + group buttons, Prototype 03
  title/header/menu text, corrected How to Play (red economy,
  Guard, Rally, group buttons, Not-in-slice list).
- `game/CONTROLS.md` — Prototype 03 revision (above).
- `tests/prototype02.test.js` — the ONE updated assertion (Xandria
  starts at 500), commented as such.
- `tests/prototype03.test.js` — 15 new tests.
- Screenshots: `game/p03-groups.png`, `game/p03-guard.png`,
  `game/p03-rally.png`, `game/p03-red-base.png` (context only, §5).

## 7. Honest gaps (still NOT in this pass, by scope)

- Fog of war, research/tech tree, campaign, save/load, multiplayer,
  structure placement, Power/Components/Supplies, Salvage Clans /
  Directorate, transport, repair, difficulty settings (one AI
  behaviour, documented — no untested tiers).
- Red COMBAT is still the demo attack-move script, not a combat AI
  doctrine. The AI economy does not pick compositions, defend, expand,
  or retreat — cheapest-first + per-type cap only.
- No phone/touch playtest: screenshots are headless desktop Chromium.
  Pinch, long-press-free Assign mode, and the group buttons are
  code-reviewed and mouse-tested only; finger testing is still owed.
- Guard has no "guard this area and chase within a radius" variant —
  it engages only within weapon range of the guard point, like Hold.
  A guard whose weapon cannot reach an attacker standing just outside
  range will not move to engage it.
- Rally is per-core, single point, no rally-to-unit and no per-unit
  rally override. A rallied unit that cannot reach the point (water
  for ground units) holds next to the core.
- The AI's per-type cap counts live + queued units, and scenario
  units count as live: on First Map it starts with 3 Medium Tanks, so
  it will not queue Medium Tanks until it loses some.
- The catalog's Command Core description and the generated
  `game/catalog.js` header still carry "Prototype 01" strings in the
  data files (see §1); only the player-facing display is sanitised.
