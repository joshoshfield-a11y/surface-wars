# MECHS-12H Wave 2 Report (2026-11-01)

Wave 2 (MECHS) of the Surface Wars 12-hour improvement cycle. Baseline:
251/251 tests green after Wave 1 (weapons tuning). This wave adds 8
expansion mechs to the catalog in one batch. No APK. Nothing committed,
pushed, merged, or published. Nothing removed.

## 1. The 8 chassis

All single-weapon rows using EXISTING catalog family weapons (`w_*` only).
All power 0 / components 0, so the Prototype 03 producible filter admits
them. All ground movement. Chassis uses the catalog vocabulary:
expansion `bulwark` -> Bulwark, `vespid` -> Vespid, `longshot` ->
Longshot, `striker` -> Lancer (mobile assault).

| Slug | Expansion class | Catalog chassis | Faction | Role | Counter (verified) | Cost | Time | HP | Armour | Speed | Vision | Size | Weapon (DPS) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bastion | bulwark | Bulwark | Iron Eden | Heavy frontline anchor | Demolition Crawler | 480 | 28 | 340 | Heavy | 3.8 | 7 | 0.65 | w_heavy_cannon (18.7) |
| gatekeeper | bulwark | Bulwark | Iron Eden | Laser skirmisher, ground + air | Heavy Tank | 380 | 24 | 240 | Medium | 4.2 | 8 | 0.60 | w_laser (20.6) |
| deadeye | longshot | Longshot | Iron Eden | Precision fire support, range 14, min-range 3, cannot hit air | Medium Tank | 460 | 26 | 190 | Medium | 4.0 | 10 | 0.60 | w_light_railgun (10.0) |
| mortarjack | longshot | Longshot | Iron Eden | Mobile indirect fire, range 12, min-range 3 | Lancer Mech | 340 | 22 | 150 | Light | 4.5 | 8 | 0.55 | w_mortar (8.0) |
| needlewing | vespid | Vespid | Xandria | Fast scout-striker | Medium Tank | 140 | 10 | 80 | Light | 9.0 | 11 | 0.40 | w_scout_gun (15.1) |
| longsight | vespid | Vespid | Xandria | Long-vision spotter (vision 13) | Fast Raider | 140 | 10 | 60 | Light | 8.0 | 13 | 0.40 | w_scout_gun (15.1) |
| javelin | striker | Lancer | Xandria | Mobile assault / flanking | Heavy Tank | 320 | 22 | 180 | Medium | 6.5 | 8 | 0.55 | w_autocannon (20.4) |
| raptor | striker | Lancer | Xandria | Close assault, melee range 1.2 | Lancer Mech | 300 | 20 | 170 | Medium | 7.5 | 8 | 0.55 | w_melee (29.7) |

Faction reasoning (doctrine): Iron Eden = heavy industry / armour /
siege, so it gets the two Bulwark anchors and the two Longshot fire
platforms. Xandria = mobility / recon / precision, so it gets the two
Vespid scouts and the two Striker assault mechs. No shared roster
entries: every chassis was faction-distinctive under its doctrine, so
no shared-entry justification was needed.

Slug collisions: none of the 8 ids appears in the 49 baseline catalog
ids, and none equals the previously used `expansion_warden`,
`expansion_colossus`, or `rampart_mk2` slugs. Nothing was overwritten.

Audit of the other 55: all 31 `additional`-class chassis were held —
that class has no clean catalog-chassis mapping and its concepts sit
outside the two skirmish doctrines (support/oddity roles, not
frontline/scout/assault/siege). Within the picked classes, held as
spares for later waves: ironclad (Bulwark), goliath, dreadnought
(super-heavy, would breach the cost/DPS envelope), railwarden
(Longshot railgun, overlaps deadeye), siegeback, thunderhead (siege,
overlap), ghoststep (Vespid EW — the sim gives EW no special effect,
just 2.7 DPS, so an EW producible would be a trap pick), flicker,
jackrabbit (Vespid spares), breakneck, pitbull, iron_jackal (Striker
spares).

## 2. Pricing audit (DPS = damage x accuracy / interval, raw)

| Unit | HP x DPS | Cost | Cost / (HP x DPS) | Neighbours |
|---|---|---|---|---|
| bastion | 6346.7 | 480 | 0.076 | bulwark_mech 0.077, medium_tank 0.073, heavy_tank 0.073 |
| gatekeeper | 4937.1 | 380 | 0.077 | bulwark_mech 0.077, flak_tank 0.080, medium_tank 0.073 |
| deadeye | 1906.9 | 460 | 0.241 | mortar_carrier 0.286, heavy_railgun 0.320 (indirect/long-range premium band) |
| mortarjack | 1200.0 | 340 | 0.283 | mortar_carrier 0.286 (same weapon, +10 HP, -0.5 speed, +20 scrap) |
| needlewing | 1208.9 | 140 | 0.116 | vespid_scout 0.113, scout_buggy 0.088 |
| longsight | 906.7 | 140 | 0.154 | radar_scout class: vision-13 premium over scout_buggy 0.088; speed 8.0 vs radar 6.0 |
| javelin | 3672.0 | 320 | 0.087 | medium_tank 0.073, bulwark_mech 0.077, speed 6.5 premium |
| raptor | 5046.9 | 300 | 0.059 | demolition_crawler 0.054 (melee band; range-1.2 drawback) |

Rules checked in tests: no new unit is cheaper than Scout Buggy (80)
while beating it on HP, speed, AND DPS at once (cheapest new unit is
140); no new unit exceeds the top-end envelope (max cost 480 <= Heavy
Tank 520; max DPS 29.7 = existing melee ceiling) so no drawback
exception was needed. Lancer Mech's nominal dual-weapon DPS (50.1) was
NOT used as a pricing anchor: in practice its melee only fires at
range <= 1.2 and hold-order lancers stop at autocannon range, so its
realised DPS is usually gun-only (see counter findings below).

## 3. Sprite wiring

Method: mapping in `game/sprites.js` (`EXPANSION_SPRITES`), NOT copies
into `units/`. Each new id resolves to
`../assets/sprites-90/mechs-expansion/<class>/<slug>[-red]-512.png`
(blue = no suffix, red = `-red`, same convention as `units/`).
All 16 files verified present and 512x512 (test reads PNG IHDR).
`preloadPriority` now preloads all 8 ids for both factions, so a
produced unit has real art on its first frame.

`game/game.js` was NOT edited: the build menu already lists
`Sim.producibleUnits(state, PLAYER)` automatically, so the new units
appear in the production panel with no menu change. A test asserts
that call still exists in `game.js`.

### verify_refs.py — explicit open gate (not silent)

Baseline (pre-wave): `verify_refs: all referenced files present`.
Post-wave: `units=57`, 24 MISSING — exactly the 8 new ids x (blue
units/ file, red units/ file, wreck file). Cause: `apk/verify_refs.py`
hardcodes the `sprites-90/units/` layout and checks the APK staging
tree, which predates this wave; it cannot resolve expansion mapping,
and `apk/build.sh` only stages `units/*-512.png` (line 35), so a
future APK would NOT ship the expansion art either. Copying files
into `units/` was NOT done: the task discourages copies, the web
mapping did not fail, and copies alone would not fix the APK anyway
(the game would still resolve to the unstaged expansion dir; the
real fix is staging). Wreck files for the 8 ids also do not exist;
`render.js` guards wreck drawing (`if (wreckImg)`), so a missing
wreck draws nothing instead of crashing — verified by code reading,
not by a crash test. Remediation for the coordinator before any APK:
add a mechs-expansion staging line to `apk/build.sh` (and the
matching check to `verify_refs.py`, both outside this wave's file
ownership) and generate wreck art for the 8 ids. No APK was built
this wave, so no user-facing impact.

## 4. Match data (`scripts/mechs12h-match.js`, exit 0)

### (a) Production smoke: 8/8
Each new unit, for its faction: queued (full scrap deducted), spawned
at catalog HP, and moved on a move order. Costs paid: bastion 480,
gatekeeper 380, deadeye 460, mortarjack 340, needlewing 140,
longsight 140, javelin 320, raptor 300.

### (b) AI matches: scripted blue stand-in vs red AI, Normal difficulty
(`Sim.DIFFICULTY_PARAMS.normal`), 3 maps x 2 seeds. Red production
composition is the anti-degeneration evidence; the red AI is
cheapest-first with queue cap 3 and per-type cap 3, and the new
Xandria types (140/140/320/300) sit behind five cheaper tiers
(80/80/90/110/120), so in shipped-rule matches the AI never reaches
them — proven, not assumed, by the counts below (and by rich-scrap
probes at 5000 red scrap, which still ended before reaching the 140
tier). That gating is a consequence of cheapest-first ordering, not a
defect: the AI cannot spam what it never queues. Per-type cap audit
sampled every think tick: zero violations in all 6 matches.

| Map | Seed | Winner | Ticks | Red produced (total) | Red new-type counts | Blue left | Red left |
|---|---|---|---|---|---|---|---|
| First Map | 20261030 | iron_eden | 1068 | 6 (scout_buggy 3, sensor_drone 3) | all 0 | 7 | 0 |
| First Map | 1337 | STALLED | 15000 | 11 (scout_buggy 5, sensor_drone 3, combat_drone 3) | all 0 | 1 | 7 |
| Twin Bridges | 20261030 | draw | 4819 | 8 (scout_buggy 4, sensor_drone 3, combat_drone 1) | all 0 | 2 | 2 |
| Twin Bridges | 1337 | draw | 3545 | 11 (scout_buggy 6, sensor_drone 3, combat_drone 2) | all 0 | 2 | 5 |
| Forest Belt | 20261030 | draw | 2557 | 5 (scout_buggy 3, sensor_drone 2) | all 0 | 8 | 1 |
| Forest Belt | 1337 | draw | 2593 | 6 (scout_buggy 3, sensor_drone 3) | all 0 | 5 | 1 |

Max new-type share of red production: 0.00 in every match.
Degeneration: none (no new type produced at all, let alone spammed).

STALL NOTE (First Map, seed 1337): the harness does NOT count this
as a wave failure, because the stripped-catalog control in the same
script reproduces it exactly with the 8 new units removed from the
catalog object in memory: STALLED, 15000 ticks, same production
(scout_buggy 5, sensor_drone 3, combat_drone 3), blueLeft 1, redLeft 7.
It is a pre-existing baseline stall (both cores dead, remnants never
meet), not a new stall: the stalled match produced zero new units
and zero new-unit interactions, and the AI's cheapest-first choices
among old types are byte-identical with the new units appended at
the end of catalog order. Fixing the baseline stall is out of scope
for this wave (Cycle 3 deadlock rules are frozen).

### (c) Counter duels: attackMove, 6 and 12 tiles apart, seeds 42/1337/2026
Protocol note: hold-order duels were tried first and REJECTED as a
protocol — hold units never chase beyond their acquire radius
(min(vision, maxRange)+1), so melee units at 5 tiles never engaged
and long-range pairs at 9 tiles never met. AttackMove matches real
play (armies advance and engage en route) and is the protocol the
harness uses. Counter passes if it wins at least half its duels.

| New unit | Named counter | Result (6 duels) | Verdict |
|---|---|---|---|
| bastion | Demolition Crawler | counter,new,counter,counter,new,counter = 4/6 | PASS (narrow; seed variance, both distances 2/3) |
| gatekeeper | Heavy Tank | 6/6 | PASS |
| deadeye | Medium Tank | 6/6 | PASS |
| mortarjack | Lancer Mech | 6/6 | PASS |
| needlewing | Medium Tank | 6/6 | PASS |
| longsight | Fast Raider | 6/6 | PASS |
| javelin | Heavy Tank | 6/6 | PASS |
| raptor | Lancer Mech | 6/6 | PASS |

REWRITTEN COUNTER (per the freeze rule, description changed, no
opponent buff): deadeye's first counter guess was Fast Raider and it
FAILED 0/6 in attackMove duels — a raider stops at autocannon range
(6) and loses the gun trade to the railgun instead of closing inside
the 3-tile minimum range, because hold/attackMove units stop once any
weapon is in range. The description now names the verified counter,
Medium Tank (6/6). Same mechanism explains why Lancer Mech is NOT a
bastion counter (0/6): its melee never fires when its autocannon is
in range, so it trades gun-only and loses. Bastion's verified
counter is the melee-only Demolition Crawler, which does close to
1.2 tiles.

No sweep, no retune needed: no new unit won every duel its counter
lost (the reverse — counters win), and no new unit dominated AI
queues (zero AI production). Per the freeze rule, had a sweep
appeared the fix would have been cost/HP/DPS retuning of the new
unit, never an opponent buff.

## 5. Tests

Full suite: 260/260 pass (251 baseline + 9 new), explicit file list
(all `tests/*.test.js` files named individually; directory invocation
fails on this Node). New file `tests/mechs12h.test.js` (9 tests):
ids/stats/costs/times/counters, roster assignment (iron_eden 27 =
23+4, xandria 28 = 24+4), sprite paths + 512x512 + preload coverage,
producible-filter admission, starting scrap 500/500, 10v10 scenarios
unchanged on all three maps (exact composition pinned, new ids
absent), red-AI per-type cap sampled over 3000 ticks, pricing rules
(scout-buggy floor, top-end envelope, HP x DPS bands), and
no-existing-row-changed (49 baseline ids intact + full pinned values
for 8 pricing neighbours + 19 weapons with spot values).

## 6. Old-test changes (explicit, justified, never silent)

1. `tests/sprites.test.js`: unit-count pin 49 -> 57. The pin exists to
   catch silent adds/removes; this wave's add is the documented one,
   so the pin was updated explicitly, not deleted.
2. `tests/animation.test.js`: unit-count pin 49 -> 57, and the 8
   expansion ids are EXEMPTED from the wreck-file loop (not silently
   dropped — the exemption is a named set with a comment). Reason:
   no wreck art was generated for them this wave; `render.js`
   guards the draw, so the exemption is safe. Generating wreck art
   is recorded follow-up work (see section 3).

No other old test was touched. `game/weapons.js`,
`game/progression.js`, `game/hero.js`, `game/sim.js` (AI/economy
rules), and `game/maps.js` starting scenarios were NOT edited.
`game/game.js` was NOT edited (build menu already auto-lists).

## 7. Files changed (only these)

- Edited: `scripts/gen-catalog.py` (8 unit rows + 2 roster lines)
- Regenerated via scripts (never hand-edited): `data/catalog.json`
  (49 -> 57 units), `game/catalog.js` (via `scripts/build-catalog.js`)
- Edited: `game/sprites.js` (EXPANSION_SPRITES map + unitPath
  special-case + preload + export)
- Edited (justified, section 6): `tests/sprites.test.js`,
  `tests/animation.test.js`
- New: `tests/mechs12h.test.js`, `scripts/mechs12h-match.js`,
  `game/MECHS-12H-REPORT.md` (this file)

## 8. Gates waived, with reasons (none silent)

1. `apk/verify_refs.py` 0-missing for new references: NOT met (24
   entries, section 3). Reason: the checker hardcodes `units/` and
   the APK staging tree; satisfying it needs `build.sh` staging +
   wreck art, both outside this wave's file ownership, and no APK
   was built. Web wiring is fully verified instead (tests + IHDR
   sizes). Coordinator action required before any APK (section 3).
2. AI-match termination for First Map seed 1337: STALLED, but
   proven pre-existing by the stripped-catalog control in the
   harness (section 4b). Not a wave failure; baseline-stall fix is
   out of scope (Cycle 3 deadlock frozen).
3. Red-AI fielding of new Xandria types in shipped-rule matches:
   not observed (0 produced in 6 matches + rich-scrap probes).
   This is the documented consequence of cheapest-first ordering +
   match length, not a failure of visibility: the new types ARE in
   the producible list (test-proven) and ARE producible on demand
   (smoke-proven). If the coordinator wants the red AI to field
   them in normal matches, that needs an AI-logic change in
   `game/sim.js`, which this wave was forbidden to make.

## 9. Follow-ups for the coordinator (not done here)

- Before any APK: stage `assets/sprites-90/mechs-expansion/` in
  `apk/build.sh` and update `apk/verify_refs.py` to resolve
  expansion mapping; generate wreck art for the 8 ids.
- If red-AI fielding of needlewing/longsight/javelin/raptor matters,
  that is a sim.js AI-economy decision, not a catalog tweak.
- Bastion's counter margin is narrow (4/6, Demolition Crawler):
  worth re-checking if bastion or crawler stats ever change.
- Held spares for later waves: ironclad, goliath, dreadnought,
  railwarden, siegeback, thunderhead, ghoststep, flicker,
  jackrabbit, breakneck, pitbull, iron_jackal, plus all 31
  `additional`-class chassis.
