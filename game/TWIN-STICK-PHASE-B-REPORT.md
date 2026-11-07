# Twin-Stick Phase B — Hero Mech + Loadout + Gear — REPORT

## Spec sentence verdict: MET, no exception

"The player's default starting mech spawns in place of one starting
unit, with a between-match loadout over the seven catalog slots,
using the twelve family templates and the named-weapon data rows."

Read WITH the reserve amendment (which wins wherever it disagrees
with the original spec): "spawns in place of" means the hero
REPLACES the west roster's `lancer_mech` entry but STARTS IN
RESERVE. Opening field count is 9v10 with the hero available on
demand via Drop Back In — not 10v10 on the field. Verified in tests
(spawn replacement, 9v10, east untouched) and in a real-click
playthrough (iron=9, east=10, hero=reserve at match start).

## Amendment-wins notes (where the two documents disagreed)

- Original spec §3.2 said the hero spawns in place of the lancer;
  the amendment says it starts in reserve. The amendment wins: the
  roster entry is replaced, the field starts 9v10, and the original
  lancer spawn coordinates are NOT the drop location (the drop is
  the nearest passable tile to the player's own Command Core).
- Original spec §4.2 said respawn is automatic after 30 s + 200
  scrap; the amendment unifies respawn into Drop Back In. The
  amendment wins: the hero never reappears on its own — the player
  must press the button, and the cost is paid at press (refunded if
  the match ends during the telegraph).
- Original spec §4.2's respawn kept level/skills/loadout; the
  amendment adds exact-HP persistence across voluntary withdrawal
  only. Death redeploy is a fresh full-HP deployment — that split
  (withdrawal keeps HP, death resets it) is a Phase B decision
  recorded here, not a spec quote: withdrawal is not a heal, death
  is a new deployment.
- "Command Mech" stays the placeholder name everywhere, including
  code identifiers (`HERO_BASE`, `hero`, `btn-drop-back`). No final
  name was invented.

## Tier-band resolution (the gear-tier vs level conflict)

The spec's gear tier bands are written by hero level (1–3 / 4–6 /
7+), but Phase B has NO levels (levels are Phase C), and §6 Phase B
out-of-scope explicitly says the hero is level 1 every match and
Phase B must not half-build progression by storing a level it never
changes. Resolution, chosen per the expected reading and recorded
here: **Phase B ships tier-1 weapons AND tier-1 gear only** — the
level-1 band — with tier 2/3 rows data-complete but locked in the
UI and rejected by the validator with Phase C reasons. The
secondary slot IS usable in Phase B (tier-1, lighter families,
tier ≤ primary tier). The validator takes a `phaseTierCap`
parameter so tests can exercise slot rules (secondary-tier rule,
Scrapjack cap, air bans) in isolation from the band by passing a
higher cap. Freeze-gate consequence: no tier 2/3 weapon or gear can
be equipped in this phase, by UI or by validator. Phase C follow-up:
unlock tiers by hero level (bands 1–3 / 4–6 / 7+ as specified) and
remove the cap — the data rows already exist.

## Hero base values, verified against the catalog (not the proposal)

`data/catalog.json` `lancer_mech` row: HP 200, armour Medium, speed
6.0, vision **8**, size 0.55, weapons `w_autocannon` + `w_melee`,
cost scrap 380, components 1, buildTime 24, movementClass ground.
The hero uses HP 200 / Medium / 6.0 / vision 8 / radius 0.55 /
cost 380. The design spec's proposed vision 10 was UNCONFIRMED and
is NOT used — the report states this plainly rather than silently
adopting the proposal. Default loadout: primary Twin-Bore Autogun
(Autocannon baseline: 12 damage, range 6, interval 0.5), everything
else null — so the default hero has exactly the lancer's anchor
stats with one weapon, not two (the catalog lancer also carries a
melee weapon; see the hero-on/off comparison for why that matters).

## Aim and control reuse (Phase A path, not rebuilt)

Hero control uses the Phase A twin-stick path unchanged: stick
zones, 0.35 deadzone, 60 px radius, 30° aim cone, catalog speed cap,
terrain blocking, pooled projectiles, cooldown/range/min-range/LOS/
target-class/accuracy/armour-matrix gates, no hidden multipliers.
The ONE deliberate difference is the reserve model, not a Phase A
change: Release Control (or Esc) on the hero withdraws it to
reserve instead of giving it a hold order, and taking control of
another unit while the hero is on the field withdraws the hero at
the same moment control transfers — never both a controlled unit
and a field hero. Pressing Drop Back In while controlling a
non-hero unit releases that unit to a hold order and drops the hero
in its place. The red AI never reads the control flag, hero level
(there is none yet), loadout, or reserve state — a field hero is
targeted exactly like any blue unit (test-proven: a red hold unit
fires on the hero).

## Files changed

- `game/weapons.js` (NEW, DOM-free `SWWeapons`, ~26 KB): 12 family
  baselines copied from the catalog's canonical rows; all 123 named
  rows in document order (name verbatim, family, slot, tier, ≤2
  multipliers, ≤1 special from the closed list, scrapCost = tier ×
  60 recorded only, powerCost always 0); 12 gear rows (4 slots × 3
  tiers, NO ability gear rows — ability must stay null in Phase B);
  chassis→primary-family tables for all 8 chassis, lighter-family
  list, air-banned list; `resolveWeapon` (fresh object per call,
  never a shared baseline reference); `validateLoadout` (reasons for
  every failure); `heroStats` (armor/mobility/reactor/sensor
  effects); `DEFAULT_LOADOUT`. Design note: the template's
  `compatibleChassis` lists are encoded as the chassis→family
  tables (single source of truth, not 123 duplicated lists); a
  family absent from a chassis's list is compatible with none.
- `game/hero.js` (NEW, DOM-free `SWHero`): presence state machine
  with PROPOSED constants DROP_TELEGRAPH_TICKS = 40 (2 s),
  VOLUNTARY_COOLDOWN_TICKS = 200 (10 s), DEATH_COOLDOWN_TICKS = 600
  (30 s), DEATH_COST_SCRAP = 200; `startMatch`, `applyRoster`,
  `canDrop` (kinds ok/field/dropping/core/notile/cooldown/scrap,
  exact reason strings, time checked before scrap so the binding
  constraint is reported), `startDrop`, `cancelDrop`, `landDrop`,
  `withdraw` (exact HP), `die`.
- `game/sim.js`: `createGame` gains `burnZones: []`; `addUnit`
  gains `heat: []` and `slowUntil: 0`; new exported `addCustomUnit`
  and `withdrawUnit` (removes without wreck/scrap); `createWreck`
  uses `costScrap` when present (hero 380 → 152); special-effect
  helpers `noteFired` (overheat: 4 s continuous fire → forced 1.5 s
  cooldown, gap resets), `copyWeaponScaled`, `applyHitEffects`
  (stun: speed halved 30 ticks; pierce: see approximation below;
  burn: 3 s zone, 1.5 radius, 25%/s, armour matrix applied, zones
  capped at 64), `processBurnZones` (runs after projectiles, before
  cleanup, so zone kills leave wrecks in the same tick); normal and
  manual firing set cooldown via `Math.max(interval, noteFired)`;
  stepDist and manual mStep halved while stunned; `spawnPosition`
  exported. Catalog weapons carry no `special` field, so all special
  paths are no-ops for non-hero units — existing combat behaviour
  is unchanged for them. `noteFired` and `applyHitEffects` are
  exported as test seams, like Phase A's `angleDiff`.
- `game/game.js`: `Weapons`/`Hero` refs; hero state block
  (`heroEnabled` default ON — PROPOSED toggle, `heroLoadout`,
  `hero`, `tutorialStarting`, `loadoutOpen`, `lastDropSig`,
  `HERO_BASE` with vision 8 and a comment recording why not 10,
  `HERO_COST_SCRAP = 380`); `enterControl` allows hero transfer
  (hero withdraws at transfer); `releaseControl` branches to
  `withdrawHero` for the hero; `withdrawHero`, `heroCore`,
  `heroDropFacts`, `pressDropBackIn` (checks `canDrop` FIRST, then
  releases a controlled non-hero unit to hold, then starts the
  drop; death-path redeploy sets `hero.hp = null` for a fresh
  full-HP landing; cost paid at press); `syncDropButtons` (tray
  always visible in a hero match, strip only while controlling a
  non-hero unit, hidden in tutorials and hero-null games, DOM
  touched only on signature change); `newGame` hero setup (hero
  only if not tutorial, heroEnabled, map not test, modules present,
  loadout valid — invalid session loadout falls back to default);
  `startTutorial` sets `tutorialStarting` around `newGame` so the
  tutorial never gets a hero; full loadout-screen functions
  (tier > 1 options listed but disabled as "unlocks in Phase C",
  live validation reasons + HP/Speed/Vision/Weapons summary);
  `syncSettingsUI` syncs `set-hero`; `resetSettings` resets
  `heroEnabled = true`; Settings change handler reads `set-hero`
  (applies at next match start only); button bindings for
  `btn-drop-back`, `btn-ctl-drop`, `mm-loadout`, `lo-save`,
  `lo-close`, and select change listeners; frame-loop drop
  resolution BEFORE the control death/follow block (match-end
  cancel refunds, landing creates the unit via `addCustomUnit` and
  immediately controls it via the Phase A path); frame-loop hero
  death detection (`Hero.die` before `resetControlUI`); shell-drawn
  drop-telegraph ring and gold CMD badge (render.js stays mode-free,
  as in Phase A); `syncDropButtons()` called every frame.
- `game/index.html`: script tags for `weapons.js`/`hero.js`;
  `btn-drop-back` in the command row; `btn-ctl-drop` in the control
  strip; `mm-loadout` on the main menu; `set-hero` checkbox in
  Settings; `#loadout-panel` overlay (six selects, ability locked
  note, session-only notice, tier 2/3 locked note, `#lo-errors`,
  `#lo-summary`, Save/Back); control-strip line reworded to the
  neutral "Release Control ends manual control" (the old line said
  "returns to RTS orders", which is wrong for the hero).
- `game/style.css`: loadout select rules (full-width, 44 px
  min-height) and `#lo-errors` red bold. Drop Back In meets the
  ≥44 px rule via the existing base button rule, no extra CSS.
- `game/CONTROLS.md`: new hero + Drop Back In section (reserve
  model, all PROPOSED numbers marked PROPOSED, tier-band
  resolution, session-only warning); Phase A limits line and the
  NOT IMPLEMENTED list updated (hero/loadout/gear moved out;
  levels/XP/skills/persistence stay listed).
- `tests/herophaseb.test.js` (NEW, 18 tests), `scripts/hero-match.js`
  (NEW harness, modelled on `scripts/ai-match.js`, with a SEED env
  override).
- Screenshots: `game/phaseb-hero-control.png` (re-dropped hero,
  HP 150/200, CMD badge, control strip),
  `game/phaseb-hero-redeploy.png` (redeployed hero, HP 200/200,
  Scrap 300 after the 200 cost).

## Fixes the work itself caught (not waived)

1. **cancelDrop resurrected dead heroes.** The first version of
   `hero.js` restored the pre-drop status unconditionally, so
   calling it on a dead hero returned it to reserve. The test caught
   it; the helper now returns early unless status is 'dropping'.
   The shell only ever called it while dropping, so no shipped
   path was affected — but the helper must not resurrect on its own.
2. **Disabled reasons were hover-only.** `syncDropButtons` first
   rendered "Drop in 10s" as the label and the full reason only as
   a `title` tooltip. Phones have no hover, so the reason would
   have been invisible exactly where it matters. The label is now
   the full reason ("Drop ready in 10s", "Command Core destroyed —
   no redeploy", "No drop tile near the Command Core.", "Drop needs
   200 scrap (you have N)"), and the playthrough asserts it.
3. **Playthrough 2 harness, not game code.** The first harness kill
   used one red scout: its first shot can miss (accuracy 0.85) and
   blue defenders kill a lone scout before its second shot. The
   clean Node A/B proved manual heroes die at tick 1 like any unit
   (manual=false and manual=true both died at tick 1), so the
   failure was harness reliability, not hero invulnerability. The
   harness now spawns three adjacent scouts; the kill is reliable.
   (A debug query that matched any xandria unit near a y-band also
   misled one investigation — tracked by hero status after that.)

## Tests: 150/150 pass (132 pre-existing + 18 new, no old test changed)

`node --test tests/*.test.js` from `~/workspace/surface-wars/`
(explicit file list — the directory form does not resolve in this
Node version). New coverage in `tests/herophaseb.test.js`:

- Data: all 123 names verbatim in document order, unique ids,
  slot counts (82 primary / 34 secondary / 7 utility), ≤2
  multipliers + closed special + known family + tier 1–3 +
  powerCost 0 on every row; 12 baselines field-identical to the
  catalog canonical rows; worked examples (Scrapstorm 10.2 / 0.25 /
  overheat, Railspike baseline + pierce, Cratermaker baseline
  unchanged, Twin-Bore = Autocannon baseline); default loadout =
  lancer anchor with vision 8 (and the test asserts the catalog
  vision is 8, so the spec's proposed 10 cannot silently return).
- Validation with reasons: tier-3 primary at cap 1; secondary tier
  above primary (isolated with cap 3); utility row in a weapon
  slot; Scrapjack tier-3 (cap 3); Flamethrower-family primary on
  air; ability non-null ("Skills arrive in Phase C"); unknown ids.
- Tier band: tier-1 gear effects (armor 220 HP, mobility 6.5,
  reactor energy-only — laser 0.7 → 0.67, autocannon untouched,
  sensor vision 9); tier-2 gear rejected at cap 1; 12 gear rows,
  no ability gear.
- Reserve machine: spawn replacement (9v10, east untouched,
  second application no-ops); every `canDrop` kind and reason
  (field, dropping, core-dead blocks both, no-tile, voluntary
  cooldown boundary 199/200 ticks, death time-before-scrap,
  wait-if-broke with no debt growth); full transition chain
  (drop → 40-tick telegraph → land → withdraw keeps exact HP →
  re-drop → die → cancel-after-death stays dead).
- Sim: withdrawal removes with no wreck/scrap change; hero death
  wreck 152 scrap, 2400-tick lifetime; drop location passable
  (never water/rock) + all-water no-tile case; elimination fires
  with a healthy reserve hero (defeat, reserve untouched);
  deadlock detector (air-only weaponless sides draw at 600 even
  with a reserve hero object existing off-sim; a field hero with a
  ground-capable weapon is damage capability); red hold unit fires
  on the field hero; specials (overheat 1.5 s after 4 s continuous
  fire; pierce 50% to one extra enemy; stun halves ground covered;
  burn zone ticks damage and expires after 3 s).
- Two test-design traps worth recording: the overheat target had
  to be a 1000-HP weaponless custom unit (a 60-HP scout dies at
  shot 6, before the 8th shot that overheats), and the burn-expiry
  test needed a weaponless iron bystander (withdrawing the
  attacker left Iron Eden with zero entities, so elimination froze
  the sim and the zones could never expire).

## Playthroughs (headless Chromium, real input events, 844×390 landscape)

All three ran on a `/tmp` copy with a test-only `window.__sw` hook;
the copy's `game.js` was diffed against shipped and differs ONLY by
the hook lines (12 lines). Harness use is stated per playthrough;
no hook ships.

1. **Loadout → drop → drive/fire → release → cooldown → re-drop:
   PASS.** Main menu → Hero Loadout → secondary set to Rustfang
   (tier 1) → Save persisted in session → Play First Map → opening
   field iron=9, east=10, hero=reserve → Drop Back In → hero landed
   and controlled (unit 23) → two simultaneous CDP sticks (pointer
   ids tracked independently) drove the hero 5.50 → 14.70 and killed
   a harness-spawned red scout 4 tiles east → hero HP set to 150
   via harness → Release Control → hero=reserve, HP still 150,
   wrecks unchanged (1→1) → Drop Back In disabled with label "Drop
   ready in 10s" → after 11 s enabled ("Drop Back In") → re-drop →
   hero HP 150 (withdrawn HP, not full HP). Screenshot:
   `phaseb-hero-control.png` (CMD badge + ring visible, strip
   shows HP 150/200).
2. **Hero dies → wreck → disabled until 30 s + 200 scrap →
   redeploy: PASS.** Drop → hero controlled → harness set HP 5 +
   three adjacent red scouts → hero=dead → wreck values include
   152, scrap still 500 → Drop Back In disabled "Drop ready in
   30s" (time binds, scrap on hand) → after 31 s enabled → Drop
   Back In → hero on field, scrap 500 → 300 (the 200 cost), hero
   HP 200 (fresh full-HP deployment). Screenshot:
   `phaseb-hero-redeploy.png`. Zero page errors across both
   playthroughs.
3. **Hero-on vs hero-off headless comparison (`scripts/hero-match.js`,
   same stand-in as `ai-match.js`, 3 seeds × 2 maps × 2 modes = 12
   matches): NO SWEEP, phase may freeze.** Tally: hero-off 1 win /
   3 draws / 1 loss / 1 stall; hero-on 0 wins / 3 draws / 1 loss /
   2 stalls. The hero-on First Map seed-20261030 loss (xandria,
   128 s) against the hero-off win (iron_eden, 53 s) is the sharpest
   single cell, but across 12 matches the hero neither sweeps nor
   is swept. Mechanism, stated not assumed: the harness hero uses
   DEFAULT_LOADOUT (no secondary) while the catalog lancer it
   replaces carries autocannon + melee, so under RTS orders the
   harness hero is a slightly weaker lancer in close combat; it
   also spawns core-adjacent rather than at the lancer's (11,25)
   slot; and it never redeploys in the harness (Drop Back In is a
   shell button), so its death is permanent while its actual value
   — player driving, withdrawal, redeploy — is exactly what the
   harness cannot measure. **This comparison measures loadout/stat
   swing under RTS orders only. It is NOT a human balance verdict,
   and nothing in it justifies buffing the hero or the opponent.**
   The freeze-gate condition (hero-on wins every match the
   stand-in wins none of) is not met. Sanity anchor: hero-off
   First Map seed-20261030 reproduces Cycle 2's balanced result
   exactly (iron_eden wins tick 1068, 8 left).

## Honest gaps (stated, not hidden)

- **No real-phone playtest** of Drop Back In / reserve flows, the
  loadout screen, or the control strip's Drop Back In button.
  Playthroughs are headless Chromium with real input events and
  genuine CDP touch events — not a thumb on an S25. Thumb
  ergonomics of the strip button placement are unproven.
- **PROPOSED numbers are judgement, not playtested feel:** 10 s
  voluntary cooldown, 2 s telegraph, 200 scrap death cost, 30 s
  death timer, and the tier-1-only band. None of these came from
  Skit as decisions.
- **Loadout resets on page reload** until Phase C persistence.
  The loadout screen says this in one visible line; the report
  says it here too. Clearing app data / browser storage loses
  nothing else, because nothing is stored.
- **Pierce is an approximation.** True line penetration (hit every
  enemy along the shot's path) was not built; Phase B pierce hits
  one additional enemy within 2 tiles of the impact at 50% damage.
  If Skit wants true penetration, that is a sim change to scope,
  not a data row.
- **No human balance verdict.** The 12-match harness comparison
  cannot judge whether the hero feels right under a player's hands;
  only Skit's own phone playtesting can.
- **Drop marker visibility to the red side is PROPOSED yes** (the
  marker draws for both sides — the game has no fog of war, and
  the red AI cannot target a telegraphing hero anyway since it is
  not an entity). If Skit wants it hidden from red, that is a
  rendering decision, not a sim one.
- **Minor cosmetic note:** the red feedback line at the bottom of
  the canvas ("Command Mech dropping in near your Command Core.")
  wraps awkwardly at 844 px wide. Text-only, pre-existing feedback
  element, not a freeze blocker.
- **One harness stall worth one line:** seed 7 Second Map hero-on
  hit the 15000-tick cap with 5 blue vs 1 red left (not a deadlock
  draw — the detector did not fire, so someone could still damage
  or produce). Hero-off also stalls once (seed 99 First Map). These
  are stand-in endgames, not Phase B regressions, and no rule was
  changed to chase them.

## Out-of-scope compliance (checked, not claimed)

No XP, levels, skills, skill buttons/points/effects, persistence
storage (grep: no `localStorage`/`sessionStorage` write for hero
state in game code — the loadout lives in `heroLoadout` session
memory only), second currency, mid-match refit, hero production,
hero duplication via groups, new units/art, balance/economy/AI
changes beyond hero/reserve/drop, APK, publishing, commit, or push.
Nothing was committed, pushed, or published. The v1.3 APK predates
this phase; nothing about it changed.

## Phase C follow-up (from this phase's own loose ends)

Unlock gear/weapon tiers by hero level (bands 1–3 / 4–6 / 7+);
add the progression record, XP sources/curve, the 8-skill seed set,
skill-point spending, and the device-local-only notice; remove the
`phaseTierCap` lock; decide true line penetration for pierce if
wanted; human phone playtest of Drop Back In / reserve flows and
of the PROPOSED numbers (cooldown, telegraph, death cost) before
they harden into defaults.
