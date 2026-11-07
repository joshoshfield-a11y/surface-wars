/* Third Map ("Forest Belt") tests: dense forest belt with three
   clear lanes and scattered ponds, no spanning water barrier and
   no bridge choke — a different terrain problem from the First
   Map's single bridge and Twin Bridges' lake. Same cores, same
   10v10 scenario shape, First and Second Maps untouched. */
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
function thirdGame() {
  const map = Maps.createThirdMap();
  return { map, state: Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 42 }) };
}
function pathHasNoWater(state, path) {
  for (const [tx, ty] of path) {
    assert.notEqual(Sim.terrainAt(state, tx, ty), Sim.T.WATER, `path crosses water at ${tx},${ty}`);
  }
}

test('third map: 80x50, dense forest belt, three clear lanes, no bridges', () => {
  const { map } = thirdGame();
  assert.equal(map.width, 80);
  assert.equal(map.height, 50);
  let bridge = 0, beltForest = 0;
  for (let y = 0; y < 50; y++) for (let x = 0; x < 80; x++) {
    const t = terr(map, x, y);
    if (t === Sim.T.BRIDGE) bridge++;
    if (x >= 30 && x <= 49 && y >= 4 && y <= 45 && t === Sim.T.FOREST) beltForest++;
  }
  assert.equal(bridge, 0, 'the forest-belt map needs no bridge and must have none');
  assert.ok(beltForest >= 500, `belt must stay dense forest, got ${beltForest} forest tiles (need >= 500 of 840)`);
  // Every lane tile is open ground, never forest, rock, or water.
  for (const [y0, y1] of [[14, 16], [24, 26], [34, 36]]) {
    for (let y = y0; y <= y1; y++) for (let x = 30; x <= 49; x++) {
      const t = terr(map, x, y);
      assert.ok(t === Sim.T.GRASS || t === Sim.T.DIRT, `lane tile ${x},${y} is terrain ${t}, not open ground`);
    }
  }
});

test('third map: water is scattered ponds only, never a spanning barrier', () => {
  const { map } = thirdGame();
  let water = 0;
  const ponds = [[18, 42], [62, 10], [60, 40]];
  for (let y = 0; y < 50; y++) for (let x = 0; x < 80; x++) {
    if (terr(map, x, y) !== Sim.T.WATER) continue;
    water++;
    assert.ok(ponds.some(([px, py]) => Math.max(Math.abs(x - px), Math.abs(y - py)) <= 1),
      `water tile ${x},${y} is not part of a scattered pond`);
    assert.ok(!(x >= 30 && x <= 49 && y >= 4 && y <= 45), `water inside the forest belt at ${x},${y}`);
  }
  assert.ok(water > 0 && water <= 30, `scattered ponds must be small, got ${water} water tiles`);
  // No column or row of water could be a barrier: max run is a pond.
  for (let x = 0; x < 80; x++) {
    let n = 0;
    for (let y = 0; y < 50; y++) if (terr(map, x, y) === Sim.T.WATER) n++;
    assert.ok(n <= 5, `water column ${x} has ${n} tiles — that would be a barrier, not a pond`);
  }
  for (let y = 0; y < 50; y++) {
    let n = 0;
    for (let x = 0; x < 80; x++) if (terr(map, x, y) === Sim.T.WATER) n++;
    assert.ok(n <= 5, `water row ${y} has ${n} tiles — that would be a barrier, not a pond`);
  }
});

test('third map: ground path west to east exists, never crosses water, and crosses the belt down a lane', () => {
  const { state } = thirdGame();
  const path = Sim.findPath(state, 10, 25, 69, 25, 'ground');
  assert.ok(path, 'ground path exists');
  pathHasNoWater(state, path);
  const beltSteps = path.filter(([tx]) => tx >= 30 && tx <= 49);
  assert.ok(beltSteps.length > 0, 'path must cross the forest belt');
  for (const [, ty] of beltSteps) {
    assert.ok((ty >= 14 && ty <= 16) || (ty >= 24 && ty <= 26) || (ty >= 34 && ty <= 36),
      `belt step at row ${ty} is not in a clear lane`);
  }
});

test('third map: each lane is passable bank to bank for ground units, and the belt itself is traversable (slow, not blocked)', () => {
  const { state } = thirdGame();
  for (const y of [15, 25, 35]) {
    const path = Sim.findPath(state, 29, y, 50, y, 'ground');
    assert.ok(path, `ground path across lane row ${y} exists`);
    pathHasNoWater(state, path);
  }
  // A straight belt-interior route (between lanes) still exists:
  // forest slows ground units (movement cost 2) but never blocks them.
  const through = Sim.findPath(state, 30, 20, 49, 20, 'ground');
  assert.ok(through, 'forest belt interior must be traversable, not a wall');
  pathHasNoWater(state, through);
});

test('third map: bases and spawns sit on clear ground with a command core each', () => {
  const { map, state } = thirdGame();
  Maps.spawnThirdMapScenario(Sim, state);
  const cores = state.structures.filter((s) => s.typeId === 'command_core');
  assert.equal(cores.length, 2);
  assert.deepEqual([cores.find((s) => s.faction === 'iron_eden').x, cores.find((s) => s.faction === 'iron_eden').y], [6, 25]);
  assert.deepEqual([cores.find((s) => s.faction === 'xandria').x, cores.find((s) => s.faction === 'xandria').y], [73, 25]);
  assert.equal(state.units.length, 20, 'same 10v10 scenario shape as the First Map');
  for (const e of [...state.units, ...state.structures]) {
    const t = terr(map, Math.floor(e.x), Math.floor(e.y));
    assert.ok(t === Sim.T.GRASS || t === Sim.T.DIRT, `entity ${e.typeId} at ${e.x},${e.y} sits on terrain ${t}, not clear ground`);
  }
  assert.equal(Sim.scrapOf(state, 'iron_eden'), 500, 'starting scrap unchanged');
  assert.equal(Sim.scrapOf(state, 'xandria'), 500, 'starting scrap unchanged');
});

test('third map: cosmetic overlay lines stay on land, never over water', () => {
  const { map } = thirdGame();
  for (const set of Maps.thirdMapOverlaySets()) {
    assert.ok(['train_tracks', 'road'].includes(set.family), `unexpected overlay family ${set.family}`);
    for (const [x, y] of set.tiles) {
      assert.ok(x >= 0 && x < 80 && y >= 0 && y < 50, `overlay tile out of bounds ${x},${y}`);
      assert.notEqual(terr(map, x, y), Sim.T.WATER, `overlay tile over water at ${x},${y}`);
    }
  }
});

test('third map: selectable from the main menu, pause menu, and command bar', () => {
  const html = fs.readFileSync(path.join(ROOT, 'game', 'index.html'), 'utf8');
  const js = fs.readFileSync(path.join(ROOT, 'game', 'game.js'), 'utf8');
  for (const id of ['mm-play-third', 'pm-third', 'btn-map-third']) assert.ok(html.includes(`id="${id}"`), `index.html missing ${id}`);
  assert.ok(js.includes("startMap('third')"), 'game.js never starts the third map');
  assert.ok(js.includes('createThirdMap') && js.includes('spawnThirdMapScenario') && js.includes('thirdMapOverlaySets'), 'game.js never wires the third map definition');
});

test('first and second maps unchanged after adding the third map', () => {
  // Build the third map first, then the others — the third map's
  // builders must not leak into either earlier map's terrain.
  Maps.createThirdMap();
  const first = Maps.createFirstMap();
  let firstBridge = 0;
  for (let y = 0; y < 50; y++) for (let x = 0; x < 80; x++) {
    if (terr(first, x, y) === Sim.T.BRIDGE) {
      firstBridge++;
      assert.ok(x >= 39 && x <= 42 && y >= 23 && y <= 26, `first-map bridge tile outside block at ${x},${y}`);
    }
  }
  assert.equal(firstBridge, 16, 'first map must still have exactly its 4x4 bridge');
  const second = Maps.createSecondMap();
  let secondBridge = 0;
  for (let y = 0; y < 50; y++) for (let x = 0; x < 80; x++) {
    if (terr(second, x, y) === Sim.T.BRIDGE) {
      secondBridge++;
      assert.ok(x >= 33 && x <= 47 && ((y >= 16 && y <= 17) || (y >= 32 && y <= 33)), `second-map bridge tile outside the two bridge rows at ${x},${y}`);
    }
  }
  assert.equal(secondBridge, 60, 'second map must still have exactly its two 15x2 bridges');
});
