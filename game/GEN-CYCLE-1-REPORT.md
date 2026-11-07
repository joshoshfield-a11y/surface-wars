# Generation Cycle 1 — Second Map ("Twin Bridges")

Plain build language only. No religious framing, citations, or
metaphorical source language is used in this report or in the
tracker entry. The workflow supplied the operational order and
gate tests only.

## Step 0 — Inventory (what actually exists, gaps, constraints)

- Exists: `game/maps.js` (First Map builder + `rect`/`blob` tile
  primitives + overlay sets), `game/sim.js` terrain ids
  (GRASS/DIRT/BRIDGE/FOREST/WATER/ROCK) and A* ground pathfinding,
  `game/game.js` map-by-name wiring (`first`/`test`), the
  tiles-overlay base tiles and autotile overlay families, the
  10v10 scenario shape, the full test suite (93 tests before
  this cycle).
- Missing, by name: a second playable map; a menu entry for one.
- Hard constraints (not preferences): no new mechanic may be
  added to make the map work; no new art, units, structures, or
  weapons; no sim, balance, economy, or AI change; no APK build
  and no publishing in this cycle; the overlay rule stands
  (connective features are cosmetic overlays, never baked into
  base tiles); the First Map must stay untouched and selectable.

## Step 1 — Spec sentence (the cycle is judged against this)

"A second 80x50 skirmish map, playable from the main menu
alongside the First Map, with a different terrain problem from
the single-bridge First Map, using only existing units,
economy, and art — no new mechanics."

## Step 2 — Separations

- IN scope: one new map definition, main-menu + pause-menu +
  command-bar wiring, tests, screenshots, tracker/changelog,
  CONTROLS.md map section.
- OUT of scope, explicitly (including things that would be
  liked): no new units, structures, weapons, or art; no sim,
  balance, economy, or AI changes; no campaign, fog of war, or
  multiplayer; no tutorial changes; no APK build (separate step
  on the owner's word); no publishing.
- What may cross each boundary: the new map may reuse existing
  seeds only (tile builders, terrain ids, overlay families,
  scenario shape). Anything needing a new seed or mechanic is
  out — redesign the map instead.
- Focused-piece fence: exactly one map, 80x50, same two
  factions, cores, and economy as the First Map.
- Hard constraint (the one "never"): no new mechanic may be
  added to make this map work.

## Step 3 — Seed proof (one primitive, three variations)

The seed is the existing map builder: `rect`/`blob` terrain
shaping + terrain ids + overlay sets + the 10v10 scenario
shape. Three layout variations were evaluated from it during
design; only one shipped:

- A: full-height river with TWO bridges (rejected — too close
  to the First Map; it doubles the choke instead of changing
  the problem).
- B: central lake with two bridges plus north/south flank
  corridors (KEPT — a genuinely different problem: split
  defence across two crossings while watching the flanks).
- C: north-south divide with a forest corridor and a desert
  flank, no water (rejected — forest only slows ground units
  and blocks line of sight; it never forces a crossing
  decision, so the terrain problem is weaker, not different).

## Step 4 — Governors

- Cycle length: this single cycle, ending at the freeze gate
  below — not when ideas run out.
- Internal beats: inventory → spec → separations → build →
  tests → headless playthrough → screenshots → freeze.
- Feedback rhythm: the test suite plus a headless browser
  playthrough that actually orders a unit across a bridge
  (not opinions about the map).
- End condition: all tests pass, both bridges proven
  passable, a unit ordered across a bridge in the browser,
  screenshots viewed, tracker frozen. If any part failed,
  the step before it would be revisited, not pushed harder.

## Step 5 — Populate (one domain, seeded)

The single domain is the map itself. Every piece answers
"which domain, which seed": lake and bridges from `rect` +
  terrain ids; forest/rock clusters from `blob`; track/road
  lines from the existing overlay families; spawns from the
  First Map's scenario shape mirrored on the same cores.
  No orphan pieces: no new terrain type, no new overlay
  family, no new spawn shape.

## The map: Second Map — Twin Bridges

80x50. Cores unchanged: Iron Eden (6,25), Xandria (73,25),
same 10v10 spawns. A central lake (x=33-47, y=10-39) is
crossed by two bridges — upper (y=16-17) and lower
(y=32-33) — with open land corridors around the lake's
north (y<10) and south (y>39) ends. Bridge approach
corridors (x 28-52, y 13-20 and y 29-36) are kept clear of
forest and rock. Track (west) and road (east) overlay lines
are cosmetic only, including short approach lines to the
upper bridge's west bank and the lower bridge's east bank.

Why this terrain problem: the First Map is a single-choke
fight — hold the bridge, hold the game. Twin Bridges splits
attention: two crossings to attack or defend, plus two
flank routes that punish a player who commits everything
to one bridge. Same units, same economy, different
decisions.

## Step 6 — Stewardship and counterpart

- Names, stable and written: `createSecondMap`,
  `spawnSecondMapScenario`, `secondMapOverlaySets`, map id
  `second`, display name "Second Map — Twin Bridges".
- Maintenance: the new tests in `tests/secondmap.test.js`
  guard the map (lake/bridge geometry, both bridges
  passable, spawns on clear ground, overlay lines on land,
  menu wiring, First Map unchanged).
- Counterpart: the test suite plus a headless playthrough
  (see below) — both pushed back once during this cycle:
  the first playthrough script failed to select a unit
  because zooming back to 1x had recentred the camera, a
  script bug, not a game bug; the script was fixed to
  re-centre via the minimap, and the rerun passed.
  Worked AND guarded: the map was built, and the tests
  plus playthrough guard it.

## Verification

- Tests: **100/100 pass** (93 pre-existing + 7 new in
  `tests/secondmap.test.js`), explicit file list
  `node --test tests/*.test.js`.
- Headless playthrough (Chromium, real clicks): main menu
  → "Play Second Map — Twin Bridges" → status confirmed
  "Second Map — Twin Bridges 80x50" → medium tank at
  (12,25) selected (status "Selected: 1") → move order to
  the upper bridge's east bank (48,16) → 4 seconds later
  the tank was photographed standing ON the upper bridge
  with its dashed path running to the destination ring.
  No page errors.
- Screenshots, viewed: `gen1-secondmap-full.png` (lake,
  both bridges, minimap), `gen1-secondmap-crossing.png`
  (order issued), `gen1-secondmap-crossing-later.png`
  (tank on the bridge, path to destination ring).

## Step 7 — Freeze (baseline locked)

- Baseline: Second Map — Twin Bridges, as shipped in this
  cycle, with tests 100/100 and the playthrough above.
  Judged against the Step 1 spec sentence: second 80x50
  map, main-menu selectable alongside the First Map,
  different terrain problem, existing units/economy/art
  only, no new mechanics — spec met, no exception.
- Changelog: this report + the tracker entry below.
- NOT in this cycle (written into the NEXT cycle's
  inventory, not added now): a third map; a real red
  combat AI; structure placement; any new unit, weapon,
  or art; any APK build (separate step on the owner's
  word); any publishing.
- Religious-term scan of this report and the tracker
  addition: run at freeze; result recorded in the
  tracker entry.

## Honest gaps

- The map has never been played by a human or on a real
  phone; all proof is tests plus headless Chromium.
- Bridge decks render as solid strips (the existing
  bridge_deck overlay behaviour) — functional, not a new
  bridge art treatment.
- The First Map's visual-only ford remains a First Map
  quirk; the Second Map has no ford, visual or otherwise.
- Balance between the two bridges and the flank routes is
  untested against a human opponent; the red side is
  still the demo attack-move script on both maps.
