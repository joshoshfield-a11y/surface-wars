# UPGRADES-12H — Wave 3 report (hero progression extension)

Scope: hero progression only. No commit, push, merge, publish, or APK.
Files touched (all inside Wave 3 ownership): `game/progression.js`,
`game/weapons.js` (new gear rows + generic gear-effect path in
`heroStats` only — the 18 Wave 1 named-weapon rows and their
multipliers are untouched), `game/game.js` (one skills-screen
display line only), `game/sim.js` (one new skill-effect branch
only, in the existing skill pattern), `tests/upgrades12h.test.js`
(new), `scripts/upgrades12h-match.js` (new). Two old-test count
pins moved, explicitly justified below. Nothing else edited:
`data/catalog.json`, `game/catalog.js`, `scripts/gen-catalog.py`,
`game/hero.js`, `game/maps.js`, and `apk/` are untouched.

## 1. Audit (measured, not assumed)

Gear rows before Wave 3: 12 — exactly one choice per slot per
tier. Armor: Plated Hull I/II/III (HP x1.10 / x1.20 / x1.30 +
Heavy step at III). Mobility: Servo Legs I/II/III (+0.5 / +1.0 /
+1.5 speed). Reactor: Overclocked Reactor I/II/III (energy-only
fire rate x1.05 / x1.10 / x1.15). Sensor: Targeting Array I/II/III
(vision +1 / +2 / +3 and range +1 at III). Thin spot: no
trade-off choice inside any slot/tier — every tier step was a
pure upgrade, and there was nothing to choose between.

Skills before Wave 3: 8 — 5 active, 3 passive. Dash (A, L2),
Salvage Sense (P, L3), Overdrive (A, L4), Field Repair (A, L5),
Targeting Computer (P, L5), Shockwave Slam (A, L6), Reinforced
Frame (P, L7), Rally Signal (A, L8). Points: 9 by level 10 for 8
skills, 1 spare by design. Thin spots: the spare point was a
freebie (nothing left to buy); level 9 granted a point with no
new unlock (last unlock was L8); the early game offered no
choice (L2: Dash or nothing, L3: Salvage Sense or nothing).

Named weapons: 123 rows (82 primary, 34 secondary, 7 utility).
Utility/EW rows (EMP Carbine T2, Storm Cage T3, Blackout
Emitter T2, Biomass Reclaimer T2, Dead Channel T2, Mirror Core
T3, Scrap Singularity T3) exist as data but were never offered
in the loadout UI: the loadout shape has no utility key, the
validator rejects any utility row, `heroStats` ignores it, and
the loadout panel in `index.html` has no utility select.

Post-L10: XP past 4500 was dead — level capped at 10, points
stopped, no further progression of any kind.

## 2. What shipped

### (a) Two new skills

Choice: one active + one passive. The active joins the existing
equippable-active pool (the ability slot still holds exactly
one; the control strip and Q key are data-driven over the
equipped id, so no strip change was needed — a newly unlocked
active simply becomes equippable like any other). The passive
needs no control at all.

- **Rapid Servos** — passive, gate 3, +0.5 hero speed at match
  start, stacks with mobility gear (resolved in `heroStats`).
  Reason for gate 3: it turns the early game into a real
  3-skills-for-2-points choice (Dash, Salvage Sense, Rapid
  Servos) instead of a forced march.
- **Concussive Pulse** — active, gate 9, cooldown 25s, enemies
  within 3 tiles are slowed (half speed, via the existing
  `slowUntil`/`speedMult` path the stun special already writes)
  for 5s. No damage, no effect on structures, no hero-kill XP.
  Reason for gate 9: level 9 previously had nothing new to buy,
  and a no-damage slow is the strongest active that cannot
  inflate the damage economy. Reason it is a slow and not a
  second damage active: Shockwave Slam already owns close-range
  damage; a second damage active would stack with it and risk
  the freeze rule.

Point economy after Wave 3: 9 points at level 10 for 10 skills
— the player must leave one skill unpicked. The old spare point
is now a real choice, not a freebie.

### (b) Four new gear items, three slots, each a trade-off

No new row is a pure upgrade over its same-tier neighbour
(values at the band level, hero base HP 200 / speed 6.0):

| Row | Slot/tier | vs same-tier row | Trade-off |
|---|---|---|---|
| Reactive Weave I | armor T1 | Plated Hull I (HP 220, spd 6.0) | HP 210, spd 6.5 — less HP, more speed |
| Ablative Hull II | armor T2 | Plated Hull II (HP 276, spd 6.0 at L4) | HP 290, spd 5.5 — more HP, less speed |
| Overdrive Servos II | mobility T2 | Servo Legs II (spd 7.0, HP 230 at L4) | spd 7.5, HP 218 — faster, frailer |
| Long-Eye Array II | sensor T2 | Targeting Array II (vis 10, range 6 at L4) | vis 9, range 7 — more range, less vision |

Implementation note: `heroStats` now applies `maxHpMult` and
`speedAdd` generically over all equipped gear (the original 12
rows carry `maxHpMult` only on armor and `speedAdd` only on
mobility, so their resolved values are provably identical —
covered by the untouched Phase B tests, which still pass).
`armorStep` stays armor-slot-only, as before.

### (c) Progression extension: post-L10 mastery track (shipped, not deferred)

- Curve (cumulative XP): M1 5500, M2 6800, M3 8300, M4 10000,
  M5 11900. Steps past 4500: 1000, 1300, 1500, 1700, 1900. Cap M5.
- Each rank grants +1 skill point at match end, and nothing
  else. M1 supplies the 10th point that completes the 10-skill
  set; M2–M5 points bank for future skills and mark prestige.
  They grant no stats, no gear, and no second ability, by design.
- Anchor reasoning: level stays capped at 10 and
  `masteryRankForXp` never enters `heroStats`, so the level-10
  ceilings cannot move — effective L10 stays +45% HP (290) /
  +18% damage (14.2) whether mastery is 0 or 5 (proven by the
  identical L10 vs L10-mastery5 match rows, and by unit tests).
  Mastery rank is derived from XP like level is, never stored
  independently of it; `masteryClaimed` counts ranks already
  paid out, so a match-end transition can never double-pay.
- Migration (no wipe): old records have no `masteryClaimed`
  field. Validation treats a missing field as 0 — the old
  balance rule — so old records load intact (level, XP, skills,
  loadout all preserved; tested). The next match-end transition
  pays any earned ranks as catch-up (an old record parked at
  11500 XP claims M1–M4 in one transition; tested). Respec
  returns level points + claimed mastery points.

## 3. Utility/EW decision: DEFERRED, with reasons

The utility slot is NOT wired in Wave 3.

1. The loadout panel has no utility select (`index.html` has
   `lo-primary` through `lo-sensor` plus `lo-ability` only),
   and `index.html` is outside Wave 3 file ownership — wiring
   the slot without its UI element would produce a validator
   that accepts a loadout no player can ever build.
2. A utility weapon would be a third hero weapon. That changes
   hero DPS and risks the freeze rule in a way the four
   trade-off gear rows do not; it needs its own balance wave
   with match data, not a ride-along.
3. Nothing is hidden by deferring: the 7 EW rows stay
   data-complete, and the validator still rejects a utility
   loadout with a reason naming the slot (tested) instead of
   silently dropping it. The Wave 1 finding (utility/EW rows
   never offered in the loadout UI) is acknowledged here, not
   buried.

## 4. Match data (`scripts/upgrades12h-match.js`)

Harness: same stand-in as Wave 1 (scripted blue attack-move +
mirrored blue economy, no blue salvage; hero under RTS orders,
no redeploy; seed 20261030; First Map + Twin Bridges; 15000
tick cap). Full-match rows, winner / ticks:

| Entry | First Map | Twin Bridges |
|---|---|---|
| default-L1 | xandria, 2560 | draw, 3403 |
| no-hero (hero off) | iron_eden, 1068 | draw, 4819 |
| weave-L1 (new) | STALLED, 15000 | iron_eden, 1320 |
| rapid-on-L3 (new) | STALLED, 15000 | draw, 4865 |
| rapid-off-L3 | iron_eden, 1124 | draw, 3471 |
| ablative-L4 (new) | iron_eden, 1486 | STALLED, 15000 |
| plated-L4 (old control) | STALLED, 15000 | iron_eden, 1351 |
| servos-L4 (new) | iron_eden, 1376 | draw, 4700 |
| longeye-L4 (new) | iron_eden, 1309 | STALLED, 15000 |
| concussive-on-L9 (new) | STALLED, 15000 | STALLED, 15000 |
| concussive-off-L9 | STALLED, 15000 | STALLED, 15000 |
| L10-norapid (control) | iron_eden, 1001 | STALLED, 15000 |
| L10 (with Rapid Servos) | iron_eden, 948 | iron_eden, 1116 |
| L10-mastery5 | iron_eden, 948 | iron_eden, 1116 |

Freeze-rule verdict: **no new combination sweeps** (script exit
0; sweep scope = the six new entries). No retune made, and no
opponent buff made.

Three honest caveats, all measured:

- **Single-seed full matches are high-variance.** Near-identical
  entries flip outcomes: rapid-on-L3 stalls First Map while
  rapid-off-L3 wins it, yet L10-with-rapid wins Twin Bridges
  while L10-norapid stalls it. The same +0.5 speed flips one
  match each way. These rows are a sweep guard and a
  determinism proof, not fine balance measurement — no
  retune is justified on one seed of noise, in either
  direction.
- **L10 rows are not sweep candidates.** Level 10 is
  pre-existing Phase C progression; the L10-norapid control
  shows the L10 endpoint beats the L1 default with or without
  the new skill. Retuning L10 down would violate the frozen
  ceilings.
- **Concussive Pulse fired 0 times in full matches**, so the
  on/off full-match rows are identical and vacuous. Root cause
  measured: the RTS-order hero holds firing range and dies at
  range before any enemy closes inside 3 tiles (debug run:
  minimum enemy distance 3.14, hero dead at tick 255 on First
  Map). The skill is designed for a driven hero closing into a
  group, which this harness cannot do. The script therefore
  includes a close-contact arena (below) instead of pretending
  the full-match rows prove the skill.

Arena (3 weaponless red scouts march onto the hero's tile from
10 tiles out; hero holds and fires; pulse script-fired inside
3 tiles):

| Arena | Contact tick | Pulses | Hero HP | Red HP left | Reds killed |
|---|---|---|---|---|---|
| concussive-on | 34 | 1 | 280 | 0 | 3 |
| concussive-off | 32 | 0 | 280 | 0 | 3 |

The pulse fires in a match-like loop and delays first contact
(34 vs 32 ticks). The effect is small here because only ~1.5
tiles separate pulse radius from contact and hero firepower
kills all three reds either way; the unit tests are the primary
proof of the slow (slowUntil set on in-radius enemies only,
structures/damage untouched, 20-tick movement lag vs an
unpulsed enemy). Hero-on vs hero-off: no-hero won First Map
while default-L1 lost it — same harness chaos (replacing the
roster lancer with the hero changes unit processing order and
diverges the battle); reported as noise, not a hero verdict.

## 5. Migration proof (tests, not just claims)

- A genuine Phase C record shape (no `masteryClaimed` field,
  level 10, 6000 XP, 8 skills, armor gear + equipped Overdrive)
  validates, and `cloneRecord` preserves level/XP/skills/loadout
  exactly while normalising the missing field to 0.
- Its next match-end win pays M1 as catch-up (points 1 -> 2,
  level stays 10, skills untouched) and the result validates.
- A parked old record at 11500 XP claims M1–M4 in one
  transition (points 1 -> 5) and validates.
- A mid-level old record (level 5, 1000 XP) is untouched by the
  track (no mastery, no extra point without a level-up).

## 6. Tests

Full suite: **269/269 pass** (260 baseline + 9 new in
`tests/upgrades12h.test.js`). New coverage: nothing removed
(8 original skills with gates/types, 12 original gear rows with
effects); new-skill gates, point spending, respec with the new
skills present, 10-skills/9-points endgame; Concussive Pulse
sim effect (radius incl. exactly-3 edge, no damage, no
structures, allies untouched, cooldown, passive rejection,
movement lag); new-gear validation, tier-band gating (T2 rows
name level 4 below band), trade-off values, `heroStats`
resolution incl. Rapid Servos stacking; L1 anchor and L10
ceilings frozen; mastery curve/cap/grants/respec; old-record
migration incl. multi-rank catch-up; corruption rule (6
new-shape failures return reasons, never throw;
`defaultRecord()` is a fresh level-1 hero); utility still
rejected with a named reason.

Old-test changes (2, both explicit and justified in place):

- `tests/herophaseb.test.js`: gear count 12 -> 16 — Wave 3 adds
  4 trade-off rows; the 12 original rows are asserted unchanged
  in the new file.
- `tests/beta-wave1.test.js`: skill count 8 -> 10, actives
  5 -> 6 — Wave 3 adds Rapid Servos + Concussive Pulse; the 8
  original skills are asserted unchanged in the new file.

No other old test was touched. No test was weakened: the two
changes raise pins to the new shipped counts.

## 7. Gates waived

None. Every Wave 3 item is implemented, tested, and
match-run. The utility slot is deferred (Section 3), not
waived silently, and (c) shipped in full (mastery track),
not half-done.

## 8. Constraints checklist

- Strict 90-degree top-down: untouched (no rendering, sprite,
  or movement-model change).
- No religious language in any new/edited file: the only
  pre-existing faction name is untouched; no new file uses any.
- Hero "Command Mech" placeholder only: untouched.
- Drop Back In only entry, loadouts between matches only:
  untouched (skills screen is main-menu only, as before).
- L1 anchor unchanged: default-loadout heroStats identical
  with and without Wave 3 options (tested, deep-equal).
- L10 caps unchanged as ceilings: 290 / 14.2 at every mastery
  rank (tested + match-row identity).
- Cycle 3 deadlock frozen, twin-stick gates untouched: no sim
  change outside the one new skill branch; no AI, economy,
  weapon, or pathfinding change.
- Nothing removed: no skill, gear item, loadout slot, or
  mechanic deleted or dumbed down (tested).
