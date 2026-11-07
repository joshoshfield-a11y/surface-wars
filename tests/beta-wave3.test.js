/* Beta wave 3 tests: mechanics the wave-3 balance investigation rests on.
   NOT pinned anywhere else: (1) a PLAYER-issued salvage order to a
   distant wreck (a detached unit, not the AI idle rule) travels and
   collects the decayed value — the play element that flips sim
   matches; (2) a bare core with 70 scrap cannot afford anything
   (cheapest producible unit is 80) — the mechanism behind the
   9v10-without-salvage stall; (3) an unsalvaged wreck expires after
   its 120 s lifetime and pays nothing.
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

test('beta-wave3: player-issued salvage order to a distant wreck collects the decayed value', () => {
  const s = testGame();
  // Red keep-alive core with zero scrap: without it, red has no units
  // and no structures once the foe dies, so the sim declares blue the
  // winner and freezes — the salvager would never move. With 0 scrap
  // the red AI cannot produce a unit that disturbs the test.
  Sim.addStructure(s, 'command_core', 'xandria', 57, 20);
  s.scrap.xandria = 0;
  // Wreck 10 tiles from a blue scout, same side of the river.
  const foe = Sim.addUnit(s, 'scout_buggy', 'xandria', 20, 20);
  foe.hp = 0; foe.alive = false;
  Sim.step(s);
  const wk = s.wrecks[0];
  assert.ok(wk, 'wreck created');
  assert.equal(wk.baseValue, 32, '40% of the 80-scrap scout');
  const salvager = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 10, 20);
  const scrapBefore = Sim.scrapOf(s, 'iron_eden');
  Sim.issueOrder(s, [salvager.id], { kind: 'salvage', wreckId: wk.id });
  assert.equal(salvager.order.kind, 'salvage', 'player order applied');
  // Step tick by tick; the value at the tick BEFORE collection is what
  // the salvager must bank (decay is linear over 2400 ticks).
  let collected = false, expected = null, gained = null;
  for (let i = 0; i < 600 && !collected; i++) {
    const prevValue = s.wrecks.length ? s.wrecks[0].value : null;
    const prevScrap = Sim.scrapOf(s, 'iron_eden');
    Sim.step(s);
    if (!s.wrecks.length) {
      collected = true; expected = prevValue;
      gained = Sim.scrapOf(s, 'iron_eden') - prevScrap;
    }
  }
  assert.equal(collected, true, 'detached salvager reaches and collects the distant wreck');
  assert.ok(expected !== null && expected > 0 && expected <= 32, `decayed value in (0, 32], got ${expected}`);
  assert.equal(gained, expected, `scrap banked equals the decayed value at collection (${gained} vs ${expected})`);
  assert.ok(Sim.scrapOf(s, 'iron_eden') > scrapBefore, 'scrap rose');
});

test('beta-wave3: a bare core with 70 scrap cannot afford any unit (cheapest is 80)', () => {
  const s = testGame();
  const core = Sim.addStructure(s, 'command_core', 'iron_eden', 6, 20);
  const prod = Sim.producibleUnits(s, 'iron_eden');
  const cheapest = Math.min(...prod.map((u) => u.cost.scrap));
  assert.equal(cheapest, 80, 'cheapest producible unit costs 80 scrap');
  s.scrap.iron_eden = 70;
  const r = Sim.queueProduction(s, 'iron_eden', core.id, 'scout_buggy');
  assert.equal(r.ok, false, '70 scrap cannot queue the 80-scrap scout');
  assert.equal(r.reason, 'insufficient-scrap');
  s.scrap.iron_eden = 80;
  assert.equal(Sim.queueProduction(s, 'iron_eden', core.id, 'scout_buggy').ok, true, '80 scrap can');
});

test('beta-wave3: an unsalvaged wreck expires after its lifetime and pays nothing', () => {
  const s = testGame();
  const foe = Sim.addUnit(s, 'scout_buggy', 'xandria', 20, 20);
  foe.hp = 0; foe.alive = false;
  Sim.step(s);
  assert.equal(s.wrecks.length, 1, 'wreck created');
  assert.equal(Sim.WRECK_LIFETIME_TICKS, 2400, 'lifetime is 120 sim seconds');
  const scrapBefore = Sim.scrapOf(s, 'iron_eden');
  stepN(s, 2401);
  assert.equal(s.wrecks.length, 0, 'wreck expired with no salvager');
  assert.equal(Sim.scrapOf(s, 'iron_eden'), scrapBefore, 'no scrap gained from an expired wreck');
});
