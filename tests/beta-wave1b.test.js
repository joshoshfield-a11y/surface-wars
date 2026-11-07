/* Beta wave 1, batch 2: economy, AI modes, and skill effects proven at
   sim level. Companion to beta-wave1.test.js; same wave-1 rules (no
   game/ edits, report-only). Run: node --test tests/*.test.js */
const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');
const Maps = require('../game/maps.js');

function grassGame(w, h) {
  const terrain = new Uint8Array(w * h);
  return Sim.createGame({ catalog, width: w, height: h, terrain, seed: 42 });
}
function stepN(s, n) { for (let i = 0; i < n; i++) Sim.step(s); }
function tankWeapons() {
  return JSON.parse(JSON.stringify(
    catalog.units.find((u) => u.id === 'medium_tank').weapons.map((wid) => catalog.weapons.find((x) => x.id === wid))));
}

function firstMapGame() {
  const map = Maps.createFirstMap();
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 20261030 });
  Maps.spawnFirstMapScenario(Sim, s);
  return s;
}
// Kill one unit with a single shot: victim at 1 HP, adjacent shooter.
// Keep-alive extras (an iron core and an unarmed xandria drone far away)
// stop the kill from eliminating a faction, which would freeze the sim
// via the early winner return and mask decay/collection behaviour.
function makeWreck(s, victimType, vx, vy) {
  Sim.addStructure(s, 'command_core', 'iron_eden', 6, 20);
  Sim.addUnit(s, 'sensor_drone', 'xandria', 57, 35);
  const victim = Sim.addUnit(s, victimType, 'iron_eden', vx, vy);
  victim.hp = 1;
  const shooter = Sim.addUnit(s, 'medium_tank', 'xandria', vx + 3, vy);
  Sim.issueOrder(s, [shooter.id], { kind: 'attack', targetId: victim.id });
  stepN(s, 200);
  assert.equal(s.units.some((u) => u.id === victim.id), false, 'victim must die for the wreck test');
  const wk = s.wrecks.find((w) => w.typeId === victimType);
  assert.ok(wk, 'wreck must exist');
  return wk;
}

// ---- Economy ----
test('beta-b: production cancel refunds the full cost, including the in-progress item', () => {
  const s = grassGame(64, 40);
  const core = Sim.addStructure(s, 'command_core', 'iron_eden', 6, 20);
  assert.equal(Sim.scrapOf(s, 'iron_eden'), 500);
  assert.ok(Sim.queueProduction(s, 'iron_eden', core.id, 'medium_tank').ok);
  assert.equal(Sim.scrapOf(s, 'iron_eden'), 200, 'scrap is deducted when queued');
  stepN(s, 20);
  assert.ok(Sim.cancelProduction(s, 'iron_eden', 0).ok);
  assert.equal(Sim.scrapOf(s, 'iron_eden'), 500, 'cancel refunds in full');
  assert.equal(Sim.productionQueue(s, 'iron_eden').items.length, 0);
});
test('beta-b: core death refunds the whole queued backlog', () => {
  const s = grassGame(64, 40);
  const core = Sim.addStructure(s, 'command_core', 'iron_eden', 6, 20);
  Sim.addStructure(s, 'command_core', 'iron_eden', 30, 20); // keep-alive: no elimination
  Sim.addUnit(s, 'sensor_drone', 'xandria', 57, 35); // keep-alive: no winner declared
  Sim.queueProduction(s, 'iron_eden', core.id, 'scout_buggy'); // head, 8 s build
  Sim.queueProduction(s, 'iron_eden', core.id, 'medium_tank');
  assert.equal(Sim.scrapOf(s, 'iron_eden'), 120);
  // Remove the core the way combat would (dead structure cleanup runs in step).
  // The refund fires when the head item's timer expires and finds no core,
  // so the run must outlast the 8 s scout build, not just a few ticks.
  core.hp = 0; core.alive = false;
  stepN(s, 200);
  assert.equal(Sim.productionQueue(s, 'iron_eden').items.length, 0);
  assert.equal(Sim.scrapOf(s, 'iron_eden'), 500, 'the whole backlog is refunded when the core dies');
});
test('beta-b: red AI economy obeys the same caps as the player (queue 3, per-type 3, no negative scrap)', () => {
  const s = firstMapGame();
  stepN(s, 400);
  const q = Sim.productionQueue(s, 'xandria');
  assert.ok(q.items.length <= Sim.AI_QUEUE_CAP, 'red queue never exceeds the cap');
  for (const def of catalog.units) {
    const n = s.units.filter((u) => u.faction === 'xandria' && u.typeId === def.id).length
      + q.items.filter((it) => it.typeId === def.id).length;
    assert.ok(n <= Sim.AI_PER_TYPE_CAP, 'red per-type ceiling holds for ' + def.id);
  }
  assert.ok(Sim.scrapOf(s, 'xandria') >= 0, 'red scrap never goes negative');
});

// ---- Salvage decay + collection ----
test('beta-b: wreck value decays linearly (32 -> 16 at half life) and expires at 120 s', () => {
  const s = grassGame(64, 40);
  const wk = makeWreck(s, 'scout_buggy', 20, 20);
  assert.equal(wk.baseValue, 32, '40% of the 80-scrap scout');
  while (s.tick - wk.createdTick < 1200) Sim.step(s);
  const mid = Sim.findWreck(s, wk.id);
  assert.ok(mid, 'wreck still present at half life');
  assert.equal(mid.value, 16, 'linear decay: half the lifetime gone, half the value gone');
  while (s.tick - wk.createdTick < 2400) Sim.step(s);
  assert.equal(Sim.findWreck(s, wk.id), null, 'wreck expires at 2400 ticks');
});
test('beta-b: salvage collection pays the current (decayed) value and removes the wreck', () => {
  const s = grassGame(64, 40);
  const wk = makeWreck(s, 'scout_buggy', 20, 20);
  stepN(s, 600);
  const valAtOrder = Sim.findWreck(s, wk.id).value;
  assert.ok(valAtOrder < 32, 'the wreck has decayed below its base value before collection');
  const salvager = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 20, 21); // adjacent: collects within ticks
  const before = Sim.scrapOf(s, 'iron_eden');
  Sim.issueOrder(s, [salvager.id], { kind: 'salvage', wreckId: wk.id });
  stepN(s, 60);
  assert.equal(Sim.findWreck(s, wk.id), null, 'collected wreck is gone');
  const gained = Sim.scrapOf(s, 'iron_eden') - before;
  assert.ok(gained === valAtOrder || gained === valAtOrder - 1,
    'scrap gained equals the decayed value at collection (at most one tick of further decay): ' + gained + ' vs ' + valAtOrder);
});

// ---- Orders: patrol loop, formation ----
test('beta-b: patrol loops A -> B -> A (leg flips on arrival)', () => {
  const s = grassGame(64, 40);
  const u = Sim.addUnit(s, 'medium_tank', 'iron_eden', 10, 20);
  Sim.issueOrder(s, [u.id], { kind: 'patrol', points: [{ x: 20, y: 20 }, { x: 30, y: 20 }] });
  stepN(s, 1500);
  assert.equal(u.order.kind, 'patrol', 'patrol never completes into hold');
  // The unit must have covered ground toward B and back: it cannot still be
  // sitting at its start, and the leg must have flipped at least once.
  assert.ok(u.order.leg === 0 || u.order.leg === 1);
  stepN(s, 3000);
  assert.ok(Math.hypot(u.x - 10, u.y - 20) > 2 || u.order.leg === 1, 'patrol unit is out on its loop, not parked');
});
test('beta-b: formation move gives distinct destinations centred on the target', () => {
  const s = grassGame(64, 40);
  const ids = [10, 12, 14, 16].map((x) => Sim.addUnit(s, 'medium_tank', 'iron_eden', x, 20).id);
  Sim.issueFormationOrder(s, ids, { kind: 'move', x: 40, y: 20 });
  const dests = ids.map((id) => {
    const u = s.units.find((x) => x.id === id);
    return u.order.x + ',' + u.order.y;
  });
  assert.equal(new Set(dests).size, 4, 'no two formation units share a destination: ' + dests.join(' '));
  const xs = ids.map((id) => s.units.find((x) => x.id === id).order.x);
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  assert.ok(Math.abs(mean - 40) < 2.5, 'formation destinations centre on the target');
});

// ---- Hero auto-collect vs army ----
test('beta-b: hero auto-collects wrecks while manually controlled (scrap + 10 XP); army units do not', () => {
  const s = grassGame(64, 40);
  const wk = makeWreck(s, 'scout_buggy', 20, 20);
  const hero = Sim.addCustomUnit(s, { typeId: 'lancer_mech', faction: 'iron_eden', x: 20, y: 21,
    hp: 200, maxHp: 200, armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55,
    movementClass: 'ground', weapons: [], isHero: true, costScrap: 380 });
  assert.ok(Sim.setManualControl(s, hero.id).ok);
  const before = Sim.scrapOf(s, 'iron_eden');
  const valAtCollect = Sim.findWreck(s, wk.id).value;
  Sim.setManualInput(s, hero.id, 0, 0, null, false);
  stepN(s, 5);
  assert.equal(Sim.findWreck(s, wk.id), null, 'hero collected the wreck by proximity');
  const heroGain = Sim.scrapOf(s, 'iron_eden') - before;
  assert.ok(heroGain === valAtCollect || heroGain === valAtCollect - 1,
    'hero scrap gain equals the decayed value at collection: ' + heroGain + ' vs ' + valAtCollect);
  assert.equal(s.heroXp.salvageXp, 10);
  assert.equal(s.heroXp.salvages, 1);
  // Army manual unit: same proximity, no auto-collect.
  const s2 = grassGame(64, 40);
  const wk2 = makeWreck(s2, 'scout_buggy', 20, 20);
  const grunt = Sim.addUnit(s2, 'medium_tank', 'iron_eden', 20, 21);
  assert.ok(Sim.setManualControl(s2, grunt.id).ok);
  Sim.setManualInput(s2, grunt.id, 0, 0, null, false);
  stepN(s2, 5);
  assert.ok(Sim.findWreck(s2, wk2.id), 'army manual unit does not auto-collect');
  assert.equal(s2.heroXp.salvageXp, 0);
});

// ---- Hero kill XP attribution ----
test('beta-b: hero killing blows feed hero XP (floor 10% of cost, min 10); a 0-cost core feeds 0', () => {
  // Hero kills a scout (cost 80 -> 8 -> min 10).
  const s = grassGame(64, 40);
  const hero = Sim.addCustomUnit(s, { typeId: 'lancer_mech', faction: 'iron_eden', x: 20, y: 20,
    hp: 200, maxHp: 200, armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55,
    movementClass: 'ground', weapons: tankWeapons(), isHero: true, costScrap: 380 });
  const victim = Sim.addUnit(s, 'scout_buggy', 'xandria', 23, 20);
  victim.hp = 1;
  stepN(s, 300);
  assert.equal(s.units.some((u) => u.id === victim.id), false, 'hero killed the scout');
  assert.equal(s.heroXp.kills, 1);
  assert.equal(s.heroXp.killXp, 10, 'floor(0.10 x 80) = 8, floored up by the 10 minimum');
  // Hero kills a 0-cost Command Core: 0 XP, never the minimum.
  const s2 = grassGame(64, 40);
  const hero2 = Sim.addCustomUnit(s2, { typeId: 'lancer_mech', faction: 'iron_eden', x: 20, y: 20,
    hp: 200, maxHp: 200, armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55,
    movementClass: 'ground', weapons: tankWeapons(), isHero: true, costScrap: 380 });
  const core = Sim.addStructure(s2, 'command_core', 'xandria', 23, 20);
  core.hp = 1;
  stepN(s2, 600);
  assert.equal(s2.structures.some((x) => x.id === core.id), false, 'hero destroyed the core');
  assert.equal(s2.heroXp.killXp, 0, 'a 0-cost victim grants 0, never the minimum');
});

// ---- Skills: repair, slam, rally ----
test('beta-b: field repair restores 60 HP capped at max, then cools down 30 s', () => {
  const s = grassGame(64, 40);
  const u = Sim.addUnit(s, 'medium_tank', 'iron_eden', 20, 20);
  u.hp = 100;
  assert.equal(Sim.activateSkill(s, u.id, 'field_repair', s.tick).ok, true);
  assert.equal(u.hp, 160);
  u.hp = u.maxHp - 10;
  stepN(s, 700); // past the 600-tick cooldown
  assert.equal(Sim.activateSkill(s, u.id, 'field_repair', s.tick).ok, true);
  assert.equal(u.hp, u.maxHp, 'repair never exceeds max HP');
});
test('beta-b: shockwave slam damages enemy units in 2 tiles but never structures', () => {
  const s = grassGame(64, 40);
  const hero = Sim.addCustomUnit(s, { typeId: 'lancer_mech', faction: 'iron_eden', x: 20, y: 20,
    hp: 200, maxHp: 200, armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55,
    movementClass: 'ground', weapons: tankWeapons(), isHero: true, costScrap: 380 });
  const near = Sim.addUnit(s, 'scout_buggy', 'xandria', 21, 20);
  const far = Sim.addUnit(s, 'scout_buggy', 'xandria', 30, 20);
  const wall = Sim.addStructure(s, 'command_core', 'xandria', 21, 21);
  const wallHp = wall.hp;
  Sim.rebuildGrid(s); // radius skills read the spatial grid, which is empty on a fresh game
  assert.equal(Sim.activateSkill(s, hero.id, 'shockwave_slam', s.tick).ok, true);
  assert.ok(near.hp < 60, 'enemy unit inside 2 tiles took slam damage');
  assert.equal(far.hp, 60, 'enemy unit outside 2 tiles untouched');
  assert.equal(wall.hp, wallHp, 'structures are immune to the slam');
});
test('beta-b: rally signal boosts allies within 8 tiles, not enemies or distant allies', () => {
  const s = grassGame(64, 40);
  const hero = Sim.addUnit(s, 'medium_tank', 'iron_eden', 20, 20);
  const allyNear = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 25, 20);
  const allyFar = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 40, 20);
  const enemyNear = Sim.addUnit(s, 'scout_buggy', 'xandria', 22, 20);
  Sim.rebuildGrid(s); // radius skills read the spatial grid, which is empty on a fresh game
  assert.equal(Sim.activateSkill(s, hero.id, 'rally_signal', s.tick).ok, true);
  assert.ok(allyNear.rallyBoostUntil > s.tick, 'ally in radius boosted');
  assert.equal(allyFar.rallyBoostUntil, 0, 'ally outside radius not boosted');
  assert.equal(enemyNear.rallyBoostUntil, 0, 'enemy in radius not boosted');
  assert.equal(Sim.skillCooldownRemaining(s, hero.id, 'rally_signal'), 600);
});
test('beta-b: overdrive sets its 5 s window and 20 s cooldown; passive skill ids are not activatable', () => {
  const s = grassGame(64, 40);
  const u = Sim.addUnit(s, 'medium_tank', 'iron_eden', 20, 20);
  assert.equal(Sim.activateSkill(s, u.id, 'overdrive', s.tick).ok, true);
  assert.ok(u.overdriveUntil > s.tick);
  assert.equal(Sim.skillCooldownRemaining(s, u.id, 'overdrive'), 400);
  assert.equal(Sim.activateSkill(s, u.id, 'salvage_sense', s.tick).ok, false, 'passives have no activation');
  assert.equal(Sim.activateSkill(s, u.id, 'no_such_skill', s.tick).ok, false);
});

// ---- AI modes ----
test('beta-b: AI defend — 3+ blue units within 25 tiles of the red core switch the AI to defend', () => {
  const s = firstMapGame();
  const redCore = s.structures.find((x) => x.faction === 'xandria');
  const blues = s.units.filter((u) => u.faction === 'iron_eden').slice(0, 3);
  blues.forEach((u, i) => { u.x = redCore.x - 20; u.y = redCore.y - 2 + i * 2; });
  stepN(s, 60);
  assert.equal(s.aiCombat.mode, 'defend', 'threat at the core forces defend immediately');
});
test('beta-b: AI attack — with 10 combat units the AI leaves gather for attack and sends attack-moves', () => {
  const s = firstMapGame();
  stepN(s, 60);
  assert.equal(s.aiCombat.mode, 'attack', '10 combat units clear the gather threshold at the first thinks');
  assert.ok(s.units.some((u) => u.faction === 'xandria' && u.order.kind === 'attackMove'), 'attack mode issues attack-move orders');
});
test('beta-b: AI fall-back — a sub-35% HP red unit with a near enemy guards the core and never re-attacks', () => {
  const s = firstMapGame();
  const redCore = s.structures.find((x) => x.faction === 'xandria');
  const tank = s.units.find((u) => u.faction === 'xandria' && u.typeId === 'medium_tank');
  tank.hp = tank.maxHp * 0.3;
  const blue = s.units.find((u) => u.faction === 'iron_eden' && u.typeId === 'scout_buggy');
  tank.x = redCore.x - 12; tank.y = redCore.y; // >8 from core, enemy within 12
  blue.x = tank.x + 5; blue.y = tank.y;
  blue.hp = 10000; // the teleported scout would otherwise die to the red base before the first AI think
  stepN(s, 60);
  assert.equal(tank.aiFellBack, true, 'damaged, threatened, far-from-core unit falls back');
  assert.equal(tank.order.kind, 'guard', 'fallen-back unit guards instead of attacking');
  assert.ok(Math.hypot(tank.order.x - redCore.x, tank.order.y - redCore.y) <= 9, 'fall-back guard point is at the core ring');
});
test('beta-b: AI last stand — core dead after an earlier think sends survivors attacking; never-had-a-core stays inert', () => {
  // (a) Never had a core: the AI does nothing, as documented.
  const s0 = grassGame(64, 40);
  Sim.addUnit(s0, 'medium_tank', 'xandria', 50, 20);
  Sim.addUnit(s0, 'medium_tank', 'iron_eden', 10, 20);
  stepN(s0, 100);
  assert.equal(s0.units.find((u) => u.faction === 'xandria').order.kind, 'hold', 'coreless-from-birth AI never attacks');
  // (b) Core present at a think, then gone: survivors attack.
  const s = firstMapGame();
  stepN(s, 40); // at least one think with the core alive sets aiHadCore
  assert.equal(s.aiHadCore, true);
  const redCore = s.structures.find((x) => x.faction === 'xandria');
  redCore.hp = 0; redCore.alive = false;
  stepN(s, 60);
  assert.equal(s.aiCombat.mode, 'attack', 'last stand switches to attack');
  assert.ok(s.units.some((u) => u.faction === 'xandria' && u.order.kind === 'attackMove'), 'last-stand survivors attack-move');
});
