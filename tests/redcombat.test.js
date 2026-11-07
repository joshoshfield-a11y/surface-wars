/* Generation Cycle 2 tests: red combat AI (sim-side squad state machine).
   Run with the explicit file list:
   node --test tests/*.test.js */
const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');
const Maps = require('../game/maps.js');

function testGame() {
  const map = Sim.createTestMap();
  return Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 42 });
}
function stepN(s, n) { for (let i = 0; i < n; i++) Sim.step(s); }
function redCore(s) {
  return s.structures.find((st) => st.faction === 'xandria' && st.typeId === 'command_core')
    || Sim.addStructure(s, 'command_core', 'xandria', 57, 20);
}
function blueCore(s) {
  return s.structures.find((st) => st.faction === 'iron_eden' && st.typeId === 'command_core')
    || Sim.addStructure(s, 'command_core', 'iron_eden', 6, 20);
}
function redArmy(s, n) {
  // Combat units (weapons > 0) west of the red core, on open ground.
  const out = [];
  for (let i = 0; i < n; i++) out.push(Sim.addUnit(s, 'medium_tank', 'xandria', 50, 14 + i));
  return out;
}
function combatUnits(s) {
  return s.units.filter((u) => u.faction === 'xandria' && u.weapons && u.weapons.length);
}

test('combat: fewer than 8 combat units gather (guard staging), they do not trickle out', () => {
  const s = testGame(); blueCore(s); redCore(s);
  redArmy(s, 4);
  Sim.runAiCombat(s);
  assert.equal(s.aiCombat.mode, 'gather');
  combatUnits(s).forEach((u) => {
    assert.equal(u.order.kind, 'guard', `gather unit ${u.id} order ${u.order.kind}, expected guard`);
  });
});

test('combat: 8+ combat units attack the blue core, in squads', () => {
  const s = testGame(); const bc = blueCore(s); redCore(s);
  redArmy(s, 9);
  Sim.runAiCombat(s);
  assert.equal(s.aiCombat.mode, 'attack');
  const attackers = combatUnits(s).filter((u) => u.order.kind === 'attackMove');
  assert.ok(attackers.length >= 9, `expected 9 attackers, got ${attackers.length}`);
  // Squad 0 goes direct: its destination is the blue core area.
  const direct = attackers.filter((u) => Math.hypot(u.order.x - bc.x, u.order.y - bc.y) < 3);
  assert.ok(direct.length >= 1, 'at least one squad attacks the blue core directly');
  // Squads 1/2 detour north/south and queue the core as the second leg.
  const detoured = attackers.filter((u) => u.orderQueue && u.orderQueue.length
    && Math.hypot(u.orderQueue[0].x - bc.x, u.orderQueue[0].y - bc.y) < 3);
  assert.ok(detoured.length >= 2, `expected detoured squads queuing the core, got ${detoured.length}`);
});

test('combat: a threatened core switches to defend immediately, units guard the core ring', () => {
  const s = testGame(); blueCore(s); const rc = redCore(s);
  const army = redArmy(s, 9);
  Sim.runAiCombat(s); // attack mode first
  assert.equal(s.aiCombat.mode, 'attack');
  // Three blue units within 25 tiles of the red core: immediate defend.
  Sim.addUnit(s, 'scout_buggy', 'iron_eden', 45, 20);
  Sim.addUnit(s, 'scout_buggy', 'iron_eden', 48, 24);
  Sim.addUnit(s, 'scout_buggy', 'iron_eden', 44, 16);
  Sim.runAiCombat(s);
  assert.equal(s.aiCombat.mode, 'defend');
  army.forEach((u) => {
    assert.equal(u.order.kind, 'guard', `defender ${u.id} order ${u.order.kind}, expected guard`);
    assert.ok(Math.hypot(u.order.x - rc.x, u.order.y - rc.y) <= 9,
      `defender guard point ${u.order.x},${u.order.y} not near core ${rc.x},${rc.y}`);
  });
});

test('combat: a damaged unit with an enemy near falls back to the core and stays a defender', () => {
  const s = testGame(); blueCore(s); redCore(s);
  const army = redArmy(s, 9);
  const hurt = army[0];
  hurt.hp = Math.floor(hurt.maxHp * 0.3);
  Sim.addUnit(s, 'scout_buggy', 'iron_eden', hurt.x + 5, hurt.y); // enemy within 12
  Sim.runAiCombat(s);
  assert.equal(hurt.aiFellBack, true, 'damaged unit flagged as fallen back');
  assert.equal(hurt.order.kind, 'guard', 'fallen-back unit guards the core');
  // Next think in attack conditions: it must NOT be sent attacking again.
  Sim.runAiCombat(s);
  assert.equal(hurt.order.kind, 'guard', 'fallen-back unit stays a defender');
  assert.equal(hurt.aiFellBack, true);
});

test('combat: never interrupts a salvage in progress or a queued chain', () => {
  const s = testGame(); blueCore(s); redCore(s);
  const army = redArmy(s, 9);
  const salvager = army[0];
  Sim.issueOrder(s, [salvager.id], { kind: 'salvage', wreckId: 999999 });
  const chained = army[1];
  Sim.issueOrder(s, [chained.id], { kind: 'attackMove', x: 20, y: 20 });
  Sim.issueOrder(s, [chained.id], { kind: 'attackMove', x: 10, y: 20 }, { append: true });
  Sim.runAiCombat(s);
  assert.equal(salvager.order.kind, 'salvage', 'salvage in progress untouched');
  assert.equal(chained.orderQueue.length, 1, 'queued chain untouched');
});

test('combat: no cheating — direct combat calls change no scrap, spawn no units, touch no blue unit', () => {
  const s = testGame(); blueCore(s); redCore(s);
  redArmy(s, 9);
  const blueBefore = s.units.filter((u) => u.faction === 'iron_eden').map((u) => [u.id, u.x, u.y, u.order.kind]);
  const scrapBefore = Sim.scrapOf(s, 'xandria');
  const countBefore = s.units.length;
  Sim.runAiCombat(s);
  assert.equal(Sim.scrapOf(s, 'xandria'), scrapBefore, 'combat spent no scrap');
  assert.equal(Sim.scrapOf(s, 'iron_eden'), 500, 'combat touched no player scrap');
  assert.equal(s.units.length, countBefore, 'combat spawned no units');
  const blueAfter = s.units.filter((u) => u.faction === 'iron_eden').map((u) => [u.id, u.x, u.y, u.order.kind]);
  assert.deepEqual(blueAfter, blueBefore, 'combat moved no blue unit');
});

test('combat: on Twin Bridges, attack orders never send a ground unit into water', () => {
  const map = Maps.createSecondMap();
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 7 });
  Maps.spawnSecondMapScenario(Sim, s);
  stepN(s, 20); // first AI think (economy + combat) runs at tick 20
  assert.equal(s.aiCombat.mode, 'attack', '10 starting combat units attack');
  s.units.filter((u) => u.faction === 'xandria' && u.movementClass === 'ground').forEach((u) => {
    // Every path tile the AI gave a ground unit must be passable ground.
    u.path.forEach(([tx, ty]) => {
      const terr = Sim.terrainAt(s, tx, ty);
      assert.notEqual(terr, Sim.T.WATER, `ground unit ${u.id} pathed through water at ${tx},${ty}`);
      assert.notEqual(terr, Sim.T.ROCK, `ground unit ${u.id} pathed through rock at ${tx},${ty}`);
    });
    if (u.order.kind === 'attackMove' || u.order.kind === 'guard') {
      assert.ok(Sim.isPassable(s, Math.floor(u.order.x), Math.floor(u.order.y), 'ground'),
        `order destination ${u.order.x},${u.order.y} not passable for ground unit ${u.id}`);
    }
  });
});

test('combat: reinforcements spawned mid-attack stage in a batch of 3, they do not trickle', () => {
  const s = testGame(); blueCore(s); redCore(s);
  const army = redArmy(s, 9);
  Sim.runAiCombat(s);
  assert.equal(s.aiCombat.mode, 'attack');
  assert.ok(army.every((u) => u.order.kind === 'attackMove'), 'starting force attacks');
  // One fresh spawn during the attack: staged, not sent alone.
  const fresh1 = Sim.addUnit(s, 'medium_tank', 'xandria', 60, 20);
  Sim.runAiCombat(s);
  assert.equal(fresh1.order.kind, 'guard', 'first reinforcement stages, not attacks alone');
  const fresh2 = Sim.addUnit(s, 'medium_tank', 'xandria', 61, 20);
  Sim.runAiCombat(s);
  assert.equal(fresh2.order.kind, 'guard', 'second reinforcement still staging');
  const fresh3 = Sim.addUnit(s, 'medium_tank', 'xandria', 62, 20);
  Sim.runAiCombat(s);
  assert.equal(fresh1.order.kind, 'attackMove', 'batch of 3 attacks together (1)');
  assert.equal(fresh2.order.kind, 'attackMove', 'batch of 3 attacks together (2)');
  assert.equal(fresh3.order.kind, 'attackMove', 'batch of 3 attacks together (3)');
});

test('combat: after its core dies, the AI keeps fighting (last stand) instead of freezing', () => {
  const s = testGame(); const bc = blueCore(s); const rc = redCore(s);
  const army = redArmy(s, 9);
  Sim.runAiCombat(s);
  assert.equal(s.aiCombat.mode, 'attack');
  // Kill the red core: the economy stops, but combat must not.
  rc.hp = 0; rc.alive = false;
  Sim.step(s); // removes the dead structure; AI think runs at tick 20
  stepN(s, 40);
  assert.equal(s.aiCombat.mode, 'attack', 'last-stand mode is attack');
  const attacking = army.filter((u) => u.alive && u.order.kind === 'attackMove');
  assert.ok(attacking.length >= 1, `last-stand units attack, got ${attacking.length}`);
  const nearCore = attacking.some((u) => Math.hypot(u.order.x - bc.x, u.order.y - bc.y) < 3
    || (u.orderQueue && u.orderQueue.some((q) => Math.hypot(q.x - bc.x, q.y - bc.y) < 3)));
  assert.ok(nearCore, 'last-stand attack targets the blue core');
});

test('combat: tutorial games hold the red side — no combat orders at all', () => {
  const s = testGame(); blueCore(s); redCore(s);
  redArmy(s, 9);
  s.tutorial = true;
  stepN(s, 200);
  combatUnits(s).forEach((u) => {
    assert.equal(u.order.kind, 'hold', `tutorial red unit ${u.id} order ${u.order.kind}, expected hold`);
  });
  assert.equal(s.aiCombat, undefined, 'combat AI never ran in a tutorial game');
});
