# Surface Wars — upgrade loop tracker

Plain product language only. No religious framing, citations, or metaphors
are used anywhere in this tracker or in `marketing/`.

Rule: run the steps in order. Find the earliest step whose gate test fails
and fix that first. A later step cannot compensate for an earlier break.

## The 14 steps and their gate tests

1. **Visibility** — one headline a stranger can repeat after 5 seconds, plus
   one working demo where players already gather.
   Gate: a stranger can find the game, repeat the headline, and see it
   working, without asking the owner anything.
2. **Trust** — honest listing: every claim demonstrable, every real limit
   stated, price and refund terms findable before paying.
   Gate: every listing claim can be demonstrated, and every limit a buyer
   would care about is stated on the page.
3. **Independent proof** — at least one outsider with no stake describing
   it from their own use.
   Gate: one person with no stake in sales has publicly described the game
   from their own experience.
4. **Working demo** — prospect can try, watch, or inspect it before paying.
   Gate: a prospect can try, watch, or inspect the game working before any
   money is asked for.
5. **Audience-specific openings** — each target audience gets its own first
   sentence; facts identical, entry point different.
   Gate: each target audience has its own opening line, with a stated
   reason it differs from the others.
6. **Wide distribution, selective focus** — distribute widely, measure which
   audience actually uses, returns, and recommends, concentrate there, cut
   channels that only produce views.
   Gate: the best audience is named from evidence, and most effort goes there.
7. **Partners** — at least one other person actively showing it to an
   audience that is not the seller's.
   Gate: one partner is actively showing the game to their own audience.
8. **Wider invitation** — offered in at least one place beyond the first
   imagined audience.
   Gate: the game has been offered beyond its first imagined audience.
9. **Follow-up** — every warm prospect (tried the free version, started
   checkout, went quiet after interest) gets one genuine, useful follow-up.
   Gate: every warm prospect from the last cycle has received a follow-up.
10. **Reinvest in winners** — biggest effort on the best measured channel,
    at least one dead channel cut.
    Gate: the biggest effort sits on the best measured channel, and one
    dead channel has been cut.
11. **Ready stock / timing** — if demand doubled tomorrow, fulfilment from
    already-stored assets, with the source assets that make the next build
    (source files, audience list, reusable demo) untouched.
    Gate: double demand could be met from stored assets, source assets intact.
12. **Sharp advantage** — one sentence the incumbent could not honestly copy.
    Gate: the advantage is stated in one sentence, grounded in a real
    mechanism, with no borrowed generic claims.
13. **Clear single ask, repeated** — every public surface ends with exactly
    one next step, plus a humane follow-up sequence.
    Gate: every public surface ends with one clear next step, and a
    follow-up sequence exists and is running.
14. **Clear offer** — buyer can state from the page alone what they get,
    what it costs, what is guaranteed, and what happens next.
    Gate: a buyer can state all four from the page alone.

## Loop 1 diagnosis (verified from the tree, 2026-10-30)

Evidence checked: `game/index.html`, `game/CONTROLS.md`, the game reports
(mobile-first, tutorial, landscape), `apk/APK-REPORT-1.2.md`, and a
search of the tree for any public listing, store page, price, or offer.

| Step | Verdict | Evidence |
|---|---|---|
| 1 Visibility | FAIL — earliest break | No public listing or demo page exists in the tree. The game exists as a local web build and as APK files handed directly to the owner. No headline existed before Loop 1. |
| 2 Trust | PARTIAL, not passed | Limits are stated honestly inside the game (How to Play "Not in this slice"), but there is no public listing, no price, and no refund terms. Loop 1 stages the listing draft; it cannot pass until the page is public and price/terms are set. |
| 3 Independent proof | FAIL | No outsider description exists in the tree. Only the owner and the builders have used the game, as far as can be verified. |
| 4 Working demo | BUILT, NOT PLACED | The demo itself exists and works: 7-step tutorial plus First Map skirmish. It is not placed anywhere a stranger can reach it, so the gate does not pass. |
| 5 Audience openings | FAIL before Loop 1, STAGED in Loop 1 | No audience-specific pitches existed. Loop 1 wrote three (see below); they are staged drafts, not published, so the gate passes only as a draft, not as a live step. |
| 6 Distribution / focus | FAIL (no data) | Nothing has been distributed publicly, so there is no measurement to focus on. Cannot be fixed before Steps 1–4. |
| 7 Partners | FAIL | No partner exists in the tree. |
| 8 Wider invitation | FAIL | The game has not been offered anywhere beyond the owner. |
| 9 Follow-up | NOT APPLICABLE yet | There are no warm prospects yet, because nothing is public. The follow-up rule is recorded here so it is not forgotten when prospects exist. |
| 10 Reinvest in winners | FAIL (no data) | No channel has produced a measured return, and no channel has been cut. |
| 11 Ready stock / timing | PARTIAL | Source files, the reusable demo (tutorial + First Map), and the APK build pipeline are stored and rebuildable. There is no audience list, and no fulfilment path for double demand, so the gate does not pass. |
| 12 Sharp advantage | STAGED in Loop 1 | No advantage sentence existed before Loop 1. One is now staged (see below); it is grounded in the wreck/salvage mechanism and needs no publication to be written, but it is unproven in the market until it is used. |
| 13 Single ask | STAGED in Loop 1 | The staged listing ends with one step ("Try the free taster"). No public surface exists yet, so the gate does not pass. |
| 14 Clear offer | BLOCKED on owner decisions | Price, guarantee/refund, offer terms, and delivery are all undecided (see below). Nothing here invents them. |

Diagnosis conclusion: Step 1 is the earliest break, and it blocks Steps 2–10.
Loop 1 therefore prepares Step 1 and Step 2 (headline + honest listing
draft) and the staged parts of Steps 5, 12, and 13, without publishing
anything. Steps 3, 6, 7, 8, 10, and 14 cannot be fixed by drafting alone.

## What Loop 1 built (staged only, NOT published)

- `marketing/headline.md` — headline: "Top-down RTS battles where every
  wreck is worth scrap." Testable against the game; no hype claim.
- `marketing/listing-draft.md` — honest listing: what the game is, what it
  does, what it does NOT do yet (no research, fog of war, campaign,
  multiplayer, structure placement, Power/Components/Supplies, Clans/
  Directorate, transport/repair, red combat still a demo script, pinch
  never finger-tested, no phone performance claim), free taster description,
  and the open decisions below.
- `marketing/audience-openings.md` — three openings: (a) RTS players,
  (b) mobile gamers, (c) players of large-scale top-down strategy games.
  Facts identical; entry points differ, with reasons stated.
- `marketing/sharp-advantage.md` — one advantage sentence grounded in the
  wreck/salvage mechanism (40% of build cost, 120-second decay, any unit
  can salvage).
- Game fix (trust-relevant, `game/` only): the stale in-game title
  "Prototype 03" removed from player-facing text — page title, top bar,
  and main-menu description now read "Surface Wars" with no fake release
  version, and the `CONTROLS.md` header updated the same way. No sim,
  balance, stats, economy, or AI change was made.

## What was NOT done in Loop 1 (stated plainly)

- Nothing was posted to itch.io, social media, a store, or any public
  surface. Nothing was committed or pushed. No APK was built in this loop.
- No price, guarantee, refund terms, or offer terms were invented.
- No independent tester was recruited, and no partner was approached.
- No distribution, measurement, or follow-up has happened, because there
  is nothing public to distribute or follow up on yet.

## Blocked on owner decisions (Loop 1 cannot proceed past these alone)

1. Price — must be set before Step 14 can pass.
2. Guarantee / refund terms — must be set and findable before paying.
3. Offer terms — what a buyer gets, on which platforms, what happens
   after purchase, how delivery works.
4. Publish permission — explicit word required before any listing, page,
   post, or store entry goes live.
5. Independent tester — an owner-approved outsider to use the game and
   describe it in their own words (Loop 2).

## Generation track — separate from the visibility loop above

This track is about building the game itself, cycle by cycle,
using a second, secular workflow: inventory what exists,
specify in one testable sentence, separate in-scope from
out-of-scope, build from reusable seeds, govern the cycle
with a written end condition, populate one domain at a time,
steward names and maintenance with a real counterpart
(test suite + headless playthrough), then freeze a baseline
and write new ideas into the NEXT cycle's inventory. If a
later step gets hard, go back one step; do not push harder.
Nothing in this track is published, committed, pushed, or
packaged as an APK unless the owner says so in a separate
step. No religious framing, citations, or metaphorical
source language is used anywhere in this track.

### Generation Cycle 1 — Second Map ("Twin Bridges") — FROZEN 2026-10-31

- Spec sentence: "A second 80x50 skirmish map, playable
  from the main menu alongside the First Map, with a
  different terrain problem from the single-bridge First
  Map, using only existing units, economy, and art — no
  new mechanics."
- Separations: IN — one map definition, main-menu +
  pause-menu + command-bar wiring, tests, screenshots,
  tracker/changelog, CONTROLS.md map section. OUT —
  no new units, structures, weapons, or art; no sim,
  balance, economy, or AI changes; no campaign, fog of
  war, or multiplayer; no tutorial changes; no APK build;
  no publishing.
- Fence: exactly one map, 80x50, same factions, cores,
  and economy as the First Map. Hard constraint: no new
  mechanic may be added to make this map work — if the
  map needs one, redesign the map.
- Seed proof: the existing map builder (`rect`/`blob` +
  terrain ids + overlay families + 10v10 scenario shape).
  Three variations evaluated: (A) full-height river with
  two bridges — rejected, doubles the choke instead of
  changing the problem; (B) central lake with two bridges
  plus flank corridors — KEPT; (C) forest corridor +
  desert flank, no water — rejected, forest slows but
  never forces a crossing decision.
- Shipped: Second Map — Twin Bridges (80x50, cores 6,25 /
  73,25, same 10v10 spawns). Central lake x=33-47,
  y=10-39; upper bridge y=16-17, lower bridge y=32-33;
  land corridors north (y<10) and south (y>39); bridge
  approaches kept clear of forest and rock; track/road
  overlays cosmetic only. First Map untouched and still
  selectable; Test Map untouched.
- Governors / end condition: met — tests 100/100 (93 old
  + 7 new in `tests/secondmap.test.js`), both bridges
  proven passable, headless playthrough ordered a medium
  tank across the upper bridge (selected, move order to
  (48,16), photographed standing on the bridge with its
  path to the destination ring), screenshots viewed
  (`game/gen1-secondmap-full.png`,
  `game/gen1-secondmap-crossing.png`,
  `game/gen1-secondmap-crossing-later.png`), report at
  `game/GEN-CYCLE-1-REPORT.md`.
- Stewardship: stable names `createSecondMap`,
  `spawnSecondMapScenario`, `secondMapOverlaySets`, map
  id `second`; guarded by the new tests. Counterpart
  pushback during the cycle: the first playthrough
  script failed to select a unit because zooming back
  to 1x had recentred the camera — a script bug, not a
  game bug — fixed by re-centring via the minimap.
- Freeze judgement: judged against the spec sentence,
  not against the best imaginable map — spec met, no
  exception. Baseline locked at this entry.
- Next cycle's inventory (deferred, NOT built now): a
  third map; a real red combat AI; structure placement;
  any new unit, weapon, or art; any APK build (separate
  step on the owner's word); any publishing.

### Generation Cycle 2 — real red combat AI — FROZEN 2026-10-31

- Spec sentence: "The red side fights with a real combat AI
  — defending its core, grouping units before attacking,
  choosing targets, and retreating damaged units — using
  the same scrap economy, costs, and rules as the player,
  with no free units, no free scrap, and no information
  the player could not see in this no-fog game — on both
  the First Map and Twin Bridges."
- Separations: IN — a red combat decision layer in `sim.js`
  (squad/state behaviour for existing units only), tests,
  headless match evaluation, updated player-facing text,
  CONTROLS.md + tracker/changelog. OUT — no new units,
  structures, weapons, or art; no economy/balance changes;
  no fog of war; no difficulty settings (one AI behaviour,
  not three); no blue-side AI; no campaign/multiplayer;
  no tutorial changes except correcting any line that
  says red is a demo script; no APK build; no publishing.
- Fence: exactly one system — red combat decisions. Hard
  constraint: the AI may not cheat — no free scrap/units,
  no vision beyond the no-fog world, no stat changes, no
  touching player units. If a behaviour needs a cheat to
  work, redesign the behaviour.
- Seed proof: one squad state machine in `sim.js`,
  `runAiCombat`, reused across unit types and both maps:
  defend (3+ blue within 25 tiles of the core, or nearest
  blue within 14; ring radius 6) / gather (fewer than 8
  combat units stage toward the enemy) / attack (needs 8,
  drops out below 5, 100-tick hysteresis, squads split
  direct / 14 north / 14 south of the target, target =
  blue core, else weakest blue structure, else blue
  centroid) / fall-back (below 35% HP, enemy within 12,
  more than 8 from the core → permanent core defender).
  Reinforcement batching (stage 3, then attack together)
  and last stand after core death (combat continues,
  economy stops, gated on a core having been present at
  an earlier think) were added inside the same system.
  Every destination is snapped to the nearest passable
  tile for that unit's movement class; routes use the
  existing A* pathfinding — no new path system, and a
  ground unit is never ordered into water. The old
  browser attack-move driver was removed from
  `game.js`; red combat and economy both run inside
  `Sim.step`.
- Variations evaluated (headless matches,
  `scripts/ai-match.js`, AI-red vs a scripted blue
  attack-move stand-in with a mirrored blue economy and
  no blue salvage — a comparison between behaviours, not
  a balance verdict against a human): balanced (kept —
  attacks at tick 20, max attackers 10, defends 449 of
  1,068 ticks, loses the First Map match to the stand-in
  in 53 s); rush (gather 2 / floor 2 / defend never —
  indistinguishable from balanced, same First Map loss
  in 52 s); turtle (gather 14 / floor 10 / defend 35/1 —
  beats the stand-in on the First Map in 121 s by letting
  it trickle into defences, a stand-in artifact, and
  still stalls on Twin Bridges). Balanced kept because
  it attacks promptly, groups its full force, defends
  measurably, and is beatable.
- Governors / end condition: met with one recorded
  exception — tests 110/110 (100 old + 10 new in
  `tests/redcombat.test.js`), no cheating (scrap
  unchanged, no spawns, blue untouched by direct AI
  calls; economy code untouched, Prototype 03
  conservation tests still pass), Twin Bridges ground
  units never ordered into water, tutorial games still
  hold the red side, screenshots viewed
  (`game/gen2-match-first.png`,
  `game/gen2-match-second.png`, grouped red advances at
  tick ~404 on both maps). Exception: Twin Bridges
  stand-in matches stall at the 750 s cap in an air-only
  endgame — both cores dead, survivors air drones whose
  guns only hit ground/structure, so no order can make
  them damage each other. The AI-freeze layer of that
  stall was fixed in this cycle (last stand: attack
  ticks rose from 539 to 14,161 of 15,000); the weapon
  target-class deadlock was NOT fixed here, because
  fixing it would mean changing weapon classes or
  victory rules outside this cycle's one-system fence.
  It is queued below, not hidden. Full record:
  `game/GEN-CYCLE-2-REPORT.md`.
- Stewardship: stable names `runAiCombat`,
  `aiCombatCore`, `aiBlueTarget`, `aiNearestPassable`,
  `state.aiCombatParams` (harness/tests only — the
  browser never sets it, so shipped games always run
  the defaults). Counterpart pushback during the cycle:
  the first last-stand implementation fired in
  core-less unit test setups and broke three old tests
  (weapon range, weapon LOS, salvage) — fixed in
  `sim.js` via the `aiHadCore` gate, with no old test
  expectation changed in the completion phase. The one
  old-test change in this cycle, stated explicitly:
  the Prototype 03 salvage test now asserts the
  salvager's order is NOT `'salvage'` after collecting
  (it gets a combat guard order instead of idling).
- Player-facing text: corrected everywhere it said red
  is a demo script — main menu, How to Play,
  `CONTROLS.md` (new Red AI combat section, Known
  limits, Still NOT IMPLEMENTED), and the two stale
  lines in the staged marketing listing draft. Note for
  the Loop 1 record above: the Loop 1 diagnosis line
  "Red combat is still a demo attack-move script" was
  true when Loop 1 staged it and is now superseded by
  this cycle; the Loop 1 table is a historical record
  and was left as written, with this entry recording
  the change.
- Freeze judgement: judged against the spec sentence —
  defend, gather, attack, fall-back, target choice, same
  economy, no cheating, both maps, all present and
  tested; beatable on the First Map; no AI-decision
  stall. One exception recorded above (air-endgame
  deadlock). Baseline locked at this entry.
- Next cycle's inventory (deferred, NOT built now):
  difficulty settings (deliberately fenced out here, not
  an oversight); a blue-side AI; fog of war; a third map;
  structure placement; any new unit, weapon, or art; the
  air-endgame deadlock decision (weapon target classes
  vs victory rules — needs a design decision, not a
  silent rule change); any APK build (separate step on
  the owner's word); any publishing.

### Generation Cycle 3 — endgame deadlock draw — FROZEN 2026-10-31

- Spec sentence: "No Surface Wars match can stall forever in a
  target-class deadlock: when neither side can damage the other
  and neither side can produce new units, the match ends in a
  declared draw within a bounded time, with no change to weapon
  damage, range, or target classes for any unit that is not part
  of the deadlock."
- Separations: IN — deadlock detection in `sim.js`, a Draw
  result in the victory/defeat screen (`game.js` + the existing
  victory panel), tests, headless reproduction, `CONTROLS.md` +
  tracker/changelog. OUT — no broad weapon stat or target-class
  changes; no new units, weapons, or art; no economy or balance
  changes; no fog of war; no difficulty settings; no blue-AI
  changes; no campaign/multiplayer; no tutorial changes except
  one victory-text correction; no APK build; no publishing.
- Fence: exactly one system — endgame deadlock resolution. Hard
  constraint: no fix by making air weapons hit air or by buffing
  drones — that would change combat balance everywhere to fix
  one endgame. The constraint held: the catalog is untouched.
- Seed: a structural-capability primitive in `sim.js` —
  `factionCanDamage` (the sim's actual firing gate,
  `weaponCanHit`; splash only fires on a direct hit, so no
  indirect damage path escapes it; structures never fire),
  `factionCanProduce` (living Command Core only; scrap on hand
  deliberately excluded, since a core with no scrap today can
  salvage tomorrow), `checkDeadlock` (two or more factions with
  alive entities, nobody can produce, nobody can damage
  anybody). Detection uses capability, not range or line of
  sight, because range and position change every tick — a draw
  must mean structurally impossible, not tactically awkward.
  Production is the escape hatch: a living core can eventually
  produce a unit that breaks the deadlock, so a core alive
  anywhere resets the counter.
- Trigger and grace: `state.deadlockTicks` advances once per
  tick while deadlocked and resets on any other state; at
  `DEADLOCK_GRACE_TICKS = 600` ticks (30 sim seconds) the sim
  sets `state.winner = 'draw'`. Elimination takes precedence
  (a side with nothing left loses, never draws); tutorial
  games are excluded (own end screen, red side held).
- Alternatives evaluated and rejected: changing weapon target
  classes (violates the hard constraint, changes every match);
  victory by remaining scrap value (scrap is an economy
  remainder, not a measure of who fought better); letting the
  match run to the cap (that is the stall itself, relabelled);
  instant draw at grace 0 (no confirmation window, risks a
  transitional tick).
- Governors / end condition: met with no exception — tests
  116/116 (110 old + 6 new in `tests/deadlock.test.js`),
  no old test expectation changed, First Map stand-in match
  unchanged from Cycle 2 (iron_eden wins at tick 1068, 53 s),
  Twin Bridges stand-in match now ends in a Draw at tick
  4819 (241 s, 2 vs 2) instead of stalling at the 15,000-tick
  cap, Draw panel viewed (`game/gen3-draw-screen.png` —
  test-copy provenance: pre-seeded deadlock scenario in a
  `/tmp` copy, `sim.js`/`game.js`/page markup verified
  byte-identical to the shipped game; panel reached at
  exactly tick 600).
- Stewardship: stable names `factionCanDamage`,
  `factionCanProduce`, `checkDeadlock`, `deadlockTicks`,
  `DEADLOCK_GRACE_TICKS`, all exported for tests.
  Counterpart pushback during the cycle: the first draft of
  the non-core-structure test used a red combat drone
  against a blue bunker — but a bunker IS a structure and
  the drone's gun hits structures, so the state was not a
  deadlock at all; the test was corrected to a weaponless
  sensor drone (the detector was right, the test was
  wrong). A second design catch: the core-alive test zeroes
  scrap so the red AI economy cannot spawn a combat unit
  mid-test and change the state under test.
- Player-facing text: How to Play win/lose paragraph now
  states the draw rule; `CONTROLS.md` victory row now covers
  Draw (both sides' counts shown) and the Cycle 2 known-limit
  paragraph now reads Fixed in Cycle 3. The Draw panel reuses
  the win/loss Restart and Main Menu buttons — no new panel
  or flow.
- Freeze judgement: judged against the spec sentence — no
  match can stall forever in a target-class deadlock, draw
  within a bounded time, no weapon change, elimination still
  wins/loses, core-alive never draws. Baseline locked at
  this entry.
- Next cycle's inventory (deferred, NOT built now):
  difficulty settings; a blue-side AI; fog of war; a third
  map; structure placement; any new unit, weapon, or art;
  the twin-stick / hero-mech feature (specified separately
  in `design/TWIN-STICK-HERO-MECH-DESIGN.md` by a parallel
  pass — not built here); any APK build (separate step on
  the owner's word — v1.3 on the phone predates this
  cycle's draw fix); any publishing.

### Twin-Stick Phase A — manual control for one selected unit — FROZEN 2026-10-31

Separate track from the generation cycles above (this phase does not
renumber them). Spec sentence, judged against it with no exception:
"Any selected player unit with a weapon can be taken over with twin
sticks and released back to RTS orders without stuck orders, on phone
landscape and desktop." Verdict: MET. Entry, drive, aim/fire,
release, fresh RTS order after release, pause-preserves-mode,
death-exit, and multi-touch were all proven by tests and by a
headless playthrough on both viewports (below); no old test
expectation was changed.

- Step 0 inventory (before any edit): tests 116/116 passing; sim
  already had the firing gates (`fireWeapon`, `acquireTarget`,
  `weaponCanHit`, `hasLOS`, `isPassable`, `movementCost`), the pooled
  2,048-slot projectile pool, and the Cycle 2 AI + Cycle 3 deadlock
  rules; shell already had selection, orders, groups, guard, rally,
  pause, and the landscape side panel; no manual-control input path
  existed anywhere.
- Step 1 specify: the sentence above.
- Step 2 separate. IN: one manual-control system — Take Control
  entry gate, twin-stick + WASD/mouse input, sim manual branch,
  camera follow, control strip, panel suppression, release/pause/
  death exits, tests, playthrough, docs. OUT (explicit, including
  liked items): anything with "hero", "level", "XP", "skill",
  "loadout", or "persist" in it; Drop Back In / reserve model;
  weapon compatibility/loadout data; gear; abilities; mid-match
  refit; any new unit, weapon, or art; any sim balance/economy/AI
  change beyond the manual input path; any APK, publishing,
  commit, or push. Fence: exactly one system. HARD CONSTRAINT held:
  no hidden multipliers for driving well — same speed, weapons,
  cooldowns, damage as RTS orders; no catalog entry changed.
- Step 3 seed: the control-state machine (enter → control →
  release/death) plus the stick-to-velocity/aim mapping, proven by
  the three variations in the playthrough: phone sticks, desktop
  WASD/mouse, and Esc release — all three drive the same sim
  branch. The aim rule is the seed's contract: fire only at the
  nearest enemy inside a 30° half-angle cone of the aim direction
  AND passing every normal gate (range, min-range, LOS, target
  class, cooldown, accuracy, armour matrix). 30° was chosen as wide
  enough for thumb-aimed shots at visible targets and narrow enough
  that aiming 90° away never fires.
- Step 4 govern: freeze gate = the tests below + the playthrough
  below + `CONTROLS.md` twin-stick section + this entry. A cycle
  ends when its condition is met, not when energy runs out.
- Step 5 populate: `game/sim.js` (manual branch in `step()`, axis-
  separated terrain blocking, cone firing through `fireWeapon`,
  `setManualControl` / `clearManualControl` / `setManualInput` /
  `angleDiff`, `MANUAL_AIM_CONE_DEG = 30`); `game/view.js` (pure
  `stickZones` / `stickZoneAt` / `stickVector` / `takeControlState` /
  `canOrderProduction`, `STICK_RADIUS = 60`, `STICK_DEADZONE =
  0.35`); `game/game.js` (control state, entry/release/silent-exit,
  Take Control buttons, control strip with Release Control + Pause,
  panel suppression while controlling, stick pointer handling by
  pointer id, WASD + mouse aim + LMB fire, Esc first-release /
  second-pause, Space stays pause, per-frame manual input before
  sim steps, camera follow, death exit, range ring + stick visuals);
  `game/index.html` (`btn-take-control`, `#control-strip`);
  `game/style.css` (strip shown / tray hidden / rotate hint
  suppressed under `body.controlling`).
- Step 6 steward: the test suite + headless playthrough as the
  counterpart that pushes back. Two real catches from that
  counterpart, both fixed, neither waived: (1) the Pause button
  lived in the command tray, which is hidden while controlling, so
  pause was unreachable by tap in the new mode — the control strip
  now carries its own Pause button (Space already paused; resume
  never touched control state, so pause-preserves-mode holds).
  (2) the bottom-anchored info panel sat on top of the left stick
  zone (and the edge of the right one) and swallowed stick touches
  — info and build panels are now suppressed while controlling and
  return on release. Two playthrough failures were harness/test
  artifacts, stated honestly: a west move-order target that sat on
  the longshot mech (a click on a unit selects it — normal RTS
  behaviour, not a twin-stick bug; the target was moved to empty
  ground) and synthetic PointerEvents failing `setPointerCapture`
  (real touch pointers never throw there; the harness now uses
  genuine CDP touch events).
- Step 7 freeze: tests 132/132 pass (116 pre-existing + 16 new in
  `tests/twinstick.test.js`, no old expectation changed);
  playthrough 20/20 on desktop 1280×800 (mouse + WASD: select,
  Take Control, strip, pause/resume preserving mode, drive east,
  mouse aim + LMB hold killing a harness-spawned red target,
  release to hold with selection preserved, fresh move order
  followed west, Esc release then Esc pause) and phone landscape
  844×390 (touch tap select, Take Control, CDP left-stick drive
  east, two sticks tracked simultaneously by pointer id,
  right-stick aim + hold killing a harness-spawned red target,
  third-pointer button click releasing control). Screenshots:
  `game/twinstick-desktop-control.png`,
  `game/twinstick-phone-control.png` (strip, HP/range note,
  range ring, clear canvas). Full record:
  `game/TWIN-STICK-PHASE-A-REPORT.md`.
- Honest gaps (not hidden): no real-phone thumb-ergonomics
  playtest — headless emulation cannot prove it, and Phase A must
  be played on a real device before it is considered proven on
  phone; pinch/zoom while controlling is via the zoom buttons
  only; sustained-fire phone performance under a full battle is
  unmeasured from the sandbox. The playthrough ran on a `/tmp`
  copy with a test-only `window.__sw` hook for assertions; the
  copy's `game.js` was verified identical to the shipped file
  except the hook lines, and harness-spawned red targets (4 tiles
  east) were used only so firing could be observed without a
  50-tile drive — the shots came from real input through the
  shipped path.
- Next phase's inventory (deferred, NOT built now): Phase B (hero
  mech + loadout + gear, reserve model + Drop Back In) and Phase C
  (persistence + skills + upgrades) per
  `design/TWIN-STICK-HERO-MECH-DESIGN.md`; any APK build (v1.3 on
  the phone predates this phase); any publishing.

### Twin-Stick Phase B — hero mech + loadout + gear — FROZEN 2026-10-31

- Spec sentence (met, no exception): "The player's default starting
  mech spawns in place of one starting unit, with a between-match
  loadout over the seven catalog slots, using the twelve family
  templates and the named-weapon data rows." Read WITH the reserve
  amendment, which wins: the hero REPLACES the west roster's
  `lancer_mech` entry but STARTS IN RESERVE — opening field 9v10,
  Drop Back In its only entry.
- What shipped: "Command Mech" (placeholder name), Iron Eden Lancer
  chassis — HP 200, Medium, speed 6.0, vision 8 (catalog-verified;
  the spec's proposed vision 10 was unconfirmed and NOT used),
  cost 380. Reserve → Dropping (PROPOSED 2 s telegraph, marker
  visible to both sides, cannot act/damaged, match-end cancels and
  refunds) → Controlling (Phase A path) → Reserve on Release/Esc/
  RTS-mode/other-unit control, or Dead (wreck) on death. Drop Back
  In button in the RTS tray AND the control strip, ≥44 px, disabled
  with a VISIBLE reason label (not a hover tooltip). Drop location:
  nearest passable tile to the own Command Core, player does not
  choose. Costs (all PROPOSED): voluntary redeploy free after 10 s;
  death redeploy 200 scrap + 30 s via the button only, no auto
  respawn, waits if broke, core dead blocks both. Voluntary
  withdrawal keeps exact HP, creates no wreck/scrap/XP change;
  death leaves the normal 152-scrap wreck (120 s). Reserve hero
  neither prevents defeat nor counts as an elimination target;
  deadlock detector untouched (600-tick grace, field entities
  only). Loadout screen from the main menu, between matches only,
  fixed for the match: 7 slots, live validation with reasons,
  tier-1 weapons + gear only (level bands cannot apply without
  levels — tier 2/3 rows data-complete but locked, Phase C
  unlocks). All 123 named weapons as data rows, 12 family
  baselines as the only tuned numbers; specials overheat/stun/
  pierce (approximation: one extra enemy within 2 tiles at 50%)/
  burn implemented. Session-only loadout: resets on page reload,
  NO persistence storage of any kind in this phase.
- Verification: tests 150/150 (132 pre-existing + 18 new, no old
  test changed); two headless playthroughs with real input events
  (loadout → drop → drive/fire → release → cooldown → re-drop
  with HP preserved; death → 152 wreck → 30 s + 200 scrap →
  redeploy at full HP, scrap 500 → 300), zero page errors;
  hero-on/off harness 12 matches (3 seeds × 2 maps × 2 modes):
  off 1W/3D/1L/1S, on 0W/3D/1L/2S — NO SWEEP, so the phase freezes
  (the no-freeze condition was hero-on winning every match the
  stand-in wins none of). The harness measures loadout/stat swing
  under RTS orders only, NOT twin-stick skill or reserve play, and
  NOT a human balance verdict. Full record:
  `game/TWIN-STICK-PHASE-B-REPORT.md`; docs in `game/CONTROLS.md`.
- Fixes caught by the work: `cancelDrop` no longer resurrects dead
  heroes (guarded to dropping-only); disabled Drop Back In reasons
  are button labels, not hover tooltips; control-strip line
  reworded (hero returns to reserve, not RTS orders).
- Honest gaps: no real-phone playtest of Drop Back In / reserve /
  loadout flows; PROPOSED numbers unplaytested; loadout resets on
  reload until Phase C; pierce is an approximation; no human
  balance verdict from the harness alone.
- Next phase's inventory (deferred, NOT built now): Phase C
  (persistence + skills + upgrades) per
  `design/TWIN-STICK-HERO-MECH-DESIGN.md`; any APK build (v1.3 on
  the phone predates Phase A and Phase B); any publishing.

### Twin-Stick Phase C — persistence + skills + upgrades — FROZEN 2026-10-31

- Spec sentence (met, no exception): "Hero level, XP, skills, and
  gear unlocks persist across matches on the same device and
  survive app restarts, with no match save/load and no cloud."
- What shipped: record `surfacewars.hero.v1` (schema 1: level
  1..10, cumulative XP, unspent skillPoints, skills, 7-slot loadout
  incl. ability, heroEnabled, matchesPlayed, wins), device-local
  only (localStorage web / DOM storage APK), written at match end
  (win/loss/draw panel), skill spend/respec, and loadout save —
  never every tick, never mid-match for XP; quit mid-match earns
  0 XP. Corruption → level-1 reset + plain notice, menu never
  blocked. Loadout screen carries the one visible data-loss line
  (Phase B's session-only notice REMOVED, not left alongside).
  XP (all PROPOSED): hero killing blow floor(0.10 × victim cost),
  minimum 10, army kills 0, 0-cost victims 0; hero salvage 10;
  win +100, draw +0 bonus (kill/salvage still count), loss +25,
  death 0 lost; level-up at match end only; curve L1 0 … L10 4500;
  1 point per level from level 2 (9 by level 10, 1 spare). Skills
  (seed 8, PROPOSED numbers): Dash, Salvage Sense, Overdrive,
  Field Repair, Targeting Computer (primary-only), Shockwave Slam
  (units only, never structures), Reinforced Frame, Rally Signal;
  free respec between matches only; ability slot holds ONE
  equipped active, shown as Ability 1 for the hero only (Q/1 on
  desktop, cooldown visible in the label, hidden for non-hero
  controlled units). Gear tiers by level: 1 at 1–3, 2 at 4–6,
  3 at 7+ (Phase B's tier-1-only lock lifted). Level badge: field
  hero reads `CMD N`.
- Stat-cap resolution (recorded, not fudged): (level−1) increments
  give +45% HP / +18% damage at level 10, UNDER the spec's +50% /
  +20% caps — the caps are non-binding ceilings and the level-1
  anchor (lancer values exactly, as in Phase B) was NOT broken to
  make them bind. Effective level-10: HP 200 → 290, damage 12 →
  14.2. Reinforced Frame +15% combines ADDITIVELY with the level
  HP bonus on base HP, before gear: L10+RF = 320, L7+RF+tier-3
  armor = 377.
- Two interpretations, test-proven: (1) hero salvage
  auto-collects — the hero is field-only while manually
  controlled, so it can never hold an RTS salvage order; a manual
  hero ending a tick within 1.5 tiles of a wreck collects it via
  the standard salvage path. (2) Kill XP needs a real cost — a
  0-cost victim grants 0, never the minimum.
- Verification: tests 159/159 (150 pre-existing + 9 new blocks, NO
  old test expectation changed); three headless playthroughs with
  real input events (two-match persistence incl. reload survival,
  Dash buy/equip/use with 8 s cooldown visible, quit-mid-match
  earns nothing; corruption garbled + failing-validation → reset
  + notice, Test Map still excludes the hero; draw with hero
  kill/salvage XP +20 and no win bonus). Full record:
  `game/TWIN-STICK-PHASE-C-REPORT.md`; docs in `game/CONTROLS.md`.
  Screenshots: `game/phasec-two-match-victory.png`,
  `game/phasec-loadout-skills.png`, `game/phasec-corruption.png`,
  `game/phasec-draw.png`.
- Honest gaps: no real-phone playtest of persistence/skills flows
  (mouse/keyboard headless only); PROPOSED numbers unplaytested;
  device-local loss on storage clear / device switch with no
  recovery; no human balance verdict from automated matches alone;
  any future APK must re-derive the game file list (Phase C adds
  `game/progression.js` — no longer 10 files) and re-run
  `verify_refs.py`.
- Next inventory (deferred, NOT built now): any APK build
  covering Cycle 3 + Phase A + Phase B + Phase C (v1.3 on the
  phone predates all four); any publishing; generation-loop next
  cycles (difficulty settings, blue-side AI, fog of war, third
  map, structure placement, new units/weapons/art).

## Queued loops, in order

- **Loop 2 — independent proof + public demo page (staged first):**
  recruit one approved independent tester, record their unscripted use,
  and stage a demo page carrying the Loop 1 headline, listing, and free
  taster. Publish only on the owner's explicit word.
- **Loop 3 — audience openings + distribution measurement:** use the three
  staged openings in the places each audience already gathers, measure
  which audience uses, returns, and recommends, and name the best audience
  from that evidence.
- **Loop 4 — partners + wider invitation:** one partner showing the game
  to their own audience, plus one offer beyond the first imagined audience.
- **Loop 5 — follow-up + reinvestment:** follow up every warm prospect
  from Loops 2–3, concentrate effort on the best measured channel, cut
  one dead channel.
- **Loop 6 — offer + close:** once price, guarantee, and offer terms are
  decided, rewrite the listing into a complete offer page where a buyer
  can state what they get, what it costs, what is guaranteed, and what
  happens next — then, only on the owner's word, publish it.

## Autonomous completion loop — final state (2026-11-01, v1.5)

The autonomous loop (authorized 2026-10-31, log in
`AUTONOMOUS-LOOP.md`) is complete. What it added on top of the
v1.4 phone build: Third Map — Forest Belt (80x50, forest belt with
three lanes, rock LOS blockers, three ponds, 0 bridges);
Easy/Normal/Hard difficulty (menu buttons, session-memory only,
tutorial forced Normal, Normal = shipped params exactly, red AI
behaviour params only, no cheats); the wave-2 in-game graphics
upgrade (DPR cap 2, baked ground, damage decals at 50%/25% HP,
structure wreck art for 15 of 23 types with generic rubble for 8,
UI order icons, HP/badge minima, thin-chassis contrast treatment);
the wired-sprite fix (all 49 wired units at blue-vs-red silhouette
IoU 0.85 or better; derived reds are blue units with red markings,
see `game/WIRED-SPRITE-FIX-REPORT.md`); beta wave-2 fixes
(tick-0 withdraw sentinel, live panel refresh, instant core-death
queue refund, tutorial-wreck refresh) and the full beta wave-2b
pass (234/234 tests; two gates waived by name — victory and draw
panels in the browser, same function as the proven defeat panel,
sim-proven terminal paths, human playtest still owed).

Final build: `~/workspace/your_files/Surface_Wars_v1.5.apk`,
66,271,617 bytes, SHA-256
46076e878560bb901cc0eb0fe933c87eab5b1e8c1ed14faea98045c4b815c11c,
versionCode 6 / versionName 1.5, package com.skit.surfacewars,
same debug keystore as v1.4 (signer cert SHA-256 1354ef2e...b39f5),
so it installs over v1.4. Bundle re-derived, not copied: 13 game
files (explicit list — the QA harness file is excluded) + 405
asset files (398 -512 sprites + 7 UI icons), verify_refs 0
missing. This closes a real v1.4 gap: v1.4 shipped zero structure
wrecks, damage decals, or UI icons even though the game preloads
them. Older APKs verified byte-identical after the v1.5 build.

Still open and user-side only: real-phone launch/touch/pinch/
performance/twin-stick feel/hero persistence across the update
install; release signing and any store step; Loops 2–6 above
(still queued, none started, nothing published). The generation-
loop next-cycle inventory items "difficulty settings" and "third
map" are now DONE; blue-side AI, fog of war, structure placement,
and new units/weapons/art remain unbuilt and need the owner's word.

## Wave-3 quality enhancement — final state (2026-11-01, v1.6)

Wave 3 (authorized 2026-10-31 ~22:11 PDT, "Continue quality
enhancement") closes the v1.5 waived gates and the named visual
limits it could close, with no new units/weapons/maps/mechanics
and no balance tune. Victory and draw panels rendered through
the shipped showVictory function in a seeded-terminal-state
browser run (match 1 victory itself seeded; everything after it
is real UI flow — win arc to level 2, Dash equipped, second
match started and drawn; an unseeded played victory remains
unproven by any driver). Structure sprites finally display
(opaque team block now fallback-only, thin team frame for ready
sprites); all 23 structure types on dedicated wreck art; all 7
UI icons keyed to transparency; combat_drone-red +
vespid_scout-red fully painted (43 derived reds remain, named);
warden protrusion fixed; minimap-centring viewTiles bug fixed
(newGame calls updateViewTiles() after the zoom reset).
Full beta pass 44/44 green (rerun 6, fresh checks file) and
full suite 242/242 green. Two beta-check fixes were harness-only
(west drives): the old east drives measured combat damage as if
it were a control/preservation failure.

Final build: `~/workspace/your_files/Surface_Wars_v1.6.apk`,
68,418,845 bytes, SHA-256
5eba3939b995677365802fa340415b65487d195e83d1ffbd57437372816ea835,
versionCode 7 / versionName 1.6, package com.skit.surfacewars,
same debug keystore as v1.5 (signer cert SHA-256 1354ef2e...b39f5),
so it installs over v1.5. Bundle re-derived: 13 game files +
413 asset files (406 -512 sprites + 7 UI icons), verify_refs 0
missing. A same-version pre-fix build (SHA 12e84c3f...646e8)
never left the sandbox and is superseded by this rebuild.
Older APKs verified byte-identical after the v1.6 build.
Queued after v1.6 is presented (not part of wave 3): the
12-hour improvement/refinement cycle recorded 2026-10-31
~23:22 PDT — it may add content/weapons/mechs/upgrades and
in-game purchase systems, but does not by itself authorize store
publishing or live real-money checkout.

## 12-hour improvement cycle — final state (2026-11-01, v1.7)

The 12-hour cycle (launched 2026-11-01 ~00:36 PDT from verified
v1.6) is complete, in 7 waves: (1) tuned hero weapons, (2) 8 new
mechs, (3) hero upgrades, (4) Salvage Credits + Premium Store,
(5) sellability + Tutorial II, (6) full beta pass, (7) docs +
backup + APK. Suite progression: 242 → 251 → 260 → 269 → 289 →
297 → 303/303, with no test change in wave 7. Nothing removed
at any wave (verified in code/tests by Wave 6): units 57, named
weapon rows 125, skills 10, gear rows 16, maps 3, tutorials 2,
store packs 4, mastery ranks 5, currencies 1. No balance retune
ships (the one Helios retune tried in Wave 6 measured
byte-identical and was reverted); no AI fielding change ships
(exclusion FINAL — new types stay player-producible and
AI-absent by decision); no real-money checkout is live or
claimed (the store runs on earnable Salvage Credits only).
Wave 6 named waivers carried, not closed: victory and draw
panels unrendered in an unseeded browser run (same
showVictory() function as the proven defeat panel; Wave 3's
seeded-terminal-state victory render stands with its caveat),
plus one honestly-FAIL browser check explained as a
driver-timing artifact (redeployed hero read at 153/200 after
taking combat damage between landing and the read — the code
spawns a redeployed hero at full HP, and quiet-field drops in
the same pass read full HP).

Final build: `~/workspace/your_files/Surface_Wars_v1.7.apk`,
72,779,664 bytes, SHA-256
a54a3580a8f28569ea8cfd05f7659e74f5726e699f50e8f022fc986b36760f49,
versionCode 8 / versionName 1.7, package com.skit.surfacewars,
same debug keystore as v1.6 (signer cert SHA-256 1354ef2e...b39f5),
so it installs over v1.6. Bundle re-derived: 14 game files
(currency.js included) + 437 asset files (430 -512 sprites +
7 UI icons), verify_refs 0 missing. Older APKs verified
byte-identical after the v1.7 build. Wave 7 made no game
content change — docs + packaging only — and found no
packaging bug, so no game file was edited in wave 7.

Still open and user-side only: real-phone launch/touch/pinch/
performance/twin-stick feel/hero persistence across the update
install; release signing and any store step; Loops 2–6 above
(still queued, none started, nothing published). The
generation-loop inventory update: the 12-hour cycle's items
(weapons tuning, expansion mechs in catalog, hero upgrades,
currency/store, Tutorial II) are now DONE; blue-side AI, fog of
war, structure placement, and the remaining held expansion
chassis still need the owner's word. Snapshot correction found
by Wave 7: the v1.6 snapshot's game-code manifest lists only 13
files and omits currency.js even though the v1.6 APK staged it —
a rebuild from that snapshot alone would ship a game missing
its Premium Store file. The v1.7 snapshot manifest lists all 14
files; the v1.6 snapshot was not rewritten, since snapshots are
records of their checkpoint.
