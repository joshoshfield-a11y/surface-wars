# Generation Cycle 3 — Endgame deadlock draw

Plain product language only. No religious framing, citations, or metaphors
are used anywhere in this report.

## Step 0 — Inventory (what this cycle builds on)

Frozen baseline from Generation Cycle 2: Prototype 03 + mobile-first +
tutorial + landscape-first + Loop 1 title fix + Cycle 1 Twin Bridges +
Cycle 2 real red combat AI (defend / gather / attack / fall-back,
reinforcement batching, last stand, no cheating, both maps), tests
110/110, APK v1.3 on the phone (which predates this cycle).

The one recorded exception from Cycle 2, and the reason this cycle
exists: Twin Bridges stand-in matches stall at the 750 s cap in an
air-only endgame — both Command Cores dead, survivors air drones
whose guns only hit ground/structure (combat drone gun:
`['ground', 'structure']`), so no order can make them damage each
other. Cycle 2 fixed the AI-freeze layer of that stall (last stand)
and deliberately left the weapon target-class deadlock for a cycle
with a design decision. This is that cycle.

## Step 1 — Specify (one testable sentence)

"No Surface Wars match can stall forever in a target-class deadlock:
when neither side can damage the other and neither side can produce
new units, the match ends in a declared draw within a bounded time,
with no change to weapon damage, range, or target classes for any
unit that is not part of the deadlock."

Judged against this sentence at freeze: a both-cores-dead air-only
match now ends in a Draw at tick 4819 in the headless harness
(previously the 15,000-tick cap) and at exactly tick 600 in the
constructed test state; no weapon stat, range, or target class was
changed anywhere; elimination still wins/loses; a core alive
anywhere still blocks a draw.

## Step 2 — Separate (in / out, with a boundary)

IN: deadlock detection in `game/sim.js`, a Draw result in the
victory/defeat screen (`game/game.js` + the existing victory panel
in `game/index.html`), tests, headless reproduction (recreate the
both-cores-dead air-only state and prove it now ends), updated
`CONTROLS.md` + tracker/changelog.

OUT (explicit, including liked items): no broad weapon stat or
target-class changes; no new units, weapons, or art; no economy or
balance changes; no fog of war; no difficulty settings; no blue-AI
changes; no campaign/multiplayer; no tutorial changes except the
one victory-text correction below; no APK build; no publishing.

FOCUSED-PIECE FENCE: exactly one system — endgame deadlock
resolution.

HARD CONSTRAINT: do not "fix" the stall by making air weapons hit
air or by buffing drones — that would change combat balance
everywhere to fix one endgame. If a fix needs a stat change, it is
the wrong fix. This constraint held: the catalog is untouched, and
every weapon's damage, range, and target classes are exactly as
they were.

## Step 3 — Seed (reusable primitive) and design alternatives evaluated

The seed is one structural-capability primitive in `sim.js`,
reused for every faction and every map:

- `factionCanDamage(state, fac)` — true if any alive unit of the
  faction has a weapon whose target classes include the class of
  any alive enemy entity (unit or structure). This is the sim's
  actual firing gate (`weaponCanHit`, used by `acquireTarget`).
  Two deliberate properties: splash damage only fires on a direct
  hit, so there is no indirect damage path the gate cannot see;
  structures never fire (their weapons list is empty), so a
  structure-only side can never damage anyone.
- `factionCanProduce(state, fac)` — true if the faction has a
  living Command Core. Scrap on hand is deliberately NOT part of
  the test: a core with no scrap today can salvage tomorrow, so
  only a dead core means production is truly gone.
- `checkDeadlock(state)` — true only when at least two factions
  have alive entities, no faction can produce, and no faction can
  damage any other faction.

Detection uses structural capability, not range or line of sight:
range and position change every tick, so a draw must mean
structurally impossible, not tactically awkward. Production is the
escape hatch that justifies the core-alive rule: a living core can
eventually produce a unit that breaks the deadlock (for example an
interceptor, whose gun hits air), so a core alive anywhere resets
the counter — even a core with zero scrap, since salvage and
production remain structurally available to it.

Trigger and grace period: the counter `state.deadlockTicks`
advances once per tick while `checkDeadlock` is true and resets to
zero on any other state. At `DEADLOCK_GRACE_TICKS = 600` ticks
(30 seconds of sim time) the sim sets `state.winner = 'draw'`.
Why 600: the trigger is state-based, so once both cores are dead
and neither side can damage the other, no new damage capability
can appear (no production, and no new wrecks without damage), so
the grace is a confirmation/display delay, not a race against
changing state. 600 ticks is long enough that a draw is never
declared on a fleeting frame and the player can see the endgame
arrive, and short enough that a deadlocked match ends far inside
any reasonable match length. Tutorial games are excluded from the
check (they have their own end screen and the red side is held).

Alternatives evaluated and rejected, with reasons:

- Change weapon target classes (for example, let scout guns hit
  air): rejected — it violates the hard constraint. It would
  change combat balance in every match, not just the endgame, and
  it answers a different question (what guns should do) from the
  one this cycle was asked (how a deadlocked match should end).
- Victory by remaining scrap value: rejected — scrap is an
  economy remainder, not a measure of who fought better; it would
  crown a side that happened to bank scrap while its army died,
  and it would need a new rule for ties and for sides with no
  scrap at all. A draw says honestly that neither side won.
- Let the match run to the existing cap: rejected — that is the
  stall itself, relabelled. A cap is not a result, and a player
  sitting through 750 seconds of units that cannot hurt each
  other has not been given an ending.
- Instant draw the moment the deadlock appears (grace 0):
  rejected — a draw with no confirmation window would feel like
  the game giving up, and would risk declaring on a single
  transitional tick in a more complex future state (for example
  if production or a new unit type ever changes what
  `checkDeadlock` sees).

## Step 4 — Govern (cycle length, beats, end condition)

One cycle, one system, no new mechanics. Beats: read the Cycle 2
record and the sim's victory path → implement detection + draw
result → unit tests → headless match reproduction (both maps) →
browser Draw-panel screenshot → report + tracker. Written end
condition: the constructed both-cores-dead air-only state ends in
a Draw within the grace period; one-sided elimination still
wins/loses, never draws; a core-alive air-only state never draws;
normal First Map and Twin Bridges stand-in matches are unaffected
except that the Twin Bridges stall now ends in a Draw; no weapon
stat, range, or target class changed; tests all pass. The end
condition is met with no exception.

## Step 5 — Populate

Changed files, `game/` + tests + tracker only:

- `game/sim.js` — `DEADLOCK_GRACE_TICKS = 600`,
  `factionCanDamage`, `factionCanProduce`, `checkDeadlock`,
  `state.deadlockTicks` (initialised in `createGame`),
  the deadlock block in `step()` after the elimination check
  (elimination takes precedence; tutorial games excluded),
  `victoryStats` now returns per-faction remaining counts
  (`ironRemaining`, `xandriaRemaining`) and counts both sides'
  survivors for a draw. All three helpers plus the grace
  constant are exported for tests. No weapon, economy, AI, or
  pathfinding code was touched.
- `game/game.js` — `showVictory` handles `winner === 'draw'`:
  title "Draw — neither side can win.", stats line with both
  sides' units remaining, wrecks created and remaining. The
  Restart and Main Menu buttons are the same overlay buttons as
  win/loss — no new panel, no new button, no new flow. The
  existing freeze logic already keys on `state.winner` being
  truthy, so `'draw'` freezes the sim exactly like a win/loss.
- `game/index.html` — one How to Play line corrected: the win/lose
  paragraph now also states the draw rule (neither side can
  damage the other and neither side can build → draw after
  30 seconds in that state, instead of stalling).
- `game/CONTROLS.md` — the Victory row now covers Draw (both
  sides' counts shown); the Cycle 2 "known limit" paragraph now
  says Fixed in Cycle 3, with the trigger, grace, precedence,
  and no-stat-change statement.
- `tests/deadlock.test.js` — 6 tests (see Step 6).
- `game/gen3-draw-screen.png` — Draw-panel screenshot (see Step 6).
- `UPGRADE-LOOP.md` — this cycle's freeze entry.

No art changes. No `~/workspace/scrap-dungeon/`. Nothing committed,
pushed, published, or packaged as an APK.

## Step 6 — Steward (counterpart: test suite + headless matches)

### Tests: 116/116 pass

`node --test tests/*.test.js` — 116 pass, 0 fail (110 pre-existing
+ 6 new in `tests/deadlock.test.js`):

1. Both cores dead, air-only, neither can damage the other →
   no draw at tick 300 or 599, Draw at exactly tick 600;
   `victoryStats` reports winner `'draw'`, 1 + 1 remaining,
   2 total.
2. One-sided elimination → `'iron_eden'` wins, never a draw.
3. Cores alive + weaponless air units only → no draw after 1200
   ticks (twice the grace), counter stays 0. (Test-design note:
   scrap was zeroed in this test so the red AI economy could not
   spawn a combat unit mid-test and change the state under test;
   the question under test is the cores, and the cores are what
   block the draw.)
4. One side able to damage the other (red interceptor gun hits
   air) → not a deadlock, no draw after 700 ticks.
5. Counter resets the moment the state stops being a deadlock
   (a blue ground unit arrives that red drones can hit → counter
   300 → 0 on the next tick).
6. A non-core structure with no units and no core, against a
   weaponless air unit → Draw at tick 600, not an elimination.
   (Test-design catch, recorded honestly: the first draft of
   this test used a red combat drone against a blue bunker —
   but a bunker IS a structure, and the drone's gun hits
   structures, so red could damage blue and the state was not a
   deadlock at all. The test was corrected to a weaponless
   sensor drone; the detector was right, the test was wrong.)

No old test expectation was changed in this cycle.

### Headless matches (same harness and stand-in as Cycle 2)

`scripts/ai-match.js`, balanced variant, AI-red vs scripted blue
attack-move stand-in with a mirrored blue economy and no blue
salvage — a behaviour comparison, not a balance verdict against
a human:

- First Map: **unchanged from Cycle 2** — `iron_eden` wins at tick
  1068 (53 s), 8 blue left, 0 red left, first attack tick 20,
  max attackers 10. The draw logic does not touch normal matches.
- Twin Bridges: **previously stalled at the 15,000-tick cap, now
  ends in a Draw at tick 4819 (241 s)**, 2 vs 2 left, first attack
  tick 20, max attackers 10, attack 3980 ticks / defend 820 ticks.
  The match plays out fully, reaches the both-cores-dead air-only
  state, waits out the 600-tick grace, and ends — bounded, with a
  result, instead of running to the cap.

### Browser Draw-panel screenshot (viewed)

`game/gen3-draw-screen.png` — "Draw — neither side can win.",
"Ticks elapsed: 600 | Sim time: 30.0s | Iron Eden units
remaining: 1 | Xandria units remaining: 1 | Wrecks created: 20 |
Wrecks still on the field: 20", Restart and Main Menu buttons,
game frozen behind the panel. How it was obtained, stated
plainly: the shipped game's shell keeps its state inside a
closure, so a deadlock cannot be injected into the shipped page
from outside; the screenshot was taken from a copy in `/tmp`
with a test-only injected script that pre-seeds the Cycle 2
deadlock state (both cores and all spawned units killed, one
combat drone per side added) before the game starts. `sim.js`,
`game.js`, and the page markup in that copy are byte-identical
to the shipped game (verified by diff); only the scenario setup
differs, and the Draw panel reached is the shipped panel code
running the shipped deadlock code, at exactly tick 600. The
screenshot background lacks sprites because the `/tmp` copy has
no assets directory; the panel itself is the shipped code. This
is a panel verification, not a claim that a human played a match
to a draw — no human has yet, on any device.

### Cost note (considered, not a problem found)

`checkDeadlock` runs once per tick. In a normal match it exits
almost immediately: the first unit's first weapon usually hits
the first enemy checked, so the scan is near-free. Only a
genuinely deadlocked state scans everything, and that state ends
the match 600 ticks later. No match-length cost was measured
because the harness matches above run at the same tick counts as
Cycle 2 where they are comparable (First Map identical at 1068).

## Step 7 — Freeze

Baseline locked: Prototype 03 + mobile-first + tutorial +
landscape-first + Loop 1 title fix + Cycle 1 Twin Bridges +
Cycle 2 real red combat AI + Cycle 3 endgame deadlock draw.

Changelog (this cycle):

- Deadlock detection in `sim.js` (`factionCanDamage`,
  `factionCanProduce`, `checkDeadlock`, `deadlockTicks`,
  `DEADLOCK_GRACE_TICKS = 600`).
- Draw result: `state.winner = 'draw'`, Draw panel in
  `game/game.js` (both sides' survivors shown), How to Play
  draw line, `CONTROLS.md` victory row + known-limit update.
- Tests 116/116 (6 new deadlock tests); no old test expectation
  changed.
- Headless proof: First Map unchanged (win at 1068 ticks);
  Twin Bridges stall replaced by a Draw at 4819 ticks.
- Draw-panel screenshot viewed (`game/gen3-draw-screen.png`,
  test-copy provenance stated above).

Deferred to the NEXT cycle's inventory (not built now):
difficulty settings; a blue-side AI; fog of war; a third map;
structure placement; any new unit, weapon, or art; the
twin-stick / hero-mech feature (specified separately in
`design/TWIN-STICK-HERO-MECH-DESIGN.md` by a parallel pass —
not built here, and no code in this cycle anticipates it); any
APK build (separate step on the owner's word — v1.3 on the
phone predates this cycle's draw fix); any publishing.

## Honest gaps (carried, not closed)

- Never played by a human or on a real phone (tests + headless
  Chromium only); pinch zoom still never finger-tested.
- The Draw panel screenshot comes from a `/tmp` test copy with
  a pre-seeded deadlock scenario (provenance above); no human
  has played a match to a draw yet, and the 600-tick grace is a
  judgement call, not a playtested feel — a human might find
  30 seconds too long or too short, and that is a tuning
  question for a later cycle, not a correctness claim.
- The draw rule is structural (target classes + living cores),
  not tactical: a match where both sides COULD damage each
  other but neither player chooses to will still run until
  someone acts or is eliminated. That is a different stall
  (player inaction, not a rules deadlock) and is out of this
  cycle's fence.
- A core alive with zero scrap and no salvageable wrecks still
  blocks a draw, by design (production remains structurally
  available). If that state ever proves to stall in practice, it
  is a new cycle's question, not a bug in this one.
- Religious-term scan of the new/changed files in this cycle:
  clean — no religious language, citations, or framing. (The
  word "Iron Eden" appears as the pre-existing faction name in
  game text, as in Cycles 1–2; it is game content predating
  this cycle, not workflow language, and was left as-is rather
  than renaming a faction.)
