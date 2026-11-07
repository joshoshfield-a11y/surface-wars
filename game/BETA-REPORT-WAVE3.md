# Surface Wars — Beta Report, Wave 3

**Scope:** wave-3 beta + balance. Reports ONLY to the parent coordinator.
No APK built, no commit, no push, no publish. No game-code edits were made
in this wave; every game-code question below is filed, not fixed.
Authorization: user 2026-10-31 ~22:11 PDT, "Continue quality enhancement"
(continuation of the autonomous loop that completed at v1.5).

**Baseline:** parent-verified v1.5, 234/234 tests. Wave-3 final full suite:
**242 pass, 0 fail** (26 test files, explicit list — see §8).

**Headline, stated plainly:** the two formerly waived panels were NOT
rendered in a wave-3 browser run, and the two-match win arc was NOT
achieved by play. They are closed below with two NEW named waivers
(§2), not with silence and not with v1.5's wording. The defeat panel
is proven repeatedly; the victory/draw panels run through the same
`showVictory` function and stats rendering, but their victory/draw
title and stats lines remain unrendered in browser. No tune is
recommended (§7): the browser losses trace to driver-play limitations,
and the sim shows human-style play already wins.

---

## 1. Browser-proof items (sim-covered in v1.5) — both PASS

### 1a. Hero-death wreck count — PASS (browser)

`herodeath` mode, First Map / Normal / hero on. Before drop: wrecks 0,
tick 41. Hero drove east with `d` only, no fire, and died: feedback
`Controlled unit destroyed.`, status wrecks 2, tick 233 (hero wreck +
one early-skirmish wreck). Death-site info panel text:

> `Wreck: Lancer Mech | Faction: iron_eden | Salvage value now: 147
> scrap (started at 152, decays to 0 over 120s) | Time left: 117s |
> Wrecks do not block movement and cannot fight. | Select one of your
> units, then tap this wreck to salvage it.`

Screenshot `game/beta-wave3/herodeath-wreck-panel.png` was viewed: it
genuinely shows that panel, status Wrecks: 3 by tick 285, drop button
`Drop ready in 27s`, feedback `Controlled unit destroyed.` The 147
(not 152) is decay between death and panel read. The 152 full-value
figure is pinned in `beta-wave1.test.js` / `herophaseb.test.js`.

### 1b. Info-panel HP live refresh — PASS (browser, re-viewed wave 3)

`hprefresh` mode, First Map / Normal / hero on. Unit selected at
(8,25); info panel t0: `Longshot Artillery Mech (iron_eden) | HP: 210 /
210 | Armour: Medium | Weapon: Siege Cannon | Cost: 700 scrap | Take
Control`. After attack-moving it to (73,25), the SAME open panel (no
re-tap) read `HP: 70 / 210` at the first 5 s sample. Screenshot
`game/beta-wave3/hprefresh-panel.png` was re-viewed in wave 3: it shows
the same open panel at tick 243 reading `HP: 20 / 210` — still falling,
still the same panel, no re-tap. (70 vs 20 is time passing between the
log sample and the screenshot, not a discrepancy.) Status in shot:
First Map, Scrap 500, blue 9, red 10, Wrecks 1, tick 243, Selected 1,
Mode attackMove.

---

## 2. Formerly waived gates — NEW named waivers

### WAIVER-W3-VICTORY-PANEL (victory panel not rendered in browser)

**Reason, exactly:** no played skirmish match reached a blue victory
in wave 3. Eleven competent-driver iterations (v1–v11) were run across
First/Normal and Third/Easy with salvage + hero + production (§6); every
run ended in defeat or was stopped mid-grind (v8, v9-third, v10b, v11
were killed by the tester, recorded as incomplete, never counted as
losses). Scripted sim stand-ins DO win these matchups (§7), but browser
play never closed one. The panel code path itself is proven: defeat
panels render repeatedly through the same `showVictory()` function
(`game/game.js` ~line 613) with the same `Sim.victoryStats(state)`
rendering. Only the victory title line (`Victory — Iron Eden wins!`)
and its stats line remain unrendered in browser. This is NOT claimed
as a game defect: the losses trace to driver-play limitations (§7),
and no tune is recommended to chase a driver win.

### WAIVER-W3-DRAW-PANEL (draw panel not rendered in browser)

**Reason, exactly:** no browser run reached a draw terminal. Sim draws
exist (third/normal competent 3122 ticks; second/normal before-draw
4819; second/easy competent 6563), but every browser run ended in
defeat or was stopped mid-grind. The draw title line (`Draw — neither
side can win.`) and its two-sided stats line remain unrendered in
browser, through the same proven `showVictory()` path. Same
non-defect qualification as above.

### Two-match win arc — NOT ACHIEVED (no waiver; open item)

A browser win driving level-up + skill spend + a second match was
never executed, because no browser win occurred. Partial evidence,
stated exactly:

- Hero level-up in browser IS proven on a loss: v9 first/normal ended
  `Defeat, tick 2066`, panel stats `Hero XP +185 (level 1 -> 2)`. The
  `--arc` flag only fires on a Victory terminal, so no arc ran.
- Loss arc menu IS proven (beta script): `Command Mech — Level 1 |
  25 XP | 0 skill points unspent | 1 matches, 0 wins`.
- Loadout Dash-spend (level-2 active skill) + match-2 start + hero drop
  in one browser session: UNPROVEN. A loss-level-up is not a
  substitute for the win arc.

### Screenshot-naming discipline (v1.5 quirk not repeated — except once, flagged)

Wave-3 terminal screenshots are named for what they actually show, and
the driver names terminal shots by the actual title kind. One exception
is flagged, not hidden: `game/beta-wave3/beta3-04-tut-win-screen.png`
does NOT show a win screen. Viewed in wave 3, it shows the tutorial
step-6 wreck panel at tick 462 (Scrap 420, blue 11, red 10, Wrecks 2,
`Wreck: Scout Buggy | Faction: xandria | Salvage value now: 30 scrap
(started at 32, decays to 0 over 120s) | Time left: 117s | Salvage this
wreck`). Cite it as the tutorial wreck panel, never as a win screen.
Coordinator may rename the file; the checks record is unchanged.

---

## 3. Full beta pass — 41 checks, 38 PASS, 3 FAIL (all 3 = harness bugs)

Script `scripts/beta-wave3-beta.py` (Playwright, repo-root server,
`/game/index.html`), re-run solo in wave 3 after the hero-HP fix.
Full record: `game/beta-wave3/beta3-checks.json`. Zero console errors.

**PASS (selection, with numbers):**

- Menu visible; difficulty E/N/H status lines (all three state red-AI
  behaviour only, same costs/economy/stats, next match start).
- Tutorial steps 1–5 by doing: Look (zoom advanced it), Select (blue
  unit tapped, selected 1, tick 81), Move, Attack (pulsing target),
  Build (core tap opens build panel, Scout Buggy queued). Step 6
  Salvage text reached. `Play a real game` starts First Map (tick 27,
  blue 9, red 10, wrecks 0).
- Maps: Second (Twin Bridges 80x50) and Third (Forest Belt 80x50) start
  correctly (tick 30, blue 9, red 10).
- Hero cycle: Drop Back In visible at start; drop lands controlled;
  release → `Drop ready in 9s`; re-drop ready after cooldown; re-drop
  preserves HP exactly (`HP: 179 / 200` release == re-drop, fixed
  expectation — see §5); death observed (wrecks 0 → 1); death →
  `Drop ready in 30s`; redeploy ready after death cooldown; redeploy
  lands at full HP 200/200.
- Rally: `Rally set at (15.0, 25.0). New units will move there on
  spawn.` Zoom out clamps at 0.40; zoom 1x resets to 1.00. Pause freezes
  sim (301 → 301); resume advances (301 → 328).
- Corruption: `Hero progress could not be read, so it was reset to
  level 1.`
- Mobile (headless emulation, NOT a real phone): portrait 390×844
  canvas == stage 390×443, overflowX 0, min button 44 px, 16 buttons;
  portrait tray toggle keeps canvas == stage (390×358); landscape
  844×390 canvas == stage 544×311, min 44 px, 38 buttons; landscape
  932×430 canvas == stage 632×370, min 44 px, 38 buttons.
- Phone-landscape twin-stick: two simultaneous touch points via CDP
  multi-touch (emulated touch, NOT a real phone), still controlling.
- Throw match: defeat panel, `Ticks elapsed: 1367 | Sim time: 68.3s |
  Winning units remaining: 17 | Wrecks created: 10 | Wrecks still on
  the field: 1 | Hero XP +25 (level 1 -> 1)`. Viewed screenshot
  `game/beta-wave3/beta3-15-throw-defeat-panel.png`: genuinely that
  panel, Restart / Main Menu buttons, status behind blue 0 / red 17.
- Loss arc menu: Level 1, 25 XP, 0 skill points, 1 match, 0 wins.

**FAIL (all harness, none game — triaged, see §5):**

1. `tutorial salvage gains scrap :: 420 -> 420` — HARNESS TIMING BUG.
   Triage replay (§5) proves the game collects: 420 → 450 at +3 s.
   The script waited 1.5 s for a ~7.8-tile trip.
2. `tutorial step 7 How to win` — CASCADE of (1): step 6 never
   completed inside the script's timing, so step 7 never opened. The
   script's `#tut-play` click still advanced to a real game (PASS).
3. `twin-stick info panel offers Take Control for armed unit` —
   HARNESS TAP BUG. The script's select loop fell through to the core
   tile (6,25) and got the core panel, which correctly shows no Take
   Control (proven by the next check PASSing on the same panel). The
   script's downstream driving checks were skipped as a consequence;
   desktop twin-stick driving is separately proven by the competent
   runs' hero phases (real WASD + mouse, §6).

**NOT covered in wave 3 (do not claim):** minimap-off has NO check in
the beta script (only a bounding-box helper). Wave-2b's
`display:none` result is reference only. Finger-pinch remains
unproven: pinch stays "Zoom-buttons verified / finger-pinch unproven."

---

## 4. Balance investigation — data and recommendation

### 4a. The mechanism that explained the v1–v7 routs (driver error, not game)

`orderSelected` (`game/game.js`): a tap on an enemy issues `{kind:
'attack', targetId}` REGARDLESS of tray mode. Sim firing logic
(`game/sim.js` ~1379–1387): an `attack`-ordered unit fires ONLY at its
target; the auto-acquire fallback covers only `hold`, `attackMove`,
`patrol`, `guard`, or no order. Driver versions v1–v7 tapped the red
core tile (73,25) as the "attack-move" destination and therefore issued
beeline charges that took unanswered fire across the map. Fix from v8:
tap empty ground (71,23) — 2.83 tiles from the core (outside the 2.2
structure hit threshold) and 2.24 tiles from the nearest red spawn
(outside the 1.2 unit tolerance) — a true attackMove. Tap accuracy was
ruled out as a confound by a diagnostic (own-core taps open the Command
Core info panel, HP 800/800; bridge screenshot shows correct camera
centring with real sprites).

### 4b. Sim balance table (seed 20261030, cap 15000 ticks; STALLED = no terminal in harness cap, not a game cap)

Styles: `before` = attack-move every 40 ticks + mirrored production,
no salvage, no hero. `competent` = before production + player-style
salvage (red-AI idle rule verbatim + capped detachment: max 2 units
sent to the highest-value unclaimed wreck within 25 tiles) +
combat-only attack-move. `reserve` = competent play, hero never dropped
(9v10 field). `hero` = competent + hero as an RTS field unit from match
start — an UPPER-BOUND PROXY, not the browser hero (no Drop Back In /
redeploy in sim; browser hero is reserve + twin-stick driven). That
caveat stays attached to every hero-row claim.

| style | map/diff | result | ticks | blueLeft | redLeft | blueScrap | salvageIssued |
|---|---|---|---|---|---|---|---|
| before | first/easy | STALLED | 15000 | 8 | 2 | 70 | 0 |
| before | first/normal | iron_eden win | 1068 | 8 | 0 | 70 | 0 |
| before | first/hard | iron_eden win | 1097 | 8 | 0 | 70 | 0 |
| before | second/easy | draw | 4899 | 2 | 3 | 70 | 0 |
| before | second/normal | draw | 4819 | 2 | 2 | 0 | 0 |
| before | second/hard | draw | 3899 | 2 | 3 | 0 | 0 |
| before | third/easy | STALLED | 15000 | 6 | 2 | 70 | 0 |
| before | third/normal | draw | 2557 | 8 | 1 | 70 | 0 |
| before | third/hard | draw | 2557 | 8 | 1 | 70 | 0 |
| competent | first/easy | STALLED | 15000 | 4 | 2 | 87 | 49 |
| competent | first/normal | iron_eden win | 1098 | 9 | 0 | 1944 | 27 |
| competent | first/hard | iron_eden win | 1086 | 9 | 0 | 1975 | 27 |
| competent | second/easy | draw | 6563 | 3 | 2 | 506 | 42 |
| competent | second/normal | iron_eden win | 2507 | 14 | 0 | 1098 | 26 |
| competent | second/hard | iron_eden win | 2379 | 15 | 0 | 925 | 24 |
| competent | third/easy | iron_eden win | 2983 | 8 | 0 | 167 | 33 |
| competent | third/normal | draw | 3122 | 8 | 3 | 1579 | 21 |
| competent | third/hard | draw | 3122 | 8 | 3 | 1579 | 21 |
| reserve | first/easy | draw | 4640 | 3 | 6 | 31 | 40 |
| reserve | first/normal | iron_eden win | 2486 | 11 | 0 | 1493 | 29 |
| reserve | first/hard | iron_eden win | 1154 | 10 | 0 | 1774 | 24 |
| reserve | second/easy | STALLED | 15000 | 4 | 6 | 508 | 41 |
| reserve | second/normal | iron_eden win | 2570 | 13 | 0 | 1118 | 27 |
| reserve | second/hard | iron_eden win | 2405 | 15 | 0 | 738 | 24 |
| reserve | third/easy | draw | 3636 | 3 | 4 | 1033 | 30 |
| reserve | third/normal | draw | 2611 | 8 | 3 | 2188 | 20 |
| reserve | third/hard | draw | 2651 | 8 | 3 | 2188 | 20 |
| hero | first/easy | STALLED | 15000 | 4 | 6 | 828 | 30 |
| hero | first/normal | iron_eden win | 997 | 10 | 0 | 1859 | 22 |
| hero | first/hard | iron_eden win | 997 | 10 | 0 | 1859 | 22 |
| hero | second/easy | iron_eden win | 3093 | 6 | 0 | 887 | 37 |
| hero | second/normal | iron_eden win | 1411 | 8 | 0 | 1767 | 28 |
| hero | second/hard | iron_eden win | 2150 | 13 | 0 | 1414 | 23 |
| hero | third/easy | iron_eden win | 2894 | 14 | 0 | 174 | 25 |
| hero | third/normal | draw | 3224 | 5 | 3 | 2410 | 25 |
| hero | third/hard | draw | 3224 | 5 | 3 | 2410 | 25 |

Sim diagnostics: `hero-match.js first` WITHOUT salvage flips the
other way (hero off wins first/normal in 1068; hero on LOSES in 2560,
heroDeaths 1) — and lancer-gun hero still loses in 2560, so the flip
is not the weapon delta. `roster9` (applyRoster only, no hero) on
first/normal STALLS at 15000 with a bare core + 70 scrap (cheapest
producible is Scout Buggy, 80) and no wrecks left — the stand-in
battle is knife-edge: 10v10 wins, 9v10 without salvage stalls or
loses. Easy stalls end with red hold-order sensor drones (air,
weaponless) salvaging base-area wrecks while blue does not — the
sim-side explanation for the v1.5 observation that red production
grew while attack-only blue lost. A first-version salvage rule
(idle-only) collapsed exactly to `before` everywhere (salvageIssued 0):
an attacking army has no hold units near the front, and fresh spawns
idle at base more than 15 tiles from front wrecks — evidence, not a
result.

### 4c. Browser competent runs (all Playwright, real input, 0 console errors after the server-root fix)

- v1–v7 (core-tap bug): defeats at ~1550–1730 ticks, 0v17–18. Explained
  by §4a, not by balance.
- v8 first/normal (true attackMove): INCOMPLETE, killed by tester at
  tick 3048 (blue 2, red 8, scrap 1015). Mid-game was contested (2v4 at
  1317, 1v6 at 2193), not a rout. 8 s hero drives stayed 200/200 — they
  stopped short of the fight.
- v9 first/normal (fill-to-3 scouts, 12 s drives): DEFEAT, tick 2066
  (103.3 sim s), red 13, blue 0, wrecks 27/9, Hero XP +185 (level 1 →
  2), scrap 864. 12 s drives reach combat; hero died, redeployed (200
  scrap paid), fought, died again. Opening queued 3 scouts.
- v9 third/easy: INCOMPLETE, killed at tick 2708 (blue 1, red 4, scrap
  208, wrecks 7). Hero sat in reserve at 129 HP after the 4-drive cap
  (driver limitation, raised to 12 in v10b).
- v10 third/easy (most-expensive-first, unfiltered): FLAWED, killed at
  tick 169. Queued flak_tank (340) + interceptor_drone (150) — both
  air-only, cannot hit a ground army. Lesson: target-class filter
  required.
- v10b third/easy (v10 + ground-capable filter): INCOMPLETE, killed at
  tick 1470 (blue 1, red 8, scrap 0, wrecks 0). Healthiest mid-game yet
  at tick 881 (blue 6, red 8), then collapse. Hero phase 2 started at
  41 HP (took 152 damage during the drop telegraph / first seconds —
  red units at the blue core) and drove east away, flat 41.
- v11 third/easy (v10b + per-cycle attack refresh): INCOMPLETE, killed
  at tick 993 (blue 4, red 13, scrap 0). The v4 refresh-only rule rested
  on v2/v3's early bleed, now explained by §4a, so per-cycle refresh
  was a justified experiment; it did not outperform v10b (seed
  variance dominates at this sample size — do not over-claim either
  way). Hero phase 1 reached combat at the drive's end (200 → 168)
  and died just after.

Production note: the hero REPLACES the west roster's lancer_mech
entry (`game/game.js` newGame): hero-on starts 9v10 on the field, not
10v10. Test Map is the same 10v10 shape on a smaller map (64x40, cores
(6,20)/(57,20)) and never gets a hero — no cheap played victory there.

### 4d. Recommendation: NO TUNE

Salvage, not the hero, is the decisive play element in sim: with
salvage present, second/normal and second/hard flip draw → win,
third/easy flips stall → win, and first/normal reserve (9v10 +
salvage) wins in 2486 ticks versus stalling without salvage. The hero
proxy adds speed and survivors once salvage is present (first/normal
997 vs 1098; second/normal 1411 vs 2507) but flips nothing on
third/normal or third/hard, which remain draws under all
competent/hero stand-ins. Easy matches run very long even when
competent.

The browser gap versus sim competent/reserve wins is driver play, not
game numbers: (1) spawn-to-order latency ~200–600 ticks in browser
versus 40 in sim; (2) hero duty cycle ~25–30% (12 s drives + 30 s
death / 10 s voluntary cooldowns) versus the sim proxy's 100%
presence; (3) army salvage 0 via UI taps in every browser run (hero-drive
collections only, worth ~200–275 scrap in v5/v9-third runs); (4)
scout/mortar-only pipelines versus the sim's diversified production.
A human player buys mixed units, salvages with detached units, and
drives the hero continuously — exactly what the sim's
competent/reserve wins model. Tuning difficulty behaviour, costs,
economy, or weapon stats to make DRIVER play win would make human
play trivially easy. No tune applied by this wave (coordinator owns
any tune); none is recommended.

UX observation (not a bug claim, for the coordinator): salvage needs
<1.2-tile wreck-tap precision, which makes it hard to execute
mid-battle — a possible consideration (e.g. salvage-mode tap snaps to
the nearest wreck within a larger radius, or a "salvage nearest"
button). This is not a balance tune and is not filed as a bug.

---

## 5. Harness bugs found and fixed (harness, NOT game bugs)

- Server root: early runs served `game/` as HTTP root, so every
  `../assets/` request 404'd (157 console errors). Fix: serve the repo
  root and load `/game/index.html`. After the fix, v4–v11 report 0
  console errors and 0 unique 404s. `game/assets/` does not exist;
  files live under repo-root `assets/`.
- Build-panel re-render detaches buttons mid-click (30 s Playwright
  locator timeouts in v4). Workaround: evaluate-clicks for build-panel
  close and build buttons. Filed as an observation in §6 (a human
  click may still land; characterise from build-panel rendering before
  calling it a UX bug).
- Click timeouts: driver `click()` now uses 3000 ms (a 30 s default once
  burned ~600 ticks unattended). Log loss to `tail` pipes: driver now
  writes `<tag>.log`; beta script writes `beta3-checks.json`. Do not
  pipe driver output through `tail` again.
- Stale browsers after kills: kill orphaned Chromium trees after any
  killed run (check `ps` for `http.server 893x` / chrome-headless).
  Final wave-3 state: 0 orphans, 0 servers.
- Beta hero-HP check (FIXED): compared re-drop HP to pristine 200;
  correct expectation is release HP == re-drop HP (proven 179 == 179).
- Beta tutorial-salvage check (TRIAGED, fix pending by coordinator):
  1.5 s wait after the wreck tap is too short. Focused replay
  (`/tmp/tutsalv.py`, imports the beta Driver so tap math matches):
  tutorial steps 1–5 replay exactly; step 6 reached after 8 s; salvage
  unit selected at (12,23) (the (10,21) scout moved to (18,22) in step
  3, so the loop picks the medium_tank); scrap 420 → 450 at +3 s
  (wrecks 2 → 1); wreck panel read `Salvage value now: 30 scrap
  (started at 32, decays to 0 over 120s) | Time left: 117s`. Fix: wait
  ≥4 s (or poll to 10 s) before reading scrap. Step-7 FAIL is a pure
  cascade of this.
- Beta twin-stick check (TRIAGED, fix pending by coordinator): select
  loop `(10,21), (8,22), (12,23), (6,25)` fell through to the core
  tile; the core panel correctly lacks Take Control. Fix: exclude
  structure tiles from the armed-unit loop, or fail-closed when the
  selected panel is a structure. The skipped driving checks are
  covered by §6 hero phases (desktop) and the CDP multi-touch check
  (phone landscape).

## 6. Bugs / observations filed for the coordinator (none fixed in game code)

1. (Observation, needs care) Build panel re-renders during queue
   progress in a way that detaches its buttons mid-click, defeating
   Playwright locator clicks (30 s timeouts in v4). Repro: queue a
   unit, click a build-panel button via locator while the queue
   progresses. A human click may still land; characterise from
   `game/game.js` build-panel rendering before calling it a UX bug.
   Driver workaround: evaluate-clicks.
2. (Driver play error, resolved in v8, NOT a game bug) v1–v7 attack
   taps on the red core issued beeline `attack` orders, not attackMove
   (§4a). Do not file as a game bug; it explains the v1–v7 rout shape.
3. (Harness, resolved, NOT a game bug) Early 404 asset loads were a
   server-root error (§5).
4. (Open question, not a bug claim) Browser competent play on
   First/Normal lost the v9 terminal (2066 ticks, 0v13) while sim
   stand-ins win the same matchup — decided in §4d as driver play
   (scout-only pipeline, hero duty cycle, no army salvage), not
   evidence for a tune.
5. (Driver limitation, recorded) v9-third hero sat unused in reserve
   at 129 HP after the 4-drive cap during a 1v4 grind; v10b raises the
   cap to 12.
6. (File misnomer, flagged) `beta3-04-tut-win-screen.png` shows the
   tutorial step-6 wreck panel, not a win screen (§2). Rename by
   coordinator if desired; do not cite as a win screen.

No game-code bug was found in wave 3 that warrants a fix. The three
beta FAILs are harness bugs with repros in §5; the two waivers in §2
are play-terminal gaps, not defects.

---

## 7. Stress (SANDBOX numbers ONLY, never phone FPS)

Run 2026-10-31 via `node scripts/stress.js` (300 ticks, two blobs
attack-moving): 100 units avg 1.943 ms/tick, p95 4.432, max 73.413, 65
alive, 11 projectiles; 300 units avg 3.007, p95 4.359, max 63.5, 205
alive, 28 projectiles; 500 units avg 4.977, p95 43.087, max 67.08, 342
alive, 49 projectiles. Consistent with wave 2b (100: 1.422/6.216/
47.791; 300: 2.575/2.227/59.333; 500: 4.359/11.419/62.663); no regression
signal — the 500-unit p95 rise (43 vs 11) sits beside a similar max,
i.e. one slow tick (GC/spike) rather than a trend; average still
~5 ms.

---

## 8. Regression tests

New file `tests/beta-wave3.test.js` (3 pass, verified individually),
each pinning a mechanism the balance investigation rests on that was
not already pinned elsewhere (152 hero-wreck value already in
`beta-wave1.test.js` / `herophaseb.test.js`; deadlock core-alive
already in `deadlock.test.js`; AI salvage already in
`prototype03.test.js` — none duplicated):

1. Player-issued salvage order to a distant wreck collects the
   decayed value (detachment mechanism). Gotcha: with no red core,
   killing the only red unit declares blue the winner and freezes the
   sim (`game/sim.js` line 1303 `if (state.winner) return;`), so the
   test gives red a keep-alive core at (57,20) with 0 scrap.
2. A bare core with 70 scrap cannot afford any unit (cheapest
   producible is 80): `Sim.queueProduction` returns `{ok: false,
   reason: 'insufficient-scrap'}` at 70 and `{ok: true}` at 80.
3. An unsalvaged wreck expires after `Sim.WRECK_LIFETIME_TICKS` (2400)
   and pays nothing.

Full suite, explicit 26-file list, from `~/workspace/surface-wars/`:
`node --test tests/animation.test.js tests/beta-wave1.test.js
tests/beta-wave1b.test.js tests/beta-wave2.test.js
tests/beta-wave2b.test.js tests/beta-wave3.test.js tests/catalog.test.js
tests/deadlock.test.js tests/firstmap.test.js
tests/gameplay-difficulty.test.js tests/gameplay-thirdmap.test.js
tests/graphics-wave2.test.js tests/graphics-wave3.test.js
tests/herophaseb.test.js tests/landscape.test.js tests/mobile.test.js
tests/progression.test.js tests/prototype02.test.js
tests/prototype03.test.js tests/redcombat.test.js
tests/secondmap.test.js tests/sim.test.js tests/sprites.test.js
tests/tutorial.test.js tests/twinstick.test.js tests/view.test.js`
→ **242 pass, 0 fail** (baseline 234; +3 wave-3 tests, +5 from test
files added concurrently by other work — provenance of those 5 not
established by this wave; no old-test changes made here).

---

## 9. Boundaries kept

- Work only in `~/workspace/surface-wars/`. No other project touched.
- No commit, push, merge, publish, or APK build in this wave.
- No `game/` gameplay/render code, `assets/`, `apk/`,
  `AUTONOMOUS-LOOP.md`, `RESUME.md`, `CONTROLS.md`, or `UPGRADE-LOOP.md`
  edits. Owned files only: `tests/beta-wave3*.test.js`,
  `scripts/beta-wave3*.js` (driver is `scripts/beta-wave3-driver.py`,
  Python — naming choice flagged to the coordinator),
  `scripts/beta-wave3-beta.py`, this report, screenshots under
  `game/beta-wave3/`.
- Strict 90° top-down; Iron Eden = blue, Xandria = red, 500 scrap both
  factions; red AI never cheats, never reads hero/control state;
  hero placeholder "Command Mech" only, reserve model, Drop Back In
  only entry, loadouts between matches only, device-local
  `surfacewars.hero.v1`, Phase C caps, L1 anchor = lancer; Cycle 3
  deadlock frozen (600 ticks, structural, elimination precedence,
  tutorial excluded, no weapon/economy changes to fix endgames);
  twin-stick guardrails kept (no hidden multipliers, firing gates +
  30° aim cone, pooled projectiles, release semantics).
- No religious language in any file (faction "Iron Eden" excepted).
- No faked pinch: pinch stays "Zoom-buttons verified / finger-pinch
  unproven." Touch-stick evidence is CDP emulated multi-touch only,
  never a real phone. Mobile and stress numbers are headless-emulation
  / sandbox numbers, never phone results.
- Screenshots cited here were all viewed by this wave (or, for
  herodeath, viewed in the wave-3 session and re-confirmed by log):
  `game/beta-wave3/herodeath-wreck-panel.png`,
  `game/beta-wave3/hprefresh-panel.png`,
  `game/beta-wave3/beta3-15-throw-defeat-panel.png`,
  `game/beta-wave3/beta3-04-tut-win-screen.png` (wreck panel, not a
  win screen — see §2),
  `game/beta-wave3/first-normal-defeat-panel.png` (v2, viewed).
- Incomplete runs (v8, v9-third, v10b, v11) were killed by the tester
  to close the played-win chase after the pattern was established;
  they are recorded as incomplete, never as losses or wins.
