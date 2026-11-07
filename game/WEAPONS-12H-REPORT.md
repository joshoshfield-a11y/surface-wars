# Surface Wars — WEAPONS-12H Wave 1 (WEAPONS) report

Scope: first-batch hero weapon tuning only. Files touched, and nothing
else: `game/weapons.js` (named-row multipliers/specials/tiers only —
the 12 family baselines are byte-identical, see the test below),
`tests/weapons12h.test.js` (new), `scripts/weapons12h-match.js` (new),
this report (new), plus ONE justified old-test update
(`tests/herophaseb.test.js`, Scrapstorm worked example — see §5).
No commit, push, merge, publish, or APK. Strict 90° top-down is
unaffected (no art, no view change). No religious language added;
the pre-existing faction name "Iron Eden" is untouched.

## 1. Claim verified in code before assuming it

Tuning named rows alone DOES change hero play, and the tuned rows ARE
surfaced in the UI — no `game.js` edit was needed:

- `game/game.js` `openLoadout()` builds the primary select from ALL
  `Weapons.NAMED_WEAPONS` with `slot === 'primary'` and the secondary
  select from ALL with `slot === 'secondary'`, listing rows above the
  hero's tier band as disabled with the level they need (never hidden).
- `updateLoSummary()` / the match path both call
  `Weapons.heroStats(loadout, HERO_BASE, …)`, which resolves each
  equipped row through `resolveWeapon` — so a retuned row's damage /
  interval / range flows straight into the field hero's weapons.
- Caveat (finding for a later wave, §6): utility-slot (Electronic
  Warfare) rows are data rows only — the validator rejects them in
  weapon slots and the loadout screen never offers a utility select —
  so EW rows tuned in a later batch would still not reach the hero
  without a UI/slot change. That is out of this wave's file ownership.

## 2. Audit summary (all 123 rows, DPS = damage × accuracy / interval)

Method: resolved every row through `resolveWeapon` (baseline +
multipliers), before and after. The headline finding: the catalog
was almost entirely undifferentiated.

- Before this wave, 119 of 123 rows resolved to EXACTLY their family
  baseline (ratio 1.00, no multipliers); the only exceptions were
  Scrapstorm Rotary Gun (1.70×), Hailstorm Minigun (2.00×), Toxic
  Dart Array (same DPS 20.40 via dmg 0.6 + int 0.6 — a genuine
  fast-small-hits sidegrade), and the special-only rows (same stats,
  differentiated by burn/pierce/stun/overheat alone).
- Near-duplicate classes before the wave (same family, slot, stats,
  and usually the same special): all 7 T1 Autocannon primaries were
  the identical 20.40 DPS row; all 5 T1 Heavy Cannon primaries were
  the identical 18.67 row; all 8 T2/T3 Laser primaries without a
  special were the identical 20.57 row; all 22 Melee secondaries
  without a special were the identical 29.69 row; all Mortar /
  Rocket / Siege primaries without a special were their baseline row.
- Tier inversion before the wave: every T3 row without a special was
  stat-identical to a T1 row of the same family (e.g. Meltdown
  Cannon T3 = Plasma Spitter T1 = 20.57 DPS; Helios Projector T3 =
  Null Ray T1; Cratermaker T3 = the Siege baseline a T1 row would
  also resolve to). A level-7 unlock bought nothing but the name.
  After this wave the tuned T3 rows are sidegrades (§3), not piles;
  the untuned T3 rows (Cratermaker, Atlas, Singularity Projector,
  Faultline Driver, The Last Argument, Entropy Cannon, Blackbox,
  Mimic Gun, Probability Engine, Nanite Swarm Injector, Mirror Core,
  Scrap Singularity, Storm Cage, Chrono Spike, Phase-Shear Cannon,
  Ghost Battery, Siege Nail Driver, Ghostlight, Phase Lance,
  Eventide, Starved Reactor) remain exact-baseline rows and are the
  natural next batch — most are NOT Lancer-equippable (Siege /
  Mortar / Rocket / utility), so a later batch touching them needs
  a match harness beyond the hero loadout to prove anything.
- Strictly dominated before the wave: no row was worse on DPS AND
  range AND special simultaneously against a same-family row, because
  almost everything was identical — the failure mode was duplication,
  not domination. The two bound violations were the opposite
  direction: Scrapstorm (1.70×) and Hailstorm (2.00×) exceeded the
  cycle's 1.5× family-baseline bound; both are retuned down below it.
- After this wave: max ratio across all 123 rows is Hailstorm at
  1.43×; every row is ≤ 1.5× its family baseline (asserted in tests).
  17 rows changed DPS; 1 further row (Plasma Machete) changed range
  only (1.2 → 1.5) at identical DPS. 105 rows unchanged.
- L1 anchor untouched: Twin-Bore Autogun still resolves to 12 damage,
  0.5 interval, range 6, 20.40 DPS; default-loadout heroStats still
  200 HP / Medium / 6.0 / vision 8 (asserted in tests, and the
  existing Phase B/C tests still pass unmodified on this point).

## 3. Batch changed (18 rows, all Lancer-equippable)

Design principle applied: tier-2/3 and special weapons are SIDEGRADES
with a named trade-off. No tuned row exceeds 1.5× its family baseline
DPS; no tuned primary exceeds 1.5× the anchor DPS (20.40 → cap 30.60;
max tuned primary is Hailstorm 29.14). Every row keeps ≤ 2 multipliers
and ≤ 1 special; no tier, slot, or family changed; no special added
or removed except none (all specials below are the row's pre-existing
special). "Before" is the pre-wave resolved value.

| Row (tier) | Before mult / special | After mult / special | DPS before → after (family ratio after) | Trade-off (the price of the gain) |
|---|---|---|---|---|
| Scrapstorm Rotary Gun (T2, Autocannon) | dmg 0.85, int 0.5 / overheat | dmg 0.9, int 0.65 / overheat | 34.68 → 27.82 (1.36×) | Overheat lockout after 4 s continuous fire (1.5 s forced cooldown); per-hit 10.8 < 12 |
| Hailstorm Minigun (T3, Autocannon) | int 0.5 / overheat | int 0.7, range 0.83 / overheat | 40.80 → 29.14 (1.43×) | Range 6 → 5 AND overheat lockout; the highest tuned DPS is also the shortest-range tuned primary |
| Widowmaker LMG (T2, Autocannon) | — / none | dmg 1.2, int 1.3 / none | 20.40 → 18.83 (0.92×) | Slower cadence (0.65 s) for bigger hits (14.4); sustained DPS BELOW the anchor |
| Sawtooth Repeater (T2, Autocannon) | — / none | dmg 0.8, int 0.7 / none | 20.40 → 23.31 (1.14×) | Per-hit 9.6 (−20%) for faster cadence; +14% sustained, weaker per shot |
| Thunderclap Autocannon (T2, Autocannon) | — / none | dmg 0.85, range 1.17 / none | 20.40 → 17.34 (0.85×) | Range 6 → 7 bought with per-hit 10.2 and DPS BELOW the anchor |
| Double-Feed (T2, Heavy Cannon) | — / none | dmg 1.15, int 1.25 / none | 18.67 → 17.17 (0.92×) | Slowest Heavy cadence in the batch (1.5 s) for 32.2 hits; DPS below baseline |
| Slugger Cannon (T2, Heavy Cannon) | — / pierce | dmg 0.9, range 1.14 / pierce | 18.67 → 16.80 (0.90×) | Range 7 → 8 bought with per-hit 25.2 and DPS below baseline; pierce kept (extra victim at 50%) |
| Bonecrusher (T2, Heavy Cannon) | — / none | dmg 1.3, int 1.4 / none | 18.67 → 17.33 (0.93×) | Biggest Heavy per-hit (36.4) at the slowest cadence (1.68 s); DPS below baseline |
| Meltdown Cannon (T3, Laser) | — / none | dmg 0.9, range 0.75 / none | 20.57 → 18.51 (0.90×) | Range 8 → 6 (anchor's range) and per-hit 14.4; DPS below the anchor — see §4 freeze-rule history |
| Helios Projector (T3, Laser) | — / none | dmg 0.85, range 1.25 / none | 20.57 → 17.49 (0.85×) | Range 8 → 10 bought with per-hit 13.6 and DPS below baseline |
| Horizon Cutter (T3, Laser) | — / none | dmg 0.8, int 0.65 / none | 20.57 → 25.60 (1.24×) | Per-hit 12.8 (−20%) for the fastest Laser cadence (0.45 s); +24% sustained, weakest Laser hit |
| Capacitor Rifle (T2, Railgun) | — / none | dmg 0.75, int 0.7 / none | 10.86 → 11.63 (1.07×) | Per-hit 30 (−25%) for a 2.45 s cadence; still min-range 6, still range 20 |
| Arc Thrower (T2, Railgun) | — / none | dmg 1.2, int 1.25 / none | 10.86 → 10.41 (0.96×) | Slowest Railgun cadence in the batch (4.38 s) for 48 hits; DPS below baseline |
| Furnace Shotgun (T2, Flamethrower) | — / burn | dmg 1.2, int 1.3 / burn | 27.00 → 24.92 (0.92×) | Slower cadence (0.39 s) for 10.8 burn hits; range 3 and ground-only targeting unchanged — the harshest range trade-off in the batch |
| Plasma Machete (T2, Melee 2nd) | — / none | range 1.25 / none | 29.69 → 29.69 (1.00×) | Reach 1.2 → 1.5 at IDENTICAL DPS — the only pure-reach sidegrade; melee range is still the trade-off vs every ranged weapon |
| Guillotine Arm (T3, Melee 2nd) | — / none | dmg 1.4, int 1.5 / none | 29.69 → 27.71 (0.93×) | Slowest melee cadence (1.2 s) for 35 hits; DPS below baseline |
| Phase Cutter (T3, Melee 2nd) | — / pierce | dmg 0.8, int 0.7 / pierce | 29.69 → 33.93 (1.14×) | Per-hit 20 (−20%) for a 0.56 s pierce flurry; melee range 1.2 unchanged |
| Bellringer (T2, Melee 2nd) | — / stun | dmg 1.2, int 1.3 / stun | 29.69 → 27.40 (0.92×) | Slower stunning blows (1.04 s, 30 hits); stun kept (speed halved 1.5 s); DPS below baseline |

Deliberately NOT retuned in this batch (audit notes): Railspike T3
(pierce already differentiates it, and its damage/interval are pinned
by an existing Phase B worked-example test — retuning it would break
that test for no batch need); Toxic Dart Array (already a genuine
sidegrade); all special-only rows whose special is their identity
(Furnace Bombard burn, Ion Needle pierce, EMP/Stun EW rows, etc.) —
they are differentiated, if weak, and a later batch should tune them
with their special cost in mind rather than by DPS alone.

## 4. Match data — scripts/weapons12h-match.js

Harness: same stand-in as `scripts/hero-match.js` (AI-red vs scripted
blue attack-move + mirrored blue economy, no blue salvage). The hero
fights under RTS orders (the harness cannot twin-stick) and does NOT
redeploy on death. Seed 20261030 (hero-match's default), cap 15000
ticks (750 s), First Map + Twin Bridges, 19 loadouts (default + 14
tuned primaries alone + 4 tuned-secondary combos) × 2 maps = 38
matches. "STALLED" = no winner within the cap. W-D-L counts wins for
iron_eden first. Run: `node scripts/weapons12h-match.js` (exit 0 =
no sweep; exit 1 = sweep, see below).

Sweep definition used (stated so the coordinator can re-judge it): a
tuned loadout sweeps if it wins EVERY map the default loadout fails
to win (default: 0 wins — First Map loss, Twin Bridges draw — so a
sweep = wins on both maps). Single-map flips are NOT sweeps under
this definition and are disclosed, not hidden: Meltdown, Helios,
Horizon, Capacitor, and Arc-Thrower each flip the default's First
Map loss to a win while stalling/drawing the second map. That pattern
— all five are range ≥ 8 weapons, and the fast First Map wins
(~1000–1140 ticks, vs the hero-off baseline win at 1068) track hero
survival at range more than DPS (Capacitor DPS 11.63 and Arc-Thrower
10.41 win First; Hailstorm DPS 29.14 at range 5 loses it) — is a
single-seed signal, not proof of dominance, and is flagged in §6 for
a multi-seed check before any of those five is called strong.

Freeze-rule history (no buff to the opponent at any point):
- Run 1: sweeps = Thunderclap, Meltdown (both won both maps).
  Thunderclap retuned down (dmg 0.9 → 0.85, range 1.33 → 1.17:
  DPS 18.36 → 17.34, range 8 → 7). Meltdown retuned down
  (int 1.3 → 1.5: DPS 19.78 → 17.14).
- Run 2: Thunderclap cleared (0 wins); Meltdown still swept at
  DPS 17.14 — DPS cuts were not the mechanism. Meltdown retuned
  down a second time on the mechanism instead: int mult dropped,
  range mult added (dmg 0.9, range 0.75: DPS 18.51, range 8 → 6).
- Run 3 (final, table below): sweeps = NONE, exit 0. Meltdown now
  1 win (First) + 1 draw (Second) — a single-map flip, not a sweep.

Final match table (seed 20261030, cap 15000 ticks):

| loadout | First Map | ticks | hero survived | Twin Bridges | ticks | hero survived | W-D-L |
|---|---|---|---|---|---|---|---|
| default | xandria (red 12/blue 0) | 2560 | no | draw (red 5/blue 2) | 3403 | no | 0-1-1 |
| scrapstorm | STALLED (red 3/blue 6) | 15000 | no | iron_eden (red 0/blue 6) | 1385 | no | 1-0-1 |
| hailstorm | xandria (red 12/blue 0) | 2893 | no | draw (red 5/blue 2) | 3871 | no | 0-1-1 |
| widowmaker | STALLED (red 1/blue 6) | 15000 | no | STALLED (red 3/blue 4) | 15000 | no | 0-0-2 |
| sawtooth | draw (red 2/blue 3) | 4973 | no | draw (red 4/blue 2) | 3273 | no | 0-2-0 |
| thunderclap | STALLED (red 1/blue 7) | 15000 | no | STALLED (red 1/blue 8) | 15000 | no | 0-0-2 |
| double-feed | draw (red 4/blue 3) | 3558 | no | draw (red 3/blue 2) | 3502 | no | 0-2-0 |
| slugger | STALLED (red 1/blue 7) | 15000 | no | iron_eden (red 0/blue 8) | 1244 | no | 1-0-1 |
| bonecrusher | STALLED (red 1/blue 7) | 15000 | no | STALLED (red 1/blue 4) | 15000 | no | 0-0-2 |
| meltdown | iron_eden (red 0/blue 8) | 1007 | no | draw (red 2/blue 2) | 4849 | no | 1-1-0 |
| helios | iron_eden (red 0/blue 7) | 1120 | yes | STALLED (red 1/blue 9) | 15000 | no | 1-0-1 |
| horizon | iron_eden (red 0/blue 9) | 994 | yes | STALLED (red 1/blue 6) | 15000 | no | 1-0-1 |
| capacitor | iron_eden (red 0/blue 7) | 1135 | yes | STALLED (red 3/blue 6) | 15000 | no | 1-0-1 |
| arc-thrower | iron_eden (red 0/blue 8) | 1102 | yes | STALLED (red 1/blue 8) | 15000 | yes | 1-0-1 |
| furnace-shotgun | STALLED (red 1/blue 7) | 15000 | no | STALLED (red 1/blue 7) | 15000 | no | 0-0-2 |
| hailstorm+guillotine | xandria (red 12/blue 0) | 2893 | no | draw (red 5/blue 2) | 3871 | no | 0-1-1 |
| hailstorm+phase-cutter | xandria (red 12/blue 0) | 2893 | no | draw (red 5/blue 2) | 3871 | no | 0-1-1 |
| widowmaker+machete | STALLED (red 1/blue 6) | 15000 | no | STALLED (red 3/blue 4) | 15000 | no | 0-0-2 |
| widowmaker+bellringer | STALLED (red 1/blue 6) | 15000 | no | STALLED (red 3/blue 4) | 15000 | no | 0-0-2 |

Reading the table honestly: 10 of 38 matches STALL at the cap, and
the hero dies in 32 of 38 — this harness measures army-vs-army
outcomes with a hero-shaped unit in the mix, not hero duels. No tuned
loadout sweeps. No tuned loadout is claimed "better" than default on
this evidence alone; the claim this wave makes is narrower: the batch
is differentiated, bounded, and sweep-free at this seed.

## 5. Tests

- New `tests/weapons12h.test.js`: 9 tests — 123-row count + 12
  baselines; every row ≤ 2 multipliers (keys restricted to the
  dmg/range/int keys `resolveWeapon` actually applies) + closed-list
  special + valid family/slot/tier; global ≤ 1.5× family-baseline DPS;
  exact resolved values for all 18 tuned rows; tuned primaries ≤ 1.5×
  anchor DPS; tier-band gating (reject below band, accept at band,
  secondary-tier rule, progression bands unchanged); heroStats
  resolves every tuned row at L1 and at its band level with chassis
  stats unchanged; L1 anchor unchanged; all 12 family baselines
  untouched.
- ONE old-test change, explicit and justified (never silent):
  `tests/herophaseb.test.js` "spec worked examples" asserted
  Scrapstorm damage 10.2 / interval 0.25 — the pre-wave values whose
  34.68 DPS (1.70× baseline) violated this cycle's 1.5× bound.
  Updated to the retuned 10.8 / 0.33 with a WEAPONS-12H comment.
  The same file's overheat test (Scrapstorm, accuracy forced to 1)
  still passes unchanged — overheat still forces the 1.5 s cooldown.
  No other old test was touched.
- Full suite at the end: 251/251 pass (242 baseline + 9 new),
  run as `node --test tests/*.test.js`.

## 6. Findings for later waves

1. Multi-seed match check needed before calling any range ≥ 8
   loadout strong: the five First-Map flips (§4) are single-seed and
   track range/survival, not DPS. Recommend re-running
   `weapons12h-match.js` at 2+ further seeds before buffing or
   nerfing any of them.
2. Secondaries measure as zero in this harness: all four
   primary+secondary combos reproduce their primary-only match
   EXACTLY (same winner, ticks, and wreck counts). The sim does
   iterate all weapons, so this is not a missing-secondary bug on
   its face — the likeliest reading is the RTS-ordered hero never
   gets a melee-range firing opportunity before dying — but it is
   unproven either way. A later wave should test secondaries with a
   close-range hero scenario (or twin-stick play) before tuning
   more melee rows on match evidence.
3. STALLED matches (10/38 at the 15000-tick cap) limit what this
   harness can say; several tuned loadouts end with 1 red unit
   standing. A longer cap or a damage-dealt tiebreak would sharpen
   later waves' comparisons.
4. Utility (EW) rows cannot reach the hero through the loadout UI
   (§1) — a later EW batch needs a slot/UI decision first, not just
   row tuning.
5. Next natural batch: the remaining exact-baseline T3 rows (§2),
   but most are non-Lancer families — prove them with a non-hero
   harness or not at all.
6. Cycle 3 deadlock frozen, Phase C caps (+45% HP / +18% damage at
   L10) untouched, twin-stick gates/cone/pool untouched — none of
   those systems were in this wave's files and none were modified.

## 7. Gates waived

None silently. The only gate-adjacent decisions, both disclosed
above: (a) one old-test expectation updated with justification (§5);
(b) the sweep definition is "wins every map the default fails to
win" (§4) — under a stricter "wins every map the default outright
loses" reading, five loadouts flip the default's single outright
loss (First Map) and would count as sweeps; they were NOT retuned
down on that reading because their DPS is at/below the anchor
(Meltdown 18.51, Capacitor 11.63, Arc-Thrower 10.41) or bounded
(Helios 17.49, Horizon 25.60 at 1.24× family / 1.25× anchor), and
cutting them to lose a single-seed First Map would have meant
designing weapons to lose, not sidegrades. The coordinator may
overrule this reading and direct further cuts.

## Appendix: full 123-row audit table (resolved values, post-wave)

DPS = damage × accuracy / interval. "TUNED" marks the 18 batch rows
(Plasma Machete is range-only, so its DPS is unchanged).

| id | name | family | slot | tier | special | range | splash | targets | DPS before | DPS after |
|---|---|---|---|---|---|---|---|---|---|---|
| nw_scrapstorm_rotary_gun | Scrapstorm Rotary Gun | Autocannon | primary | 2 | overheat | 6 | 0 | ground/structure | 34.68 | 27.82 **TUNED** |
| nw_ratchet_smg | Ratchet SMG | Autocannon | primary | 1 | none | 6 | 0 | ground/structure | 20.4 | 20.4 |
| nw_rivet_cannon | Rivet Cannon | Autocannon | primary | 1 | none | 6 | 0 | ground/structure | 20.4 | 20.4 |
| nw_twin_bore_autogun | Twin-Bore Autogun | Autocannon | primary | 1 | none | 6 | 0 | ground/structure | 20.4 | 20.4 |
| nw_widowmaker_lmg | Widowmaker LMG | Autocannon | primary | 2 | none | 6 | 0 | ground/structure | 20.4 | 18.83 **TUNED** |
| nw_brass_knuckle_cannon | Brass Knuckle Cannon | Autocannon | primary | 1 | none | 6 | 0 | ground/structure | 20.4 | 20.4 |
| nw_sawtooth_repeater | Sawtooth Repeater | Autocannon | primary | 2 | none | 6 | 0 | ground/structure | 20.4 | 23.31 **TUNED** |
| nw_hailstorm_minigun | Hailstorm Minigun | Autocannon | primary | 3 | overheat | 5 | 0 | ground/structure | 40.8 | 29.14 **TUNED** |
| nw_coil_feed_carbine | Coil-Feed Carbine | Autocannon | primary | 1 | none | 6 | 0 | ground/structure | 20.4 | 20.4 |
| nw_salvagers_nailgun | Salvager's Nailgun | Autocannon | primary | 1 | none | 6 | 0 | ground/structure | 20.4 | 20.4 |
| nw_breacher_12 | Breacher-12 | Heavy Cannon | primary | 1 | none | 7 | 0 | ground/structure | 18.67 | 18.67 |
| nw_door_kicker | Door-Kicker | Heavy Cannon | primary | 1 | none | 7 | 0 | ground/structure | 18.67 | 18.67 |
| nw_furnace_shotgun | Furnace Shotgun | Flamethrower | primary | 2 | burn | 3 | 1.5 | ground | 27 | 24.92 **TUNED** |
| nw_scatterjack | Scatterjack | Heavy Cannon | primary | 1 | none | 7 | 0 | ground/structure | 18.67 | 18.67 |
| nw_double_feed | Double-Feed | Heavy Cannon | primary | 2 | none | 7 | 0 | ground/structure | 18.67 | 17.17 **TUNED** |
| nw_slugger_cannon | Slugger Cannon | Heavy Cannon | primary | 2 | pierce | 8 | 0 | ground/structure | 18.67 | 16.8 **TUNED** |
| nw_shredder_8 | Shredder-8 | Heavy Cannon | primary | 1 | none | 7 | 0 | ground/structure | 18.67 | 18.67 |
| nw_backblast_shotgun | Backblast Shotgun | Heavy Cannon | primary | 1 | none | 7 | 0 | ground/structure | 18.67 | 18.67 |
| nw_bonecrusher | Bonecrusher | Heavy Cannon | primary | 2 | none | 7 | 0 | ground/structure | 18.67 | 17.33 **TUNED** |
| nw_maglock_shotgun | Maglock Shotgun | Heavy Cannon | primary | 2 | none | 7 | 0 | ground/structure | 18.67 | 18.67 |
| nw_mule_40_grenade_lobber | MULE-40 Grenade Lobber | Mortar | primary | 2 | none | 12 | 2 | ground/structure | 8 | 8 |
| nw_burrower_rocket_pod | Burrower Rocket Pod | Rocket Artillery | primary | 2 | none | 16 | 3 | ground/structure | 8 | 8 |
| nw_cratermaker | Cratermaker | Siege Cannon | primary | 3 | none | 18 | 2.5 | ground/structure | 11 | 11 |
| nw_scrap_mortar | Scrap Mortar | Mortar | primary | 1 | none | 12 | 2 | ground/structure | 8 | 8 |
| nw_clusterbug_launcher | Clusterbug Launcher | Rocket Artillery | primary | 2 | none | 16 | 3 | ground/structure | 8 | 8 |
| nw_breach_missile | Breach Missile | Missile Launcher | primary | 2 | none | 9 | 1.5 | ground/air/structure | 13.36 | 13.36 |
| nw_siege_nail_driver | Siege Nail Driver | Siege Cannon | primary | 3 | pierce | 18 | 2.5 | ground/structure | 11 | 11 |
| nw_thunderclap_autocannon | Thunderclap Autocannon | Autocannon | primary | 2 | none | 7 | 0 | ground/structure | 20.4 | 17.34 **TUNED** |
| nw_hopper_mine_dispenser | Hopper Mine Dispenser | Mortar | primary | 2 | none | 12 | 2 | ground/structure | 8 | 8 |
| nw_atlas_shoulder_howitzer | Atlas Shoulder Howitzer | Siege Cannon | primary | 3 | none | 18 | 2.5 | ground/structure | 11 | 11 |
| nw_furnace_bombard | Furnace Bombard | Mortar | primary | 3 | burn | 12 | 2 | ground/structure | 8 | 8 |
| nw_ricochet_cannon | Ricochet Cannon | Heavy Cannon | primary | 2 | none | 7 | 0 | ground/structure | 18.67 | 18.67 |
| nw_plasma_spitter | Plasma Spitter | Laser | primary | 1 | none | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_blueglass_rifle | Blueglass Rifle | Laser | primary | 2 | none | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_arc_furnace | Arc Furnace | Laser | primary | 2 | overheat | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_sunspot_blaster | Sunspot Blaster | Laser | primary | 2 | none | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_ion_needle | Ion Needle | Laser | primary | 2 | pierce | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_meltdown_cannon | Meltdown Cannon | Laser | primary | 3 | none | 6 | 0 | ground/air/structure | 20.57 | 18.51 **TUNED** |
| nw_plasma_saw | Plasma Saw | Laser | primary | 2 | none | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_ghostlight_projector | Ghostlight Projector | Laser | primary | 3 | pierce | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_cindercoil | Cindercoil | Laser | primary | 2 | burn | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_starved_reactor | Starved Reactor | Laser | primary | 3 | none | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_arc_thrower | Arc Thrower | Railgun | primary | 2 | none | 20 | 0 | ground/structure | 10.86 | 10.41 **TUNED** |
| nw_magnetar_cannon | Magnetar Cannon | Railgun | primary | 2 | none | 20 | 0 | ground/structure | 10.86 | 10.86 |
| nw_emp_carbine | EMP Carbine | Electronic Warfare | utility | 2 | stun | 7 | 0 | ground/air | 2.7 | 2.7 |
| nw_tesla_fork | Tesla Fork | Railgun | primary | 2 | none | 20 | 0 | ground/structure | 10.86 | 10.86 |
| nw_static_harpoon | Static Harpoon | Railgun | primary | 1 | none | 20 | 0 | ground/structure | 10.86 | 10.86 |
| nw_railspike | Railspike | Railgun | primary | 3 | pierce | 20 | 0 | ground/structure | 10.86 | 10.86 |
| nw_storm_cage | Storm Cage | Electronic Warfare | utility | 3 | stun | 7 | 0 | ground/air | 2.7 | 2.7 |
| nw_flux_hammer | Flux Hammer | Railgun | primary | 2 | none | 20 | 0 | ground/structure | 10.86 | 10.86 |
| nw_capacitor_rifle | Capacitor Rifle | Railgun | primary | 2 | none | 20 | 0 | ground/structure | 10.86 | 11.63 **TUNED** |
| nw_blackout_emitter | Blackout Emitter | Electronic Warfare | utility | 2 | stun | 7 | 0 | ground/air | 2.7 | 2.7 |
| nw_redline_laser | Redline Laser | Laser | primary | 2 | burn | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_prism_rifle | Prism Rifle | Laser | primary | 2 | none | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_phase_lance | Phase Lance | Laser | primary | 3 | pierce | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_mirrorbeam | Mirrorbeam | Laser | primary | 2 | none | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_null_ray | Null Ray | Laser | primary | 1 | none | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_helios_projector | Helios Projector | Laser | primary | 3 | none | 10 | 0 | ground/air/structure | 20.57 | 17.49 **TUNED** |
| nw_photon_scatterer | Photon Scatterer | Laser | primary | 1 | none | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_afterimage_emitter | Afterimage Emitter | Laser | primary | 2 | none | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_horizon_cutter | Horizon Cutter | Laser | primary | 3 | none | 8 | 0 | ground/air/structure | 20.57 | 25.6 **TUNED** |
| nw_eventide_cannon | Eventide Cannon | Laser | primary | 3 | none | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_rustfang | Rustfang | Melee Weapon | secondary | 1 | none | 1.2 | 0 | ground/structure | 29.69 | 29.69 |
| nw_arc_cleaver | Arc Cleaver | Melee Weapon | secondary | 1 | none | 1.2 | 0 | ground/structure | 29.69 | 29.69 |
| nw_plasma_machete | Plasma Machete | Melee Weapon | secondary | 2 | none | 1.5 | 0 | ground/structure | 29.69 | 29.69 |
| nw_monorail_blade | Monorail Blade | Melee Weapon | secondary | 2 | none | 1.2 | 0 | ground/structure | 29.69 | 29.69 |
| nw_rotary_sawarm | Rotary Sawarm | Melee Weapon | secondary | 2 | none | 1.2 | 0 | ground/structure | 29.69 | 29.69 |
| nw_chain_glaive | Chain Glaive | Melee Weapon | secondary | 2 | none | 1.2 | 0 | ground/structure | 29.69 | 29.69 |
| nw_guillotine_arm | Guillotine Arm | Melee Weapon | secondary | 3 | none | 1.2 | 0 | ground/structure | 29.69 | 27.71 **TUNED** |
| nw_vibroknife | Vibroknife | Melee Weapon | secondary | 1 | none | 1.2 | 0 | ground/structure | 29.69 | 29.69 |
| nw_glass_edge | Glass Edge | Melee Weapon | secondary | 2 | none | 1.2 | 0 | ground/structure | 29.69 | 29.69 |
| nw_furnace_sword | Furnace Sword | Melee Weapon | secondary | 2 | burn | 1.2 | 0 | ground/structure | 29.69 | 29.69 |
| nw_splitter_axe | Splitter Axe | Melee Weapon | secondary | 2 | none | 1.2 | 0 | ground/structure | 29.69 | 29.69 |
| nw_phase_cutter | Phase Cutter | Melee Weapon | secondary | 3 | pierce | 1.2 | 0 | ground/structure | 29.69 | 33.93 **TUNED** |
| nw_pile_driver_fist | Pile-Driver Fist | Melee Weapon | secondary | 1 | none | 1.2 | 0 | ground/structure | 29.69 | 29.69 |
| nw_wrecking_maul | Wrecking Maul | Melee Weapon | secondary | 1 | none | 1.2 | 0 | ground/structure | 29.69 | 29.69 |
| nw_seismic_hammer | Seismic Hammer | Melee Weapon | secondary | 2 | none | 1.2 | 0 | ground/structure | 29.69 | 29.69 |
| nw_anchor_fist | Anchor Fist | Melee Weapon | secondary | 1 | none | 1.2 | 0 | ground/structure | 29.69 | 29.69 |
| nw_hydraulic_crusher | Hydraulic Crusher | Melee Weapon | secondary | 2 | none | 1.2 | 0 | ground/structure | 29.69 | 29.69 |
| nw_bellringer | Bellringer | Melee Weapon | secondary | 2 | stun | 1.2 | 0 | ground/structure | 29.69 | 27.4 **TUNED** |
| nw_corebreaker | Corebreaker | Melee Weapon | secondary | 2 | none | 1.2 | 0 | ground/structure | 29.69 | 29.69 |
| nw_gravity_mallet | Gravity Mallet | Melee Weapon | secondary | 2 | none | 1.2 | 0 | ground/structure | 29.69 | 29.69 |
| nw_demolition_ram | Demolition Ram | Melee Weapon | secondary | 2 | none | 1.2 | 0 | ground/structure | 29.69 | 29.69 |
| nw_foundry_sledge | Foundry Sledge | Melee Weapon | secondary | 2 | none | 1.2 | 0 | ground/structure | 29.69 | 29.69 |
| nw_rebar_bowcaster | Rebar Bowcaster | Missile Launcher | primary | 1 | none | 9 | 1.5 | ground/air/structure | 13.36 | 13.36 |
| nw_toaster_turret | Toaster Turret | Autocannon | primary | 1 | none | 6 | 0 | ground/structure | 20.4 | 20.4 |
| nw_forklift_forks | Forklift Forks | Melee Weapon | secondary | 1 | none | 1.2 | 0 | ground/structure | 29.69 | 29.69 |
| nw_industrial_stapler | Industrial Stapler | Melee Weapon | secondary | 1 | none | 1.2 | 0 | ground/structure | 29.69 | 29.69 |
| nw_propane_lance | Propane Lance | Flamethrower | secondary | 1 | burn | 3 | 1.5 | ground | 27 | 27 |
| nw_compressed_junk_cannon | Compressed Junk Cannon | Heavy Cannon | primary | 1 | none | 7 | 0 | ground/structure | 18.67 | 18.67 |
| nw_microwave_emitter | Microwave Emitter | Laser | primary | 2 | none | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_emergency_flare_gun | Emergency Flare Gun | Flamethrower | secondary | 1 | burn | 3 | 1.5 | ground | 27 | 27 |
| nw_concrete_mixer | Concrete Mixer | Flamethrower | secondary | 2 | none | 3 | 1.5 | ground | 27 | 27 |
| nw_the_negotiator | The Negotiator | Melee Weapon | secondary | 2 | none | 1.2 | 0 | ground/structure | 29.69 | 29.69 |
| nw_cursed_office_printer | Cursed Office Printer | Rocket Artillery | primary | 2 | none | 16 | 3 | ground/structure | 8 | 8 |
| nw_breakroom_special | Breakroom Special | Laser | primary | 2 | none | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_acid_sprayer | Acid Sprayer | Flamethrower | secondary | 2 | none | 3 | 1.5 | ground | 27 | 27 |
| nw_corrosion_needle | Corrosion Needle | Flamethrower | secondary | 2 | none | 3 | 1.5 | ground | 27 | 27 |
| nw_spore_mortar | Spore Mortar | Mortar | primary | 2 | none | 12 | 2 | ground/structure | 8 | 8 |
| nw_leech_harpoon | Leech Harpoon | Railgun | secondary | 2 | none | 20 | 0 | ground/structure | 10.86 | 10.86 |
| nw_rust_cloud_projector | Rust Cloud Projector | Mortar | primary | 2 | none | 12 | 2 | ground/structure | 8 | 8 |
| nw_caustic_foam_gun | Caustic Foam Gun | Flamethrower | secondary | 2 | stun | 3 | 1.5 | ground | 27 | 27 |
| nw_furnace_gel_launcher | Furnace Gel Launcher | Mortar | primary | 3 | burn | 12 | 2 | ground/structure | 8 | 8 |
| nw_cryogenic_mist_cannon | Cryogenic Mist Cannon | Flamethrower | secondary | 2 | stun | 3 | 1.5 | ground | 27 | 27 |
| nw_cryo_piercer | Cryo-Piercer | Railgun | primary | 2 | pierce | 20 | 0 | ground/structure | 10.86 | 10.86 |
| nw_toxic_dart_array | Toxic Dart Array | Autocannon | secondary | 1 | none | 6 | 0 | ground/structure | 20.4 | 20.4 |
| nw_nanite_swarm_injector | Nanite Swarm Injector | Mortar | primary | 3 | none | 12 | 2 | ground/structure | 8 | 8 |
| nw_biomass_reclaimer | Biomass Reclaimer | Electronic Warfare | utility | 2 | none | 7 | 0 | ground/air | 2.7 | 2.7 |
| nw_probability_engine | Probability Engine | Laser | primary | 3 | none | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_echo_rifle | Echo Rifle | Laser | primary | 2 | none | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_chrono_spike | Chrono Spike | Railgun | primary | 3 | stun | 20 | 0 | ground/structure | 10.86 | 10.86 |
| nw_phase_shear_cannon | Phase-Shear Cannon | Railgun | primary | 3 | pierce | 20 | 0 | ground/structure | 10.86 | 10.86 |
| nw_blackbox_launcher | Blackbox Launcher | Missile Launcher | primary | 3 | none | 9 | 1.5 | ground/air/structure | 13.36 | 13.36 |
| nw_singularity_projector | Singularity Projector | Siege Cannon | primary | 3 | none | 18 | 2.5 | ground/structure | 11 | 11 |
| nw_faultline_driver | Faultline Driver | Siege Cannon | primary | 3 | none | 18 | 2.5 | ground/structure | 11 | 11 |
| nw_mimic_gun | Mimic Gun | Laser | primary | 3 | none | 8 | 0 | ground/air/structure | 20.57 | 20.57 |
| nw_entropy_cannon | Entropy Cannon | Heavy Cannon | primary | 3 | none | 7 | 0 | ground/structure | 18.67 | 18.67 |
| nw_ghost_battery | Ghost Battery | Railgun | primary | 3 | overheat | 20 | 0 | ground/structure | 10.86 | 10.86 |
| nw_redshift_rifle | Redshift Rifle | Railgun | primary | 2 | none | 20 | 0 | ground/structure | 10.86 | 10.86 |
| nw_dead_channel | Dead Channel | Electronic Warfare | utility | 2 | stun | 7 | 0 | ground/air | 2.7 | 2.7 |
| nw_mirror_core | Mirror Core | Electronic Warfare | utility | 3 | none | 7 | 0 | ground/air | 2.7 | 2.7 |
| nw_scrap_singularity | Scrap Singularity | Electronic Warfare | utility | 3 | none | 7 | 0 | ground/air | 2.7 | 2.7 |
| nw_the_last_argument | The Last Argument | Siege Cannon | primary | 3 | none | 18 | 2.5 | ground/structure | 11 | 11 |
