# Gameplay Completion — Third Map + Difficulty Settings

Plain build language only. Scope: exactly the two features in the
workstream brief, nothing else. No new mechanics, units,
structures, weapons, art, or APK; no push, commit, or publish.
Baseline at start: 159/159 tests pass. Baseline at finish:
194/194 tests pass — 159 baseline + 16 new in this cycle +
19 from the concurrent beta workstream
(`tests/beta-wave1.test.js`, landed while this cycle ran;
it touches none of this cycle's files). This cycle's own
delta is 159 → 175 with zero old-test changes.

## Step 0 — Inventory (what actually exists, gaps, constraints)

- Exists: `game/maps.js` (First Map + Twin Bridges builders,
  `rect`/`blob` primitives, overlay sets), `game/sim.js` terrain
  ids + A* ground pathfinding + the red combat AI with a
  headless-only `state.aiCombatParams` variant seam (combat
  thresholds only, staging batch hardcoded at 3), `game/game.js`
  map-by-name wiring (`first`/`second`/`test`), the 10v10
  scenario shape, the full test suite (159 tests).
- Missing, by name: a third playable map; a menu-selectable
  difficulty setting.
- Hard constraints (not preferences): strict 90° top-down; tile
  overlay rule (linear features cosmetic overlays, never baked
  into bases); no Bible/religious language (faction "Iron Eden"
  excepted); Iron Eden = blue, Xandria = red, starting scrap
  500 both; red AI never cheats and never reads manual-control
  flag / hero state / level / skills / loadout / XP; Cycle 3
  deadlock rule frozen (600 ticks, structural, elimination
  precedence, tutorial excluded, no weapon changes);
  twin-stick guardrails unchanged; hero rules unchanged;
  tests via explicit file list; old-test changes explicit,
  never silent (there are none in this cycle).

## Step 1 — Spec sentences (the cycle is judged against these)

1. "A third 80×50 skirmish map, playable from the main menu
   alongside the First Map and Twin Bridges, with a different
   terrain problem from both, using only existing units,
   economy, and art — no new mechanics."
2. "A menu-selectable difficulty setting (Easy / Normal / Hard,
   Normal = current shipped behaviour exactly) that changes
   ONLY red AI behaviour parameters — same costs, same economy,
   same unit stats, no free resources, no vision changes, no
   stat changes on any difficulty — visible in the UI,
   persisting for the session, and testable per difficulty;
   tutorial games always use Normal behaviour."

## Step 2 — Separations

- IN scope: one new map definition, main-menu + pause-menu +
  command-bar wiring for it, the difficulty param sets + menu
  wiring + staging-batch seam, tests, playthroughs, this
  report, CONTROLS.md sections, AUTONOMOUS-LOOP.md entry.
- OUT of scope, explicitly: research/tech tree, campaign, fog
  of war, multiplayer, Power/Components/Supplies,
  Salvage Clans/Directorate, transport/repair, structure
  placement, blue-side AI, expansion mechs in the catalog,
  any new art, any APK, any publishing.
- What may cross each boundary: the new map may reuse
  existing seeds only (tile builders, terrain ids, overlay
  families, scenario shape); difficulty may reuse the
  existing AI param seam only (plus the staging-batch size,
  which was the one hardcoded staging value). Anything needing
  a new seed or mechanic is out — redesign instead.
- Focused-piece fence: exactly one map, 80×50, same two
  factions, cores, and economy; exactly three difficulty
  levels, behaviour params only.
- Hard constraint (the one "never"): no new mechanic may be
  added to make either feature work, and difficulty may never
  change a cost, a stat, or the economy.

## Step 3 — Seed proof (one primitive, three variations)

The seed is the existing map builder: `rect`/`blob` terrain
shaping + terrain ids + overlay sets + the 10v10 scenario
shape. Three third-map variations were evaluated from it;
only one shipped:

- A: cross-shaped water feature (rejected — an east–west
  water arm on the cores' row would put the cores' row in
  water or force the cores to move, breaking the same-cores
  rule; it is also a third water-choke map, not a different
  problem).
- B: scattered-pond map with no spanning barrier but no
  dominant feature (rejected — ponds alone are too weak a
  terrain problem; a player can ignore them).
- C: dense-forest slow-advance belt with three clear lanes
  plus scattered ponds (KEPT — a genuinely different
  problem: no choke to hold, no bridge to fight over; the
  decisions are lane choice, ambush, and slow vs exposed
  advance. Forest slows ground units per the catalog's own
  movement cost, and rock clusters inside the belt block
  line of sight per the sim's own LOS rule — no new rules).

## The map: Third Map — Forest Belt

80×50. Cores unchanged: Iron Eden (6,25), Xandria (73,25),
same 10v10 spawns. A dense forest belt (x=30–49, y=4–45; 643
forest tiles of 840 belt tiles) is cut by three clear lanes
(y=14–16, y=24–26, y=34–36). Rock clusters sit between lanes
(never on a lane, core, or spawn tile) as LOS blockers and
movement obstacles. Three scattered ponds (5 water tiles each,
15 total, at (18,42), (62,10), (60,40)) are circumventable on
land — there are no bridges on this map at all (0 bridge
tiles), and no water column or row exceeds 5 tiles, so no pond
can read as a barrier. Track (west) and road (east) overlay
lines are cosmetic only, as on the other maps.

Why this terrain problem: the First Map is a single-choke
fight — hold the bridge, hold the game. Twin Bridges splits
attention across two crossings plus flanks. Forest Belt has
no choke: the fight is about which lane to commit to, whether
to pay the forest's slow-movement cost for concealment, and
where rock-blocked sight lines create ambushes. Same units,
same economy, different decisions.

A correction recorded honestly: forest does NOT block line of
sight in this sim — only rock does (`hasLOS` tests ROCK
only). The report and CONTROLS.md therefore credit forest
with slowing ground units only, and credit the belt's rock
clusters with LOS blocking. Any earlier shorthand claiming
"forest blocks LOS" would be wrong about this codebase.

Pond-centre note: the `blob` builder drops a radius-1 arm
whose x+y sum is even, so a pond centre with an odd x+y sum
collapses to a single tile. All three pond centres were
chosen with even sums (60, 72, 100) after the first draft's
(62,9) pond measured as one tile; the shipped ponds are all
5 tiles.

## Difficulty: param sets (the whole feature, in one table)

Keys are exactly the `aiCombatParams` seam keys plus
`stagingBatch` (previously hardcoded at 3 in the staging
branch). No other key exists in any set — proven by test
(the key list must equal the allowed list, so a future cost
or stat key cannot slip in silently).

| Param | Easy | Normal (= shipped) | Hard |
|---|---|---|---|
| defendRange | 20 | 25 | 30 |
| defendCount | 5 | 3 | 2 |
| coreDanger | 10 | 14 | 18 |
| gatherCount | 12 | 8 | 5 |
| attackFloor | 8 | 5 | 3 |
| retreatHp | 0.50 | 0.35 | 0.20 |
| retreatRange | 16 | 12 | 8 |
| modeMinTicks | 200 | 100 | 50 |
| stagingBatch | 5 | 3 | 2 |

Reading: Easy needs more units before attacking, drops out
of attacks sooner, falls damaged units back earlier and from
further away, waits longer between mode changes, and stages
reinforcements in larger batches. Hard is the mirror on
every axis. Normal values equal the shipped
`AI_COMBAT_*` constants one-for-one (proven by test, not
asserted from the table).

UI + persistence: three buttons on the main menu
(`mm-diff-easy` / `mm-diff-normal` / `mm-diff-hard`) plus a
status line (`mm-diff-status`) stating the setting and its
limits; the active button highlights. The setting lives in
session memory only (`difficulty` in game.js) — deliberately
no new persistence store, so it resets to Normal on page
reload (observed in the browser playthrough, see below),
and Settings → Reset to defaults also resets it to Normal.
It applies at the next match start only (`newGame` copies
the set onto the fresh state's `aiCombatParams`); changing
it mid-match never touches the match in progress.
Tutorial games are forced to Normal in `newGame` — and the
sim's tutorial gate holds the red AI anyway, so no tutorial
game ever runs the AI at all (proven by test: with the
setting at Easy and the tutorial flag on, 100 ticks produce
no AI state, no red production, and every red unit still
holding).

## Step 4 — Governors

- Cycle length: this single cycle, ending at the freeze gate
  below — not when ideas run out.
- Internal beats: inventory → spec → separations → build →
  tests → headless difficulty matches → headless browser
  playthrough → screenshots → freeze.
- Feedback rhythm: the test suite plus a headless browser
  playthrough that actually orders a unit across the belt
  down the central lane, and a headless match per difficulty
  showing a behaviour difference with no cheat indicators
  (not opinions about either feature).
- End condition: all tests pass, the belt crossing is proven
  in the browser, the difficulty behaviour gap is proven
  headless, screenshots viewed, tracker frozen. If any part
  failed, the step before it would be revisited, not pushed
  harder.

## Step 5 — Populate (two domains, seeded)

- Map domain: belt and lanes from `rect`, ponds and clusters
  from `blob`, track/road lines from the existing overlay
  families, spawns from the First Map's scenario shape
  mirrored on the same cores. No orphan pieces: no new
  terrain type, no new overlay family, no new spawn shape.
- Difficulty domain: param sets from the existing AI
  constants + the staging-batch seam; menu buttons from the
  existing main-menu button pattern. No orphan pieces: no
  new store, no new AI system, no economy touch.

## Step 6 — Stewardship and counterpart

- Names, stable and written: `createThirdMap`,
  `spawnThirdMapScenario`, `thirdMapOverlaySets`, map id
  `third`, display name "Third Map — Forest Belt";
  `Sim.DIFFICULTY_PARAMS` (`easy` / `normal` / `hard`),
  game.js `difficulty` / `setDifficulty` / `syncDifficultyUI`,
  menu ids `mm-diff-easy` / `mm-diff-normal` /
  `mm-diff-hard` / `mm-diff-status`.
- Maintenance: the new tests in
  `tests/gameplay-thirdmap.test.js` (8 tests) and
  `tests/gameplay-difficulty.test.js` (8 tests) guard both
  features; `scripts/gameplay-difficulty-match.js` is the
  headless per-difficulty match check.
- Counterpart: the test suite plus headless playthroughs
  (see below) — both pushed back once during this cycle:
  the first browser run failed to select the tank because
  zooming to 0.5× recentred the camera (a script bug, not a
  game bug — the same recentre trap Gen Cycle 1 hit with a
  zoom reset); the script was fixed to run at a wide
  viewport at zoom 1× with no zoom step, and the rerun
  passed. The tutorial test's first draft asserted exact
  red-unit positions and failed on separation nudges
  (fractions of a tile between neighbouring held units —
  movement physics, not AI orders); it was corrected to
  assert orders (all hold), not positions.

## Verification

- Tests: **194/194 pass** on the final run (159 baseline +
  16 new here + 19 concurrent beta tests), explicit file
  list `node --test tests/*.test.js`. This cycle's own
  files pass 16/16 standalone.
  Old-test changes: NONE. No old test was edited, and no
  old expectation changed.
- Headless difficulty matches
  (`node scripts/gameplay-difficulty-match.js`, exit 0):
  Easy first attacks at tick 820 with 12 red combat units;
  Normal and Hard first attack at tick 20 with 10. The Easy
  delay is production-sequential (scout, then flak, then
  the mode-change hysteresis wait) — the script asserts
  only that Easy differs, not the exact tick, so
  production-timing drift cannot false-fail it. No-cheat
  indicators all clean in every match: starting scrap
  500/500, blue scrap still 500 at first attack, blue army
  intact (10 units), every unit's max HP and speed equal
  to its catalog values.
- Headless browser playthrough (Chromium via Playwright,
  real mouse clicks, zero page errors): main menu →
  Difficulty: Hard clicked (status line + highlight confirm)
  → Difficulty: Easy clicked (status confirms) → "Play
  Third Map — Forest Belt" → status confirmed "Third Map —
  Forest Belt 80x50" → medium tank at (12,25) selected
  (status "Selected: 1", info panel "Medium Tank, HP
  220/220") → move order to (55,25) → 16 seconds later
  the tank stood east of the belt at its destination, still
  selected, tick advanced 134 → 492, red AI on Easy having
  produced to 12 units meanwhile. Reload → difficulty
  status reads Normal again (session-only behaviour
  observed, not just claimed) → Hard re-selected → First
  Map match started cleanly (status "First Map 80x50",
  tick advancing, no errors).
- Screenshots, viewed (scratch copies in /tmp, not shipped
  as project files — this cycle's file ownership allows no
  new files under game/ beyond the report): `menu.png`
  (third-map button + difficulty buttons, Normal
  highlighted by default), `diff-hard.png` (Hard
  highlighted, status line stating the limits),
  `third-start.png`, `third-crossing.png`,
  `third-crossing-later.png` (tank east of the belt down
  the central lane, forest bands + lanes + rock clusters +
  ponds visible), `diff-hard-match.png`.

## Step 7 — Freeze (baseline locked)

- Baseline: Third Map — Forest Belt + Easy/Normal/Hard
  difficulty, as shipped in this cycle, with tests 194/194
  on the final run (175 from this cycle's own baseline +
  delta) and the playthroughs above. Judged against the Step 1
  spec sentences: third 80×50 map, main-menu selectable
  alongside the First Map and Twin Bridges, different
  terrain problem, existing units/economy/art only, no new
  mechanics — met, no exception. Difficulty: menu-
  selectable, Normal = shipped behaviour exactly, behaviour
  params only, visible in the UI, session-persistent,
  testable per difficulty, tutorial always Normal — met,
  no exception.
- Changelog: this report + the tracker entry below +
  CONTROLS.md sections (Third Map, Difficulty) + the
  in-game How to Play line (difficulty removed from the
  not-implemented list, with its limits stated).
- NOT in this cycle (written into the NEXT cycle's
  inventory, not added now): any further map; any
  difficulty effect beyond red AI behaviour params; any
  persistent difficulty store (a deliberate non-goal this
  cycle — if persistence is ever wanted, it must be
  specified as its own feature, not smuggled into the
  hero record); any APK build (separate step on the
  owner's word); any publishing.

## Honest gaps

- Neither feature has been played by a human or on a real
  phone; all proof is tests plus headless Chromium.
- Browser behaviour-difference evidence for difficulty is
  indirect: the browser proves selection + match start +
  no errors, while the behaviour gap itself (first-attack
  tick, fallback threshold) is proven headless, where the
  AI mode is observable. The browser status bar does not
  show the AI mode, so a screenshot alone cannot show
  Easy-vs-Hard behaviour.
- Balance between the three lanes, the forest's slow cost,
  and the rock sight-lines is untested against a human
  opponent; the red AI's three-squad detour split (±14
  tiles around the target) was designed for two-crossing
  maps and is unchanged here — on Forest Belt it still
  routes squads around the belt's north/south edges
  rather than down separate lanes, which is acceptable
  (it is existing AI behaviour, not a map bug) but means
  lane-by-lane AI attacks are not a thing this cycle.
- Difficulty persistence is session-only by design (see
  above); a player who reloads must re-pick Easy/Hard.
  That is stated in the UI status line ("applies at the
  next match start") and in CONTROLS.md, not hidden.
- Screenshots live in /tmp scratch, not in the repo: this
  cycle's file ownership allowed no new files under
  game/ beyond this report, so the playthrough evidence
  is described here rather than committed as images.
  The parent coordinator may copy them into the project
  if it wants them kept.
