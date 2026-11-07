/* Second Map ("Twin Bridges") tests: central lake with two bridges
   plus north/south flank corridors, same cores and 10v10 scenario
   shape as the First Map, First Map left untouched. */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Maps = require('../game/maps.js');
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');

const ROOT = path.join(__dirname, '..');
function terr(map, x, y) { return map.terrain[y * map.width + x]; }
function secondGame() {
  const map = Maps.createSecondMap();
  return { map, state: Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 42 }) };
}
function pathHasNoWater(state, path) {
  for (const [tx, ty] of path) {
    assert.notEqual(Sim.terrainAt(state, tx, ty), Sim.T.WATER, `path crosses water at ${tx},${ty}`);
  }
}

test('second map: 80x50 central lake with exactly two 15x2 bridges', () => {
  const { map } = secondGame();
  assert.equal(map.width, 80);
  assert.equal(map.height, 50);
  let bridge = 0;
  for (let y = 0; y < 50; y++) for (let x = 0; x < 80; x++) {
    const t = terr(map, x, y);
    const inLake = x >= 33 && x <= 47 && y >= 10 && y <= 39;
    if (inLake) assert.ok(t === Sim.T.WATER || t === Sim.T.BRIDGE, `lake tile ${x},${y} is neither water nor bridge`);
    if (t === Sim.T.BRIDGE) {
      bridge++;
      assert.ok(x >= 33 && x <= 47 && ((y >= 16 && y <= 17) || (y >= 32 && y <= 33)), `bridge tile outside the two bridge rows at ${x},${y}`);
    }
  }
  assert.equal(bridge, 60, 'bridges must be exactly two 15x2 blocks');
});

test('second map: ground path west to east exists, never crosses water, and crosses a bridge', () => {
  const { state } = secondGame();
  const path = Sim.findPath(state, 10, 25, 69, 25, 'ground');
  assert.ok(path, 'ground path exists');
  pathHasNoWater(state, path);
  assert.ok(path.some(([tx, ty]) => Sim.terrainAt(state, tx, ty) === Sim.T.BRIDGE), 'path must cross a bridge');
});

test('second map: each bridge is passable bank to bank for ground units', () => {
  const { state } = secondGame();
  for (const y of [16, 32]) {
    const path = Sim.findPath(state, 32, y, 48, y, 'ground');
    assert.ok(path, `ground path across bridge row ${y} exists`);
    pathHasNoWater(state, path);
    assert.ok(path.some(([tx, ty]) => Sim.terrainAt(state, tx, ty) === Sim.T.BRIDGE), `bridge row ${y} path must cross bridge tiles`);
  }
});

test('second map: bases and spawns sit on clear ground with a command core each', () => {
  const { map, state } = secondGame();
  Maps.spawnSecondMapScenario(Sim, state);
  const cores = state.structures.filter((s) => s.typeId === 'command_core');
  assert.equal(cores.length, 2);
  assert.deepEqual([cores.find((s) => s.faction === 'iron_eden').x, cores.find((s) => s.faction === 'iron_eden').y], [6, 25]);
  assert.deepEqual([cores.find((s) => s.faction === 'xandria').x, cores.find((s) => s.faction === 'xandria').y], [73, 25]);
  assert.equal(state.units.length, 20, 'same 10v10 scenario shape as the First Map');
  for (const e of [...state.units, ...state.structures]) {
    const t = terr(map, Math.floor(e.x), Math.floor(e.y));
    assert.ok(t === Sim.T.GRASS || t === Sim.T.DIRT, `entity ${e.typeId} at ${e.x},${e.y} sits on terrain ${t}, not clear ground`);
  }
});

test('second map: cosmetic overlay lines stay on land, never over water', () => {
  const { map } = secondGame();
  for (const set of Maps.secondMapOverlaySets()) {
    assert.ok(['train_tracks', 'road'].includes(set.family), `unexpected overlay family ${set.family}`);
    for (const [x, y] of set.tiles) {
      assert.ok(x >= 0 && x < 80 && y >= 0 && y < 50, `overlay tile out of bounds ${x},${y}`);
      assert.notEqual(terr(map, x, y), Sim.T.WATER, `overlay tile over water at ${x},${y}`);
    }
  }
});

test('second map: selectable from the main menu, pause menu, and command bar', () => {
  const html = fs.readFileSync(path.join(ROOT, 'game', 'index.html'), 'utf8');
  const js = fs.readFileSync(path.join(ROOT, 'game', 'game.js'), 'utf8');
  for (const id of ['mm-play-second', 'pm-second', 'btn-map-second']) assert.ok(html.includes(`id="${id}"`), `index.html missing ${id}`);
  assert.ok(js.includes("startMap('second')"), 'game.js never starts the second map');
  assert.ok(js.includes('createSecondMap') && js.includes('spawnSecondMapScenario'), 'game.js never wires the second map definition');
});

test('first map unchanged after adding the second map', () => {
  // Build the second map first, then the first — the second map's
  // builders must not leak into the First Map's terrain.
  Maps.createSecondMap();
  const first = Maps.createFirstMap();
  let bridge = 0;
  for (let y = 0; y < 50; y++) for (let x = 0; x < 80; x++) {
    if (terr(first, x, y) === Sim.T.BRIDGE) {
      bridge++;
      assert.ok(x >= 39 && x <= 42 && y >= 23 && y <= 26, `first-map bridge tile outside block at ${x},${y}`);
    }
  }
  assert.equal(bridge, 16, 'first map must still have exactly its 4x4 bridge');
});
