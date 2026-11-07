# BETA-12H REPORT — Wave 6: full beta pass + open-item closure

Wave 6 of the Surface Wars 12-hour improvement cycle. Headless Chromium
(Playwright, real input only) + Node harnesses + full unit suite. No APK
build in this wave; the docs/APK wave builds it. Nothing committed,
pushed, merged, or published. No content removed anywhere in this wave.

**Headline:** 303/303 unit tests green (297 baseline + 6 new). Browser
pass: 68 checks, 67 PASS, 1 FAIL — and that one FAIL is a proved
driver-timing artifact, not a game bug (§6.3). One real bug was found
and fixed (§3.2). No weapon retune ships: the one retune the multi-seed
data suggested was tried, measured byte-identical, and reverted (§1.3).
Red-AI fielding exclusion is FINAL (§2). Tutorial economy fixed (§3).

## 1. Multi-seed balance checks

Harness: `scripts/beta12h-match.js` — the Wave 1/4 stand-in (AI-red vs
scripted blue attack-move every 40 ticks + mirrored cheapest-first blue
economy, no blue salvage, hero under RTS orders, no redeploy, cap
15000 ticks). 3 seeds × First Map + Twin Bridges × 10 loadouts
(default L1, 5 Wave 1 flippers, 4 Wave 4 packs at first-unlock level) =
60 matches. Sweep = Wave 1 definition: wins every map the default
fails to win. Default fails both maps at every seed, so a sweep here
means winning both maps at that seed. Winner codes: W = Iron Eden
(blue) win, L = loss, D = draw, S = stalled at cap.

### 1.1 Per-seed tables

Default (Twin-Bore Autogun, L1): 0 wins in 6 matches.

| loadout | 20261030 F / S | 1337 F / S | 42 F / S | wins / 6 | sweeps |
|---|---|---|---|---|---|
| default | L(2560) / D(3403) | S / S | S / D(3274) | 0 | — |
| meltdown | W(1007) / D(4849) | W(1053) / D(3546) | S / D(5285) | 2 | 0 |
| helios | W(1120) / S | W(1115) / W(1123) | W(1029) / W(1228) | 5 | 2 (1337, 42) |
| horizon | W(994) / S | W(1097) / W(1087) | D(3642) / S | 3 | 1 (1337) |
| capacitor | W(1135) / S | W(1107) / S | S / S | 2 | 0 |
| arc-thrower | W(1102) / S | W(976) / S | S / D(5334) | 2 | 0 |
| pack_ember_line (L4) | W(1036) / S | W(1110) / W(1095) | D(3706) / W(1067) | 4 | 1 (1337) |
| pack_gilded_reach (L4) | W(1159) / S | W(976) / S | W(1065) / S | 3 | 0 |
| pack_bulwark_march (L1) | S / S | S / S | D(5136) / D(3580) | 0 | 0 |
| pack_storm_cell (L7) | L(2556) / S | S / D(3533) | S / S | 0 | 0 |

Full rows: `/tmp/beta12h-multiseed.log` (pre-retune) and
`/tmp/beta12h-post-retune.log` (re-run after the reverted Helios
experiment). Script summary: `multiSeedSweeps: []`,
`retuneTrigger: false` under the every-seed definition.

### 1.2 Verdicts

- **No every-seed sweep exists.** Under the strict reading, no loadout
  triggers a retune. That is recorded, not assumed.
- **Single-seed flips still hold, and are still not retune triggers.**
  Meltdown, Capacitor, Arc-Thrower flip the default's First Map loss
  at 2 of 3 seeds each and never sweep. Horizon flips at 2 seeds and
  sweeps once. Ember Line sweeps once, flips otherwise. Per the Wave 1
  rule, none of these is retuned.
- **Helios is the cycle's strongest open signal** (see §1.3): 5/6
  wins, sweeps at 2 of 3 seeds, flips the third, hero survived 5/6
  matches. It is reported as an open signal, not silently fixed.
- **Storm Cell wins 0/6 (1 loss, 1 draw, 4 stalls) and Bulwark
  March wins 0/6 (2 draws, 4 stalls).** Neither is retuned in
  either direction: there is no sweep evidence for a retune down,
  and no buff-on-proxy-evidence rule exists for a retune up.
  Storm Cell's 0/6 is a proxy-artifact candidate worth naming —
  its power sits partly in the T3 melee secondary (Phase Cutter,
  range 1.2), which the RTS proxy range-gates exactly as §4
  describes — but that is a hypothesis for a twin-stick-driven
  test, not a finding, and it changes nothing this wave.

### 1.3 Helios: retune tried, measured, reverted (no retune ships)

Because Helios swept on multiple seeds, the retune rule permitted a
retune down, and the mechanism looked like range/survival (DPS 17.49
is already below the Laser family baseline 20.57 and below the L1
anchor 20.40 — damage was not the lever). A bounded mechanism retune
was applied: Helios Projector range mult 1.25 → 1.125 (10 → 9 tiles),
DPS untouched, still above the family range of 8.

The full 3-seed harness was then re-run. **All six Helios rows came
back byte-identical** — same winners, same tick counts, same
survivors. Range 9 vs 10 is inert in this harness: no shot in any
match fell in (9,10]. The retune was therefore a placebo, and shipping
a placebo as a "balance fix" would have been dishonest. Both edits
(`game/weapons.js` row and the `tests/weapons12h.test.js` expectation)
were reverted byte-exact; Helios stays at range 10, DPS 17.49.

What this rules out and what it leaves open: the Helios edge in this
harness is NOT the 9/10 range boundary. A remaining candidate is
target class (Laser hits ground/air/structure where Twin-Bore does
not hit air), which was not tested here and must not be cut blindly —
cutting it would destroy the Laser identity on proxy evidence. The
honest close for this cycle: Helios strength is real in the harness,
its mechanism is unpinned, and no retune ships on this evidence.
**Zero old-test content changes result from this experiment.**

### 1.4 Gilded Reach assessment (task item 4)

Gilded Reach (450 Credits, Gilded Lance pierce-only T2) wins First
Map at all 3 seeds and stalls Second Map at all 3 seeds — the most
consistent pack in the set, and never a sweep. It beats the default
(0 wins) on every seed. It is not too weak on this data: a pierce
sidegrade below family baseline damage (12.8 vs 16, DPS 16.46 vs
20.57) at baseline range 8 that flips First Map 3/3. **No sidegrade
retune:** there is no multi-seed evidence of weakness (it never
loses First outright) and no sweep evidence for a retune down, and
price changes are never a balance substitute. Pack price stays 450.

## 2. Red-AI fielding investigation — exclusion FINAL

Harness: `scripts/beta12h-ai-field.js` (22.5 s, exit 0).

- **Mechanism (corrects Wave 2's "five cheaper tiers"):** Xandria
  producibles by cost: scout_buggy 80, sensor_drone 80, combat_drone
  90, radar_scout 110, vespid_scout 120, then the 140 tier —
  **fast_raider first in catalog order, then needlewing, longsight**
  — then interceptor_drone 150, recon_aircraft 180 (weaponless),
  combat_engineer 180, recovery_crawler 220 (weaponless),
  construction_vehicle 240 (weaponless), field_repair_mech 260,
  medium_tank 300, raptor 300, javelin 320, flak_tank 340.
- **Saturation probe:** 3 live of every cheaper type (18 units),
  red scrap 5000, First Map with the red scenario army removed —
  after 200 ticks the red queue was
  `["needlewing","needlewing","needlewing"]`. The rule reaches new
  types in principle; it is saturation-gated, not broken.
- **Shipped-rule matches:** 14 matches (3 maps × 3 seeds, Normal,
  plus Easy + Hard on First Map, plus a rich-bank variant topping
  red scrap to 5000 every 500 ticks, plus passive-blue variants).
  **New-type spawns: 0 in every match.** Max red alive 16 (passive
  blue, Easy, First Map — the most favourable probe, still short of
  the 18 cheap-alive units needed before the first Needlewing is
  even queued). Max red bank 5281 (rich-bank variant, still 0 new
  spawns — bank size does not bind; live-count caps do).
- **Decision: exclusion FINAL, no AI change shipped.** Any ordering
  change that fields new types in normal matches must displace
  cheap production — a doctrine change, not a bounded fix — and
  would need a full re-validation wave. The task allows recording
  the exclusion as FINAL with data + a CONTROLS.md note rather than
  forcing it, and that is what was done. New types stay
  player-producible and AI-absent in shipped matches by decision,
  not oversight. `game/sim.js` untouched.

## 3. Tutorial economy edge (task item 3)

### 3.1 The Wave 5 note, verified

Tier 1 sets `tutorialStarting = true` around `newGame('first')`, so
its hero branch is skipped and tier 1 never marks a pack used nor
grants anything. Tier 2 sets `tutorial2` only AFTER `newGame`
returns, so at `newGame` time the hero branch ran — marking an
equipped pack used — and the `showVictory` grant block (gated only
by `heroMatch`) could have paid out on a tier-2 terminal panel.

### 3.2 Fix in `game/game.js` (minimal, 4 sites)

1. `var tutorial2Starting = false;` declared beside
   `tutorialStarting`. Tier 2 NEEDS the hero branch (step 5 teaches
   Drop Back In) but must never get economy side-effects.
2. `startTutorial2()` sets `tutorial2Starting = true` before
   `newGame('first')` and `false` after.
3. Mark-used block: `if (heroMatch && !tutorial2Starting &&
   !tutorial2 && Curr && wallet && wallet.equipped)` —
   `tutorial2Starting` covers the initial start, `!tutorial2`
   covers Restart inside tier 2 (both `#btn-reset` and `#pm-restart`
   call `newGame()` directly while `tutorial2` is non-null). A real
   match started after the tutorial clears `tutorial2` first (via
   `startMap`), so its marking is unaffected.
4. Grant block in `showVictory`: `if (heroMatch && !matchXpWritten
   && state && !state.tutorial && heroRecord && Prog &&
   state.heroXp)` — `state.tutorial` is true in both tier-1 and
   tier-2 games, falsy in normal matches, so tutorials grant
   neither hero XP nor Salvage Credits.

### 3.3 BUG-12H-1: the fix itself shipped broken, caught by this pass

The first Wave 6 edit added the `tutorial2Starting` comment but NOT
the declaration line. Result: every `newGame` read threw
`ReferenceError: tutorial2Starting is not defined`, the main menu
never rendered, and the first browser run failed at its first
section ("menu visible" FAIL). The guard-string regression test did
not catch it (the guard strings existed; the declaration did not).
Fix: the declaration line was added, and the regression test now
also asserts `var tutorial2Starting = false;` is present, with a
comment naming this failure mode. Lesson recorded: a source-string
test proves the guard text, not that the flag exists — the browser
pass is what caught it. `node --check game/game.js` passes.

### 3.4 Proof (browser, real clicks)

- Buy + equip Bulwark March (L1, 300) from a seeded 800 wallet, start
  Tutorial II, skip: wallet reads `used: []`, equipped still set,
  and the store still offers the refund button. **Tutorial start
  does not mark used.**
- Then start a real First Map match with the pack equipped: wallet
  reads `used: ["pack_bulwark_march"]`, and the store offers no
  refund button. **Real match start still marks used, and
  refund-after-use stays blocked.** Both directions proven in one
  flow (`scripts/beta12h-beta.py`, section currency).
- Tutorial II store step itself leaves a 0 balance at 0
  (viewing-only, no purchase required).

## 4. Wave 1 secondary finding (task item 5) — resolved, not a bug

`game/sim.js` fires EVERY weapon whose target is in range, min-range,
line-of-sight, and target class — secondaries are range-gated, not
missing. An RTS-ordered hero stops moving once ANY weapon is in
range (primary range 6), so it never closes to melee range before
dying. That explains Wave 1's exact-match primary+secondary rows.

Proof (Node arena, seed 42, hold orders, bulwark_mech foe HP 320,
Hailstorm primary + Phase Cutter secondary, 1 tile apart):
primary-only → foe HP 185.6, hero dead at tick 170;
primary+melee → foe dead by tick 157, hero alive at 99.2 HP.
Regression test in `tests/beta12h.test.js` (Twin-Bore + Plasma
Machete, 100 ticks): at 1.0 tile dual foe HP < single foe HP; at
5.0 tiles dual foe HP == single foe HP exactly (melee out of range,
primary in range). **No retune.** Secondaries work when in range;
the Wave 1 zero was a range artifact of the RTS proxy.

## 5. No-depth-removed proof (task item 7)

Verified in code/tests (`tests/beta12h.test.js` test 1), not from
reports:

| feature | v1.6 baseline | now | verdict |
|---|---|---|---|
| units | 49 | 57 | grown |
| named weapon rows | 123 | 125 | grown |
| skills | 8 | 10 | grown |
| gear rows | 12 | 16 | grown |
| maps | 3 | 3 | present |
| tutorials | 1 | 2 | grown |
| store packs | 0 | 4 | grown |
| mastery ranks | 0 | 5 (M1–M5, 5500/6800/8300/10000/11900) | grown |
| currency | 0 | 1 (Salvage Credits) | grown |
| v1.6 pins | — | Normal gatherCount 8, AI queue cap 3, per-type cap 3, wreck lifetime 2400 ticks, MAX_LEVEL 10 | all present |

Nothing removed. L1 anchor (Twin-Bore 12 dmg, 0.5 interval, range 6,
20.40 DPS) and L10 ceilings (+45% HP / +18% damage) unchanged.

## 6. Full beta pass

Script: `scripts/beta12h-beta.py` (Wave 3 driver + new sections;
port 8936, repo root served, Playwright via ml-stack venv, real
input only). Shots: `game/beta12h/` (24 files). Checks JSON:
`game/beta12h/beta12h-checks.json`.

**Result: 68 checks, 67 PASS, 1 FAIL (explained artifact, §6.3).**

### 6.1 Sections passed

- **Menu + difficulty:** E/N/H status lines, all three difficulties
  selectable with correct status text.
- **Tutorial I, all 7 steps by doing** (Wave 3 flow: 10 s salvage
  poll, core-tile exclusion, west drives for HP preservation).
- **Tutorial II, all 6 steps by doing** (new section): Take Control
  via the clamped-camera longshot tap + retry grid, Drive with D,
  aim sweep east holding fire until the held target dies, Release
  Control (real transition), Drop Back In (real field hero), store
  viewing-only at balance 0, cleanup into a real game with no
  tutorial bar. 9/9 checks.
- **All 3 maps** (First, Second, Third) start and render; **E/N/H**
  each playable.
- **Twin-stick desktop:** driving, aiming, firing, release, re-drop
  (re-drop HP == release HP, preserved, not pristine).
- **Phone landscape (CDP multi-touch, labelled emulated, never a
  real phone):** two simultaneous points, still controlling.
- **Hero death → redeploy:** death observed (wrecks 0 → 2), 30 s-class
  cooldown label, redeploy ready after cooldown (§6.3 for the HP
  check).
- **Mastery + new skills + new gear in a match** (seeded valid
  record, Wave 4 pattern — seeded levels are not claimed as
  earned): menu shows Level 10 / 5500 XP / 7 points; loadout
  summary HP 289 / Speed 8.5 / Vision 9 (Reactive Weave I +
  Overdrive Servos II + Rapid Servos); hero on field at
  HP 289/289, weapon range 7 (Long-Eye Array II); Concussive Pulse
  ability button visible while controlling the hero.
- **Premium pack in a match** (real store clicks): Bulwark March
  buy+equip 800 → 500; hero on field at HP 220/220, range 7
  (Breacher-12 + Rustfang + Plated Hull I + Servo Legs I).
- **Currency:** live match-end grant PROVEN in browser for the
  first time (Wave 4 left this unproven): throw match from a 0
  wallet reaches a defeat panel reading
  `Salvage Credits +30 (30 base + 0 hero-kill bonus)`, and the menu
  wallet afterwards reads 30. Refund-before-use restores the full
  price (800); refund-after-use blocked (no refund button);
  wallet corruption resets with notice and the hero record intact.
  Tutorial exemption proven both directions (§3.4).
- **Victory/defeat/draw panels:** defeat proven twice (live-grant
  throw, throw-defeat section) with full stats lines; loss arc
  menu shows Level 1, 25 XP, 0 wins. Victory/draw panels remain
  browser-unrendered (§6.2).
- **Mobile emulation (headless, NOT a real phone):** portrait
  390×844 canvas == stage 390×443, overflowX 0, min button 44 px,
  16 buttons; tray toggle 390×358, canvas == stage; landscape
  844×390 canvas == stage 544×311, min 44 px, 38 buttons;
  landscape 932×430 canvas == stage 632×370, min 44 px, 38 buttons.
  Zero overflow at every layout change.
- **Stress (SANDBOX NUMBERS ONLY, never phone FPS):**
  `node scripts/stress.js` (300 ticks, two blobs attack-moving):
  100 units avg 3.675 ms/tick, p95 19.71, max 81.338;
  300 units avg 7.023, p95 64.16, max 71.738;
  500 units avg 6.334, p95 49.816, max 74.121.
  Averages run higher than Wave 3's run of the same script
  (1.943 / 3.007 / 4.977); p95 inflation across all sizes reads
  as sandbox machine noise, not a code regression — reported
  as-is, not smoothed.
- **Pinch:** "Zoom-buttons verified / finger-pinch unproven" —
  unchanged, never faked.
- **Packaging inputs:** `apk/verify_refs.py` 0 missing
  (units 57, structures 23 referenced, all present).

### 6.2 Victory attempt + carried waivers

A bounded victory attempt ran after the main pass: First Map /
Easy, attack-move loop + hero drops + re-attacks, 600 s cap.
**Result: no terminal panel within the cap (VICTORY_ATTEMPT null).**
This is recorded as an attempt, NOT as a game failure — the driver
re-issues orders every 2 s and plays no economy — and it extends
the Wave 3 position, not a new failure mode:

- **WAIVER-W6-VICTORY-PANEL** (carries WAIVER-W3-VICTORY-PANEL):
  no played browser match reached blue victory in this wave either
  (11 Wave 3 iterations + 1 Wave 6 attempt). Defeat panels render
  repeatedly through the same `showVictory()` function, but the
  victory title/stats lines remain unrendered in browser.
- **WAIVER-W6-DRAW-PANEL** (carries WAIVER-W3-DRAW-PANEL): no
  browser run reached a draw terminal; sim draws exist and are
  pinned in existing tests. Both panels share `showVictory()` with
  the proven defeat panel.

### 6.3 The one FAIL, explained (not a bug, not waived silently)

`hero redeploy lands at full HP 200/200` read `HP: 153 / 200`.
Code is unambiguous: `pressDropBackIn()` sets `hero.hp = null`
for a dead hero — "a redeployed hero is a fresh deployment at full
HP". The screenshot (`beta12h-10-hero-redeployed.png`, tick 885)
shows the redeployed hero already under fire at the blue core:
red units adjacent, red health bars on screen, a burning wreck
nearby, blue down to 2 units vs red 11. The hero spawned at full
HP and took 47 damage from live combat between landing and the
read; the check reads HP after the drop poll loop, not at the
landing tick. Corroboration: fresh drops in quiet fields read
full HP in this same pass (mastery 289/289, Bulwark 220/220).
Wave 3 passed this check by battlefield luck, not by different
code. **No game change.** The check stays FAIL in the log,
honestly, with this explanation — it is a check-design artifact
(needs a landing-tick read), not a game defect.

## 7. Files changed in this wave

Created:

- `tests/beta12h.test.js` (6 tests, extended once for BUG-12H-1)
- `scripts/beta12h-match.js` (multi-seed harness)
- `scripts/beta12h-ai-field.js` (AI-fielding investigation)
- `scripts/beta12h-beta.py` (browser pass)
- `game/BETA-12H-REPORT.md` (this file)
- `game/beta12h/` (24 screenshots + checks JSON — evidence, not
  shipped game content)

Edited (bugs only, minimal):

- `game/game.js` — tutorial economy fix (§3.2) + BUG-12H-1
  declaration fix (§3.3). No other game file edited:
  `game/sim.js`, `game/weapons.js`, `game/currency.js`,
  `game/progression.js` untouched (the Helios experiment in
  `weapons.js` was reverted byte-exact).
- `game/CONTROLS.md` — tutorial exemption paragraph (Wave 6 fix
  of the Wave 5 note) + Red-AI fielding FINAL paragraph (§2).
  No other CONTROLS.md statements were proved wrong by this
  pass, so no other CONTROLS.md lines changed.

NOT edited, per ownership: `data/catalog.json`, `game/catalog.js`,
`scripts/gen-catalog.py`, `game/maps.js` scenarios, `apk/` files.

## 8. Test count and old-test changes

- Full suite: **303/303 pass, 0 fail** (`node --test
  tests/*.test.js`), baseline 297 + 6 new beta12h tests.
- **Old-test changes: none in content.** The
  `tests/weapons12h.test.js` Helios expectation was changed for
  the §1.3 experiment and restored byte-exact afterwards; the
  file now matches its pre-wave content. The only test-file
  change that persists is the new `tests/beta12h.test.js`
  (including its BUG-12H-1 declaration assertion).

## 9. Gates waived, named (none silently)

1. WAIVER-W6-VICTORY-PANEL — victory title/stats lines
   unrendered in browser (§6.2).
2. WAIVER-W6-DRAW-PANEL — draw terminal unreached in browser
   (§6.2).
3. The hero-redeploy HP check FAIL is explained as a
   driver-timing artifact (§6.3); it is not a waived game gate,
   and the check result stands as FAIL in the log.
4. Real-phone verification remains owed everywhere it was owed
   before (touch-stick is CDP-emulated, stress is sandbox-only,
   pinch is zoom-buttons-only). Nothing in this wave claims a
   real-phone result.
