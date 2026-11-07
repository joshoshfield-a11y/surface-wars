/* Tutorial: pure step logic (view.js) + the tutorial flag's isolation
   in the sim (sim.js). Browser driving (taps, banner, highlight) is
   verified in the Playwright run and reported in TUTORIAL-REPORT.md,
   not faked here. */
'use strict';
const assert = require('node:assert');
const { test } = require('node:test');
const View = require('../game/view.js');
const Sim = require('../game/sim.js');
const catalog = require('../game/catalog.js');

test('tutorial steps: 7 steps, each one short sentence + a tap hint', () => {
  assert.equal(View.TUTORIAL_STEPS.length, 7);
  const ids = View.TUTORIAL_STEPS.map((s) => s.id);
  assert.deepEqual(ids, ['look', 'select', 'move', 'attack', 'build', 'salvage', 'win']);
  for (const s of View.TUTORIAL_STEPS) {
    assert.ok(s.title && s.instruction && s.tapHint, s.id + ' needs title, instruction, tap hint');
    assert.ok(s.instruction.length <= 130, s.id + ' instruction must stay one short sentence, got ' + s.instruction.length);
  }
});

test('tutorialAdvance: each step advances only on its own action', () => {
  assert.equal(View.tutorialAdvance('look', { camX: 0, camY: 14, zoom: 1 }, { camX: 0, camY: 14, zoom: 1 }), false);
  assert.equal(View.tutorialAdvance('look', { camX: 0, camY: 14, zoom: 1 }, { camX: 2, camY: 14, zoom: 1 }), true);
  assert.equal(View.tutorialAdvance('look', { camX: 0, camY: 14, zoom: 1 }, { camX: 0, camY: 14, zoom: 1.25 }), true);
  assert.equal(View.tutorialAdvance('select', {}, { selectedUnits: 0 }), false);
  assert.equal(View.tutorialAdvance('select', {}, { selectedUnits: 1 }), true);
  assert.equal(View.tutorialAdvance('move', {}, { moveOrdered: false }), false);
  assert.equal(View.tutorialAdvance('move', {}, { moveOrdered: true }), true);
  assert.equal(View.tutorialAdvance('attack', {}, { attackOrdered: false }), false);
  assert.equal(View.tutorialAdvance('attack', {}, { attackOrdered: true }), true);
  assert.equal(View.tutorialAdvance('build', { scoutCount: 2 }, { scoutCount: 2 }), false);
  assert.equal(View.tutorialAdvance('build', { scoutCount: 2 }, { scoutCount: 3 }), true);
  assert.equal(View.tutorialAdvance('salvage', { scrap: 420 }, { scrap: 420 }), false);
  assert.equal(View.tutorialAdvance('salvage', { scrap: 420 }, { scrap: 452 }), true);
  assert.equal(View.tutorialAdvance('win', {}, {}), false);
  assert.equal(View.tutorialAdvance('bogus', {}, {}), false);
});

test('modeShort: short names fit the phone top bar', () => {
  assert.equal(View.modeShort('move'), 'Move');
  assert.equal(View.modeShort('attackMove'), 'Atk-Move');
  assert.equal(View.modeShort('hold'), 'Hold');
  assert.equal(View.modeShort('patrol'), 'Patrol');
  assert.equal(View.modeShort('salvage'), 'Salvage');
  assert.equal(View.modeShort('guard'), 'Guard');
  for (const m of ['move', 'attackMove', 'hold', 'patrol', 'salvage', 'guard']) {
    assert.ok(View.modeShort(m).length <= 8, m + ' short name too long for the phone bar');
  }
});

function freshGame() {
  const map = Sim.createTestMap();
  const state = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 20261030 });
  Sim.spawnScenario(state);
  return state;
}

test('tutorial flag isolation: held red side runs NO AI economy', () => {
  const state = freshGame();
  state.tutorial = true;
  const scrapBefore = Sim.scrapOf(state, 'xandria');
  for (let i = 0; i < 40; i++) Sim.step(state);
  assert.equal(Sim.productionQueue(state, 'xandria').items.length, 0);
  assert.equal(Sim.scrapOf(state, 'xandria'), scrapBefore);
});

test('normal game (no tutorial flag) still runs the red AI economy', () => {
  const state = freshGame();
  assert.equal(state.tutorial, false);
  for (let i = 0; i < 40; i++) Sim.step(state);
  // The AI thinks every 20 ticks; by tick 40 it has queued at least
  // one unit or spent scrap — either proves the economy ran.
  const queued = Sim.productionQueue(state, 'xandria').items.length;
  const spent = Sim.scrapOf(state, 'xandria') < 500;
  assert.ok(queued > 0 || spent, 'expected red AI to queue or spend, got queue=' + queued + ' scrap=' + Sim.scrapOf(state, 'xandria'));
});
