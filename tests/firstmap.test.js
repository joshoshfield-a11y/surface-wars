/* First Map tests: layout, single-bridge ground crossing, visual-only
   ford, canopy coverage, and the old test map staying available.
   Uses the existing bridge-only test pattern, applied to the new map. */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Assets = require('../game/sprites.js');
const Maps = require('../game/maps.js');
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');

const ROOT = path.join(__dirname, '..');
function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }
function diskPath(p) { return p.replace(/^\.\.\//, ''); }
function firstGame() {
  const map = Maps.createFirstMap();
  return { map, state: Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 42 }) };
}
function terr(map, x, y) { return map.terrain[y * map.width + x]; }

test('first map: 80x50 with a north-south river and exactly one bridge block', () => {
  const { map } = firstGame();
  assert.equal(map.width, 80);
  assert.equal(map.height, 50);
  let bridge = 0;
  for (let y = 0; y < 50; y++) for (let x = 0; x < 80; x++) {
    if (terr(map, x, y) === Sim.T.BRIDGE) {
      bridge++;
      assert.ok(x >= 39 && x <= 42 && y >= 23 && y <= 26, `bridge tile outside block at ${x},${y}`);
    }
  }
  assert.equal(bridge, 16, 'bridge must be exactly the 4x4 block');
  for (let y = 0; y < 50; y++) {
    assert.equal(terr(map, 39, y) === Sim.T.WATER || terr(map, 39, y) === Sim.T.BRIDGE, true);
  }
});

test('first map: ground pathfinding west bank to east bank uses the bridge only, never water', () => {
  const { map, state } = firstGame();
  const path = Sim.findPath(state, 10, 25, 69, 25, 'ground');
  assert.ok(path, 'ground path exists');
  let crossedBridge = false;
  for (const [tx, ty] of path) {
    const t = Sim.terrainAt(state, tx, ty);
    assert.notEqual(t, Sim.T.WATER, `path crosses water at ${tx},${ty}`);
    if (t === Sim.T.BRIDGE) crossedBridge = true;
  }
  assert.ok(crossedBridge, 'path must cross the bridge');
});

test('first map: the stepping-stone ford is VISUAL ONLY — ground paths between its banks route via the bridge, never through water', () => {
  const { map, state } = firstGame();
  // The ford tiles sit over WATER terrain (that is the whole point).
  for (const [fx, fy] of Maps.FIRST_FORD) {
    if (fx >= 39 && fx <= 42) assert.equal(terr(map, fx, fy), Sim.T.WATER, `ford river tile ${fx},${fy} is not water`);
  }
  const path = Sim.findPath(state, 36, 12, 45, 12, 'ground');
  assert.ok(path, 'ground path around the ford exists');
  let crossedBridge = false;
  for (const [tx, ty] of path) {
    const t = Sim.terrainAt(state, tx, ty);
    assert.notEqual(t, Sim.T.WATER, `ford-bank path crosses water at ${tx},${ty}`);
    if (t === Sim.T.BRIDGE) crossedBridge = true;
  }
  assert.ok(crossedBridge, 'ford-bank path must detour via the bridge');
});

test('first map: bases and spawns sit on clear ground with a command core each', () => {
  const { map, state } = firstGame();
  Maps.spawnFirstMapScenario(Sim, state);
  const cores = state.structures.filter((s) => s.typeId === 'command_core');
  assert.equal(cores.length, 2);
  const west = cores.find((s) => s.faction === 'iron_eden');
  const east = cores.find((s) => s.faction === 'xandria');
  assert.deepEqual([west.x, west.y], [Maps.WEST_CORE.x, Maps.WEST_CORE.y]);
  assert.deepEqual([east.x, east.y], [Maps.EAST_CORE.x, Maps.EAST_CORE.y]);
  for (const e of [...state.units, ...state.structures]) {
    const t = terr(map, Math.floor(e.x), Math.floor(e.y));
    assert.ok(t !== Sim.T.WATER && t !== Sim.T.ROCK, `${e.typeId} spawns on blocking terrain ${t}`);
  }
  assert.equal(state.units.filter((u) => u.faction === 'iron_eden').length, 10);
  assert.equal(state.units.filter((u) => u.faction === 'xandria').length, 10);
});

test('first map: forest clusters exist and every forest tile has a canopy variant + file', () => {
  const { map } = firstGame();
  let forest = 0;
  for (let y = 0; y < 50; y++) for (let x = 0; x < 80; x++) {
    if (terr(map, x, y) !== Sim.T.FOREST) continue;
    forest++;
    const hasN = y > 0 && terr(map, x, y - 1) === Sim.T.FOREST;
    const hasE = x < 79 && terr(map, x + 1, y) === Sim.T.FOREST;
    const hasS = y < 49 && terr(map, x, y + 1) === Sim.T.FOREST;
    const hasW = x > 0 && terr(map, x - 1, y) === Sim.T.FOREST;
    const variant = Assets.canopyVariantForNeighbours(hasN, hasE, hasS, hasW);
    assert.ok(variant, `no canopy variant at ${x},${y}`);
    assert.ok(exists(diskPath(Assets.canopyPath(variant))), 'missing canopy ' + variant);
  }
  assert.ok(forest >= 40, `too little forest: ${forest}`);
});

test('first map: track, road and ford overlay sets autotile cleanly and every variant file exists', () => {
  const overlay = Assets.overlayMapForSets(Maps.firstMapOverlaySets());
  for (const [key, entry] of Object.entries(overlay)) {
    assert.ok(entry.variant, key + ' has no variant');
    assert.ok(exists(diskPath(Assets.overlayPath(entry.family, entry.variant))), 'missing overlay ' + entry.family + '/' + entry.variant);
  }
  const fams = new Set(Object.values(overlay).map((e) => e.family));
  assert.ok(fams.has('train_tracks') && fams.has('road') && fams.has('stepping_stones'));
  // Ford autotiles as a straight east-west line with end caps.
  const fordEntries = Maps.FIRST_FORD.map(([x, y]) => overlay[x + ',' + y]);
  assert.ok(fordEntries.every(Boolean), 'ford tile missing from overlay map');
  assert.ok(fordEntries.some((e) => e.variant === 'straight_ew'), 'ford has no straight_ew');
  assert.ok(fordEntries.some((e) => e.variant === 'end_east'), 'ford has no end_east');
  assert.ok(fordEntries.some((e) => e.variant === 'end_west'), 'ford has no end_west');
  // Rock clusters exist and none sit on the bridge or in the approach corridor.
  const { map } = firstGame();
  let rocks = 0;
  for (let y = 0; y < 50; y++) for (let x = 0; x < 80; x++) {
    if (terr(map, x, y) !== Sim.T.ROCK) continue;
    rocks++;
    assert.ok(!(x >= 39 && x <= 42 && y >= 23 && y <= 26), `rock on bridge at ${x},${y}`);
    assert.ok(!(x >= 35 && x <= 48 && y >= 20 && y <= 29), `rock in approach corridor at ${x},${y}`);
  }
  assert.ok(rocks >= 10, `too few rocks: ${rocks}`);
});

test('old test map still available unchanged (64x40, bridge rows 18-21)', () => {
  const map = Sim.createTestMap();
  assert.equal(map.width, 64);
  assert.equal(map.height, 40);
  for (let y = 18; y <= 21; y++) for (let x = 30; x <= 33; x++) {
    assert.equal(map.terrain[y * 64 + x], Sim.T.BRIDGE);
  }
});
