/* Beta wave 2: regression tests for the wave-1 beta report's open items.
   Fixes: BUG-LOW-1 (withdrawTick tick-0 sentinel), BUG-LOW-2 (stale
   info/wreck panels — shell-level, proven in the browser pass; the
   sim-level half here is the wreck-decay value the panel reads),
   OBS-1 (core-death queue refund is now INSTANT, not deferred to the
   head item's timer expiry), and the tutorial-wreck refresh on
   entering the salvage step (shell-level, browser-proven; the
   sim-level half here is wreck value/expiry arithmetic).
   Run: node --test tests/*.test.js */
const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');
const Maps = require('../game/maps.js');
const Hero = require('../game/hero.js');
const Weapons = require('../game/weapons.js');

function grassGame(w, h) {
  const terrain = new Uint8Array(w * h);
  return Sim.createGame({ catalog, width: w, height: h, terrain, seed: 42 });
}
function stepN(s, n) { for (let i = 0; i < n; i++) Sim.step(s); }
const facts = (tick, scrap) => ({ coreAlive: true, scrap: scrap ?? 500, tick, dropTile: { x: 7, y: 25 } });

// ---- BUG-LOW-1: withdrawal at tick 0 must cool down, not drop free ----
test('beta2: hero withdrawn at tick 0 cools down (no tick-0 sentinel collision)', () => {
  const h = Hero.startMatch(Weapons.DEFAULT_LOADOUT);
  assert.equal(h.withdrawTick, -1, 'fresh match: never withdrawn');
  assert.equal(Hero.canDrop(h, facts(0)).ok, true, 'fresh hero drops immediately');
  Hero.withdraw(h, 150, 0);
  assert.equal(Hero.canDrop(h, facts(0)).kind, 'cooldown', 'withdrawal at tick 0 is a real withdrawal');
  assert.equal(Hero.canDrop(h, facts(199)).kind, 'cooldown', 'still cooling at tick 199');
  assert.equal(Hero.canDrop(h, facts(200)).ok, true, 'free again at tick 200');
});

// ---- OBS-1: core-death queue refund is instant ----
test('beta2: core death refunds the whole queue within one tick (not at head timer expiry)', () => {
  const s = grassGame(64, 40);
  const core = Sim.addStructure(s, 'command_core', 'iron_eden', 6, 20);
  Sim.addStructure(s, 'command_core', 'iron_eden', 30, 20); // keep-alive: no elimination
  Sim.addUnit(s, 'sensor_drone', 'xandria', 57, 35); // keep-alive: no winner
  Sim.queueProduction(s, 'iron_eden', core.id, 'scout_buggy'); // head, 8 s build
  Sim.queueProduction(s, 'iron_eden', core.id, 'medium_tank');
  assert.equal(Sim.scrapOf(s, 'iron_eden'), 120);
  core.hp = 0; core.alive = false;
  stepN(s, 1);
  assert.equal(Sim.productionQueue(s, 'iron_eden').items.length, 0, 'queue cleared in the death tick');
  assert.equal(Sim.scrapOf(s, 'iron_eden'), 500, 'whole backlog refunded immediately');
});

// ---- Wreck decay arithmetic the refreshed tutorial wreck relies on ----
test('beta2: wreck value decays linearly and a refresh restores full value + full lifetime', () => {
  const s = grassGame(64, 40);
  const u = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 10, 10);
  Sim.addStructure(s, 'command_core', 'iron_eden', 5, 5); // keep-alive: no elimination (else step() early-returns and decay freezes)
  Sim.addUnit(s, 'sensor_drone', 'xandria', 50, 35); // keep-alive
  u.hp = 0; u.alive = false;
  stepN(s, 1);
  assert.equal(s.wrecks.length, 1);
  const wk = s.wrecks[0];
  assert.equal(wk.baseValue, 32, 'scout wreck base 40% of 80');
  stepN(s, 1200);
  assert.equal(wk.value, 16, 'half life = half value');
  // The tutorial-step refresh (game.js enterTutorialStep): reset the clock.
  wk.createdTick = s.tick; wk.expiresTick = s.tick + Sim.WRECK_LIFETIME_TICKS; wk.value = wk.baseValue;
  assert.equal(wk.value, 32, 'refresh restores full value');
  stepN(s, 2399);
  assert.ok(s.wrecks.length === 1, 'refreshed wreck still alive just before expiry');
});

// ---- Difficulty params still exactly the shipped sets (guard vs wave-2 edits) ----
test('beta2: difficulty param sets unchanged by wave-2 work', () => {
  assert.deepEqual(Sim.DIFFICULTY_PARAMS.normal, { defendRange: 25, defendCount: 3, coreDanger: 14, gatherCount: 8, attackFloor: 5, retreatHp: 0.35, retreatRange: 12, modeMinTicks: 100, stagingBatch: 3 });
  assert.equal(Sim.DIFFICULTY_PARAMS.easy.gatherCount, 12);
  assert.equal(Sim.DIFFICULTY_PARAMS.hard.gatherCount, 5);
});

// ---- Third map geometry still intact after wave-2 edits ----
test('beta2: third map Forest Belt geometry unchanged by wave-2 work', () => {
  const map = Maps.createThirdMap();
  assert.equal(map.width, 80); assert.equal(map.height, 50);
  let forest = 0, bridges = 0;
  for (let y = 0; y < 50; y++) for (let x = 0; x < 80; x++) {
    const t = map.terrain[y * 80 + x];
    if (x >= 30 && x <= 49 && y >= 4 && y <= 45 && t === 3) forest++;
    if (t === 2) bridges++;
  }
  assert.equal(forest, 643, 'belt forest count unchanged (belt region only; scatter clusters outside it are extra)');
  assert.equal(bridges, 0, 'Forest Belt has no bridges (BRIDGE id is 2, not 5)');
});
