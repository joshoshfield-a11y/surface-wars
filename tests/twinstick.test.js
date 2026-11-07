/* Twin-Stick Phase A tests: manual control input path (sim) + shell
   gates (view helpers). No hero, no loadout, no persistence in this
   phase — those words appear in this file only in this comment.
   Run with the explicit file list:
   node --test tests/*.test.js */
const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');
const View = require('../game/view.js');

function testGame() {
  const map = Sim.createTestMap();
  return Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 42 });
}
function stepN(s, n) { for (let i = 0; i < n; i++) Sim.step(s); }
function aimAt(u, tx, ty) { return Math.atan2(ty - u.y, tx - u.x); }

// ---- View helpers: stick zones, vectors, entry gate ----

test('twinstick: stick zones are canvas fractions — left 40%, right 40%, middle 20% stick-free', () => {
  const z = View.stickZones(800, 400);
  assert.deepEqual(z.left, { x0: 0, x1: 320, y0: 160, y1: 400 });
  assert.deepEqual(z.right, { x0: 480, x1: 800, y0: 160, y1: 400 });
  assert.equal(View.stickZoneAt(800, 400, 100, 300), 'left');
  assert.equal(View.stickZoneAt(800, 400, 700, 300), 'right');
  assert.equal(View.stickZoneAt(800, 400, 400, 300), null, 'middle 20% is stick-free');
  assert.equal(View.stickZoneAt(800, 400, 100, 100), null, 'top 40% of height is not a stick zone');
  assert.equal(View.stickZoneAt(800, 400, 700, 100), null);
});

test('twinstick: stick vector deadzone 0.35 and magnitude cap 1', () => {
  assert.equal(View.STICK_DEADZONE, 0.35);
  assert.equal(View.STICK_RADIUS, 60);
  const tremor = View.stickVector(100, 300, 110, 300);
  assert.equal(tremor.active, false, '10 px tremor is below the 21 px deadzone');
  assert.equal(tremor.mag, 0);
  const half = View.stickVector(100, 300, 130, 300);
  assert.equal(half.active, true);
  assert.ok(Math.abs(half.mag - 0.5) < 1e-9);
  assert.ok(Math.abs(half.dx - 0.5) < 1e-9);
  const far = View.stickVector(100, 300, 400, 300);
  assert.equal(far.mag, 1, 'pushing past the edge caps at magnitude 1, never faster than catalog speed');
  assert.ok(Math.abs(far.dx - 1) < 1e-9);
});

test('twinstick: multi-touch — two sticks tracked independently by zone', () => {
  // Two thumbs at once: a left-zone origin and a right-zone origin
  // produce two independent active vectors. The shell keys sticks by
  // pointer id; this test proves the zone/vector math does not
  // collapse them into one input.
  const left = View.stickVector(100, 300, 130, 300);
  const right = View.stickVector(700, 300, 700, 260);
  assert.equal(left.active, true);
  assert.equal(right.active, true);
  assert.ok(left.dx > 0 && Math.abs(left.dy) < 1e-9, 'left stick drives east');
  assert.ok(right.dy < 0 && Math.abs(right.dx) < 1e-9, 'right stick aims north');
  assert.equal(View.stickZoneAt(800, 400, 100, 300), 'left');
  assert.equal(View.stickZoneAt(800, 400, 700, 300), 'right');
});

test('twinstick: take-control gate — single armed unit only', () => {
  assert.deepEqual(View.takeControlState(1, false, true, false), { ok: true, hidden: false, reason: '' });
  assert.equal(View.takeControlState(0, false, true, false).ok, false);
  assert.equal(View.takeControlState(0, false, true, false).reason, 'Select one unit to take control.');
  assert.equal(View.takeControlState(2, false, true, false).ok, false, 'multi-select never silently takes the first unit');
  assert.equal(View.takeControlState(1, false, false, false).ok, false);
  assert.equal(View.takeControlState(1, false, false, false).reason, 'This unit has no weapon.');
  assert.equal(View.takeControlState(1, true, true, false).ok, false);
  assert.equal(View.takeControlState(1, true, true, false).reason, 'Structures cannot be controlled.');
  const tut = View.takeControlState(1, false, true, true);
  assert.equal(tut.ok, false);
  assert.equal(tut.hidden, true, 'tutorial hides the button, it does not lecture');
});

test('twinstick: production cannot be ordered while controlling', () => {
  assert.equal(View.canOrderProduction(false), true);
  assert.equal(View.canOrderProduction(true), false, 'build panel is replaced by the twin-stick HUD');
});

// ---- Sim: entry, movement, terrain blocking ----

test('twinstick: entry clears path and queue and sets hold; unit has a manual flag', () => {
  const s = testGame();
  const u = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 10, 20);
  Sim.issueOrder(s, [u.id], { kind: 'move', x: 20, y: 20 });
  assert.ok(u.path.length > 0, 'precondition: a path exists before entry');
  const res = Sim.setManualControl(s, u.id);
  assert.equal(res.ok, true);
  assert.equal(u.order.kind, 'hold');
  assert.deepEqual(u.path, []);
  assert.deepEqual(u.orderQueue, []);
  assert.ok(u.manual, 'manual flag set on the unit');
  assert.equal(Sim.setManualControl(s, 99999).ok, false, 'unknown unit cannot be controlled');
});

test('twinstick: movement at catalog speed, no faster, clamped to the map', () => {
  const s = testGame();
  const u = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 10, 20); // speed 7
  Sim.setManualControl(s, u.id);
  Sim.setManualInput(s, u.id, 1, 0, null, false);
  stepN(s, 20); // 1 sim second
  assert.ok(Math.abs(u.x - 17) < 0.01, '7 tiles in 1 second at speed 7, got ' + u.x);
  assert.ok(Math.abs(u.y - 20) < 0.01, 'no sideways drift');
  // Magnitude above 1 is normalised, never faster than catalog speed.
  Sim.setManualInput(s, u.id, 5, 0, null, false);
  stepN(s, 20);
  assert.ok(Math.abs(u.x - 24) < 0.01, 'oversized stick vector still moves at speed 7, got ' + u.x);
});

test('twinstick: ground units cannot be driven into water or rock; air ignores ground blocking', () => {
  const s = testGame();
  // Test map river is x=30..33; bridge rows are 18..21 only, so
  // (29,10) driving east meets open water at x=30.
  const g = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 29, 10);
  Sim.setManualControl(s, g.id);
  Sim.setManualInput(s, g.id, 1, 0, null, false);
  stepN(s, 40);
  assert.ok(g.x < 30, 'ground unit stopped at the water edge, got ' + g.x);
  assert.equal(Math.floor(g.x), 29);
  // Rock at (15,10) blocks a ground drive east from (14,10).
  const r = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 14, 10);
  Sim.setManualControl(s, r.id);
  Sim.setManualInput(s, r.id, 1, 0, null, false);
  stepN(s, 40);
  assert.ok(r.x < 15, 'ground unit stopped at the rock, got ' + r.x);
  // Air flies over the same river freely.
  const a = Sim.addUnit(s, 'combat_drone', 'iron_eden', 29, 10);
  Sim.setManualControl(s, a.id);
  Sim.setManualInput(s, a.id, 1, 0, null, false);
  stepN(s, 40);
  assert.ok(a.x > 33, 'air unit crossed the river, got ' + a.x);
});

test('twinstick: a controlled unit ignores RTS orders until released', () => {
  const s = testGame();
  const u = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 10, 20);
  Sim.setManualControl(s, u.id);
  Sim.setManualInput(s, u.id, 0, 0, null, false);
  Sim.issueOrder(s, [u.id], { kind: 'move', x: 30, y: 20 });
  stepN(s, 20);
  assert.ok(Math.abs(u.x - 10) < 0.01 && Math.abs(u.y - 20) < 0.01, 'order issued mid-control moved nothing');
});

// ---- Sim: firing through the normal gates ----

test('twinstick: firing uses the pooled projectile pool and sets the weapon cooldown', () => {
  const s = testGame();
  const u = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 12, 20);
  const e = Sim.addUnit(s, 'scout_buggy', 'xandria', 15, 20); // 3 tiles east, in scout range 5
  Sim.setManualControl(s, u.id);
  assert.equal(s.projectilePool.length, 2048, 'pool is pre-allocated, never grown');
  Sim.setManualInput(s, u.id, 0, 0, aimAt(u, e.x, e.y), true);
  Sim.step(s);
  assert.ok(s.projectileActive >= 1, 'a shot took a pooled slot');
  assert.equal(s.projectilePool.length, 2048, 'no per-shot allocation');
  assert.ok(Math.abs(u.cooldowns[0] - 0.45) < 1e-9, 'cooldown set to the weapon interval, got ' + u.cooldowns[0]);
});

test('twinstick: aim cone — 30 degrees: on-target fires, 90 degrees off does not', () => {
  assert.equal(Sim.MANUAL_AIM_CONE_DEG, 30);
  const s = testGame();
  const u = Sim.addUnit(s, 'medium_tank', 'iron_eden', 20, 20);
  const e = Sim.addUnit(s, 'medium_tank', 'xandria', 27, 20); // due east, 7 tiles = max range
  Sim.setManualControl(s, u.id);
  // Aim north: target is 90 degrees off aim, outside the cone.
  Sim.setManualInput(s, u.id, 0, 0, -Math.PI / 2, true);
  stepN(s, 20);
  assert.equal(e.hp, e.maxHp, 'aiming away never fires, even at a target in range');
  // Aim east: same target, same range, now inside the cone.
  Sim.setManualInput(s, u.id, 0, 0, aimAt(u, e.x, e.y), true);
  stepN(s, 20);
  assert.ok(e.hp < e.maxHp, 'aiming at the target damages it, hp ' + e.hp);
});

test('twinstick: range, minimum range, target class, and line of sight are all respected', () => {
  // Out of range: scout gun range 5, enemy 8 tiles away.
  {
    const s = testGame();
    const u = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 12, 20);
    const e = Sim.addUnit(s, 'scout_buggy', 'xandria', 20, 20);
    Sim.setManualControl(s, u.id);
    Sim.setManualInput(s, u.id, 0, 0, aimAt(u, e.x, e.y), true);
    stepN(s, 20);
    assert.equal(e.hp, e.maxHp, 'out-of-range target is never fired at');
  }
  // Inside minimum range: mortar range 12, min 3, enemy 2 tiles away.
  {
    const s = testGame();
    const u = Sim.addUnit(s, 'mortar_carrier', 'iron_eden', 12, 20);
    const e = Sim.addUnit(s, 'scout_buggy', 'xandria', 14, 20);
    Sim.setManualControl(s, u.id);
    Sim.setManualInput(s, u.id, 0, 0, aimAt(u, e.x, e.y), true);
    stepN(s, 20);
    assert.equal(e.hp, e.maxHp, 'a target inside minimum range is never fired at');
  }
  // Wrong target class: heavy cannon hits ground/structure only, enemy is air.
  {
    const s = testGame();
    const u = Sim.addUnit(s, 'medium_tank', 'iron_eden', 20, 20);
    const e = Sim.addUnit(s, 'combat_drone', 'xandria', 25, 20);
    Sim.setManualControl(s, u.id);
    Sim.setManualInput(s, u.id, 0, 0, aimAt(u, e.x, e.y), true);
    stepN(s, 20);
    assert.equal(e.hp, e.maxHp, 'a ground-only weapon never fires at an air unit');
  }
  // Rock blocks line of sight: rocks at (15,10) and (16,10) sit
  // between (12,10) and (19,10); same geometry on open ground fires.
  {
    const s = testGame();
    const u = Sim.addUnit(s, 'medium_tank', 'iron_eden', 12, 10);
    const e = Sim.addUnit(s, 'medium_tank', 'xandria', 19, 10);
    Sim.setManualControl(s, u.id);
    Sim.setManualInput(s, u.id, 0, 0, aimAt(u, e.x, e.y), true);
    stepN(s, 20);
    assert.equal(e.hp, e.maxHp, 'rock-blocked line of sight never fires');
  }
});

test('twinstick: no firing without a firing input, even with an aim direction', () => {
  const s = testGame();
  const u = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 12, 20);
  const e = Sim.addUnit(s, 'scout_buggy', 'xandria', 15, 20);
  Sim.setManualControl(s, u.id);
  Sim.setManualInput(s, u.id, 0, 0, aimAt(u, e.x, e.y), false);
  stepN(s, 20);
  assert.equal(e.hp, e.maxHp, 'aiming without firing fires nothing');
  assert.equal(s.projectileActive, 0);
});

// ---- Sim: exit, fresh orders, death ----

test('twinstick: release gives hold, clears path and queue, preserves the unit for fresh orders', () => {
  const s = testGame();
  const u = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 10, 20);
  Sim.setManualControl(s, u.id);
  Sim.setManualInput(s, u.id, 1, 0, null, false);
  stepN(s, 10);
  assert.ok(u.x > 10, 'unit drove before release');
  // Simulate a stale path/queue arriving (they must not survive release).
  u.path = [[15, 20]]; u.orderQueue = [{ kind: 'move', x: 30, y: 20 }];
  const res = Sim.clearManualControl(s, u.id);
  assert.equal(res.ok, true);
  assert.equal(u.manual, null);
  assert.equal(u.order.kind, 'hold');
  assert.deepEqual(u.path, []);
  assert.deepEqual(u.orderQueue, []);
  const xAfter = u.x;
  stepN(s, 20);
  assert.ok(Math.abs(u.x - xAfter) < 0.01, 'released unit holds, it does not resume a stale order');
  // A fresh RTS order is accepted immediately after release.
  Sim.issueOrder(s, [u.id], { kind: 'move', x: 30, y: 20 });
  stepN(s, 20);
  assert.ok(u.x > xAfter, 'fresh move order after release is followed, got ' + u.x);
});

test('twinstick: death removes the unit and leaves a normal wreck', () => {
  const s = testGame();
  const u = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 12, 20);
  Sim.setManualControl(s, u.id);
  u.hp = 0; u.alive = false;
  Sim.step(s);
  assert.equal(s.units.some(function (x) { return x.id === u.id; }), false, 'dead controlled unit leaves the field');
  assert.equal(s.wrecks.length, 1, 'normal wreck rules apply');
  assert.equal(s.wrecks[0].baseValue, Math.floor(80 * 0.4), 'wreck worth 40% of the 80-scrap scout');
});

test('twinstick: the red AI never clears or reads the manual flag', () => {
  const s = testGame();
  Sim.addStructure(s, 'command_core', 'iron_eden', 6, 20);
  Sim.addStructure(s, 'command_core', 'xandria', 57, 20);
  const u = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 10, 20);
  Sim.addUnit(s, 'scout_buggy', 'xandria', 50, 20);
  Sim.setManualControl(s, u.id);
  Sim.setManualInput(s, u.id, 0, 0, null, false);
  stepN(s, 40); // two AI thinks
  assert.ok(u.manual, 'AI thinks left the manual flag alone');
});
