/* Generation Cycle 3 tests: endgame deadlock detection and declared draw.
   Run with the explicit file list:
   node --test tests/*.test.js */
const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');

function testGame() {
  const map = Sim.createTestMap();
  return Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 42 });
}
function stepN(s, n) { for (let i = 0; i < n; i++) Sim.step(s); }
/* The Cycle 2 deadlock state, exactly: no Command Core on either side,
   only air drones whose guns hit ground/structure, so neither side can
   damage the other. Air units fly over the test map's river freely. */
function deadlockState() {
  const s = testGame();
  Sim.addUnit(s, 'combat_drone', 'iron_eden', 10, 20);
  Sim.addUnit(s, 'combat_drone', 'xandria', 50, 20);
  return s;
}

test('deadlock: both cores dead, air-only, neither can damage the other -> Draw after the grace period, not before', () => {
  const s = deadlockState();
  assert.equal(Sim.checkDeadlock(s), true, 'the constructed state must be a deadlock');
  stepN(s, 300);
  assert.equal(s.winner, null, 'no draw before the grace period ends');
  assert.equal(s.deadlockTicks, 300, 'counter advances once per tick while deadlocked');
  stepN(s, 299);
  assert.equal(s.winner, null, 'still no draw at grace - 1');
  Sim.step(s);
  assert.equal(s.winner, 'draw', 'draw declared exactly at the grace period');
  assert.equal(Sim.DEADLOCK_GRACE_TICKS, 600, 'grace period is 600 ticks (30 sim seconds)');
  const stats = Sim.victoryStats(s);
  assert.equal(stats.winner, 'draw');
  assert.equal(stats.ironRemaining, 1);
  assert.equal(stats.xandriaRemaining, 1);
  assert.equal(stats.unitsRemaining, 2, 'a draw counts both sides\' survivors, not a winner\'s');
});

test('deadlock: one-sided elimination is still a win/loss, never a draw', () => {
  const s = testGame();
  Sim.addUnit(s, 'combat_drone', 'iron_eden', 10, 20);
  const red = Sim.addUnit(s, 'scout_buggy', 'xandria', 50, 20);
  red.hp = 0; red.alive = false;
  Sim.step(s);
  assert.equal(s.winner, 'iron_eden', 'red eliminated -> blue wins, not a draw');
});

test('deadlock: a core still alive anywhere means no draw, even with only weaponless air units', () => {
  // Transient air-only moment: sensor drones cannot damage anything, but
  // both cores live, so both sides can still produce. Scrap is zeroed so
  // the red AI economy cannot spawn a combat unit mid-test and change
  // the state under test; the deadlock question is about the cores.
  const s = testGame();
  s.scrap.iron_eden = 0; s.scrap.xandria = 0;
  Sim.addStructure(s, 'command_core', 'iron_eden', 6, 20);
  Sim.addStructure(s, 'command_core', 'xandria', 57, 20);
  Sim.addUnit(s, 'sensor_drone', 'iron_eden', 10, 20);
  Sim.addUnit(s, 'sensor_drone', 'xandria', 50, 20);
  assert.equal(Sim.checkDeadlock(s), false, 'living cores mean production is possible');
  stepN(s, 1200);
  assert.equal(s.winner, null, 'no draw after twice the grace period with cores alive');
  assert.equal(s.deadlockTicks, 0, 'counter never advances while a core lives');
});

test('deadlock: one side able to damage the other is not a deadlock', () => {
  const s = testGame();
  // Interceptor guns hit air: red CAN damage the blue drone, even though
  // blue cannot damage red. Placed far apart so no shot is actually fired
  // during the test; the question is capability, not combat outcome.
  Sim.addUnit(s, 'combat_drone', 'iron_eden', 10, 20);
  Sim.addUnit(s, 'interceptor_drone', 'xandria', 50, 20);
  assert.equal(Sim.checkDeadlock(s), false, 'red can damage blue -> not a deadlock');
  assert.equal(Sim.factionCanDamage(s, 'xandria'), true);
  assert.equal(Sim.factionCanDamage(s, 'iron_eden'), false);
  stepN(s, 700);
  assert.equal(s.winner, null, 'no draw when one side can still damage the other');
});

test('deadlock: counter resets the moment the state stops being a deadlock', () => {
  const s = deadlockState();
  stepN(s, 300);
  assert.equal(s.deadlockTicks, 300);
  // A blue ground unit arrives: red drones CAN hit ground targets, so the
  // deadlock is over even though nothing has been shot yet.
  Sim.addUnit(s, 'scout_buggy', 'iron_eden', 12, 22);
  Sim.step(s);
  assert.equal(s.deadlockTicks, 0, 'counter resets when damage becomes possible again');
  assert.equal(s.winner, null);
});

test('deadlock: a non-core structure with no units and no core is a deadlock, not an elimination', () => {
  // Blue: a bunker only (structures never fire, cannot produce). Red: a
  // combat drone, whose gun hits ground/structure — but a bunker IS a
  // structure, so red CAN damage it. Use a weaponless red sensor drone
  // instead: neither side can damage the other, neither can produce.
  const s = testGame();
  Sim.addStructure(s, 'bunker', 'iron_eden', 10, 20);
  Sim.addUnit(s, 'sensor_drone', 'xandria', 50, 20);
  assert.equal(Sim.checkDeadlock(s), true, 'structure-only vs weaponless-air is a deadlock');
  stepN(s, 600);
  assert.equal(s.winner, 'draw', 'draw declared even though blue was never eliminated');
});
