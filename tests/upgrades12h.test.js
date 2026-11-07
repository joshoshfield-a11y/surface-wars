/* WAVE 3 (UPGRADES-12H) tests: two new skills, four trade-off
   gear rows, the post-level-10 mastery track, old-record
   migration, and the frozen anchors (level-1 default == lancer,
   level-10 effective +45% HP / +18% damage). Nothing from Phase C
   is removed: the 8 original skills and 12 original gear rows are
   asserted present and unchanged, and the two old count pins that
   had to move live in their own files with Wave 3 justifications
   (herophaseb.test.js gear count 12 -> 16, beta-wave1.test.js
   skill count 8 -> 10).
   Run with the explicit file list:
   node --test tests/*.test.js */
const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');
const Weapons = require('../game/weapons.js');
const Prog = require('../game/progression.js');

const BASE = { hp: 200, armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55, movementClass: 'ground' };
const DEF = () => Prog.defaultLoadout();
function recordAt(level, xp, skills, points, loadout, extra) {
  return Object.assign({ schema: 1, level, xp, skillPoints: points, skills: skills.slice(),
    loadout: loadout || DEF(), heroEnabled: true, matchesPlayed: 0, wins: 0, masteryClaimed: 0 }, extra || {});
}
function testGame() {
  const map = Sim.createTestMap();
  return Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 42 });
}
function heroWeapon(damage, range) {
  return { id: 'test-weapon', name: 'Test Gun', family: 'Autocannon', damage: damage || 100,
    range: range || 6, minRange: 0, interval: 0.5, projectileSpeed: 0, splashRadius: 0,
    falloff: 0, accuracy: 1, damageType: 'Kinetic', targetClasses: ['ground', 'structure'], special: 'none' };
}
function addHero(s, x, y) {
  return Sim.addCustomUnit(s, { typeId: 'lancer_mech', faction: 'iron_eden', x: x || 10, y: y || 20,
    hp: 200, maxHp: 200, armor: 'Medium', speed: 6.0, vision: 10, radius: 0.55,
    movementClass: 'ground', weapons: [heroWeapon()], isHero: true, costScrap: 380 });
}

// ---- Nothing removed ----
test('upgrades12h: nothing removed — 8 original skills, 12 original gear rows, same gates/effects', () => {
  const origSkills = [['dash', 'active', 2], ['salvage_sense', 'passive', 3], ['overdrive', 'active', 4],
    ['field_repair', 'active', 5], ['targeting_computer', 'passive', 5], ['shockwave_slam', 'active', 6],
    ['reinforced_frame', 'passive', 7], ['rally_signal', 'active', 8]];
  for (const [id, type, gate] of origSkills) {
    const s = Prog.skillById(id);
    assert.ok(s, id + ' still exists'); assert.equal(s.type, type); assert.equal(s.gate, gate);
  }
  const origGear = [['gear_armor_1', 'armor', 1, 1.10], ['gear_armor_2', 'armor', 2, 1.20],
    ['gear_armor_3', 'armor', 3, 1.30], ['gear_mobility_1', 'mobility', 1, 0.5],
    ['gear_mobility_2', 'mobility', 2, 1.0], ['gear_mobility_3', 'mobility', 3, 1.5],
    ['gear_reactor_1', 'reactor', 1, 1.05], ['gear_reactor_2', 'reactor', 2, 1.10],
    ['gear_reactor_3', 'reactor', 3, 1.15], ['gear_sensor_1', 'sensor', 1, 1],
    ['gear_sensor_2', 'sensor', 2, 2], ['gear_sensor_3', 'sensor', 3, 3]];
  for (const [id, slot, tier, v] of origGear) {
    const g = Weapons.gearById(id);
    assert.ok(g, id + ' still exists'); assert.equal(g.slot, slot); assert.equal(g.tier, tier);
    const eff = g.effect.maxHpMult || g.effect.speedAdd || g.effect.energyFireRateMult || g.effect.visionAdd;
    assert.equal(eff, v, id + ' effect unchanged');
  }
  assert.equal(Prog.SKILLS.length, 10, '8 original + 2 Wave 3');
  assert.equal(Weapons.GEAR_ROWS.length, 16, '12 original + 4 Wave 3');
});

// ---- New skills: gates, spending, respec ----
test('upgrades12h: new skills — gates, point spending, respec with the new skills present', () => {
  assert.equal(Prog.skillById('rapid_servos').type, 'passive');
  assert.equal(Prog.skillById('rapid_servos').gate, 3);
  assert.equal(Prog.skillById('concussive_pulse').type, 'active');
  assert.equal(Prog.skillById('concussive_pulse').gate, 9);
  // Gate rejections below the gate, even with a point in hand.
  const l2 = recordAt(2, 100, [], 1);
  assert.equal(Prog.buySkill(l2, 'rapid_servos').ok, false, 'Rapid Servos gated at 3');
  const l8 = recordAt(8, 2800, ['dash', 'salvage_sense', 'overdrive', 'field_repair', 'targeting_computer', 'shockwave_slam', 'reinforced_frame'], 0);
  assert.equal(Prog.buySkill(l8, 'concussive_pulse').ok, false, 'Concussive Pulse gated at 9 (and no points)');
  const l8p = recordAt(8, 2800, ['dash'], 6);
  assert.equal(Prog.buySkill(l8p, 'concussive_pulse').ok, false, 'gate beats points at level 8');
  // Early choice: level 3 holds 2 points for Dash, Salvage Sense, Rapid Servos.
  let r = Prog.buySkill(recordAt(3, 300, [], 2), 'rapid_servos');
  assert.equal(r.ok, true); assert.equal(r.record.skillPoints, 1);
  r = Prog.buySkill(r.record, 'salvage_sense');
  assert.equal(r.ok, true); assert.equal(r.record.skillPoints, 0);
  assert.equal(Prog.buySkill(r.record, 'dash').ok, false, 'third early skill has no point left');
  // Level 9 buys the new active; the ability slot accepts it once unlocked.
  const l9 = recordAt(9, 3600, ['dash', 'salvage_sense', 'overdrive', 'field_repair', 'targeting_computer', 'shockwave_slam', 'reinforced_frame'], 1);
  r = Prog.buySkill(l9, 'concussive_pulse');
  assert.equal(r.ok, true); assert.deepEqual(r.record.skills.slice(-1), ['concussive_pulse']);
  const equipped = recordAt(9, 3600, r.record.skills, 0, Object.assign(DEF(), { ability: 'concussive_pulse' }));
  assert.equal(Prog.validateRecord(equipped, Weapons).ok, true, 'equipped Concussive Pulse validates');
  const notOwned = recordAt(9, 3600, r.record.skills.filter((s) => s !== 'concussive_pulse'), 1,
    Object.assign(DEF(), { ability: 'concussive_pulse' }));
  assert.equal(Prog.validateRecord(notOwned, Weapons).ok, false, 'equipped-but-locked ability is corruption');
  // Respec with the new skills present returns every point and clears the ability.
  const built = recordAt(9, 3600, ['dash', 'rapid_servos', 'concussive_pulse'], 5,
    Object.assign(DEF(), { ability: 'concussive_pulse' }));
  const rs = Prog.respec(built);
  assert.equal(rs.skillPoints, 8); assert.deepEqual(rs.skills, []); assert.equal(rs.loadout.ability, null);
  assert.equal(rs.xp, 3600); assert.equal(rs.level, 9);
  // Level-10 point economy: 9 points, 10 skills — one must stay unpicked.
  const ten = ['dash', 'salvage_sense', 'overdrive', 'field_repair', 'targeting_computer',
    'shockwave_slam', 'reinforced_frame', 'rally_signal', 'rapid_servos'];
  let l10 = recordAt(10, 4500, [], 9);
  for (const s of ten) { const b = Prog.buySkill(l10, s); assert.equal(b.ok, true, 'buy ' + s); l10 = b.record; }
  assert.equal(l10.skillPoints, 0);
  assert.equal(Prog.buySkill(l10, 'concussive_pulse').ok, false, '10th skill has no point at level 10 — the spare is now a choice');
  assert.equal(Prog.validateRecord(recordAt(10, 4500, ten, 0), Weapons).ok, true, '9-of-10 at level 10 validates');
});

// ---- New skill sim effect: Concussive Pulse ----
test('upgrades12h: concussive pulse — slows enemies in 3 tiles, no damage, no structures, cooldown enforced', () => {
  const s = testGame();
  const hero = addHero(s, 10, 20);
  const near = Sim.addUnit(s, 'scout_buggy', 'xandria', 11, 20);
  const edge = Sim.addUnit(s, 'scout_buggy', 'xandria', 13, 20); // exactly 3 tiles: in radius
  const far = Sim.addUnit(s, 'scout_buggy', 'xandria', 14, 20); // 4 tiles: out
  const ally = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 11, 21);
  const struct = Sim.addStructure(s, 'bunker', 'xandria', 11, 19);
  const structHp = struct.hp, nearHp = near.hp;
  Sim.rebuildGrid(s);
  assert.equal(Sim.activateSkill(s, hero.id, 'concussive_pulse').ok, true);
  assert.ok(near.slowUntil > s.tick, 'near enemy slowed');
  assert.ok(edge.slowUntil > s.tick, 'edge enemy at exactly 3 tiles slowed');
  assert.equal(far.slowUntil, 0, 'enemy outside 3 tiles untouched');
  assert.equal(ally.slowUntil, 0, 'allies untouched');
  assert.equal(near.hp, nearHp, 'pulse deals no damage');
  assert.equal(struct.hp, structHp, 'structures untouched');
  assert.equal(Sim.activateSkill(s, hero.id, 'concussive_pulse').ok, false, 'pulse on cooldown');
  assert.equal(Sim.activateSkill(s, hero.id, 'rapid_servos').ok, false, 'passives cannot be activated');
  // Slowed movement: a pulsed enemy covers less ground than an unpulsed one.
  const s2 = testGame();
  const h2 = addHero(s2, 10, 20);
  const slow = Sim.addUnit(s2, 'scout_buggy', 'xandria', 12, 20);
  const free = Sim.addUnit(s2, 'scout_buggy', 'xandria', 12, 30);
  // Weaponless, so the comparison measures movement only: the hero
  // cannot shoot the pulsed unit and neither subject stops to fight.
  h2.weapons = []; slow.weapons = []; free.weapons = [];
  Sim.issueOrder(s2, [slow.id, free.id], { kind: 'move', x: 40, y: 20 });
  Sim.rebuildGrid(s2);
  Sim.activateSkill(s2, h2.id, 'concussive_pulse');
  Sim.issueOrder(s2, [free.id], { kind: 'move', x: 40, y: 30 });
  const x0 = slow.x, fx0 = free.x;
  for (let i = 0; i < 20; i++) Sim.step(s2);
  // Both move east-ish; the pulsed one must lag the free one.
  assert.ok((slow.x - x0) < (free.x - fx0), 'pulsed enemy lags (' + (slow.x - x0) + ' vs ' + (free.x - fx0) + ')');
});

// ---- New gear: validation, trade-off values, heroStats ----
test('upgrades12h: new gear — validation, tier-band gating, trade-off values, heroStats resolution', () => {
  const ids = ['gear_armor_1b', 'gear_armor_2b', 'gear_mobility_2b', 'gear_sensor_2b'];
  for (const id of ids) assert.ok(Weapons.gearById(id), id + ' exists');
  assert.equal(Weapons.gearById('gear_armor_1b').tier, 1);
  for (const id of ['gear_armor_2b', 'gear_mobility_2b', 'gear_sensor_2b']) assert.equal(Weapons.gearById(id).tier, 2);
  // Tier-band gating: T2 trade-off rows need hero level 4 (band 2).
  for (const id of ['gear_armor_2b', 'gear_mobility_2b', 'gear_sensor_2b']) {
    const slot = Weapons.gearById(id).slot;
    const lo = Object.assign(DEF(), { [slot]: id });
    const below = Weapons.validateLoadout(lo, { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: 1, levelBand: true });
    assert.equal(below.ok, false, id + ' locked below band 2');
    assert.ok(below.reasons.join(' ').includes('level 4'), id + ' reason names level 4');
    const at = Weapons.validateLoadout(lo, { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: 2, levelBand: true });
    assert.equal(at.ok, true, id + ' valid at band 2');
  }
  // Wrong-slot rows are rejected, not silently reinterpreted.
  const wrong = Weapons.validateLoadout(Object.assign(DEF(), { mobility: 'gear_armor_2b' }),
    { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: 2, levelBand: true });
  assert.equal(wrong.ok, false, 'armor row in the mobility slot rejected');
  // Trade-offs at the band level (level 4: HP multiplier 1.15, damage multiplier 1.06).
  const plated2 = Weapons.heroStats(Object.assign(DEF(), { armor: 'gear_armor_2' }), BASE, { level: 4, skills: [] });
  const ablative = Weapons.heroStats(Object.assign(DEF(), { armor: 'gear_armor_2b' }), BASE, { level: 4, skills: [] });
  assert.equal(plated2.maxHp, 276); assert.equal(ablative.maxHp, 290, 'Ablative Hull II: more HP (290 vs 276)');
  assert.equal(plated2.speed, 6.0); assert.equal(ablative.speed, 5.5, '...but less speed (5.5 vs 6.0)');
  const servo2 = Weapons.heroStats(Object.assign(DEF(), { mobility: 'gear_mobility_2' }), BASE, { level: 4, skills: [] });
  const over = Weapons.heroStats(Object.assign(DEF(), { mobility: 'gear_mobility_2b' }), BASE, { level: 4, skills: [] });
  assert.equal(servo2.speed, 7.0); assert.equal(over.speed, 7.5, 'Overdrive Servos II: faster (7.5 vs 7.0)');
  assert.equal(servo2.maxHp, 230); assert.equal(over.maxHp, 218, '...but frailer (218 vs 230)');
  const targ2 = Weapons.heroStats(Object.assign(DEF(), { sensor: 'gear_sensor_2' }), BASE, { level: 4, skills: [] });
  const eye = Weapons.heroStats(Object.assign(DEF(), { sensor: 'gear_sensor_2b' }), BASE, { level: 4, skills: [] });
  assert.equal(targ2.vision, 10); assert.equal(eye.vision, 9, 'Long-Eye Array II: less vision (9 vs 10)');
  assert.equal(targ2.weapons[0].range, 6); assert.equal(eye.weapons[0].range, 7, '...but more range (7 vs 6)');
  const plated1 = Weapons.heroStats(Object.assign(DEF(), { armor: 'gear_armor_1' }), BASE, { level: 1, skills: [] });
  const weave = Weapons.heroStats(Object.assign(DEF(), { armor: 'gear_armor_1b' }), BASE, { level: 1, skills: [] });
  assert.equal(plated1.maxHp, 220); assert.equal(weave.maxHp, 210, 'Reactive Weave I: less HP (210 vs 220)');
  assert.equal(plated1.speed, 6.0); assert.equal(weave.speed, 6.5, '...but more speed (6.5 vs 6.0)');
  // No pure upgrade: every new row loses at least one stat to its same-tier neighbour (asserted above),
  // and no new row beats the NEXT tier up on its own losing axis.
  assert.ok(ablative.speed < plated2.speed && over.maxHp < servo2.maxHp && eye.vision < targ2.vision && weave.maxHp < plated1.maxHp);
  // Rapid Servos resolves in heroStats and stacks with mobility gear.
  const rapid = Weapons.heroStats(DEF(), BASE, { level: 3, skills: ['rapid_servos'] });
  assert.equal(rapid.speed, 6.5, 'Rapid Servos +0.5 at level 3');
  const rapidGear = Weapons.heroStats(Object.assign(DEF(), { mobility: 'gear_mobility_1' }), BASE, { level: 3, skills: ['rapid_servos'] });
  assert.equal(rapidGear.speed, 7.0, 'Rapid Servos stacks with Servo Legs I (+0.5 + 0.5)');
  assert.equal(rapid.maxHp, 220, 'Rapid Servos touches no HP');
  assert.equal(rapid.weapons[0].damage, 12.5, 'Rapid Servos touches no damage (level-3 damage only)');
});

// ---- Frozen anchors ----
test('upgrades12h: anchors frozen — L1 default == lancer, L10 ceilings unchanged, mastery adds nothing', () => {
  const l1 = Weapons.heroStats(DEF(), BASE);
  const l1c = Weapons.heroStats(DEF(), BASE, { level: 1, skills: [] });
  assert.deepEqual(l1c, l1, 'level-1 Phase C hero unchanged by Wave 3');
  assert.equal(l1.maxHp, 200); assert.equal(l1.speed, 6.0); assert.equal(l1.weapons[0].damage, 12);
  const l10 = Weapons.heroStats(DEF(), BASE, { level: 10, skills: [] });
  assert.equal(l10.maxHp, 290, '200 x 1.45 = 290, under the +50% ceiling of 300');
  assert.equal(l10.weapons[0].damage, 14.2, '12 x 1.18 = 14.2, under the +20% ceiling of 14.4');
  // Mastery is not a heroStats input: a mastery record resolves exactly like its level-10 self.
  const l10m = Weapons.heroStats(DEF(), BASE, { level: 10, skills: ['rapid_servos', 'reinforced_frame'] });
  const l10mPlain = Weapons.heroStats(DEF(), BASE, { level: 10, skills: ['reinforced_frame'] });
  assert.equal(l10m.maxHp, 320, 'Reinforced Frame additive, unchanged by Wave 3');
  assert.equal(l10m.weapons[0].damage, 14.2, 'damage ceiling unchanged with new skills present');
  assert.equal(l10m.speed - l10mPlain.speed, 0.5, 'the only speed delta is Rapid Servos, not mastery');
});

// ---- Mastery track ----
test('upgrades12h: mastery curve, cap, point grants, respec with mastery', () => {
  assert.deepEqual(Prog.MASTERY_CURVE, [5500, 6800, 8300, 10000, 11900]);
  assert.equal(Prog.MAX_MASTERY, 5);
  const cases = [[0, 0], [4500, 0], [5499, 0], [5500, 1], [6799, 1], [6800, 2],
    [8299, 2], [8300, 3], [9999, 3], [10000, 4], [11899, 4], [11900, 5], [999999, 5]];
  for (const [xp, rank] of cases) assert.equal(Prog.masteryRankForXp(xp), rank, 'xp ' + xp);
  // One rank granted crossing 5500 on a win.
  const l10 = recordAt(10, 5400, ['dash', 'salvage_sense', 'overdrive', 'field_repair', 'targeting_computer', 'shockwave_slam', 'reinforced_frame', 'rally_signal'], 1);
  const w = Prog.applyMatchResult(l10, 'win', { killXp: 0, salvageXp: 0 });
  assert.equal(w.record.xp, 5500); assert.equal(w.masteryBefore, 0); assert.equal(w.masteryAfter, 1);
  assert.equal(w.record.skillPoints, 2, 'M1 pays the 10th point');
  assert.equal(w.record.level, 10, 'level stays capped at 10 past the mastery threshold');
  assert.equal(Prog.validateRecord(w.record, Weapons).ok, true, 'post-mastery record validates');
  // Respec with mastery returns level points + mastery points.
  const rs = Prog.respec(w.record);
  assert.equal(rs.skillPoints, 10, '9 level points + 1 mastery point');
  assert.equal(rs.masteryClaimed, 1, 'respec keeps the claimed rank');
  // No XP growth still pays nothing extra; a loss below the next threshold pays nothing.
  const w2 = Prog.applyMatchResult(w.record, 'loss', { killXp: 0, salvageXp: 0 });
  assert.equal(w2.record.skillPoints, 2); assert.equal(w2.masteryAfter, 1);
});

// ---- Old-record migration ----
test('upgrades12h: old-record migration — v1 shape without masteryClaimed loads intact, catch-up on match end', () => {
  // A genuine Phase C record: no masteryClaimed field at all.
  const old = { schema: 1, level: 10, xp: 6000, skillPoints: 1,
    skills: ['dash', 'salvage_sense', 'overdrive', 'field_repair', 'targeting_computer', 'shockwave_slam', 'reinforced_frame', 'rally_signal'],
    loadout: Object.assign(DEF(), { armor: 'gear_armor_2', ability: 'overdrive' }),
    heroEnabled: true, matchesPlayed: 20, wins: 10 };
  const v = Prog.validateRecord(old, Weapons);
  assert.equal(v.ok, true, 'old shape validates: ' + v.reasons.join(' '));
  const cloned = Prog.cloneRecord(old);
  assert.equal(cloned.level, 10); assert.equal(cloned.xp, 6000);
  assert.deepEqual(cloned.skills, old.skills);
  assert.equal(cloned.loadout.armor, 'gear_armor_2'); assert.equal(cloned.loadout.ability, 'overdrive');
  assert.equal(cloned.masteryClaimed, 0, 'missing field normalises to 0, nothing else changes');
  // Next match end pays the earned M1 as catch-up (6000 + win 100 = 6100, rank 1).
  const after = Prog.applyMatchResult(old, 'win', { killXp: 0, salvageXp: 0 });
  assert.equal(after.masteryBefore, 0); assert.equal(after.masteryAfter, 1);
  assert.equal(after.record.skillPoints, 2, 'catch-up point granted, original point untouched');
  assert.equal(after.record.level, 10); assert.deepEqual(after.record.skills, old.skills);
  assert.equal(Prog.validateRecord(after.record, Weapons).ok, true);
  // Multi-rank catch-up: an old record parked at 11500 XP claims four ranks at once.
  const parked = { schema: 1, level: 10, xp: 11500, skillPoints: 1,
    skills: ['dash', 'salvage_sense', 'overdrive', 'field_repair', 'targeting_computer', 'shockwave_slam', 'reinforced_frame', 'rally_signal'],
    loadout: DEF(), heroEnabled: true, matchesPlayed: 30, wins: 15 };
  assert.equal(Prog.validateRecord(parked, Weapons).ok, true, 'parked old record still loads');
  const caught = Prog.applyMatchResult(parked, 'loss', { killXp: 0, salvageXp: 0 });
  assert.equal(caught.masteryAfter, 4, 'ranks M1-M4 caught up in one transition');
  assert.equal(caught.record.skillPoints, 5, '1 original + 4 catch-up');
  assert.equal(Prog.validateRecord(caught.record, Weapons).ok, true);
  // A mid-level old record (level 5, no mastery) is untouched by the track.
  const mid = { schema: 1, level: 5, xp: 1000, skillPoints: 1,
    skills: ['dash', 'salvage_sense', 'overdrive'], loadout: DEF(), heroEnabled: true, matchesPlayed: 5, wins: 2 };
  assert.equal(Prog.validateRecord(mid, Weapons).ok, true);
  const midAfter = Prog.applyMatchResult(mid, 'win', { killXp: 0, salvageXp: 0 });
  assert.equal(midAfter.masteryAfter, 0); assert.equal(midAfter.record.skillPoints, 1, 'no level-up, no new point');
});

// ---- Corruption rule ----
test('upgrades12h: corruption rule — new-shape failures return reasons, never throw, never block the menu', () => {
  const bad = [
    recordAt(10, 4500, ['dash'], 99), // unbalanced points
    recordAt(10, 5500, ['dash'], 8, DEF(), { masteryClaimed: 6 }), // claimed above MAX_MASTERY
    recordAt(10, 5500, ['dash'], 8, DEF(), { masteryClaimed: 2 }), // claimed above rank earned (1)
    recordAt(9, 3600, ['concussive_pulse', 'no_such_skill'], 6), // unknown skill id
    recordAt(3, 300, ['concussive_pulse'], 1), // gate-9 skill at level 3
    recordAt(10, -5, [], 9), // negative XP
  ];
  for (const r of bad) {
    let res;
    assert.doesNotThrow(() => { res = Prog.validateRecord(r, Weapons); }, 'validation never throws');
    assert.equal(res.ok, false, 'corrupt record rejected: ' + JSON.stringify(r));
    assert.ok(res.reasons.length > 0, 'every failure carries a reason string');
  }
  // The shell contract on corruption: defaultRecord() is a fresh level-1 hero.
  const fresh = Prog.defaultRecord();
  assert.equal(fresh.level, 1); assert.equal(fresh.xp, 0); assert.equal(fresh.masteryClaimed, 0);
  assert.deepEqual(fresh.skills, []); assert.deepEqual(fresh.loadout, DEF());
  assert.equal(Prog.validateRecord(fresh, Weapons).ok, true);
});

// ---- Utility/EW: deferred, documented, still rejected with a reason ----
test('upgrades12h: utility slot deferred — EW rows still rejected with a reason, never silently dropped', () => {
  const lo = Object.assign(DEF(), { utility: 'nw_emp_carbine' });
  const v = Weapons.validateLoadout(lo, { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: 3, levelBand: true });
  assert.equal(v.ok, false, 'utility is not equippable in Wave 3 (deferred, see report)');
  assert.ok(v.reasons.join(' ').toLowerCase().includes('utility'), 'rejection names the utility slot');
  // heroStats ignores a stray utility key: the hero's weapons are primary + secondary only.
  const st = Weapons.heroStats(lo, BASE, { level: 10, skills: [] });
  assert.equal(st.weapons.length, 1, 'utility key adds no weapon');
  assert.equal(Weapons.NAMED_WEAPONS.filter((r) => r.slot === 'utility').length, 7, 'EW rows stay data-complete for a later wave');
});
