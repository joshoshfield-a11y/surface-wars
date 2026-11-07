/* Beta wave 2b: regression tests for the full beta pass (2026-10-31).
   Every test here pins a behaviour the browser pass observed, so a
   future edit that breaks it fails here instead of silently.
   - Wreck-refresh decay arithmetic: the browser pass read a refreshed
     tutorial wreck at 31 scrap / 119 s left after a 70 s idle, and an
     early draft of the check wrongly demanded exactly 32. Decay is
     floor(32 * (2400 - age) / 2400), so a refreshed wreck reads 31
     within ~75 ticks of the refresh, while an unrefreshed wreck of
     the same match age (~1900 ticks) reads 6. The refresh is proven
     by 31, not by 32.
   - Hero death redeploy terms (browser: death -> "Drop ready in 30s"
     counting down -> redeploy at full HP once 600 ticks passed and
     200 scrap held).
   - Terminal-panel stats (Sim.victoryStats): the defeat panel the
     browser rendered twice reads exactly these fields; the victory
     and draw branches share the function, so their field shapes are
     pinned here even though no UI-driven run reached those panels.
   Run: node --test tests/*.test.js */
const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');
const Hero = require('../game/hero.js');
const Weapons = require('../game/weapons.js');

function grassGame(w, h) {
  const terrain = new Uint8Array(w * h);
  return Sim.createGame({ catalog, width: w, height: h, terrain, seed: 42 });
}
function stepN(s, n) { for (let i = 0; i < n; i++) Sim.step(s); }

// ---- Wreck refresh: 31 shortly after refresh, 6 without it ----
test('beta2b: refreshed wreck reads 31 within ~75 ticks; unrefreshed same-age wreck reads 6', () => {
  const s = grassGame(64, 40);
  Sim.addStructure(s, 'command_core', 'iron_eden', 5, 5); // keep-alive
  Sim.addUnit(s, 'sensor_drone', 'xandria', 50, 35); // keep-alive
  const u = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 10, 10);
  u.hp = 0; u.alive = false;
  stepN(s, 1);
  assert.equal(s.wrecks.length, 1);
  const wk = s.wrecks[0];
  assert.equal(wk.baseValue, 32);
  // Match ages ~1900 ticks (the browser pass idled 70 s in the build
  // step, then built for 8 s, before entering the salvage step).
  stepN(s, 1899);
  assert.equal(wk.value, 6, 'unrefreshed wreck decayed to 6 by tick ~1900');
  // The salvage-step refresh (game.js enterTutorialStep): reset clock.
  wk.createdTick = s.tick; wk.expiresTick = s.tick + Sim.WRECK_LIFETIME_TICKS; wk.value = wk.baseValue;
  stepN(s, 40);
  assert.equal(wk.value, 31, 'refreshed wreck reads 31 after 40 ticks (floor decay), not 32 and not 6');
});

// ---- Hero death redeploy terms ----
test('beta2b: hero death cools down 600 ticks then redeploys for exactly 200 scrap', () => {
  const h = Hero.startMatch(Weapons.DEFAULT_LOADOUT);
  Hero.die(h, 100);
  const facts = (tick, scrap) => ({ coreAlive: true, scrap, tick, dropTile: { x: 7, y: 25 } });
  assert.equal(Hero.canDrop(h, facts(699, 500)).kind, 'cooldown', 'still cooling one tick before 600 elapse');
  assert.equal(Hero.canDrop(h, facts(700, 199)).kind, 'scrap', 'cooldown over but 199 scrap is short');
  const ok = Hero.canDrop(h, facts(700, 200));
  assert.equal(ok.ok, true, '600 ticks + 200 scrap redeploys');
  assert.equal(ok.cost, 200, 'redeploy cost is exactly 200 scrap');
  assert.equal(Hero.canDrop(h, facts(700, 500)).cost, 200, 'extra scrap does not change the cost');
});

// ---- Terminal-panel stats: defeat branch (browser-rendered twice) ----
test('beta2b: victoryStats defeat branch reports winner-side survivors + wreck counts', () => {
  const s = grassGame(64, 40);
  Sim.addUnit(s, 'medium_tank', 'iron_eden', 10, 10);
  Sim.addUnit(s, 'medium_tank', 'xandria', 20, 10);
  Sim.addUnit(s, 'medium_tank', 'xandria', 22, 10);
  s.winner = 'xandria'; s.tick = 1492; s.time = 74.6; s.wrecksCreated = 10;
  const st = Sim.victoryStats(s);
  assert.equal(st.winner, 'xandria');
  assert.equal(st.unitsRemaining, 2, 'defeat panel shows the WINNER\'s remaining units');
  assert.equal(st.ironRemaining, 1);
  assert.equal(st.xandriaRemaining, 2);
  assert.equal(st.wrecksCreated, 10);
  assert.equal(st.tick, 1492);
});

// ---- Terminal-panel stats: victory + draw branches (same function) ----
test('beta2b: victoryStats victory and draw branches use the same fields the panel renders', () => {
  const s = grassGame(64, 40);
  Sim.addUnit(s, 'medium_tank', 'iron_eden', 10, 10);
  Sim.addUnit(s, 'medium_tank', 'iron_eden', 12, 10);
  Sim.addUnit(s, 'medium_tank', 'xandria', 20, 10);
  s.winner = 'iron_eden';
  let st = Sim.victoryStats(s);
  assert.equal(st.unitsRemaining, 2, 'victory panel shows Iron Eden survivors');
  s.winner = 'draw';
  st = Sim.victoryStats(s);
  assert.equal(st.unitsRemaining, 3, 'draw panel shows BOTH sides\' survivors (no winner count exists)');
  assert.equal(st.ironRemaining, 2);
  assert.equal(st.xandriaRemaining, 1);
  const s2 = grassGame(64, 40);
  assert.equal(Sim.victoryStats(s2), null, 'no panel stats before a winner exists');
});
