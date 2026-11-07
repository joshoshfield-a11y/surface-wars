# Twin-Stick Phase C — persistence + skills + upgrades — REPORT

## Spec sentence verdict: MET, no exception

> "Hero level, XP, skills, and gear unlocks persist across matches
> on the same device and survive app restarts, with no match
> save/load and no cloud."

Proven by: the record read at the main menu before every match and
written only at match end / skill spend / respec / loadout save;
a two-match headless playthrough in which match 1's XP, level,
skill point, and loadout survived a full page reload and match 2
spent the point, equipped an active skill, used it with its
cooldown enforced, and wrote the record again; a corruption
playthrough in which garbled and failing-validation records both
reset to level 1 with the plain notice and a usable menu; and a
draw playthrough in which hero kill/salvage XP counted and the win
bonus did not. No match save/load system, no cloud, no account, no
server, no paid unlock was built.

## What Phase C unlocked (it did not rebuild Phase B)

Phase B shipped tier-1 weapons and tier-1 gear only, a locked
ability note, and a session-only loadout. Phase C lifts exactly
those three locks: gear tiers by hero level (Tier 1 at 1–3, Tier 2
at 4–6, Tier 3 at 7+), the ability slot (one equipped active skill,
shown as Ability 1 on the control strip for the hero only), and
persistence (the `surfacewars.hero.v1` record). The reserve model,
Drop Back In (both states, cooldowns, costs, core-dead block,
telegraph), 9v10 opening field, between-match-only loadout, hero
toggle, and Test Map exclusion are unchanged. A level-1 hero in
Phase C plays identically to the Phase B hero — proven by a test
that compares `heroStats` with default options against
`heroStats` with `{level: 1, skills: []}` for deep equality.

## Stat-cap resolution (explicit, recorded)

The spec says +5% max HP and +2% damage per level, capped at +50%
HP and +20% damage at level 10. (level−1) increments give +45% HP
and +18% damage at level 10, which sit UNDER those caps. The
level-1 anchor was NOT broken to make the caps bind: a level-1
hero equals a lancer with no bonus, exactly as in Phase B. The
+50%/+20% figures are therefore non-binding ceilings, and the
effective level-10 values are **+45% HP (200 → 290) and +18%
damage (12 → 14.2)**. Reinforced Frame's +15% max HP combines
**additively with the level HP bonus on base HP, before gear
multipliers**: level-10 + Reinforced Frame = 200 × (1 + 0.45 +
0.15) = 320; level-7 + Reinforced Frame + tier-3 armor = 200 ×
(1 + 0.30 + 0.15) × 1.30 = 377 (and Medium steps to Heavy at armor
tier 3, as in Phase B).

## Skill implementations (all numbers PROPOSED, as specified)

- **Dash** (active, gate 2): manual speed ×2 for 0.4 s (8 ticks),
  cooldown 8 s (160 ticks), no invulnerability. Implemented in the
  manual branch as a speed multiplier on top of `speedMult`.
- **Salvage Sense** (passive, gate 3): the hero's salvages pay
  `floor(value × 1.25)` scrap. The sim reads `state.heroSkills`
  (shell-set from the record at match start); the red AI never
  reads it.
- **Overdrive** (active, gate 4): effective weapon interval ×0.8
  for 5 s (100 ticks), cooldown 20 s. Implemented as `effInterval`
  (used by BOTH the manual and auto firing branches, so a hero
  that is released mid-Overdrive keeps the benefit on its hold
  fire until expiry — the buff is on the unit, not the input
  mode).
- **Field Repair** (active, gate 5): +60 HP capped at max HP,
  cooldown 30 s.
- **Targeting Computer** (passive, gate 5): primary weapon
  (weapons[0]) only — accuracy +0.10 capped at 1.0, range +1.
  Secondary weapons are untouched (proven by test: secondary
  accuracy and range identical with and without the skill).
- **Shockwave Slam** (active, gate 6): 2-tile radius, damage =
  primary ×1.5, units only — structures are explicitly skipped and
  proven untouched. Killing blows attribute to the hero (via
  `applyDamage` with the hero as source), so a slam kill earns
  hero XP. Cooldown 25 s.
- **Reinforced Frame** (passive, gate 7): +15% max HP at match
  start, combined additively as above. It is a match-start stat
  (applied through `heroStats` at drop landing), not a mid-match
  heal — buying it between matches does not heal a hero already
  on the field, because there is no hero on the field between
  matches.
- **Rally Signal** (active, gate 8): allies within 8 tiles get
  +10% speed for 8 s (160 ticks), cooldown 30 s, issues no orders.
  Implemented through `speedMult` (multiplicative with stun's
  ×0.5 where both apply).

Cooldowns are enforced in `activateSkill` (second cast while on
cooldown is rejected with a reason) and visible on the control
strip button (seconds remaining, or Ready). Passives and unknown
ids are rejected with reasons. The ability button is hidden for
non-hero controlled units and disabled with its reason as the
label ("No ability equipped") for a hero with no equipped active.
Desktop: Q or 1 fires the equipped active; E/2 do nothing (there
is no second ability control — the slot holds exactly one active
skill).

## Two interpretations, stated plainly (both test-proven)

1. **Hero salvage auto-collects.** The hero is on the field ONLY
   while manually controlled, so it can never be issued an RTS
   salvage order (release withdraws it). Its spec XP source "hero
   salvage" therefore fires in the manual branch: a manually
   driven hero that ends a tick within the standard 1.5-tile
   salvage range of a wreck collects it — scrap (with Salvage
   Sense when unlocked) and 10 hero XP, via the same
   `salvageWreck` path army orders use. Standing still next to a
   wreck collects it; army units are untouched by this path.
2. **Kill XP needs a real cost.** Hero killing blow =
   `max(10, floor(0.10 × victim catalog scrap cost))`, but ONLY
   when the victim's cost is greater than 0. A 0-cost victim (a
   Command Core at cost 0) grants 0, never the minimum — the
   minimum is a floor on a real cost, not a reward for killing
   free things. Victim cost uses the unit's `costScrap` override
   or catalog cost, or the structure definition's scrap cost
   (try/catch → 0 for anything unresolvable).

## Files changed

- **New:** `game/progression.js` (DOM-free `SWProgression`:
  record key, XP curve, 8 skills, pure `levelForXp`, `tierBand`,
  `defaultRecord`/`defaultLoadout`, strict `validateRecord` with
  per-failure reasons, `applyMatchResult`, `buySkill`, `respec`),
  `tests/progression.test.js` (9 test blocks, see below),
  `game/TWIN-STICK-PHASE-C-REPORT.md` (this file), 4 screenshots
  (`phasec-two-match-victory.png`, `phasec-loadout-skills.png`,
  `phasec-corruption.png`, `phasec-draw.png`).
- **Edited:** `game/sim.js` (hero XP tracking `heroXp` in
  `createGame`; per-unit skill state in `addUnit`/`addCustomUnit`;
  `applyDamage` gains an optional `src` and attributes hero
  killing blows on instant, projectile, splash, pierce, and
  burn-zone paths; `salvageWreck` gains an optional salvager for
  Salvage Sense + hero salvage XP; manual branch gains the hero
  auto-collect; `SKILL_DEFS` + `activateSkill` +
  `skillCooldownRemaining`; `effInterval` and `speedMult`
  helpers; `rebuildGrid` exported for test harnesses), `game/
  weapons.js` (validator gains `levelBand`, `allowAbility`,
  `ownedAbilityIds` and level-worded tier reasons — the DEFAULT
  messages are unchanged so Phase B tests keep passing;
  `heroStats` gains `{level, skills}` with level-1/no-skill
  results identical to Phase B), `game/game.js` (record load/save
  with corruption handling, main-menu status + notice lines,
  loadout screen rewritten for skills/ability/tier bands with the
  device-local data-loss line REPLACING Phase B's session-only
  notice, `newGame` hero setup from the record, match-end XP write
  in `showVictory`, Ability 1 button + Q/1 key, `CMD N` level
  badge, hero toggle persisted in the record, Drop Back In landing
  uses level/skill-adjusted stats), `game/index.html` (progression
  script tag, ability button, hero status/notice lines, skills
  list + respec button + ability select + tier paragraphs in the
  loadout panel), `game/CONTROLS.md` (new Phase C section, Phase B
  loadout paragraphs marked superseded where Phase C changed them,
  NOT IMPLEMENTED list updated), `UPGRADE-LOOP.md` (twin-stick
  track Phase C entry).
- **Untouched by design:** `data/catalog.json` (no weapon, unit,
  or chassis value changed — progression is data in the record,
  not in the catalog), the red AI combat/economy code (it never
  reads hero level, skills, loadout, or XP), the deadlock detector
  (a reserve hero still contributes nothing; a field hero counts
  like any other field unit), the weapon/economy/pathfinding
  systems (only the firing-cooldown and speed helpers gained
  skill-aware branches, and both return their old values when no
  skill is active).

## Tests: 159/159 pass, no old test expectation changed

`node --test tests/*.test.js` from `~/workspace/surface-wars/`:
**159 pass, 0 fail** — 150 pre-existing + 9 new blocks in
`tests/progression.test.js`. Coverage of the freeze gate:

- Every XP source: hero killing blow incl. minimum 10 (scout 80 →
  10), cost scaling (medium 300 → 30, heavy 520 → 52), army kill =
  0, projectile kill, splash kill (2 kills, 20 XP), 0-cost core
  kill = 0; hero salvage = 10 with Salvage Sense paying
  `floor(plain × 1.25)` on the same decayed value; army salvage =
  0; win +100, draw +0 bonus with kill/salvage still counted,
  loss +25, death = 0 lost (no negative path exists), level-up
  only at match end (applyMatchResult is the only level-up path
  and the shell calls it only from showVictory — quit mid-match
  = 0 XP is proven in the playthrough, not in a unit test, because
  it is a shell write-path property).
- Full curve table: every threshold, exactly-at vs one-below
  (99→1, 100→2, …, 4499→9, 4500→10, 99999→10).
- Skill gates (each skill below-gate rejected with a level
  reason), point spending (insufficient points rejected),
  duplicate buy rejected, free respec (points restored to
  level−1, skills and ability cleared, XP/level unchanged, input
  never mutated).
- Tier bands (1–3→1, 4–6→2, 7–10→3; tier 2 locked below level 4
  with a level reason, allowed at band; ability equips only when
  unlocked-active).
- Stat caps (level-1 anchor deep-equal to Phase B; level-10
  effective +45% HP / +18% damage; Reinforced Frame additive
  combinations 320 and 377; Targeting Computer primary-only).
- Corruption reset at the module level (missing/garbled/level
  mismatch/points imbalance/gated skill/unequipped ability/passive
  ability all fail validation; a tier-2 loadout validates at
  level 4). Menu-never-blocked and the notice line are shell
  behaviour, proven in the playthrough.
- Ability cooldowns enforced (Dash, Field Repair, Shockwave Slam
  second casts rejected; cooldown remaining > 0) and passive
  effects (Salvage Sense hero-only, Targeting Computer
  primary-only, Reinforced Frame match-start-only via heroStats).
- Phase B preservation: all 150 pre-existing tests pass
  unchanged, including reserve/Drop Back In/cooldowns/152-scrap
  wreck/toggle/Test Map exclusion coverage from the Phase B
  suite; the level-1 identity test above is the Phase C-side
  proof.

Three test-design traps, recorded so they are not reintroduced:
(1) a test game with only one red unit ends the match on the
kill (elimination), so later steps are no-ops — salvage tests
keep a surviving red scout far away; (2) skill radius queries
need a fresh spatial grid, but stepping first would let a hold
order fire before the skill is tested — `rebuildGrid` is exported
for harnesses, mirroring real play where the grid is fresh from
the last step; (3) dead units leave the array only at the next
step's cleanup, so slam tests assert on `alive` before stepping,
and a structure-immunity check must precede any cleanup step that
lets the hero's hold order shoot the structure.

## Playthroughs (headless Chromium, real input events, 1280×800)

All three ran on a `/tmp` copy whose `game.js` differs from
shipped ONLY by the `window.__sw` hook lines (14 added lines, 0
removed — diff-verified before each run); no hook ships. Mouse +
keyboard driving (WASD + mouse aim + LMB), as in Phase A desktop.
Two harness lessons from this run, stated honestly: the west army
auto-engages anything near the core, so kill targets were placed
on empty ground via a harness teleport (the hero's own driving,
aiming, firing, and salvaging were real input, not scripted); and
the hero can die to red AI fire mid-harness, so releases were
made conditional on actually controlling (a stray Escape after an
auto-exit would open the pause menu) and re-drops waited out
whichever cooldown bound (10 s voluntary / 30 s death).

1. **Two-match persistence + skill use: PASS.** Main menu → Hero
   Loadout → secondary set to Rustfang (tier 1) → Save wrote the
   record → Play First Map → opening field iron=9, east=10,
   hero=reserve → Drop Back In → hero landed and controlled →
   harness-teleported to empty ground (30,25) → mouse aim + LMB
   killed a spawned red scout (heroXp kills 1, killXp 10) → D-drive
   onto the wreck collected it (salvages 1, salvageXp 10) →
   release → re-drop → harness-ended the match → victory panel:
   "Hero XP +120 (level 1 -> 2)" → record: xp 120, level 2,
   skillPoints 1, matchesPlayed 1, wins 1, loadout secondary
   Rustfang. Screenshot: `phasec-two-match-victory.png`.
   Quit-mid-match check: fresh match started and quit
   immediately → record byte-identical. Reload: menu status
   "Command Mech — Level 2 | 120 XP | 1 skill point unspent | 1
   matches, 1 wins", loadout still Rustfang. Match 2: Dash bought
   (gate 2, 1 point → 0 points), ability set to Dash, saved →
   screenshot `phasec-loadout-skills.png` (menu after save:
   Level 2, 120 XP, 0 points) → Play First Map → drop → control
   strip showed "Dash — Ready" → Q press → button showed
   "Dash (8s)" (cooldown visible and enforced) → harness-ended
   the match → record: xp 220, level 2, matchesPlayed 2, wins 2,
   skills ["dash"], ability "dash".
2. **Corruption: PASS.** Garbled record
   (`localStorage.setItem` with `garbage{{`) → reload → notice
   "Hero progress could not be read, so it was reset to level 1."
   and status back to Level 1. Failing-validation record (level
   99) → reload → same reset + notice. Menu usable throughout.
   Screenshot: `phasec-corruption.png`. Test Map check in the
   same run: Play Test Map → Drop Back In button hidden
   (display none), as in Phase B.
3. **Draw: PASS.** Fresh record (storage cleared) → Play First
   Map → drop → teleport → mouse aim + LMB kill (10 XP) →
   D-drive salvage (10 XP) → release → harness forced the Cycle 3
   deadlock state (all field units/structures removed, one
   weaponless sensor drone per side) → draw panel after the
   600-tick grace: "Draw — neither side can win." with "Hero XP
   +20 (level 1 -> 1)" → record: xp 20, level 1, matchesPlayed 1,
   wins 0 (no win bonus). Screenshot: `phasec-draw.png`.

## Religious-term scan

Whole-word scan of all new/changed files for religious terms:
CLEAN. The only "Eden" hits are the pre-existing faction name
"Iron Eden" (game content that predates this phase, left as-is,
as in prior phases). No citations, verses, parable language, or
religious framing anywhere in the new files. The word "verse"
appears only as a substring (e.g. in "Conversely"-style words in
comments), never as content.

## Honest gaps (unchanged from the brief, still true)

- No real-phone playtest of persistence/skills flows: the
  loadout screen, skill buttons, ability button, and cooldown
  labels were driven with mouse/keyboard in headless Chromium,
  not thumbs on the S25. Thumb ergonomics of the Ability 1
  button next to Release Control is unproven on a real device.
- Proposed numbers (XP values, curve, skill cooldowns/effects,
  10 s / 2 s / 200 scrap / 30 s reserve terms) are judgement, not
  playtested feel. The XP pace illustration (~300 XP/match) is a
  guess until real matches are measured.
- Device-local persistence means switching devices or clearing
  storage loses progress with no recovery — the loadout screen
  says so in one visible line, which reduces complaints but does
  not eliminate them.
- No human balance verdict from AI-vs-stand-in matches alone:
  the hero's real value (player driving, withdrawal, redeploy,
  skill timing) is unmeasured by any automated match, and the
  level-10 stat caps have never faced a human opponent.
- The 600-tick draw grace is still a judgement call from Cycle 3,
  not playtested feel, and a match where both sides COULD damage
  each other but neither player acts still runs — player inaction
  is a different stall, outside this phase's fence.
- Phase C adds `game/progression.js`, so any future APK build
  must re-derive the packaged game file list from the live tree
  (no longer 10 files) and re-run `verify_refs.py` — no APK was
  built in this phase, and none is authorized by it.
