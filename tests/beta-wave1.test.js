/* Beta wave 1 (report-only wave): independent proof/clearance tests for
   the Surface Wars autonomous completion loop. These tests touch ONLY
   the sim/view/hero/progression modules — the browser shell (game.js)
   behaviours they cannot reach are covered by scripts/beta-playthrough.py
   (headless Chromium, real input events) and are named as such in
   game/BETA-REPORT.md. Run: node --test tests/*.test.js */
const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');
const Maps = require('../game/maps.js');
const View = require('../game/view.js');
const Hero = require('../game/hero.js');
const Prog = require('../game/progression.js');
const Weapons = require('../game/weapons.js');

function grassGame(w, h) {
  const terrain = new Uint8Array(w * h); // all grass (terrain 0)
  return Sim.createGame({ catalog, width: w, height: h, terrain, seed: 42 });
}
function stepN(s, n) { for (let i = 0; i < n; i++) Sim.step(s); }
function firstMapGame() {
  const map = Maps.createFirstMap();
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 20261030 });
  Maps.spawnFirstMapScenario(Sim, s);
  return s;
}
function redSnapshot(s) {
  return s.units.filter((u) => u.faction === 'xandria').map((u) => [
    u.id, u.typeId, +u.x.toFixed(3), +u.y.toFixed(3), u.order.kind,
    u.order.x === undefined ? null : +u.order.x.toFixed(2),
    u.order.y === undefined ? null : +u.order.y.toFixed(2),
    Math.round(u.hp),
  ]);
}
function redQueueSnapshot(s) {
  const q = Sim.productionQueue(s, 'xandria');
  return { items: q.items.map((it) => it.typeId), scrap: Sim.scrapOf(s, 'xandria') };
}

// ---- 1. Tutorial hold: red side queues nothing, orders nothing ----
test('beta: tutorial hold — 2000 ticks of tutorial produce no red production, salvage, or combat orders', () => {
  const s = firstMapGame();
  s.tutorial = true;
  const redBefore = redSnapshot(s);
  stepN(s, 2000);
  assert.equal(Sim.scrapOf(s, 'xandria'), 500, 'red scrap untouched in tutorial');
  assert.deepEqual(redQueueSnapshot(s).items, [], 'red production queue stays empty');
  assert.deepEqual(redSnapshot(s).map((r) => r[4]), redBefore.map((r) => r[4]),
    'no red unit order kind changed');
  assert.equal(s.units.filter((u) => u.faction === 'xandria').length, 10, 'no red unit died or spawned');
  assert.equal(s.winner, null, 'tutorial never declares a winner by itself');
});

// ---- 2. Red AI never reads manual state (deterministic twin run) ----
test('beta: red AI orders are identical whether a blue unit is manually controlled or not', () => {
  function run(manual) {
    const s = firstMapGame();
    if (manual) {
      const scout = s.units.find((u) => u.faction === 'iron_eden' && u.typeId === 'scout_buggy');
      assert.ok(Sim.setManualControl(s, scout.id).ok);
      for (let i = 0; i < 60; i++) { Sim.setManualInput(s, scout.id, 0, 0, null, false); Sim.step(s); }
      return { red: redSnapshot(s), q: redQueueSnapshot(s), mode: s.aiCombat && s.aiCombat.mode };
    }
    stepN(s, 60);
    return { red: redSnapshot(s), q: redQueueSnapshot(s), mode: s.aiCombat && s.aiCombat.mode };
  }
  const a = run(false), b = run(true);
  assert.deepEqual(b.red, a.red, 'red orders/positions identical with a manual blue unit');
  assert.deepEqual(b.q, a.q, 'red economy identical with a manual blue unit');
  assert.equal(b.mode, a.mode);
});

// ---- 3. Red AI never reads hero state (flag-only twin run) ----
test('beta: red AI orders are identical whether a blue unit carries the hero flag or not', () => {
  function run(heroFlag) {
    const s = firstMapGame();
    const lancer = s.units.find((u) => u.faction === 'iron_eden' && u.typeId === 'lancer_mech');
    if (heroFlag) lancer.isHero = true;
    stepN(s, 60);
    return { red: redSnapshot(s), q: redQueueSnapshot(s), mode: s.aiCombat && s.aiCombat.mode };
  }
  const a = run(false), b = run(true);
  assert.deepEqual(b.red, a.red, 'red orders/positions identical with a hero-flagged blue unit');
  assert.deepEqual(b.q, a.q);
  assert.equal(b.mode, a.mode);
  // And the source-level guarantee: the AI functions never reference the flags.
  const fs = require('node:fs');
  const src = fs.readFileSync(require('node:path').join(__dirname, '..', 'game', 'sim.js'), 'utf8');
  const aiStart = src.indexOf('function runAiEconomy');
  const aiEnd = src.indexOf('function checkDeadlock');
  const aiSrc = src.slice(aiStart, aiEnd);
  assert.ok(!/\.manual\b/.test(aiSrc), 'AI source references no .manual field');
  assert.ok(!/isHero/.test(aiSrc), 'AI source references no isHero field');
});

// ---- 4. Hero roster: 9v10 opening, reserve is an absence ----
test('beta: hero applyRoster removes exactly the west lancer, leaving 9 blue field units', () => {
  const s = firstMapGame();
  assert.equal(s.units.filter((u) => u.faction === 'iron_eden').length, 10);
  const r = Hero.applyRoster(s);
  assert.equal(r.replaced, true);
  assert.equal(s.units.filter((u) => u.faction === 'iron_eden').length, 9);
  assert.equal(s.units.filter((u) => u.faction === 'iron_eden' && u.typeId === 'lancer_mech').length, 0);
  assert.equal(s.units.filter((u) => u.faction === 'xandria').length, 10);
});

// ---- 5. Hero lifecycle: withdraw keeps HP, no wreck, no scrap ----
test('beta: hero withdraw preserves exact HP, creates no wreck, moves no scrap', () => {
  const s = grassGame(64, 40);
  const hero = Hero.startMatch(Weapons.cloneLoadout(Weapons.DEFAULT_LOADOUT));
  const scrapBefore = Sim.scrapOf(s, 'iron_eden');
  const wrecksBefore = s.wrecks.length;
  // Simulate a field hero at 40 HP withdrawing (shell: Sim.withdrawUnit + Hero.withdraw).
  const hu = Sim.addCustomUnit(s, { typeId: 'lancer_mech', faction: 'iron_eden', x: 10, y: 20,
    hp: 40, maxHp: 200, armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55,
    movementClass: 'ground', weapons: [], isHero: true, costScrap: 380 });
  Hero.landDrop(hero, hu.id);
  stepN(s, 500); // withdraw at tick 500, not tick 0 (see BETA-REPORT BUG-LOW-1: tick-0 sentinel collision)
  Sim.withdrawUnit(s, hu.id);
  Hero.withdraw(hero, 40, s.tick);
  assert.equal(hero.status, 'reserve');
  assert.equal(hero.hp, 40, 'withdrawal is not a heal');
  assert.equal(s.units.some((u) => u.id === hu.id), false, 'reserve means absent from field lists');
  assert.equal(s.wrecks.length, wrecksBefore, 'no wreck on voluntary withdrawal');
  assert.equal(Sim.scrapOf(s, 'iron_eden'), scrapBefore, 'no scrap either way on withdrawal');
  // Voluntary redeploy: free after 10 s (200 ticks), blocked before.
  const cd = Hero.canDrop(hero, { coreAlive: true, scrap: 500, tick: 600, dropTile: { x: 8, y: 20 } });
  assert.equal(cd.ok, false);
  assert.equal(cd.kind, 'cooldown');
  const ok = Hero.canDrop(hero, { coreAlive: true, scrap: 500, tick: 700, dropTile: { x: 8, y: 20 } });
  assert.equal(ok.ok, true);
  assert.equal(ok.cost, 0, 'voluntary redeploy is free');
});

// ---- 6. Hero death: 30 s + 200 scrap, waiting-if-broke, core-dead block ----
test('beta: hero death redeploy — 600-tick cooldown, 200 scrap, timer does not reset when broke, core dead blocks', () => {
  const hero = Hero.startMatch(Weapons.cloneLoadout(Weapons.DEFAULT_LOADOUT));
  Hero.die(hero, 1000);
  assert.equal(hero.status, 'dead');
  const early = Hero.canDrop(hero, { coreAlive: true, scrap: 9999, tick: 1500, dropTile: { x: 8, y: 20 } });
  assert.equal(early.kind, 'cooldown', '500 ticks after death is still cooling down');
  const broke = Hero.canDrop(hero, { coreAlive: true, scrap: 199, tick: 1600, dropTile: { x: 8, y: 20 } });
  assert.equal(broke.kind, 'scrap', 'after 600 ticks with <200 scrap the binding constraint is scrap, not a reset timer');
  assert.equal(broke.cost, 200);
  const rich = Hero.canDrop(hero, { coreAlive: true, scrap: 200, tick: 1600, dropTile: { x: 8, y: 20 } });
  assert.equal(rich.ok, true);
  assert.equal(rich.cost, 200);
  const noCore = Hero.canDrop(hero, { coreAlive: false, scrap: 9999, tick: 9999, dropTile: { x: 8, y: 20 } });
  assert.equal(noCore.kind, 'core');
  const noTile = Hero.canDrop(hero, { coreAlive: true, scrap: 9999, tick: 9999, dropTile: null });
  assert.equal(noTile.kind, 'notile');
  // Telegraph cancel never resurrects a dead hero into reserve.
  Hero.startDrop(hero, { x: 8, y: 20 }, 1600, 200);
  Hero.cancelDrop(hero);
  assert.equal(hero.status, 'dead', 'cancel returns to the pre-drop status (dead), never reserve');
});

// ---- 7. Hero death wreck value: 40% of 380 = 152 ----
test('beta: hero wreck is worth 152 scrap (40% of 380), like any unit wreck', () => {
  const s = grassGame(64, 40);
  const hu = Sim.addCustomUnit(s, { typeId: 'lancer_mech', faction: 'iron_eden', x: 10, y: 20,
    hp: 1, maxHp: 200, armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55,
    movementClass: 'ground', weapons: [], isHero: true, costScrap: 380 });
  const red = Sim.addUnit(s, 'medium_tank', 'xandria', 12, 20);
  Sim.issueOrder(s, [red.id], { kind: 'attack', targetId: hu.id });
  stepN(s, 400);
  assert.equal(s.units.some((u) => u.id === hu.id), false, 'hero died in the fight');
  const wk = s.wrecks.find((w) => w.typeId === 'lancer_mech');
  assert.ok(wk, 'a lancer wreck exists');
  assert.equal(wk.baseValue, 152);
});

// ---- 8. Guard: moves to point, holds, returns after displacement; guard-target follows ----
test('beta: guard order — unit travels to the point, holds there, and returns when displaced', () => {
  const s = grassGame(64, 40);
  const u = Sim.addUnit(s, 'medium_tank', 'iron_eden', 10, 20);
  Sim.issueOrder(s, [u.id], { kind: 'guard', x: 20, y: 20 });
  stepN(s, 600);
  assert.ok(Math.hypot(u.x - 20, u.y - 20) <= 1.5, 'guard arrived at the point, got (' + u.x.toFixed(1) + ',' + u.y.toFixed(1) + ')');
  assert.equal(u.order.kind, 'guard');
  // Displace the guard (simulating a fight push) and watch it walk back.
  u.x = 30; u.y = 30;
  stepN(s, 600);
  assert.ok(Math.hypot(u.x - 20, u.y - 20) <= 1.5, 'guard returned to its point after displacement');
});
test('beta: guard-target — guard point follows a friendly unit while it lives', () => {
  const s = grassGame(64, 40);
  const guard = Sim.addUnit(s, 'medium_tank', 'iron_eden', 10, 20);
  const friend = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 30, 20);
  Sim.issueOrder(s, [guard.id], { kind: 'guard', guardTargetId: friend.id, x: friend.x, y: friend.y });
  assert.ok(Math.hypot(guard.order.x - 30, guard.order.y - 20) < 0.01, 'guard point initialised on the friendly unit');
  Sim.issueOrder(s, [friend.id], { kind: 'move', x: 40, y: 20 });
  stepN(s, 300);
  assert.ok(Math.abs(guard.order.x - friend.x) < 2.0, 'guard point tracked the moving friendly unit');
});

// ---- 9. Rally: produced units move to the rally point on spawn ----
test('beta: rally — a produced unit moves to the core rally point instead of idling', () => {
  const s = grassGame(64, 40);
  const core = Sim.addStructure(s, 'command_core', 'iron_eden', 6, 20);
  const rr = Sim.setRally(s, 'iron_eden', core.id, 20, 20);
  assert.equal(rr.ok, true);
  assert.ok(Sim.queueProduction(s, 'iron_eden', core.id, 'scout_buggy').ok);
  stepN(s, 1200); // build time + travel; scout buildTime is short
  const spawned = s.units.find((u) => u.faction === 'iron_eden' && u.typeId === 'scout_buggy');
  assert.ok(spawned, 'produced unit spawned');
  assert.ok(Math.hypot(spawned.x - 20, spawned.y - 20) < 6, 'spawned unit headed for the rally point, at (' + spawned.x.toFixed(1) + ',' + spawned.y.toFixed(1) + ')');
  // Rally into water is a documented hold, not a crash: core on a water-adjacent map.
  const bad = Sim.setRally(s, 'iron_eden', core.id, 999, 999);
  assert.equal(bad.rally.x, 63.5, 'rally clamps to the map');
});

// ---- 10. Queue toggle: append vs replace ----
test('beta: queue mode — append chains orders, unappended orders replace and clear the queue', () => {
  assert.equal(View.queueAppend(false, false), false);
  assert.equal(View.queueAppend(true, false), true, 'Shift appends');
  assert.equal(View.queueAppend(false, true), true, 'Queue button appends');
  const s = grassGame(64, 40);
  const u = Sim.addUnit(s, 'medium_tank', 'iron_eden', 10, 20);
  Sim.issueOrder(s, [u.id], { kind: 'move', x: 20, y: 20 });
  Sim.issueOrder(s, [u.id], { kind: 'move', x: 30, y: 20 }, { append: true });
  assert.equal(u.orderQueue.length, 1, 'appended order waits in the queue');
  Sim.issueOrder(s, [u.id], { kind: 'move', x: 40, y: 20 });
  assert.equal(u.orderQueue.length, 0, 'unappended order clears the queue');
  assert.equal(u.order.x, 40);
});

// ---- 11. Group buttons: assign switches off, recall is a copy, dead ids pruned by caller ----
test('beta: group buttons — assign stores a copy and switches off; recall returns a copy', () => {
  const groups = View.createGroups();
  const r1 = View.groupButtonAction(groups, '3', [11, 12], true);
  assert.equal(r1.assigned, '3');
  assert.equal(r1.assignMode, false, 'Assign switches itself off after one tap');
  assert.deepEqual(r1.selected, [11, 12]);
  const r2 = View.groupButtonAction(groups, '3', [], false);
  assert.deepEqual(r2.selected, [11, 12]);
  r2.selected.push(99);
  assert.deepEqual(View.groupButtonAction(groups, '3', [], false).selected, [11, 12], 'recall returns a copy, not the stored array');
  assert.deepEqual(View.groupButtonAction(groups, '9', [], false).selected, [], 'unassigned group recalls empty');
});

// ---- 12. Twin-stick cone: 30° boundary, live fire ----
test('beta: twin-stick cone — aim inside 30° fires, aim outside 30° fires nothing', () => {
  function run(aimDeg) {
    const s = grassGame(64, 40);
    const u = Sim.addUnit(s, 'medium_tank', 'iron_eden', 20, 20);
    const t = Sim.addUnit(s, 'salvage_team', 'xandria', 24, 20); // unarmed: its fire cannot pollute the count
    assert.ok(Sim.setManualControl(s, u.id).ok);
    const aim = aimDeg * Math.PI / 180;
    for (let i = 0; i < 5; i++) { Sim.setManualInput(s, u.id, 0, 0, aim, true); Sim.step(s); }
    return { projectiles: s.projectileActive, targetHp: t.hp };
  }
  const inside = run(29);
  assert.ok(inside.projectiles > 0 || inside.targetHp < 60, '29° aim fired (projectiles=' + inside.projectiles + ')');
  const outside = run(31);
  assert.equal(outside.projectiles, 0, '31° aim fired nothing');
  assert.equal(Sim.MANUAL_AIM_CONE_DEG, 30);
});

// ---- 13. Progression two-match arc + reload persistence + respec + corruption ----
test('beta: progression two-match arc — win XP levels up, point spends, reload round-trips, respec refunds', () => {
  const rec0 = Prog.defaultRecord();
  assert.equal(Prog.RECORD_KEY, 'surfacewars.hero.v1');
  // Match 1: win (+100) + a 300-scrap hero kill (+30) = 130 XP -> level 2, 1 point.
  const m1 = Prog.applyMatchResult(rec0, 'win', { killXp: 30, salvageXp: 0 });
  assert.equal(m1.xpGained, 130);
  assert.equal(m1.levelAfter, 2);
  assert.equal(m1.record.skillPoints, 1);
  assert.equal(m1.record.matchesPlayed, 1);
  assert.equal(m1.record.wins, 1);
  assert.equal(rec0.xp, 0, 'applyMatchResult never mutates its input');
  // Spend the point on Dash (gate level 2) and equip it.
  const bought = Prog.buySkill(m1.record, 'dash');
  assert.equal(bought.ok, true);
  assert.equal(bought.record.skillPoints, 0);
  bought.record.loadout.ability = 'dash';
  // Simulate a page reload: JSON round-trip + validation must accept the record.
  const reloaded = JSON.parse(JSON.stringify(bought.record));
  const v = Prog.validateRecord(reloaded, Weapons);
  assert.equal(v.ok, true, 'reloaded record validates: ' + v.reasons.join(' '));
  // Match 2: loss (+25) -> 155 XP, still level 2, no new point, wins unchanged.
  const m2 = Prog.applyMatchResult(reloaded, 'loss', { killXp: 0, salvageXp: 0 });
  assert.equal(m2.xpGained, 25);
  assert.equal(m2.levelAfter, 2);
  assert.equal(m2.record.wins, 1);
  assert.equal(m2.record.matchesPlayed, 2);
  // Free respec between matches: points back, skills and ability cleared, XP untouched.
  const rs = Prog.respec(m2.record);
  assert.equal(rs.skillPoints, 1);
  assert.deepEqual(rs.skills, []);
  assert.equal(rs.loadout.ability, null);
  assert.equal(rs.xp, 155);
  assert.equal(Prog.validateRecord(rs, Weapons).ok, true);
});
test('beta: progression draw — +0 win bonus, kill/salvage XP still count, wins unchanged', () => {
  const rec = Prog.defaultRecord();
  const d = Prog.applyMatchResult(rec, 'draw', { killXp: 20, salvageXp: 10 });
  assert.equal(d.bonus, 0, 'draw bonus is 0, not the win bonus');
  assert.equal(d.xpGained, 30);
  assert.equal(d.record.wins, 0);
  assert.equal(d.record.matchesPlayed, 1);
});
test('beta: progression corruption — garbage, wrong schema, level/XP mismatch, unknown skill all fail validation', () => {
  const bad = [
    null, 'not-an-object', { schema: 2, level: 1, xp: 0, skillPoints: 0, skills: [], loadout: Prog.defaultLoadout(), heroEnabled: true, matchesPlayed: 0, wins: 0 },
    { schema: 1, level: 5, xp: 0, skillPoints: 4, skills: [], loadout: Prog.defaultLoadout(), heroEnabled: true, matchesPlayed: 0, wins: 0 },
    { schema: 1, level: 1, xp: -10, skillPoints: 0, skills: [], loadout: Prog.defaultLoadout(), heroEnabled: true, matchesPlayed: 0, wins: 0 },
    { schema: 1, level: 2, xp: 100, skillPoints: 1, skills: ['no_such_skill'], loadout: Prog.defaultLoadout(), heroEnabled: true, matchesPlayed: 0, wins: 0 },
    { schema: 1, level: 1, xp: 0, skillPoints: 0, skills: [], loadout: Prog.defaultLoadout(), heroEnabled: 'yes', matchesPlayed: 0, wins: 0 },
  ];
  for (const r of bad) assert.equal(Prog.validateRecord(r, Weapons).ok, false, 'corrupt record must fail: ' + JSON.stringify(r));
  const good = Prog.defaultRecord();
  assert.equal(Prog.validateRecord(good, Weapons).ok, true);
  // Skill gates: Dash needs level 2, Salvage Sense needs level 3.
  assert.equal(Prog.buySkill(good, 'dash').ok, false, 'level-1 hero cannot buy a level-2 skill');
  const lv2 = Prog.applyMatchResult(good, 'win', { killXp: 0, salvageXp: 0 }).record;
  assert.equal(Prog.buySkill(lv2, 'salvage_sense').ok, false, 'level-2 hero cannot buy a level-3 skill');
  assert.equal(Prog.buySkill(lv2, 'dash').ok, true);
});

// ---- 14. Skills: cooldown enforced, single ability slot ----
test('beta: skills — Dash activation sets a cooldown and a second immediate use is refused', () => {
  const s = grassGame(64, 40);
  const u = Sim.addUnit(s, 'medium_tank', 'iron_eden', 20, 20);
  const r1 = Sim.activateSkill(s, u.id, 'dash', s.tick);
  assert.equal(r1.ok, true, 'first Dash works: ' + (r1.reason || ''));
  assert.ok(Sim.skillCooldownRemaining(s, u.id, 'dash') > 0, 'cooldown is set after use');
  const r2 = Sim.activateSkill(s, u.id, 'dash', s.tick);
  assert.equal(r2.ok, false, 'second Dash during cooldown is refused');
  stepN(s, 200); // 10 s > 8 s Dash cooldown
  assert.equal(Sim.skillCooldownRemaining(s, u.id, 'dash'), 0);
  assert.equal(Sim.activateSkill(s, u.id, 'dash', s.tick).ok, true, 'Dash is usable again after cooldown');
  // WAVE 3 (UPGRADES-12H) old-test change, justified: 2 skills
  // added (Rapid Servos passive, Concussive Pulse active), so the
  // set moves 8 -> 10 and actives 5 -> 6. The 8 original skills
  // are untouched and still share the single ability slot.
  assert.equal(Prog.SKILLS.length, 10, '8 original skills + 2 Wave 3 skills');
  assert.equal(Prog.SKILLS.filter((k) => k.type === 'active').length, 6, '6 active skills share the single ability slot');
});

// ---- 15. Deadlock detector: air-only + no cores draws; a living core never draws ----
test('beta: deadlock — air-only survivors with no cores deadlock; a living core resets the condition', () => {
  function airOnly(withCore) {
    const s = grassGame(64, 40);
    // Air units whose guns only hit ground/structure: use an air unit if the catalog has one,
    // otherwise fall back to the documented shape — two factions, no cores, no hittable pair.
    const airId = catalog.units.find((u) => u.movementClass === 'air');
    if (!airId) return null;
    Sim.addUnit(s, airId.id, 'iron_eden', 10, 20);
    Sim.addUnit(s, airId.id, 'xandria', 50, 20);
    if (withCore) Sim.addStructure(s, 'command_core', 'iron_eden', 6, 20);
    return s;
  }
  const noCore = airOnly(false);
  if (noCore) {
    assert.equal(Sim.checkDeadlock(noCore), true, 'air-only, coreless sides cannot damage each other and cannot produce');
    stepN(noCore, 700);
    assert.equal(noCore.winner, 'draw', '600-tick grace declares the draw');
  } else {
    // No air unit in this catalog: prove the detector shape directly with weaponless units.
    const s = grassGame(64, 40);
    Sim.addUnit(s, 'salvage_team', 'iron_eden', 10, 20);
    Sim.addUnit(s, 'salvage_team', 'xandria', 50, 20);
    assert.equal(Sim.checkDeadlock(s), true, 'weaponless, coreless sides deadlock');
    stepN(s, 700);
    assert.equal(s.winner, 'draw');
  }
  const withCore = airOnly(true) || (() => { const s = grassGame(64, 40); Sim.addUnit(s, 'salvage_team', 'iron_eden', 10, 20); Sim.addUnit(s, 'salvage_team', 'xandria', 50, 20); Sim.addStructure(s, 'command_core', 'iron_eden', 6, 20); return s; })();
  assert.equal(Sim.checkDeadlock(withCore), false, 'a living core anywhere prevents the draw');
  // Tutorial games never draw: the detector is bypassed in step().
  const tut = grassGame(64, 40);
  tut.tutorial = true;
  Sim.addUnit(tut, 'salvage_team', 'iron_eden', 10, 20);
  Sim.addUnit(tut, 'salvage_team', 'xandria', 50, 20);
  stepN(tut, 700);
  assert.equal(tut.winner, null, 'tutorial games are excluded from the draw rule');
});

// ---- 16. Hero toggle-off / Test Map shape (module-level; shell wiring proven in browser) ----
test('beta: hero-off record validates and carries no hero state into a match (shell skips hero when heroEnabled is false)', () => {
  const rec = Prog.defaultRecord();
  rec.heroEnabled = false;
  assert.equal(Prog.validateRecord(rec, Weapons).ok, true);
  // The shell's newGame gate is: heroEnabled && map !== 'test' && !tutorial.
  // Module proof of the two other gate inputs: the Test Map scenario is 10v10 with a lancer present.
  const map = Sim.createTestMap();
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 42 });
  Sim.spawnScenario(s);
  assert.equal(s.units.filter((u) => u.faction === 'iron_eden').length, 10, 'Test Map opens 10v10');
  assert.equal(s.units.filter((u) => u.faction === 'iron_eden' && u.typeId === 'lancer_mech').length, 1, 'lancer present — nothing removed on Test Map');
});
