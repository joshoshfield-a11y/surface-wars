# Twin-Stick Phase A — report (FROZEN 2026-10-31)

## Spec sentence (judge against it, met with no exception)

> "Any selected player unit with a weapon can be taken over with twin
> sticks and released back to RTS orders without stuck orders, on phone
> landscape and desktop."

**Verdict: MET.** Entry, drive, aim/fire, release, fresh RTS order
after release, pause-preserves-mode, death-exit, and multi-touch were
all proven by tests and by a headless playthrough on both viewports.
No old test expectation was changed.

## Seed

The control-state machine (enter → control → release/death) plus the
stick-to-velocity/aim mapping. Proven by three variations driving the
same sim branch: phone twin sticks, desktop WASD + mouse, and Esc
release.

## Aim rule + angle

While firing, the unit shoots at the **nearest enemy** that passes
**every normal firing gate** — weapon range, minimum range, line of
sight (rock blocks), target class, cooldown, accuracy, damage type,
and the armour matrix — **AND lies within a 30° half-angle cone**
(`MANUAL_AIM_CONE_DEG = 30`, `MANUAL_AIM_CONE_RAD`) of the aim-stick /
mouse-aim direction. Aiming away, out of range, inside minimum range,
at the wrong class, or behind rock fires nothing. Shots use the
existing pooled projectile pool (2,048 slots, no per-shot allocation).
Driving well gives no hidden bonus: same speed, weapons, cooldowns,
and damage as RTS orders. If twin-stick ever systematically
outperforms RTS orders with the same loadout, that is an input bug,
not a damage bonus.

## What changed, file by file

- `game/sim.js` — manual branch in `step()` (before target
  acquisition, after cooldown decrement): movement at
  `speed × TICK_DT / movementCost` with axis-separated terrain
  blocking (a diagonal drive into a water/rock corner slides along
  the passable axis, never enters a blocking tile), clamped to the
  map, `facing` = move direction; firing per weapon through
  `fireWeapon` with the cone + all normal gates, then `continue` so
  orders and auto-engage are skipped (group/guard/rally/patrol
  orders were cleared on entry, not queued). Added
  `setManualControl` (hold order, path/queue cleared),
  `clearManualControl` (hold order, path/queue cleared),
  `setManualInput` (move vector clamped to magnitude ≤ 1),
  `angleDiff` (normalised to [-π, π]). No weapon, economy, AI, or
  pathfinding code touched; no catalog entry changed. The red AI
  never reads the manual flag — it iterates xandria units only, and
  a controlled unit is always an iron_eden unit, so the AI treats
  it as an ordinary enemy unit.
- `game/view.js` — pure helpers, all exported and tested:
  `stickZones` (left = left 40% of canvas width, bottom 60% of
  height; right = right 40%, bottom 60%; middle 20% stick-free),
  `stickZoneAt`, `stickVector` (`STICK_RADIUS = 60`,
  `STICK_DEADZONE = 0.35`, magnitude capped at 1),
  `takeControlState` (tutorial → hidden; structure → "Structures
  cannot be controlled."; count ≠ 1 → "Select one unit to take
  control."; unarmed → "This unit has no weapon."),
  `canOrderProduction` (false while controlling).
- `game/game.js` — shell control state (`controlUnitId`,
  `controlSticks` keyed by pointer id, `controlKeys` WASD set,
  `mouseAim`); `enterControl` / `releaseControl` (hold order,
  path/queue cleared, selection preserved, no silent resume) /
  `exitControlSilent` (death, victory panel, quit, new game);
  Take Control button in the command row + in the single-unit info
  panel (disabled with reasons, hidden in tutorial / while
  controlling, never for structures or enemy units); control strip
  in `#side` (Release Control, Pause / Menu, HP bar, weapon-range
  note, landscape-recommended note); info and build panels
  suppressed while controlling (see catches below); production
  unorderable while controlling; canvas pointer handling while
  controlling (stick zones only — no pan, pinch, selection, or RTS
  orders; mouse aim + LMB fire via `e.buttons`; touch sticks by
  pointer id; pointercancel clears sticks); minimap taps ignored
  while controlling; key handling (WASD tracked, Esc first press
  releases / second opens pause, Space stays pause, group recall
  ignored while controlling, zoom/path keys still allowed);
  per-frame manual input fed to the sim before each step batch;
  camera follow (centred on the controlled unit, clamped via
  `View.clampCamera`); death exit (mode off, selection cleared,
  camera stays on the death tile, "Controlled unit destroyed."
  feedback); victory exit before `showVictory`; pause preservation
  (no clearing on pause/resume); rotate-hint suppression while
  controlling; range ring + stick visuals drawn after `drawScene`.
  Order functions (`orderSelected`, `orderSalvage`) and group
  buttons ignore the controlled unit while it is controlled, so a
  multi-select order cannot drag it along.
- `game/index.html` — `btn-take-control` in the command row;
  `#control-strip` in `#side` (Release Control, Pause / Menu, HP,
  range note, landscape-recommended line).
- `game/style.css` — `#control-strip` hidden by default; under
  `body.controlling`, `#commands` hidden, `#control-strip` shown,
  `#rotate-hint` suppressed.
- `game/CONTROLS.md` — new "Twin-stick manual control (Phase A)"
  section (entry, phone zones, desktop keys, aim rule + 30° cone,
  movement, camera, exit, death, limits) and the Still NOT
  IMPLEMENTED list updated (twin-stick moved out; hero mech,
  levels, XP, skills, loadouts, gear, and persistence stay listed
  as later phases).
- `tests/twinstick.test.js` — 16 new tests (see below).
- `UPGRADE-LOOP.md` — Twin-Stick Phase A entry as a SEPARATE track
  from the generation cycles (cycles not renumbered).

## NOT built (out of scope, verified absent from the diff)

No hero, level, XP, skill, loadout, or persistence code; no Drop
Back In / reserve model; no weapon compatibility/loadout data; no
gear; no abilities (no ability buttons, no ability keys wired); no
mid-match refit; no new units, weapons, or art (existing sprites /
FX / projectiles only); no APK, publishing, commit, or push.

## Tests

`node --test tests/*.test.js` — **132/132 pass** (116 pre-existing +
16 new, no old expectation changed). New tests cover: stick zones
(canvas fractions, middle 20% stick-free), deadzone 0.35 + magnitude
cap 1, multi-touch independence by zone, take-control gate (single
armed unit / multi-select / unarmed / structure / tutorial-hidden),
production-unorderable while controlling, entry (hold + path/queue
cleared), movement at catalog speed (scout 7 tiles in 1 s, oversized
vector still speed-capped), terrain blocking (ground stopped by
water and rock, air crosses the river), orders ignored while
controlled, pooled projectiles (pool stays 2,048, cooldown set to
the weapon interval), aim cone (90° off fires nothing, on-target
damages), range / minimum range / target class / LOS gates, no
firing without a firing input, release (hold + cleared + fresh move
order followed, no stale resume), death (unit removed, normal 40%
wreck), red AI never clearing the manual flag.

## Headless playthrough (Chromium, real input events)

20/20 checks. Desktop 1280×800 (mouse + WASD): menu → First Map →
minimap centre on the blue base → click the (12,25) medium tank →
Take Control enabled → strip visible, tray hidden → strip Pause
opens the pause menu → resume preserves control mode → hold D
1.2 s drives the unit east (12.02 → 14.36) → mouse aim + LMB hold
kills a harness-spawned red target → Release Control gives hold
order, empty path, selection preserved → fresh move order to empty
ground followed west → re-select works → Esc releases, second Esc
opens pause. Phone landscape 844×390 (touch + genuine CDP touch
events): tap selects one unit → Take Control → CDP left-stick drag
drives east → two sticks tracked simultaneously by pointer id →
right-stick aim + hold kills a harness-spawned red target →
third-pointer button click releases control.

Provenance, stated honestly: the playthrough ran on a `/tmp` copy
with a test-only `window.__sw` hook exposing state/selection/
controlling/camera/sticks for assertions; the copy's `game.js` was
verified identical to the shipped file except the hook lines.
Harness-spawned red targets (4 tiles east of the controlled unit)
were used only so firing could be observed without a 50-tile drive;
the shots came from real mouse aim + LMB hold and a real right-stick
drag through the shipped input path. Screenshots (shipped tree):
`game/twinstick-desktop-control.png`,
`game/twinstick-phone-control.png` (strip, HP/range note, range
ring, clear canvas), plus the playthrough's end-state shots
`twinstick-desktop-strip.png`, `twinstick-phone-strip.png`.

## Counterpart catches (fixed, not waived)

1. **Pause unreachable by tap while controlling.** The Pause button
   lived in the command tray, which is hidden while controlling.
   Fix: the control strip carries its own Pause / Menu button.
   Space already paused while controlling, and resume never touched
   control state, so pause-preserves-mode holds through both routes.
2. **Info panel covered the stick zones.** The bottom-anchored info
   panel sat on top of the left stick zone (and the edge of the
   right one) and swallowed stick touches. Fix: info and build
   panels are suppressed while controlling and return on release.
   The strip carries the HP/range note instead.
3. **Two playthrough failures were harness/test artifacts, not game
   bugs.** A west move-order target sat on the longshot mech — a
   click on a unit selects it (normal RTS behaviour), so the target
   was moved to empty ground. Synthetic PointerEvents failed
   `setPointerCapture` (real touch pointers never throw there), so
   the phone sticks are now driven with genuine CDP touch events.

## Honest gaps (do not hide)

- **No real-phone thumb-ergonomics playtest.** Headless emulation
  cannot prove it. Phase A must be played on a real device before
  it is considered proven on phone.
- **Pinch/zoom while controlling is via the zoom buttons only.**
  Pinch was never finger-tested anywhere in the game; the buttons
  are the verified route.
- **Sustained-fire phone performance under a full battle is
  unmeasured from the sandbox.** The pooled-projectile constraint
  (no per-shot allocation) is in place and tested, but frame cost
  on the S25 is not.
- **No APK in this phase.** v1.3 on the phone predates twin-stick
  entirely; a rebuild needs its own authorisation.
- **No human has driven a unit yet.** Balance feel (30° cone,
  deadzone, stick radius) is judgement + tests, not playtested feel;
  retune from real play, not from this report.
