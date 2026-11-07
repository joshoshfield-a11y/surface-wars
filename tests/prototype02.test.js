/* Surface Wars Prototype 02 tests: scrap economy, production, sim wrecks,
   queued orders, groups, formation offsets, patrol, victory stats.
   Run with the explicit file list (directory invocation fails on this Node):
   node --test tests/sim.test.js tests/view.test.js tests/firstmap.test.js \
     tests/catalog.test.js tests/animation.test.js tests/sprites.test.js \
     tests/prototype02.test.js */
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

// ---- Scrap economy ----
// Prototype 03 behaviour change (documented in PROTOTYPE03-REPORT.md):
// Xandria now starts with 500 scrap too, for the red AI economy. This is
// the ONLY Prototype 02 assertion whose expectation changed in P03.
test('economy: both factions start with 500 scrap (P03: red AI economy)', () => {
  const s = testGame();
  assert.equal(Sim.scrapOf(s, 'iron_eden'), 500);
  assert.equal(Sim.scrapOf(s, 'xandria'), 500);
  assert.equal(Sim.STARTING_SCRAP, 500);
});

test('economy: producible list is the iron_eden roster with zero power and zero components', () => {
  const s = testGame();
  const prod = Sim.producibleUnits(s, 'iron_eden');
  assert.ok(prod.length > 0, 'some units producible');
  for (const u of prod) {
    assert.equal(u.cost.power, 0, u.id);
    assert.equal(u.cost.components, 0, u.id);
  }
  const ids = prod.map((u) => u.id);
  assert.ok(ids.includes('scout_buggy') && ids.includes('medium_tank'), 'cheap + mid units in');
  assert.ok(!ids.includes('heavy_tank'), 'heavy_tank needs a component, excluded');
  assert.ok(!ids.includes('siege_cannon'), 'siege_cannon needs power, excluded');
});

test('economy: queueing deducts scrap; insufficient funds blocks with no deduction; cancel refunds in full', () => {
  const s = testGame();
  const core = Sim.addStructure(s, 'command_core', 'iron_eden', 6, 20);
  const ok = Sim.queueProduction(s, 'iron_eden', core.id, 'scout_buggy');
  assert.equal(ok.ok, true);
  assert.equal(Sim.scrapOf(s, 'iron_eden'), 500 - 80);
  // A medium tank (300) still fits; a second one (300) would leave 40, so queue one then fail the next.
  assert.equal(Sim.queueProduction(s, 'iron_eden', core.id, 'medium_tank').ok, true);
  assert.equal(Sim.scrapOf(s, 'iron_eden'), 120);
  const blocked = Sim.queueProduction(s, 'iron_eden', core.id, 'medium_tank');
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'insufficient-scrap');
  assert.equal(Sim.scrapOf(s, 'iron_eden'), 120, 'blocked build deducts nothing');
  const q = Sim.productionQueue(s, 'iron_eden');
  assert.equal(q.items.length, 2);
  const cancel = Sim.cancelProduction(s, 'iron_eden', 0); // cancel the in-progress scout
  assert.equal(cancel.ok, true);
  assert.equal(cancel.refund, 80);
  assert.equal(Sim.scrapOf(s, 'iron_eden'), 200, 'cancel refunds the full queued cost');
  assert.equal(Sim.productionQueue(s, 'iron_eden').items.length, 1);
});

test('economy: queueing at a non-core, enemy core, or non-producible type is rejected', () => {
  const s = testGame();
  const core = Sim.addStructure(s, 'command_core', 'iron_eden', 6, 20);
  const foe = Sim.addStructure(s, 'command_core', 'xandria', 57, 20);
  assert.equal(Sim.queueProduction(s, 'iron_eden', foe.id, 'scout_buggy').ok, false);
  assert.equal(Sim.queueProduction(s, 'iron_eden', 99999, 'scout_buggy').ok, false);
  assert.equal(Sim.queueProduction(s, 'iron_eden', core.id, 'heavy_tank').ok, false);
  assert.equal(Sim.scrapOf(s, 'iron_eden'), 500);
});

// ---- Production timing + spawn ----
test('production: one at a time in queue order, catalog build time, spawns next to the core on passable ground', () => {
  const s = testGame();
  const core = Sim.addStructure(s, 'command_core', 'iron_eden', 6, 20);
  Sim.queueProduction(s, 'iron_eden', core.id, 'scout_buggy'); // 8s = 160 ticks
  Sim.queueProduction(s, 'iron_eden', core.id, 'medium_tank'); // 20s = 400 ticks
  stepN(s, 159);
  assert.equal(s.units.filter((u) => u.faction === 'iron_eden').length, 0, 'nothing before 160 ticks');
  stepN(s, 1);
  const afterFirst = s.units.filter((u) => u.faction === 'iron_eden');
  assert.equal(afterFirst.length, 1);
  assert.equal(afterFirst[0].typeId, 'scout_buggy');
  assert.ok(Math.hypot(afterFirst[0].x - 6, afterFirst[0].y - 20) <= 6, 'spawned next to the core');
  assert.ok(Sim.isPassable(s, Math.floor(afterFirst[0].x), Math.floor(afterFirst[0].y), 'ground'), 'spawn tile passable');
  stepN(s, 399);
  assert.equal(s.units.filter((u) => u.faction === 'iron_eden').length, 1, 'second unit not early');
  stepN(s, 1);
  const afterSecond = s.units.filter((u) => u.faction === 'iron_eden');
  assert.equal(afterSecond.length, 2);
  assert.equal(afterSecond[1].typeId, 'medium_tank');
});

test('production: air units spawn on any tile near the core (they ignore ground terrain)', () => {
  const s = testGame();
  const core = Sim.addStructure(s, 'command_core', 'iron_eden', 6, 20);
  assert.equal(Sim.queueProduction(s, 'iron_eden', core.id, 'combat_drone').ok, true); // 8s
  stepN(s, 160);
  const drones = s.units.filter((u) => u.typeId === 'combat_drone');
  assert.equal(drones.length, 1);
  assert.ok(Math.hypot(drones[0].x - 6, drones[0].y - 20) <= 6);
});

// ---- Wrecks: fraction, decay, expiry, salvage ----
test('wrecks: dead unit leaves a sim wreck worth 40% of catalog cost (never full value)', () => {
  const s = testGame();
  const tank = Sim.addUnit(s, 'medium_tank', 'iron_eden', 10, 20); // cost 300
  tank.hp = 0; tank.alive = false;
  Sim.step(s);
  assert.equal(s.wrecks.length, 1);
  assert.equal(s.wrecks[0].baseValue, 120, 'floor(300 * 0.4)');
  assert.equal(s.wrecks[0].value, 120);
  assert.equal(s.wrecksCreated, 1);
  assert.equal(Sim.SALVAGE_FRACTION, 0.4);
});

test('wrecks: value decays linearly and the wreck expires after 120s', () => {
  const s = testGame();
  const scout = Sim.addUnit(s, 'scout_buggy', 'xandria', 13, 20); // cost 80 -> base 32
  scout.hp = 0; scout.alive = false;
  Sim.step(s);
  assert.equal(s.wrecks[0].value, 32);
  stepN(s, 1200); // half of 2400 ticks
  assert.equal(s.wrecks.length, 1);
  assert.equal(s.wrecks[0].value, 16, 'half life left -> half value');
  stepN(s, 1200);
  assert.equal(s.wrecks.length, 0, 'expired at 2400 ticks');
});

test('wrecks: structures leave no sim wreck', () => {
  const s = testGame();
  const core = Sim.addStructure(s, 'command_core', 'xandria', 57, 20);
  core.hp = 0; core.alive = false;
  Sim.step(s);
  assert.equal(s.wrecks.length, 0);
});

test('salvage: order sends a unit to the wreck, collects current value on arrival, removes the wreck', () => {
  const s = testGame();
  // A distant surviving xandria unit, so the foe's death does not end
  // the game by elimination (a declared winner freezes the sim).
  Sim.addUnit(s, 'scout_buggy', 'xandria', 50, 20);
  const foe = Sim.addUnit(s, 'scout_buggy', 'xandria', 14, 20);
  foe.hp = 0; foe.alive = false;
  Sim.step(s);
  const wk = s.wrecks[0];
  const salvager = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 10, 20);
  const before = Sim.scrapOf(s, 'iron_eden');
  Sim.issueOrder(s, [salvager.id], { kind: 'salvage', wreckId: wk.id });
  stepN(s, 400);
  assert.equal(s.wrecks.length, 0, 'wreck collected');
  assert.ok(Sim.scrapOf(s, 'iron_eden') > before, 'scrap increased');
  assert.ok(Sim.scrapOf(s, 'iron_eden') <= before + 32, 'never more than the wreck value');
  assert.equal(salvager.order.kind, 'hold', 'salvager holds after collecting');
});

test('salvage: a salvager that arrives late collects the decayed value, not the base value', () => {
  const s = testGame();
  Sim.addUnit(s, 'scout_buggy', 'xandria', 50, 20); // survivor: death must not end the game
  const foe = Sim.addUnit(s, 'scout_buggy', 'xandria', 14, 20);
  foe.hp = 0; foe.alive = false;
  Sim.step(s);
  stepN(s, 1200); // decay to 16
  assert.equal(s.wrecks[0].value, 16);
  const salvager = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 13, 20);
  Sim.issueOrder(s, [salvager.id], { kind: 'salvage', wreckId: s.wrecks[0].id });
  stepN(s, 100);
  assert.equal(s.wrecks.length, 0);
  const gained = Sim.scrapOf(s, 'iron_eden') - 500;
  assert.ok(gained > 0 && gained <= 16, `late collection gained ${gained}, must be in (0, 16]`);
});

// ---- Queued orders ----
test('queued orders: shift-appended move runs after the first order instead of replacing it', () => {
  const s = testGame();
  const u = Sim.addUnit(s, 'medium_tank', 'iron_eden', 10, 20);
  Sim.issueOrder(s, [u.id], { kind: 'move', x: 14, y: 20 });
  Sim.issueOrder(s, [u.id], { kind: 'move', x: 14, y: 24 }, { append: true });
  assert.equal(u.orderQueue.length, 1, 'second order queued, first kept');
  assert.equal(u.order.x, 14); assert.equal(u.order.y, 20);
  stepN(s, 800);
  assert.ok(Math.hypot(u.x - 14.5, u.y - 24.5) < 1.0, `ended near second waypoint at ${u.x},${u.y}`);
});

test('queued orders: a non-appended order replaces the current order and clears the queue', () => {
  const s = testGame();
  const u = Sim.addUnit(s, 'medium_tank', 'iron_eden', 10, 20);
  Sim.issueOrder(s, [u.id], { kind: 'move', x: 14, y: 20 });
  Sim.issueOrder(s, [u.id], { kind: 'move', x: 14, y: 24 }, { append: true });
  assert.equal(u.orderQueue.length, 1);
  Sim.issueOrder(s, [u.id], { kind: 'move', x: 20, y: 20 });
  assert.equal(u.orderQueue.length, 0);
  assert.equal(u.order.x, 20);
});

// ---- Groups (view.js pure data) ----
test('groups: assign stores a copy, recall returns a copy, unknown key recalls empty', () => {
  const g = View.createGroups();
  assert.deepEqual(View.recallGroup(g, '1'), []);
  View.assignGroup(g, '1', [3, 5]);
  const recalled = View.recallGroup(g, '1');
  assert.deepEqual(recalled, [3, 5]);
  recalled.push(99);
  assert.deepEqual(View.recallGroup(g, '1'), [3, 5], 'mutating a recall must not corrupt the group');
  View.assignGroup(g, '1', [7]);
  assert.deepEqual(View.recallGroup(g, '1'), [7], 'reassign replaces');
});

// ---- Formation offsets ----
test('formation: offsets are distinct, centred on the target, 2 tiles apart', () => {
  const offs = Sim.formationOffsets(4);
  assert.equal(offs.length, 4);
  const keys = new Set(offs.map((o) => o.join(',')));
  assert.equal(keys.size, 4, 'all offsets distinct');
  const meanX = offs.reduce((a, o) => a + o[0], 0) / 4;
  const meanY = offs.reduce((a, o) => a + o[1], 0) / 4;
  assert.ok(Math.abs(meanX) < 0.01 && Math.abs(meanY) < 0.01, 'formation centred on target');
  assert.deepEqual(Sim.formationOffsets(1), [[0, 0]]);
});

test('formation: a group move gives each unit its own destination tile', () => {
  const s = testGame();
  const a = Sim.addUnit(s, 'medium_tank', 'iron_eden', 10, 18);
  const b = Sim.addUnit(s, 'medium_tank', 'iron_eden', 10, 20);
  const c = Sim.addUnit(s, 'medium_tank', 'iron_eden', 10, 22);
  Sim.issueFormationOrder(s, [a.id, b.id, c.id], { kind: 'move', x: 20, y: 20 });
  const dests = new Set([a, b, c].map((u) => u.order.x + ',' + u.order.y));
  assert.equal(dests.size, 3, 'three distinct destinations');
  stepN(s, 900);
  // Units end near their own destinations, not stacked on one tile.
  const spread = Math.max(Math.abs(a.x - b.x), Math.abs(a.x - c.x), Math.abs(b.x - c.x),
    Math.abs(a.y - b.y), Math.abs(a.y - c.y), Math.abs(b.y - c.y));
  assert.ok(spread >= 1.5, `formation spread ${spread}`);
});

// ---- Patrol ----
test('patrol: unit walks A, flips to leg B, then flips back to leg A, looping', () => {
  const s = testGame();
  const u = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 10, 20);
  Sim.issueOrder(s, [u.id], { kind: 'patrol', points: [{ x: 14, y: 20 }, { x: 18, y: 20 }] });
  // Step until the leg flips to B (arrival at A), bounded so a stuck unit fails loudly.
  let guard = 0;
  while (u.order.leg !== 1 && guard++ < 1000) Sim.step(s);
  assert.equal(u.order.leg, 1, 'flipped to leg B after reaching A');
  assert.ok(Math.abs(u.x - 14) < 1.5, `near A when flipping, x=${u.x}`);
  guard = 0;
  while (u.order.leg !== 0 && guard++ < 1000) Sim.step(s);
  assert.equal(u.order.leg, 0, 'flipped back to leg A after reaching B');
  assert.ok(Math.abs(u.x - 18) < 1.5, `near B when flipping back, x=${u.x}`);
  assert.equal(u.order.kind, 'patrol', 'still patrolling after a full loop');
});

test('patrol: a patrol unit engages an enemy in range and resumes patrolling', () => {
  const s = testGame();
  Sim.addUnit(s, 'scout_buggy', 'xandria', 50, 20); // survivor: foe death must not end the game
  const u = Sim.addUnit(s, 'medium_tank', 'iron_eden', 10, 20);
  const foe = Sim.addUnit(s, 'scout_buggy', 'xandria', 15, 20);
  Sim.issueOrder(s, [u.id], { kind: 'patrol', points: [{ x: 14, y: 20 }, { x: 18, y: 20 }] });
  stepN(s, 200);
  assert.ok(foe.hp < 60, `patrol unit fired, foe hp ${foe.hp}`);
  assert.equal(u.order.kind, 'patrol');
});

// ---- Victory stats ----
test('victory stats: winner, ticks, units remaining, wrecks created', () => {
  const s = testGame();
  assert.equal(Sim.victoryStats(s), null, 'no stats before a winner');
  const coreB = Sim.addStructure(s, 'command_core', 'xandria', 57, 20);
  const foe = Sim.addUnit(s, 'scout_buggy', 'xandria', 50, 20);
  const coreA = Sim.addStructure(s, 'command_core', 'iron_eden', 6, 20);
  void coreA;
  coreB.hp = 0; coreB.alive = false;
  foe.hp = 0; foe.alive = false;
  Sim.step(s);
  assert.equal(s.winner, 'iron_eden');
  const stats = Sim.victoryStats(s);
  assert.equal(stats.winner, 'iron_eden');
  assert.equal(stats.tick, s.tick);
  assert.equal(stats.unitsRemaining, 0, 'no iron_eden units were spawned in this test game');
  assert.equal(stats.wrecksCreated, 1, 'the dead scout left one wreck');
});
