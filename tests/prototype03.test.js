/* Surface Wars Prototype 03 tests: guard order, rally points, red AI
   economy, on-screen group buttons (pure helpers), stale-text strip.
   Run with the explicit file list (directory invocation fails on this Node):
   node --test tests/sim.test.js tests/view.test.js tests/firstmap.test.js \
     tests/catalog.test.js tests/animation.test.js tests/sprites.test.js \
     tests/prototype02.test.js tests/prototype03.test.js */
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
// Both factions must be "seen" (have had at least one unit/structure) or
// the sim declares a winner and freezes — the same guard the P02 tests use.
function bothSides(s) {
  Sim.addUnit(s, 'scout_buggy', 'iron_eden', 10, 20);
  Sim.addStructure(s, 'command_core', 'xandria', 57, 20);
}

// ---- Guard order ----
test('guard: unit moves to the guard point and then holds there', () => {
  const s = testGame(); bothSides(s);
  const u = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 10, 20);
  Sim.issueOrder(s, [u.id], { kind: 'guard', x: 14, y: 20 });
  stepN(s, 400);
  assert.equal(u.order.kind, 'guard');
  assert.equal(u.order.guardArrived, true);
  assert.ok(Math.hypot(u.x - 14, u.y - 20) < 1.5, `guard ended at ${u.x},${u.y}, expected near (14,20)`);
  const px = u.x, py = u.y;
  stepN(s, 200);
  assert.ok(Math.hypot(u.x - px, u.y - py) < 0.5, 'arrived guard stays at its point with no enemy around');
});

test('guard: engages an enemy in range without chasing, and hold does not return when displaced', () => {
  const s = testGame(); bothSides(s);
  const guard = Sim.addUnit(s, 'medium_tank', 'iron_eden', 14, 20);
  Sim.issueOrder(s, [guard.id], { kind: 'guard', x: 14, y: 20 });
  stepN(s, 100); // arrive first
  const foe = Sim.addUnit(s, 'scout_buggy', 'xandria', 18, 20); // in tank range, out of melee
  const foeHp = foe.hp;
  stepN(s, 200);
  assert.ok(foe.hp < foeHp, `guard fired: foe hp ${foeHp} -> ${foe.hp}`);
  assert.ok(Math.hypot(guard.x - 14, guard.y - 20) < 2.0, `guard did not chase: at ${guard.x},${guard.y}`);

  // Contrast: a Hold unit displaced the same way never returns.
  const holder = Sim.addUnit(s, 'medium_tank', 'iron_eden', 10, 30);
  Sim.issueOrder(s, [holder.id], { kind: 'hold' });
  holder.x = 20; holder.y = 30; // simulated displacement (separation, knockback, etc.)
  stepN(s, 100);
  assert.ok(Math.hypot(holder.x - 10, holder.y - 30) > 5, `hold unit stayed displaced at ${holder.x},${holder.y}`);
});

test('guard: returns to its guard point after being displaced', () => {
  const s = testGame(); bothSides(s);
  const u = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 14, 20);
  Sim.issueOrder(s, [u.id], { kind: 'guard', x: 14, y: 20 });
  stepN(s, 100);
  assert.equal(u.order.guardArrived, true);
  u.x = 22; u.y = 20; // displaced 8 tiles from the guard point
  stepN(s, 600);
  assert.ok(Math.hypot(u.x - 14, u.y - 20) < 1.5, `guard returned to ${u.x},${u.y}, expected near (14,20)`);
});

test('guard: guarding a friendly unit follows it when it moves', () => {
  const s = testGame(); bothSides(s);
  const ward = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 16, 20);
  const guard = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 10, 20);
  Sim.issueOrder(s, [guard.id], { kind: 'guard', guardTargetId: ward.id, x: ward.x, y: ward.y });
  stepN(s, 400);
  assert.ok(Math.hypot(guard.x - 16, guard.y - 20) < 2.0, `guard reached ward at ${guard.x},${guard.y}`);
  Sim.issueOrder(s, [ward.id], { kind: 'move', x: 26, y: 20 });
  stepN(s, 800);
  assert.ok(guard.order.x > 20, `guard point followed ward to ${guard.order.x},${guard.order.y}`);
  assert.ok(Math.hypot(guard.x - ward.x, guard.y - ward.y) < 3.0, `guard kept up with ward: guard ${guard.x},${guard.y} ward ${ward.x},${ward.y}`);
});

test('guard: guarding a dead target keeps the last known point', () => {
  const s = testGame(); bothSides(s);
  const ward = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 16, 20);
  const guard = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 10, 20);
  Sim.issueOrder(s, [guard.id], { kind: 'guard', guardTargetId: ward.id, x: ward.x, y: ward.y });
  stepN(s, 400);
  // The last known point is the ward's actual final position (separation
  // nudges it slightly off its spawn tile), not the spawn tile itself.
  const lastX = guard.order.x, lastY = guard.order.y;
  ward.hp = 0; ward.alive = false;
  stepN(s, 100);
  assert.equal(guard.order.kind, 'guard');
  assert.ok(Math.hypot(guard.order.x - lastX, guard.order.y - lastY) < 0.01,
    `guard kept last point ${guard.order.x},${guard.order.y}, was ${lastX},${lastY}`);
});

// ---- Rally points ----
test('rally: setRally stores and clamps the point, rejects bad cores', () => {
  const s = testGame(); bothSides(s);
  const core = s.structures.find((st) => st.faction === 'iron_eden' && st.typeId === 'command_core')
    || Sim.addStructure(s, 'command_core', 'iron_eden', 6, 20);
  const r = Sim.setRally(s, 'iron_eden', core.id, 20, 20);
  assert.equal(r.ok, true);
  assert.equal(core.rally.x, 20); assert.equal(core.rally.y, 20);
  const clamped = Sim.setRally(s, 'iron_eden', core.id, 999, -5);
  assert.equal(clamped.ok, true);
  assert.equal(core.rally.x, 63.5); assert.equal(core.rally.y, 0.5);
  assert.equal(Sim.setRally(s, 'iron_eden', 999999, 10, 10).ok, false, 'unknown core rejected');
  const redCore = s.structures.find((st) => st.faction === 'xandria');
  assert.equal(Sim.setRally(s, 'iron_eden', redCore.id, 10, 10).ok, false, 'wrong-faction core rejected');
  const other = Sim.addStructure(s, 'bunker', 'iron_eden', 8, 20);
  assert.equal(Sim.setRally(s, 'iron_eden', other.id, 10, 10).ok, false, 'non-core structure rejected');
});

test('rally: newly produced units move to the rally point on spawn', () => {
  const s = testGame();
  const core = Sim.addStructure(s, 'command_core', 'iron_eden', 6, 20);
  Sim.addUnit(s, 'scout_buggy', 'xandria', 50, 20); // survivor: no elimination freeze
  assert.equal(Sim.setRally(s, 'iron_eden', core.id, 20, 20).ok, true);
  const before = s.units.filter((u) => u.faction === 'iron_eden').length;
  assert.equal(Sim.queueProduction(s, 'iron_eden', core.id, 'scout_buggy').ok, true);
  stepN(s, 200); // scout build time is 8s = 160 ticks
  const spawned = s.units.filter((u) => u.faction === 'iron_eden');
  assert.ok(spawned.length > before, 'a unit spawned');
  const fresh = spawned[spawned.length - 1];
  assert.equal(fresh.order.kind, 'move', 'spawned unit got a move order, not idle hold');
  assert.equal(fresh.order.x, 20); assert.equal(fresh.order.y, 20);
  const d0 = Math.hypot(fresh.x - 20, fresh.y - 20);
  stepN(s, 200);
  assert.ok(Math.hypot(fresh.x - 20, fresh.y - 20) < d0, 'spawned unit travelled toward the rally point');
});

test('rally: without a rally point, produced units idle next to the core', () => {
  const s = testGame();
  const core = Sim.addStructure(s, 'command_core', 'iron_eden', 6, 20);
  Sim.addUnit(s, 'scout_buggy', 'xandria', 50, 20);
  assert.equal(core.rally, null);
  Sim.queueProduction(s, 'iron_eden', core.id, 'scout_buggy');
  stepN(s, 200);
  const fresh = s.units.filter((u) => u.faction === 'iron_eden').pop();
  assert.equal(fresh.order.kind, 'hold', 'no rally -> idle hold next to the core');
});

// ---- Red AI economy ----
test('ai: spends scrap and produces a unit, never exceeding its queue cap', () => {
  const s = testGame(); bothSides(s);
  const redBefore = s.units.filter((u) => u.faction === 'xandria').length;
  for (let i = 0; i < 30; i++) {
    stepN(s, 20);
    assert.ok(Sim.productionQueue(s, 'xandria').items.length <= Sim.AI_QUEUE_CAP,
      `queue cap exceeded at tick ${s.tick}`);
  }
  const redAfter = s.units.filter((u) => u.faction === 'xandria').length;
  assert.ok(redAfter > redBefore, `AI produced units: ${redBefore} -> ${redAfter}`);
  assert.ok(Sim.scrapOf(s, 'xandria') < 500, 'AI spent scrap');
  // Per-type ceiling: no type exceeds live + queued cap through AI builds.
  const counts = {};
  s.units.filter((u) => u.faction === 'xandria').forEach((u) => { counts[u.typeId] = (counts[u.typeId] || 0) + 1; });
  Sim.productionQueue(s, 'xandria').items.forEach((it) => { counts[it.typeId] = (counts[it.typeId] || 0) + 1; });
  Object.keys(counts).forEach((t) => {
    assert.ok(counts[t] <= Sim.AI_PER_TYPE_CAP + redBefore, `type ${t} count ${counts[t]} within cap (initial units excluded)`);
  });
});

test('ai: scrap is conserved — no free scrap, and the player side is untouched', () => {
  const s = testGame(); bothSides(s);
  // Sim does not export unitDef; the test reads costs from the catalog,
  // exactly as the game shell's unitDefById does.
  const costOf = (typeId) => catalog.units.find((u) => u.id === typeId).cost.scrap;
  const redBefore = s.units.filter((u) => u.faction === 'xandria');
  const redCostBefore = redBefore.reduce((sum, u) => sum + costOf(u.typeId), 0);
  stepN(s, 400);
  const q = Sim.productionQueue(s, 'xandria');
  const queuedCost = q.items.reduce((sum, it) => sum + (it.cost || costOf(it.typeId)), 0);
  const redNow = s.units.filter((u) => u.faction === 'xandria');
  const redCostNow = redNow.reduce((sum, u) => sum + costOf(u.typeId), 0);
  const spawnedCost = redCostNow - redCostBefore;
  assert.equal(Sim.scrapOf(s, 'xandria') + queuedCost + spawnedCost, 500,
    `scrap ${Sim.scrapOf(s, 'xandria')} + queued ${queuedCost} + spawned ${spawnedCost} must equal starting 500`);
  assert.equal(Sim.scrapOf(s, 'iron_eden'), 500, 'AI never touched player scrap');
  assert.equal(Sim.productionQueue(s, 'iron_eden').items.length, 0, 'AI never touched the player queue');
});

test('ai: salvages a nearby wreck for the decayed value', () => {
  const s = testGame();
  Sim.addUnit(s, 'scout_buggy', 'iron_eden', 10, 20); // survivor
  const core = Sim.addStructure(s, 'command_core', 'xandria', 57, 20);
  // A wreck 3 tiles from an idle red unit: the AI may send it.
  const foe = Sim.addUnit(s, 'scout_buggy', 'xandria', 43, 20);
  foe.hp = 0; foe.alive = false;
  Sim.step(s); // creates the wreck (base 32); tick 1, no AI think yet
  const wk = s.wrecks[0];
  assert.ok(wk, 'wreck created');
  const baseValue = wk.baseValue;
  const salvager = Sim.addUnit(s, 'scout_buggy', 'xandria', 40, 20);
  // Starve the AI of production spend so the salvage gain is measurable:
  // with 0 scrap it cannot afford anything, but salvage is still allowed.
  s.scrap.xandria = 0;
  Sim.runAiEconomy(s);
  assert.equal(salvager.order.kind, 'salvage', 'AI assigned the idle unit to salvage');
  assert.equal(salvager.order.wreckId, wk.id, 'AI targeted the nearby wreck');
  stepN(s, 400);
  assert.equal(s.wrecks.length, 0, 'wreck collected by the AI salvager');
  const gained = Sim.scrapOf(s, 'xandria');
  assert.ok(gained > 0 && gained <= baseValue, `AI gained ${gained} scrap, must be in (0, ${baseValue}] (decayed value)`);
  // Generation Cycle 2 change, stated explicitly (the ONLY P03
  // expectation changed in Cycle 2): after collecting, the salvager
  // is no longer left idle — the combat AI assigns it a gather/defend
  // guard order. What the test guards is that it is no longer
  // salvaging, not that it idles forever.
  assert.notEqual(salvager.order.kind, 'salvage', 'AI salvager is done salvaging after collecting');
});

test('ai: ignores wrecks beyond its salvage range and does nothing without a core', () => {
  const s = testGame();
  Sim.addUnit(s, 'scout_buggy', 'iron_eden', 10, 20);
  Sim.addStructure(s, 'command_core', 'xandria', 57, 20);
  const foe = Sim.addUnit(s, 'scout_buggy', 'xandria', 12, 20);
  foe.hp = 0; foe.alive = false;
  Sim.step(s);
  const far = Sim.addUnit(s, 'scout_buggy', 'xandria', 40, 20); // ~28 tiles from the wreck
  Sim.runAiEconomy(s);
  assert.notEqual(far.order.kind, 'salvage', 'wreck beyond AI_SALVAGE_RANGE is ignored');
  // No core -> no AI action at all (and no crash).
  const s2 = testGame();
  Sim.addUnit(s2, 'scout_buggy', 'iron_eden', 10, 20);
  const lone = Sim.addUnit(s2, 'scout_buggy', 'xandria', 40, 20);
  Sim.runAiEconomy(s2);
  assert.equal(lone.order.kind, 'hold', 'no core, no AI orders');
  assert.equal(Sim.productionQueue(s2, 'xandria').items.length, 0);
});

test('ai: no rally for the AI — its produced units idle next to its core', () => {
  const s = testGame(); bothSides(s);
  stepN(s, 200);
  const spawned = s.units.filter((u) => u.faction === 'xandria');
  // At least the first AI unit has spawned by now (cheapest build 8s).
  assert.ok(spawned.length >= 1, 'AI spawned at least one unit');
  spawned.forEach((u) => {
    assert.notEqual(u.order.kind, 'move', 'AI units do not get rally move orders');
  });
});

// ---- View helpers: group buttons + stale-text strip ----
test('view: stripVersionRef removes stale Prototype references, leaves other text alone', () => {
  assert.equal(
    View.stripVersionRef('Faction command structure. Losing it is elimination in Prototype 01.'),
    'Faction command structure. Losing it is elimination.');
  assert.equal(View.stripVersionRef('Prototype 02 economy'), 'economy');
  assert.equal(View.stripVersionRef('Plain text, no version here.'), 'Plain text, no version here.');
});

test('view: groupButtonAction assigns in assign mode (then switches off) and recalls on tap', () => {
  const groups = View.createGroups();
  View.assignGroup(groups, 1, [11, 22]);
  // Normal tap recalls.
  let res = View.groupButtonAction(groups, 1, [99], false);
  assert.deepEqual(res.selected, [11, 22]);
  assert.equal(res.assigned, null);
  assert.equal(res.assignMode, false);
  // Assign mode: tap assigns the current selection and switches itself off.
  res = View.groupButtonAction(groups, 2, [33, 44], true);
  assert.equal(res.assigned, 2);
  assert.equal(res.assignMode, false);
  assert.deepEqual(View.recallGroup(groups, 2), [33, 44]);
  // Keyboard path is unchanged: assign/recall still work directly.
  View.assignGroup(groups, 3, [55]);
  assert.deepEqual(View.recallGroup(groups, 3), [55]);
  // Empty group recall returns an empty selection, not a crash.
  res = View.groupButtonAction(groups, 9, [], false);
  assert.deepEqual(res.selected, []);
});
