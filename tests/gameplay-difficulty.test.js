/* Difficulty settings tests: Easy / Normal / Hard change ONLY red
   AI behaviour parameters — gather/defend thresholds, squad
   staging, retreat thresholds. Same costs, same economy, same
   unit stats, no free resources, no vision change, no stat change
   on any difficulty. Normal is exactly the shipped behaviour.
   Tutorial games always use Normal behaviour (and the red side
   is held anyway). */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Maps = require('../game/maps.js');
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');

const ROOT = path.join(__dirname, '..');
const ALLOWED_KEYS = ['defendRange', 'defendCount', 'coreDanger', 'gatherCount', 'attackFloor', 'retreatHp', 'retreatRange', 'modeMinTicks', 'stagingBatch'];

// A minimal two-core setup: red core far from blue, blue units kept
// out of every defend trigger, so mode decisions come only from the
// gather/attack thresholds under test.
function aiGame(params, redCount) {
  const map = Maps.createFirstMap();
  const state = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 42 });
  if (params) state.aiCombatParams = params;
  Sim.addStructure(state, 'command_core', 'iron_eden', 6, 25);
  Sim.addStructure(state, 'command_core', 'xandria', 73, 25);
  for (let i = 0; i < redCount; i++) Sim.addUnit(state, 'medium_tank', 'xandria', 68, 20 + (i % 10));
  Sim.addUnit(state, 'medium_tank', 'iron_eden', 10, 25);
  return state;
}

test('difficulty: Normal param set equals the shipped constants exactly', () => {
  const n = Sim.DIFFICULTY_PARAMS.normal;
  assert.equal(n.defendRange, Sim.AI_COMBAT_DEFEND_RANGE);
  assert.equal(n.defendCount, Sim.AI_COMBAT_DEFEND_COUNT);
  assert.equal(n.coreDanger, Sim.AI_COMBAT_CORE_DANGER);
  assert.equal(n.gatherCount, Sim.AI_COMBAT_GATHER_COUNT);
  assert.equal(n.attackFloor, Sim.AI_COMBAT_ATTACK_FLOOR);
  assert.equal(n.retreatHp, Sim.AI_COMBAT_RETREAT_HP);
  assert.equal(n.retreatRange, Sim.AI_COMBAT_RETREAT_RANGE);
  assert.equal(n.modeMinTicks, Sim.AI_COMBAT_MODE_MIN_TICKS);
  assert.equal(n.stagingBatch, Sim.AI_COMBAT_STAGING_BATCH);
});

test('difficulty: param sets contain behaviour thresholds only — no cost, stat, or vision keys', () => {
  for (const level of ['easy', 'normal', 'hard']) {
    const keys = Object.keys(Sim.DIFFICULTY_PARAMS[level]).sort();
    assert.deepEqual(keys, ALLOWED_KEYS.slice().sort(), `${level} param keys must be behaviour thresholds only`);
  }
});

test('difficulty: Easy is more cautious and Hard more aggressive than Normal on every axis', () => {
  const e = Sim.DIFFICULTY_PARAMS.easy, n = Sim.DIFFICULTY_PARAMS.normal, h = Sim.DIFFICULTY_PARAMS.hard;
  // Needs more units to attack, drops out sooner, falls back earlier.
  assert.ok(e.gatherCount > n.gatherCount && n.gatherCount > h.gatherCount, 'gatherCount easy > normal > hard');
  assert.ok(e.attackFloor > n.attackFloor && n.attackFloor > h.attackFloor, 'attackFloor easy > normal > hard');
  assert.ok(e.retreatHp > n.retreatHp && n.retreatHp > h.retreatHp, 'retreatHp easy > normal > hard');
  assert.ok(e.retreatRange > n.retreatRange && n.retreatRange > h.retreatRange, 'retreatRange easy > normal > hard');
  assert.ok(e.modeMinTicks > n.modeMinTicks && n.modeMinTicks > h.modeMinTicks, 'modeMinTicks easy > normal > hard');
  assert.ok(e.stagingBatch > n.stagingBatch && n.stagingBatch > h.stagingBatch, 'stagingBatch easy > normal > hard');
  // Defends only on a bigger threat (easy) vs a smaller one (hard).
  assert.ok(e.defendCount > n.defendCount && n.defendCount > h.defendCount, 'defendCount easy > normal > hard');
  assert.ok(e.defendRange < n.defendRange && n.defendRange < h.defendRange, 'defendRange easy < normal < hard');
  assert.ok(e.coreDanger < n.coreDanger && n.coreDanger < h.coreDanger, 'coreDanger easy < normal < hard');
});

test('difficulty: with 6 combat units, Hard attacks at once while Easy and Normal gather', () => {
  // 6 is above Hard's gather threshold (5), below Normal's (8)
  // and Easy's (12) — a single-threshold behaviour difference
  // produced by the param sets alone, with identical armies.
  for (const [level, expected] of [['hard', 'attack'], ['normal', 'gather'], ['easy', 'gather']]) {
    const state = aiGame(Sim.DIFFICULTY_PARAMS[level], 6);
    Sim.runAiCombat(state);
    assert.equal(state.aiCombat.mode, expected, `${level} with 6 combat units must be ${expected}`);
  }
});

test('difficulty: a 40%-HP unit falls back on Easy but not on Normal or Hard', () => {
  // 40% HP is below Easy's retreat threshold (50%) but above
  // Normal's (35%) and Hard's (20%). Enemy 5 tiles away (inside
  // every retreat range), unit far from its own core.
  for (const [level, fellBack] of [['easy', true], ['normal', false], ['hard', false]]) {
    const state = aiGame(Sim.DIFFICULTY_PARAMS[level], 1);
    const red = state.units.find((u) => u.faction === 'xandria');
    red.x = 40; red.y = 25;
    red.hp = 0.4 * red.maxHp;
    const blue = state.units.find((u) => u.faction === 'iron_eden');
    blue.x = 45; blue.y = 25;
    Sim.runAiCombat(state);
    assert.equal(red.aiFellBack === true, fellBack, `${level}: 40%-HP unit fellBack must be ${fellBack}`);
  }
});

test('difficulty: no difficulty changes costs, stats, or starting scrap', () => {
  for (const level of ['easy', 'normal', 'hard']) {
    const map = Maps.createFirstMap();
    const state = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 42 });
    state.aiCombatParams = Sim.DIFFICULTY_PARAMS[level];
    Maps.spawnFirstMapScenario(Sim, state);
    assert.equal(Sim.scrapOf(state, 'iron_eden'), 500);
    assert.equal(Sim.scrapOf(state, 'xandria'), 500);
    for (const u of state.units) {
      const def = catalog.units.find((d) => d.id === u.typeId);
      assert.equal(u.maxHp, def.hp, `${level}: ${u.typeId} max HP must stay catalog`);
      assert.equal(u.speed, def.speed, `${level}: ${u.typeId} speed must stay catalog`);
    }
    // The AI never touches the player's side: run it and re-check.
    for (let t = 0; t < 60; t++) Sim.step(state);
    assert.equal(Sim.scrapOf(state, 'iron_eden'), 500, `${level}: red AI must never change blue scrap`);
    assert.ok(state.units.filter((u) => u.faction === 'iron_eden').length >= 10, `${level}: blue army must be untouched by the red AI`);
  }
});

test('difficulty: tutorial games always use Normal behaviour — red side held regardless of setting', () => {
  const map = Maps.createFirstMap();
  const state = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 42 });
  state.aiCombatParams = Sim.DIFFICULTY_PARAMS.easy; // setting says Easy
  state.tutorial = true; // tutorial flag holds the red side
  Maps.spawnFirstMapScenario(Sim, state);
  for (let t = 0; t < 100; t++) Sim.step(state);
  assert.equal(state.aiCombat, undefined, 'combat AI never ran in a tutorial game');
  assert.equal(Sim.scrapOf(state, 'xandria'), 500, 'no red production in a tutorial game');
  // Held = never given an order: every red unit still holds. Exact
  // positions are NOT asserted — separation nudges neighbouring
  // held units by fractions of a tile, which is movement physics,
  // not an AI order.
  for (const u of state.units.filter((u) => u.faction === 'xandria')) {
    assert.equal(u.order.kind, 'hold', `red unit ${u.typeId} must still hold in a tutorial game`);
  }
  assert.equal(state.units.filter((u) => u.faction === 'xandria').length, 10, 'no red unit added or removed in a tutorial game');
});

test('difficulty: visible in the UI — main-menu buttons + status, wired in game.js, session-only', () => {
  const html = fs.readFileSync(path.join(ROOT, 'game', 'index.html'), 'utf8');
  const js = fs.readFileSync(path.join(ROOT, 'game', 'game.js'), 'utf8');
  for (const id of ['mm-diff-easy', 'mm-diff-normal', 'mm-diff-hard', 'mm-diff-status']) {
    assert.ok(html.includes(`id="${id}"`), `index.html missing ${id}`);
  }
  assert.ok(js.includes("setDifficulty('easy')") && js.includes("setDifficulty('normal')") && js.includes("setDifficulty('hard')"), 'game.js never wires the difficulty buttons');
  assert.ok(js.includes('syncDifficultyUI'), 'game.js never syncs the difficulty UI');
  assert.ok(js.includes("var difficulty = 'normal'"), 'game.js must default difficulty to normal');
  assert.ok(js.includes("tutorialStarting) ? 'normal' : difficulty"), 'game.js must force Normal for tutorial games');
  assert.ok(js.includes('SESSION MEMORY ONLY'), 'game.js must record that difficulty is session memory, not a new store');
  assert.ok(js.includes('state.aiCombatParams = Sim.DIFFICULTY_PARAMS[diffLevel]'), 'game.js must hand the menu setting to the sim seam at match start');
});
