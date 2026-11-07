# Generation Cycle 2 — Real red combat AI

## Step 0 — Inventory (what this cycle builds on)

Frozen baseline from Generation Cycle 1: Prototype 03 + mobile-first +
tutorial + landscape-first + marketing Loop 1 title fix + Second Map
"Twin Bridges" (80×50, two bridges, flank corridors). The red side at
that baseline had a real economy (Prototype 03: same 500 starting scrap,
same costs, queue cap 3, per-type cap 3, salvage 40% / 120 s decay,
range 15 tiles, think every 20 ticks) and a browser attack-move
driver that issued attack-move to every idle red unit every 40 ticks.
That driver was the game's weakest system, and the reason this cycle
exists. No new units, structures, weapons, or art existed to draw on
beyond the catalog and the two maps.

## Step 1 — Specify (one testable sentence)

"The red side fights with a real combat AI — defending its core,
grouping units before attacking, choosing targets, and retreating
damaged units — using the same scrap economy, costs, and rules as
the player, with no free units, no free scrap, and no information
the player could not see in this no-fog game — on both the First
Map and Twin Bridges."

Judged against this sentence at freeze: defend, gather, attack,
fall-back, target choice, same economy, no cheating, both maps —
all present and tested. The one qualification is in Step 6: on Twin
Bridges, headless matches against the scripted stand-in stall in
an air-only endgame. That stall is a weapon target-class deadlock,
not an AI decision stall, and it is reported as a failed sub-case
rather than hidden (see "Honest gaps").

## Step 2 — Separate (in / out, with a boundary)

IN: a red combat decision layer in `game/sim.js` (squad/state
behaviour for existing units only); the removal of the old browser
driver from `game/game.js`; tests; headless match evaluation;
updated player-facing text; `CONTROLS.md` + tracker/changelog.

OUT (explicit, including liked items): no new units, structures,
weapons, or art; no economy/balance changes (red production and
salvage rules stay exactly as they are); no fog of war; no
difficulty settings (one AI behaviour, not three); no blue-side AI
(player side unchanged); no campaign/multiplayer; no tutorial
changes except correcting any line that says red is a demo script
(no tutorial line needed changing beyond the shared menu/help text
— the tutorial holds the red side via the existing tutorial flag,
unchanged); no APK build; no publishing.

FOCUSED-PIECE FENCE: exactly one system — red combat decisions.

HARD CONSTRAINT: the AI may not cheat to win — no free scrap/units,
no vision beyond the no-fog world, no stat changes, no direct
manipulation of player units. If a behaviour needs a cheat to work,
redesign the behaviour. This constraint held: the AI reads only
positions, HP, and terrain, all visible to both sides.

## Step 3 — Seed (reusable primitive, 3 variations proven)

The seed is one squad state machine in `sim.js`, `runAiCombat`,
reused across unit types and both maps: **defend / gather / attack
/ fall-back**, with target selection by range/threat/value.

- **Defend:** 3+ blue units within 25 tiles of the red core, or the
  nearest blue unit within 14 tiles → combat units guard a ring
  (radius 6) around the core. Entering defend is immediate.
- **Gather:** fewer than 8 combat units → units guard a staging
  ring toward the enemy (6 tiles from the core, toward the blue
  core, radius 3) instead of trickling out one by one.
- **Attack:** needs 8 combat units to enter, only drops out below
  5; attack↔gather changes wait 100 ticks (hysteresis), except
  entering defend. Squads attack-move to a chosen target — the blue
  Command Core while it lives, else the weakest blue structure,
  else the centroid of blue units — split three ways: squad 0
  direct, squad 1 via a point 14 tiles north of the target, squad 2
  via 14 tiles south, so a two-crossing map is not attacked down
  one bridge only, with the target queued as the second leg for
  detoured squads. Every destination is snapped to the nearest
  passable tile for that unit's movement class, and routes use the
  existing A* pathfinding — a ground unit is never ordered into
  water, and no new path system was added. Individual firing
  targets remain the sim's existing `acquireTarget` (nearest
  hittable in range), unchanged.
- **Fall-back:** a combat unit below 35% HP with an enemy within 12
  tiles, and more than 8 tiles from its core, is sent to guard the
  core ring and is never sent attacking again (there is no repair
  in this slice, so a damaged unit that re-attacked would just
  fall back again); it stays a core defender. Weaponless units
  (salvage teams, sensor and decoy drones) are never given combat
  orders.
- **Reinforcement batching:** a unit that spawns during an attack
  does not go out alone — it guards a staging ring near the core
  until 3 staged units are ready, then the batch attacks together.
- **Last stand:** the economy stops when the core dies (that rule
  is unchanged), but combat does not switch off — survivors attack
  the chosen blue target, fallen-back units included, since there
  is no core left to defend. Gated: this branch only activates if a
  core was present at an earlier AI think (`state.aiHadCore`), so a
  game that never had a core keeps the old behaviour of the AI
  doing nothing. That gate exists because three pre-existing tests
  (weapon range, weapon LOS, salvage) use core-less unit setups and
  broke when the last-stand branch first fired in them; the fix was
  in the sim, not in the tests — no old test expectation was changed
  in this cycle.
- Other rules: thinks once per 20 ticks (1 sim second), after the
  economy, never in a tutorial game (`state.tutorial` gates both
  economy and combat, as before); never touches the iron_eden
  queue, scrap, or units; never interrupts a salvage in progress,
  and never reassigns a unit mid-chain (a unit with a queued order
  finishes its chain); in attack mode it only reassigns on a mode
  change, for idle (hold) units such as fresh spawns, or for units
  sitting at a dead destination with no enemy within 20 tiles —
  reissuing every think tick would reset paths and look like a
  trickle.

Constants (`sim.js`, exported for tests): `AI_COMBAT_DEFEND_RANGE
= 25`, `AI_COMBAT_DEFEND_COUNT = 3`, `AI_COMBAT_CORE_DANGER = 14`,
`AI_COMBAT_GATHER_COUNT = 8`, `AI_COMBAT_ATTACK_FLOOR = 5`,
`AI_COMBAT_RETREAT_HP = 0.35`, `AI_COMBAT_RETREAT_RANGE = 12`,
`AI_COMBAT_MODE_MIN_TICKS = 100`. Initial mode state is
`{ mode: 'gather', modeSince: -AI_COMBAT_MODE_MIN_TICKS }`, so the
first mode decision is not delayed 100 ticks for no reason; the
wait applies after a mode has actually been held.

Variant seam: `state.aiCombatParams` overrides the constants for
one game, used ONLY by the headless match harness and tests. The
browser never sets it, so shipped games always run the defaults.

### Variations evaluated (headless matches, `scripts/ai-match.js`)

| Variant | Parameters | First Map | Twin Bridges |
|---|---|---|---|
| Balanced (kept, shipped defaults) | 8 / 5, defend 25 / 3 / 14 | iron_eden wins, 53 s, red 0 left, blue 8 left, first attack tick 20, max attackers 10 | STALLED at 750 s cap, 2 vs 2 left, AI in attack 14,161 of 15,000 ticks |
| Rush | gather 2, attack floor 2, defend never (count 99) | iron_eden wins, 52 s, red 0 left, blue 8 left, first attack tick 20, max attackers 10 | STALLED at 750 s cap, 2 vs 2 left, identical end state to balanced |
| Turtle | gather 14, attack floor 10, defend 35 / 1 | xandria wins, 121 s, first attack tick 1020, max attackers 3, red 4 left, blue 0 left | STALLED at 750 s cap, 3 vs 1 left, first attack tick 1700 |

Kept: **balanced**. Reasons: rush is indistinguishable from
balanced in outcomes — the starting force is already 10 units, so
both attack at tick 20 either way, and defend-never only changes
the mode mix, not the result. Turtle beats the stand-in on the
First Map only because the stand-in trickles its units into red
defences without salvaging or hunting — a stand-in artifact, not
evidence turtle is good or beatable against a human — and turtle
still stalls on Twin Bridges, attacking first at tick 1700.
Balanced is the only variant that attacks promptly, groups its
full force (max attackers 10), defends measurably (449 of 1,068
ticks in defend on the First Map), and loses to the stand-in on
the First Map — the beatable evidence the end condition asks for.
Its Twin Bridges stall is shared by all three variants and is not
a variant behaviour (see Step 6).

## Step 4 — Govern (cycle length, beats, end condition)

One cycle, one system, no new mechanics. Beats: read the frozen
baseline and the driver → implement the state machine → unit tests
→ match harness with three variations → diagnose the Twin Bridges
stall (last-stand fix, then weapon-deadlock diagnosis) → browser
screenshots → report + tracker. Written end condition: the AI
defends, groups, attacks, and falls back on both maps; no cheating
(scrap conservation and no free spawns hold); it is beatable
(loses a First Map match to the stand-in) and does not stall games
by its own decisions. The end condition is met with one recorded
exception: the Twin Bridges stand-in matches stall in an air-only
endgame for a reason outside the AI (Step 6). Shipping with that
exception recorded, rather than inventing a victory rule to hide
it, is the honest freeze.

## Step 5 — Populate

Changed files, `game/` + tests + tracker only:

- `game/sim.js` — `runAiCombat` (state machine, staging batch,
  last stand, variant seam), constants, old browser-driver
  references removed from sim comments. `runAiEconomy` untouched.
- `game/game.js` — the periodic attack-move driver (`demoTick` /
  `demoTarget` block in the frame loop) removed; the frame loop now
  only calls `Sim.step(state)`, and red combat + economy both run
  inside `Sim.step`. Header/tutorial comments updated to say the
  sim AI (economy + combat) is gated on `state.tutorial`.
- `game/maps.js` — header line about "the demo opponent" updated
  to say the red AI (economy + combat) lives in `sim.js`.
- `game/index.html` — main-menu line now reads: "The red side
  fights with a real combat AI (defends its core, groups up before
  attacking, falls damaged units back) and runs the same scrap
  economy as you — no free units, no free scrap." How to Play "Not
  in this slice" paragraph rewritten the same way.
- `game/CONTROLS.md` — five places updated: the opening "You play
  Iron Eden" paragraph; the Tutorial paragraph; the Red AI economy
  section (combat sentence rewritten, old 40-tick driver note
  removed); a new Red AI combat section (defend/gather/attack/
  fall-back, reinforcement batching, last stand, the known air
  endgame limit); the Known limits section; the Still NOT
  IMPLEMENTED list (red combat AI entry removed, difficulty
  settings kept as one documented behaviour, no untested tiers).
- `marketing/listing-draft.md` — the two lines that still said red
  combat is a demo attack-move script (lines 29 and 43 in the Loop
  1 draft) corrected to describe the real combat AI. The draft is
  staged, not published, so this is a correctness fix to a draft.
- `tests/redcombat.test.js` — 10 tests (see Step 6).
- `scripts/ai-match.js` — headless match harness (new).
- `game/gen2-match-first.png`, `game/gen2-match-second.png` —
  browser screenshots of matches in progress (see Step 6).

No art changes. No `~/workspace/scrap-dungeon/`. Nothing committed,
pushed, published, or packaged as an APK.

Player-facing text audit: after the edits, a grep for "demo" in
`game/CONTROLS.md` and `game/index.html` returns no combat-driver
references (only unrelated "demonstrable"/"demo" uses remain in the
marketing listing draft, where "demo" means the free taster).

## Step 6 — Steward (counterpart: test suite + headless matches)

### Tests: 110/110 pass

`node --test tests/*.test.js` — 110 pass, 0 fail (100 pre-existing
+ 10 new in `tests/redcombat.test.js`):

1. Fewer than 8 combat units gather (guard staging), they do not
   trickle out.
2. 8+ combat units attack the blue core, in squads (at least one
   squad direct to the core area; at least two detoured squads
   queuing the core as the second leg).
3. A threatened core switches to defend immediately; units guard
   the core ring (guard points within 9 tiles of the core).
4. A damaged unit (30% HP) with an enemy near falls back to the
   core and stays a defender (`aiFellBack` true, guard order, still
   guard on the next think).
5. Combat never interrupts a salvage in progress or a queued chain.
6. No cheating — direct `runAiCombat` calls change no scrap, spawn
   no units, touch no blue unit (blue positions/orders unchanged,
   player scrap still 500).
7. On Twin Bridges, attack orders never send a ground unit into
   water (path tiles never WATER or ROCK for ground units; order
   destinations passable for ground units) — run via
   `Maps.createSecondMap()` + `spawnSecondMapScenario`, stepping
   20 ticks to the first AI think.
8. Tutorial games hold the red side — no combat orders at all
   (`state.tutorial = true`, 200 ticks, all red combat units still
   `'hold'`, `state.aiCombat` undefined).
9. Reinforcements spawned mid-attack stage in a batch of 3, they
   do not trickle (first and second staged as guard, third
   releases all three to attackMove together).
10. After its core dies, the AI keeps fighting (last stand) instead
    of freezing (mode attack, units attackMove, target is the blue
    core).

One old-test change, made in the earlier part of this cycle and
stated here explicitly (Prototype 03 style): in
`tests/prototype03.test.js`, the test "ai: salvages a nearby wreck
for the decayed value" previously asserted the salvager's order is
`'hold'` after collecting. That expectation was changed to assert
the salvager's order is NOT `'salvage'` after collecting, because
after collecting, the salvager is no longer left idle — the combat
AI assigns it a gather/defend guard order. What the test guards is
that it is no longer salvaging, not that it idles forever. **No
old test expectation was changed in the completion phase of this
cycle** — the three failures found there (weapon range, weapon
LOS, salvage) were fixed in `sim.js` via the `aiHadCore` gate, not
by editing the tests.

Scrap conservation: `runAiEconomy` was not touched in this cycle,
and the Prototype 03 conservation tests (scrap + queued + spawned
= starting scrap, player side untouched) still pass. Match end
scrap remainders (balanced First 202, balanced Second 336, rush
First 15, turtle First 1,998, turtle Second 2,348) are remainders
after production and salvage, not a conservation proof on their
own — the proof is the unchanged economy code plus its tests.

### Headless matches (stand-in limitation, stated plainly)

Opponent: the old blue attack-move behaviour as stand-in (idle
blue units attack-move to the red core every 40 ticks) plus a
mirrored blue economy (cheapest affordable, queue cap 3, per-type
cap 3, same rules as the red economy, written in the harness
because `runAiEconomy` is xandria-only). The blue stand-in does
NOT salvage, so red has a small edge in these matches; they compare
AI behaviours against each other, they are not a balance verdict
against a human. Results are in the Step 3 table. Full logs:
`/tmp/matches.jsonl` is ephemeral; the table above is the record.

Measurable grouping/defend/retreat, honestly separated:

- Grouping: proven by tests 1, 2, 9 and by matches (max attackers
  10 for balanced/rush — the full starting force attacking
  together, not trickling). Match first-attack tick 20 does NOT
  prove grouping (the starting force is already 10, above the
  gather threshold), and is not claimed as proof.
- Defend: proven by test 3 and by match mode counts (balanced
  First: defend 449 of 1,068 ticks; balanced Second before the
  last stand: defend 820 ticks).
- Retreat: proven by test 4 only. Match-observed `fellBack` was 0
  in all 6 matches — units in these matches die outright or fight
  near their core, so the fall-back branch never fired there.
  Retreat exists and is tested; it is not match-observed, and this
  report does not claim otherwise.

### The Twin Bridges stall — diagnosed, not hidden

All three variants stall on Twin Bridges at the 750 s cap. The
end state was traced tick by tick: both cores dead, 2 vs 2 (or 3
vs 1) survivors, and the survivors are air drones (combat drones
and a sensor drone) whose guns only hit ground/structure targets.
No order can make them damage each other. The AI itself is not
stalled — after the last-stand fix it spends 14,161 of 15,000
ticks in attack and keeps issuing attack orders; the blue
stand-in also stops re-targeting, because its driver only orders
idle (hold) units and its drones sit at a dead core site in
attackMove with an empty path. Two layers, separated:

1. AI freeze after core death — FIXED in this cycle (last stand).
   Before the fix, the second-map balanced match spent 14,461 of
   15,000 ticks in defend with survivors frozen on a dead guard
   point. After the fix, 14,161 ticks in attack.
2. Air-vs-air weapon deadlock — NOT fixed here, because fixing it
   would mean changing weapon target classes or victory rules,
   which are outside this cycle's one-system fence. Queued for a
   later cycle, where it needs a design decision (for example,
   whether scout guns should hit air, or whether victory should
   consider structures only), not a silent rule change.

Consequence for the end condition: the kept AI is beatable (loses
the First Map match to the stand-in in 53 s) and does not stall
games by its own decisions, but a Twin Bridges game can still
stall in an air-only endgame. That is a known, recorded limit, not
a pass.

### Browser screenshots (viewed)

Headless Chromium, real clicks, 1280×800, no page errors:

- `game/gen2-match-first.png` — First Map, tick 404 after 20 s of
  play: Iron Eden 10, Xandria 8, Wrecks 4. Red units visible as a
  group mid-field (several red HP bars advancing together) with
  wrecks and fire behind them.
- `game/gen2-match-second.png` — Twin Bridges, tick 404 after 20 s
  of play: Iron Eden 9, Xandria 9, Wrecks 4. Same grouped red
  advance, lake and both bridges visible on the minimap.

The player side gave no orders in these screenshots, so blue
units sit near their core and auto-engage; the screenshots prove
red grouping/attacking, not blue play.

## Step 7 — Freeze

Baseline locked: Prototype 03 + mobile-first + tutorial +
landscape-first + Loop 1 title fix + Cycle 1 Twin Bridges + Cycle
2 real red combat AI (defend / gather / attack / fall-back,
reinforcement batching, last stand, no cheating, both maps).

Changelog (this cycle):

- Red combat AI added to `sim.js` (state machine, thresholds
  above, squad splitting, passable-tile snapping, existing A*
  pathfinding, weaponless exclusion, salvage/chain protection).
- Old browser attack-move driver removed from `game.js`; red
  combat and economy both run inside `Sim.step`.
- Reinforcement batching (stage 3, then attack together).
- Last stand after core death, gated on `aiHadCore`.
- Variant seam `state.aiCombatParams` (harness/tests only).
- Player-facing text corrected everywhere it said red is a demo
  script (menu, How to Play, `CONTROLS.md`, marketing draft).
- Tests 110/110 (10 new red-combat tests); one old P03 test
  expectation changed explicitly (salvage order after collecting).
- Match harness `scripts/ai-match.js`; three variations evaluated,
  balanced kept (reasons in Step 3).
- Twin Bridges air-endgame stall diagnosed and recorded as a
  known limit (weapon target-class deadlock), not fixed by a
  silent rule change.

Deferred to the NEXT cycle's inventory (not built now): difficulty
settings (one AI behaviour was a deliberate fence, not an
oversight); a blue-side AI; fog of war; a third map; structure
placement; any new unit/weapon/art; the air-endgame deadlock
decision (weapon target classes vs victory rules); any APK build;
any publishing.

## Honest gaps (carried, not closed)

- Never played by a human or on a real phone (tests + headless
  Chromium only); pinch zoom still never finger-tested.
- Retreat is test-proven but match-unobserved (`fellBack` 0 in all
  6 matches).
- Twin Bridges matches stall in an air-only endgame (weapon
  deadlock, Step 6). A human player would order remaining units to
  hunt, which the stand-in does not — but the red side cannot kill
  air units with ground-only guns in any case, so the deadlock is
  real even with a human blue side, until the queued decision is
  made.
- Turtle beating the stand-in on the First Map is a stand-in
  artifact (no blue salvage, no hunting), not evidence about
  turtle vs a human.
- Match scrap remainders are not a conservation proof; the proof
  is the unchanged economy code plus its Prototype 03 tests.
- The v1.2 APK predates the Loop 1 title fix, Twin Bridges, and
  this AI — none of those three are on the phone yet. An APK
  rebuild is a separate step on the user's word, as before.
- Religious-term scan of the new/changed files in this cycle:
  clean — no religious language, citations, or framing. (The word
  "Iron Eden" appears as the pre-existing faction name in game
  text, as in Cycle 1; it is game content predating this cycle,
  not workflow language, and was left as-is rather than renaming
  a faction.)
