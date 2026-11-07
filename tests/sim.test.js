const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');

function testGame() {
  const map = Sim.createTestMap();
  return Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 42 });
}
function weapon(id) { return catalog.weapons.find((w) => w.id === id); }

test('movement: unit follows a path and arrives at the ordered tile', () => {
  const s = testGame();
  const u = Sim.addUnit(s, 'medium_tank', 'iron_eden', 10, 20);
  Sim.issueOrder(s, [u.id], { kind: 'move', x: 14, y: 20 });
  for (let i = 0; i < 400; i++) Sim.step(s);
  assert.ok(Math.hypot(u.x - 14.5, u.y - 20.5) < 0.6, `ended at ${u.x},${u.y}`);
});

test('collision/pathfinding: ground path to the far bank uses the bridge, never water', () => {
  const s = testGame();
  const path = Sim.findPath(s, 10, 10, 50, 10, 'ground');
  assert.ok(path, 'ground path exists');
  let crossedBridge = false;
  for (const [tx, ty] of path) {
    const terr = Sim.terrainAt(s, tx, ty);
    assert.notEqual(terr, Sim.T.WATER, `path crosses water at ${tx},${ty}`);
    if (terr === Sim.T.BRIDGE) crossedBridge = true;
  }
  assert.ok(crossedBridge, 'path must cross the bridge');
  const hover = Sim.findPath(s, 10, 10, 50, 10, 'hover');
  assert.ok(hover, 'hover path exists');
  assert.ok(!hover.some(([tx, ty]) => Sim.terrainAt(s, tx, ty) === Sim.T.ROCK), 'hover path avoids rock');
});

test('weapon range: in-range target takes damage, out-of-range target does not', () => {
  const s = testGame();
  const tank = Sim.addUnit(s, 'medium_tank', 'iron_eden', 10, 20);
  const near = Sim.addUnit(s, 'scout_buggy', 'xandria', 15, 20);
  const far = Sim.addUnit(s, 'scout_buggy', 'xandria', 25, 20);
  // Hold both enemies still: give them no orders (hold) and step; the tank
  // auto-engages the nearest valid target, which is the near scout.
  for (let i = 0; i < 200; i++) Sim.step(s);
  assert.ok(near.hp < 60, `near scout hp ${near.hp}`);
  // The far scout is out of the tank's 7-tile range and the scout's own
  // 5-tile gun cannot reach the tank from 15 tiles away.
  assert.equal(far.hp, 60);
  void tank;
});

test('weapon range/LOS: rock between shooter and target blocks fire', () => {
  const terrain = new Uint8Array(20 * 20); // all grass
  const s = Sim.createGame({ catalog, width: 20, height: 20, terrain, seed: 7 });
  terrain[10 * 20 + 10] = Sim.T.ROCK;
  const tank = Sim.addUnit(s, 'medium_tank', 'iron_eden', 8, 10);
  const foe = Sim.addUnit(s, 'scout_buggy', 'xandria', 12, 10);
  assert.equal(Sim.hasLOS(s, tank.x, tank.y, foe.x, foe.y), false);
  for (let i = 0; i < 200; i++) Sim.step(s);
  assert.equal(foe.hp, 60);
});

test('weapon min range: long-range artillery does not fire point-blank', () => {
  const s = testGame();
  const art = Sim.addUnit(s, 'longshot_mech', 'iron_eden', 20, 20);
  const foe = Sim.addUnit(s, 'scout_buggy', 'xandria', 23, 20);
  for (let i = 0; i < 100; i++) Sim.step(s);
  assert.equal(foe.hp, 60, 'artillery must not fire inside its 5-tile minimum range');
  void art;
});

test('armor/damage math: matrix multiplier and splash falloff', () => {
  const heavy = Sim.computeDamage(catalog, weapon('w_heavy_cannon'), 'Heavy', 0);
  assert.ok(Math.abs(heavy - 28 * 0.7) < 1e-9, `heavy cannon vs Heavy = ${heavy}`);
  const fort = Sim.computeDamage(catalog, weapon('w_heavy_cannon'), 'Fortified', 0);
  assert.ok(Math.abs(fort - 28 * 0.5) < 1e-9);
  const splashEdge = Sim.computeDamage(catalog, weapon('w_rocket_artillery'), 'Medium', 1.5);
  assert.ok(Math.abs(splashEdge - 30 * (1 - 0.6 * 0.5)) < 1e-9, `splash at half radius = ${splashEdge}`);
  const splashCentre = Sim.computeDamage(catalog, weapon('w_rocket_artillery'), 'Medium', 0);
  assert.ok(Math.abs(splashCentre - 30) < 1e-9);
});

test('combat: a tank kills a scout in range over time', () => {
  const s = testGame();
  Sim.addUnit(s, 'medium_tank', 'iron_eden', 10, 20);
  Sim.addUnit(s, 'scout_buggy', 'xandria', 13, 20);
  for (let i = 0; i < 2000 && s.units.length === 2; i++) Sim.step(s);
  assert.equal(s.units.length, 1);
  assert.equal(s.units[0].faction, 'iron_eden');
});

test('victory by elimination: losing all units and structures declares the other faction', () => {
  const s = testGame();
  const coreA = Sim.addStructure(s, 'command_core', 'iron_eden', 6, 20);
  const coreB = Sim.addStructure(s, 'command_core', 'xandria', 57, 20);
  const u = Sim.addUnit(s, 'scout_buggy', 'xandria', 50, 20);
  assert.equal(s.winner, null);
  coreB.hp = 0; coreB.alive = false;
  u.hp = 0; u.alive = false;
  Sim.step(s);
  assert.equal(s.winner, 'iron_eden');
  void coreA;
});

test('fixed timestep: 20 steps advance exactly 1 second of sim time', () => {
  const s = testGame();
  for (let i = 0; i < 20; i++) Sim.step(s);
  assert.ok(Math.abs(s.time - 1.0) < 1e-9, `time = ${s.time}`);
  assert.equal(s.tick, 20);
});
