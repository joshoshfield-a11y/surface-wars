# Surface Wars — Prototype 02 Slice Report: Menus, Controls, Mechanics

Date: 2026-10-30. Scope: `game/` + `tests/` ONLY in `~/workspace/surface-wars/`.
`sim.js` MAY change in this pass and did (see §5). No catalog change was
needed: all costs and build times come from the existing
`data/catalog.json` (mirrored in `game/catalog.js`, untouched).
`sprites/`, `sprites-90/`, `tiles-overlay/`, `assets/animation/` art, and
`~/workspace/scrap-dungeon/` were not touched. Nothing was committed,
pushed, published, or packaged as an APK.

Prototype 01 baseline (verified before work): 46/46 tests via the
explicit file list. Prototype 02 result: **65/65** (46 old + 19 new).
Every new mechanic has a test; nothing untested is claimed to work.

## 1. Menu map (all real, all with a way back)

| Menu | Reach | Back / exit | Sim state while open |
|---|---|---|---|
| Main menu | On load | Play buttons start a map; Settings/How to Play have Back | Frozen (tick stays 0 — see `p02-main-menu.png`) |
| Pause menu | Pause button, Menu button, Esc, Space | Resume, Esc, Space | Frozen |
| Settings | Pause menu or main menu | Back (returns to whichever menu opened it) | Frozen (inherits the opener) |
| How to Play | Main menu | Back | Frozen |
| Victory / Defeat | Automatic on sim winner | Restart, Main Menu | Frozen; the game never runs invisibly behind it |
| Build menu | Select your Command Core | Deselect / select something else | Game keeps running (it is a panel, not a modal) |
| Info panel | Select a unit, structure, or wreck | Deselect | Game keeps running |

No dead buttons: every button in the main menu, pause menu, settings
panel, victory panel, build panel, and command bar is wired. The
Settings panel contains ONLY working toggles — Paths, FX/Animation,
Shadows, Minimap — plus Reset to defaults. There is deliberately no
sound toggle: the game has no audio, and a fake one would be a lie.

## 2. Control table (what changed vs Prototype 01)

| Control | Status in Prototype 02 | How |
|---|---|---|
| Queued orders | IMPLEMENTED | Shift+click/tap appends instead of replacing; unshifted orders replace + clear the queue. Queued path draws as one connected line (current path, then each queued destination) |
| Unit groups | IMPLEMENTED (desktop keys) | Ctrl+1..9 assigns, 1..9 recalls (pruned against live entities). Membership shows in single-unit info. Pure-data helpers in `view.js` (`createGroups`/`assignGroup`/`recallGroup`), tested |
| Double-click / double-tap select-all-of-type | IMPLEMENTED | Second tap on the same player unit within 350 ms selects all visible player units of that type (adds them, in Add mode) |
| Patrol | IMPLEMENTED | Patrol mode: tap two points; unit loops A↔B and engages enemies en route (same acquire/fire code as attack-move); a stale chase path is dropped when the target dies so the unit resumes its leg |
| Formation movement | IMPLEMENTED | Group move/attack-move: centred grid, 2 tiles apart, one destination per unit, clamped to the map. Unreachable offset = that unit holds, it never stacks or steals another unit's spot |
| Minimap drag | IMPLEMENTED | Dragging the minimap pans continuously; click still centres |
| Pan mode | IMPLEMENTED | Pan: Off/On button. ON = mouse drag pans instead of selecting. Documented in CONTROLS.md as the answer to the old mouse-drag-pan gap |
| Touch multi-select | IMPLEMENTED | Add Select: Off/On button. ON = unit taps (and mouse drag-select) ADD to the selection instead of replacing it |
| Structure selection | IMPLEMENTED | Player structures select (white ring in render, info panel). Command Core opens the build panel. Enemy structures are attack targets, never selected |
| Wreck selection | IMPLEMENTED | Tap with no units selected = info. Tap with units selected = salvage order + info. Wreck info shows current value, starting value, time left |

Unchanged and still true: Hold-mode tap fallback (tap ground in Hold
mode = Move), tap ≤ 8 px / drag > 8 px thresholds, zoom 0.4×–3× with
smooth animation, zoom-to-selection, bridge-only ground crossing.

## 3. Economy numbers (the whole slice, no hidden knobs)

- **Starting scrap: 500** (Iron Eden only; Xandria starts at 0 and has
  no economy in this slice). Justification: 500 buys a Medium Tank
  (300) + a Scout Buggy (80) with 120 left over, or a spread of cheap
  recon — but not a Heavy Tank (520). The opening build is a choice,
  and everything beyond it must come from salvage.
- **Build-time rule: catalog `buildTime` seconds, used as-is**
  (× 20 ticks/s). No derivation, no invented numbers. Examples:
  Scout Buggy 80 scrap / 8 s, Medium Tank 300 / 20 s, Flak Tank 340 /
  22 s, Mortar Carrier 320 / 22 s.
- **Producible filter: catalog roster ∩ (Power = 0 AND Components = 0).**
  11 Iron Eden units qualify (Scout Buggy, Vespid Scout, Combat Drone,
  Medium Tank, Mortar Carrier, Interceptor Drone, Flak Tank,
  Construction Vehicle, Recovery Crawler, Field Repair Mech, Combat
  Engineer — full list is the panel itself). Units needing Power or
  Components (Heavy Tank, Siege Cannon, Longshot Mech, …) are NOT
  listed and cannot be queued, because those layers do not exist yet.
  This is a deliberate restriction, not an oversight, and it is stated
  in the panel, in CONTROLS.md, and here.
- **Payment: on queue, not on completion. Cancel: full refund**,
  including the in-progress item. If the core dies mid-queue, the
  whole queue is refunded.
- **Spawn: first passable tile spiralling out from the core**
  (Chebyshev rings 1–5, by the unit's own movement class). If no tile
  is free, the finished item waits at 0 ticks and retries every tick —
  a paid unit is never silently dropped.
- **Salvage fraction: 40%.** Wreck base value =
  `floor(0.4 × catalog scrap cost)` — never full value. Examples:
  Scout Buggy 80 → 32, Medium Tank 300 → 120.
- **Decay: linear to 0 over 120 seconds (2400 ticks), then expiry.**
  Value at age `t` = `floor(base × (2400 − t) / 2400)`. A wreck
  collected late pays its decayed value, verified by test.
- **Salvage rules:** any player unit can salvage (Prototype 02
  simplification, stated plainly — not restricted to Recovery
  Crawlers). Collection range 1.5 tiles. On arrival the unit collects
  the current value, the wreck is removed, and the unit holds or runs
  its next queued order. If the wreck expires mid-route, the order
  falls through to the queue/hold. Wrecks NEVER block movement and are
  NOT combat units (explicit decision, unchanged from Prototype 01).
- **Behaviour change to note:** Prototype 01 wrecks were render-only
  and persisted forever. Prototype 02 wrecks are sim records, so they
  now decay and expire. The visual wreck art is derived from
  `state.wrecks` each frame — one source of truth.

## 4. Screenshots (headless desktop Chromium, Playwright, viewed)

Real-game shots (no staging — clicked through the actual UI):

- `p02-main-menu.png` — main menu on load, all four buttons, sim at tick 0 behind it.
- `p02-build-menu.png` — Command Core selected: info panel (HP 800/800, Fortified, role) + production panel (name, scrap cost, build time per unit).
- `p02-build-queue.png` — after queueing a Scout Buggy: status bar scrap 500 → 420, queue line "Scout Buggy — 9% (8s left), Cancel (refund 80)". Queue was moved above the producible list after the first shot showed it below the panel fold.
- `p02-unit-info.png` — Scout Buggy selected: ring + panel (HP 60/60, Armour Light, Scout Autocannon, cost 80 scrap).
- `p02-pause-menu.png` — pause menu via Esc, all six actions present.

STAGED shots (stated as staged, per the task brief — a full battle to
elimination is impractical to screenshot live; the staging was a
throwaway copy in /tmp with a one-line spawn patch, running the
unmodified UI code, and the shipped game was not given any debug hook):

- `p02-wreck-info.png` — STAGED: a red scout was spawned dead near the
  west base so its sim wreck appears in view. Selected wreck ring +
  panel: "Salvage value now: 31 scrap (started at 32, decays to 0 over
  120s), Time left: 120s". The 32 → 31 drop after ~29 ticks is the
  linear decay working, not a bug.
- `p02-victory.png` — STAGED: all red entities removed at spawn so the
  sim declares Iron Eden the winner on tick 1. Overlay shows ticks
  elapsed 1, sim time 0.1 s, 10 winning units remaining, 0 wrecks
  created, 0 remaining, with Restart and Main Menu. The game is frozen
  behind it (tick stays 1).

Not screenshotted (no visual claim made): queued-path drawing, patrol
looping, formation spread, minimap drag, and group recall are covered
by sim/view tests and code inspection, not by screenshots — the
screenshots above prove the menus/panels, not every control gesture.

## 5. Files changed

- `game/sim.js` — economy + wrecks + queues + patrol + formation
  (new exports: `STARTING_SCRAP`, `SALVAGE_FRACTION`,
  `WRECK_LIFETIME_TICKS`, `SALVAGE_RANGE`, `scrapOf`,
  `producibleUnits`, `productionQueue`, `queueProduction`,
  `cancelProduction`, `findWreck`, `salvageWreck`, `victoryStats`,
  `formationOffsets`, `issueFormationOrder`; `issueOrder` gained an
  `opts.append` argument, default behaviour unchanged).
- `game/view.js` — group helpers + `queuedDestinations` (pure, tested).
- `game/render.js` — selected-structure ring, selected-wreck ring,
  queued-path extension, FX/shadow toggles (default on).
- `game/game.js` — rewritten shell: menus, settings, info/build
  panels, scrap status, all new controls, minimap drag, sim-wreck
  visuals, victory overlay. Demo opponent driver unchanged.
- `game/index.html`, `game/style.css` — overlays, panels, new buttons.
- `game/CONTROLS.md` — rewritten to Prototype 02; doc and game agree.
  The old NOT IMPLEMENTED list is now implemented except the items in
  §6 below.
- `tests/prototype02.test.js` — 19 new tests.
- `game/p02-*.png` — 7 screenshots (5 real, 2 staged, labelled above).
- NOT changed: `data/catalog.json`, `game/catalog.js` (no catalog
  change to document — costs/times already existed).

## 6. Test results

Command (directory invocation fails on this Node version, so the
explicit list is used):

```
node --test tests/sim.test.js tests/view.test.js tests/firstmap.test.js \
  tests/catalog.test.js tests/animation.test.js tests/sprites.test.js \
  tests/prototype02.test.js
```

Result: **65 tests, 65 pass, 0 fail** (46 pre-existing + 19 new).
New coverage: starting scrap; producible filter; spend / block /
full-refund-on-cancel (including cancelling the in-progress item);
rejected queues (non-core, enemy core, non-producible); production
timing (nothing early, head-first, queue order) and spawn (next to
core, passable tile, air-unit spawn); wreck fraction (300 → 120);
linear decay (32 → 16 at half life) and expiry at 2400 ticks;
structure deaths leave no wreck; salvage travel + collect + hold;
late salvage pays the decayed value; queued order runs after the
first; non-appended order replaces + clears; group assign/recall copy
semantics; formation offsets distinct + centred + distinct group
destinations; patrol leg flips A→B→A; patrol engages and resumes;
victory stats (null before a winner; winner/tick/units/wrecks after).

One test-design catch, fixed during the pass and worth knowing: a
salvage test that killed the ONLY red unit froze the sim — not a bug,
but victory-by-elimination firing (a declared winner stops `step()`).
Those tests now keep a distant surviving red unit so the economy
under test can actually run.

## 7. Honest gaps (nothing silently skipped)

- **Explicitly NOT in this pass, as briefed:** research/tech tree,
  fog of war, campaign, multiplayer, placing new structures,
  Power/Components/Supplies layers, Salvage Clans/Directorate
  factions, and any change to the red demo opponent (it keeps its
  attack-move script; production/salvage are player-side first).
- **Also still missing:** guard orders, rally points, transport,
  repair, on-screen group buttons (groups are keyboard-only),
  phone playtest (screenshots are headless desktop Chromium).
- **Known rough edges:** the producible list scrolls inside its panel
  (11 buttons + queue); the Command Core info panel quotes the
  catalog description verbatim ("…elimination in Prototype 01") —
  catalog text was intentionally not edited; queued-path drawing,
  patrol, formation, minimap drag, and group recall are test-verified
  but were not each screenshotted.
- **What was NOT claimed:** no AI economy, no balance validation
  beyond the stated numbers, no performance measurement for the new
  sim paths (production/wreck processing is O(queue + wrecks) per
  tick and trivially small at this scale, but it was not benchmarked).
