/* Twin-Stick Phase C tests: persistence record, XP sources, curve,
   skills, gear tier bands, stat caps, corruption reset, sim skill
   effects, and Phase B preservation (level-1 hero identical to
   Phase B). Shell-only behaviours (localStorage read/write, menu
   notice, quit-mid-match earns nothing) are covered by the
   headless playthroughs, not here — this file tests the DOM-free
   modules the shell is built on.
   Run with the explicit file list:
   node --test tests/*.test.js */
const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');
const Weapons = require('../game/weapons.js');
const Prog = require('../game/progression.js');

function testGame() {
  const map = Sim.createTestMap();
  return Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 42 });
}
function heroWeapon(damage, range) {
  return { id: 'test-weapon', name: 'Test Gun', family: 'Autocannon', damage: damage || 100,
    range: range || 6, minRange: 0, interval: 0.5, projectileSpeed: 0, splashRadius: 0,
    falloff: 0, accuracy: 1, damageType: 'Kinetic', targetClasses: ['ground', 'structure'], special: 'none' };
}
function addHero(s, x, y, weapons) {
  return Sim.addCustomUnit(s, { typeId: 'lancer_mech', faction: 'iron_eden', x: x || 10, y: y || 20,
    hp: 200, maxHp: 200, armor: 'Medium', speed: 6.0, vision: 10, radius: 0.55,
    movementClass: 'ground', weapons: weapons || [heroWeapon()], isHero: true, costScrap: 380 });
}
function addRed(s, typeId, x, y, hp) {
  const u = Sim.addUnit(s, typeId, 'xandria', x, y);
  if (hp !== undefined) u.hp = hp;
  return u;
}

// ---- XP curve: every threshold, exactly-at vs one-below ----
test('phasec: full XP curve table, boundary-exact', () => {
  const cases = [[0, 1], [99, 1], [100, 2], [299, 2], [300, 3], [599, 3], [600, 4],
    [999, 4], [1000, 5], [1499, 5], [1500, 6], [2099, 6], [2100, 7], [2799, 7],
    [2800, 8], [3599, 8], [3600, 9], [4499, 9], [4500, 10], [99999, 10]];
  for (const [xp, level] of cases) assert.equal(Prog.levelForXp(xp), level, 'xp ' + xp);
  assert.deepEqual(Prog.XP_CURVE, [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500]);
});

// ---- Match-end transitions ----
test('phasec: applyMatchResult — win/draw/loss bonuses, level-up grants points', () => {
  const base = Prog.defaultRecord();
  let r = Prog.applyMatchResult(base, 'win', { killXp: 30, salvageXp: 10 });
  assert.equal(r.xpGained, 140); assert.equal(r.record.xp, 140);
  assert.equal(r.levelBefore, 1); assert.equal(r.levelAfter, 2);
  assert.equal(r.record.skillPoints, 1); assert.equal(r.record.matchesPlayed, 1); assert.equal(r.record.wins, 1);
  r = Prog.applyMatchResult(base, 'draw', { killXp: 30, salvageXp: 10 });
  assert.equal(r.xpGained, 40, 'draw grants +0 bonus but kill/salvage XP still count');
  assert.equal(r.record.wins, 0); assert.equal(r.record.matchesPlayed, 1);
  r = Prog.applyMatchResult(base, 'loss', { killXp: 0, salvageXp: 0 });
  assert.equal(r.xpGained, 25); assert.equal(r.record.level, 1);
  // Multi-level jump grants one point per level gained.
  const mid = { ...Prog.defaultRecord(), xp: 90, level: 1, skillPoints: 0 };
  r = Prog.applyMatchResult(mid, 'win', { killXp: 0, salvageXp: 0 });
  assert.equal(r.record.xp, 190); assert.equal(r.record.level, 2); assert.equal(r.record.skillPoints, 1);
  const far = { ...Prog.defaultRecord(), xp: 290, level: 2, skillPoints: 1 };
  r = Prog.applyMatchResult(far, 'win', { killXp: 0, salvageXp: 0 });
  assert.equal(r.record.xp, 390); assert.equal(r.record.level, 3); assert.equal(r.record.skillPoints, 2);
  // Input never mutated.
  assert.equal(base.xp, 0); assert.equal(base.skillPoints, 0);
});

// ---- Sim: hero killing blows (instant, projectile, splash) and army kills ----
test('phasec: hero killing blow XP — minimum 10, cost-scaled, army kills 0', () => {
  let s = testGame();
  const hero = addHero(s);
  const scout = addRed(s, 'scout_buggy', 11, 20, 1); // catalog cost 80 -> floor(8) -> minimum 10
  Sim.step(s);
  assert.equal(s.units.some(u => u.id === scout.id), false, 'scout died');
  assert.equal(s.heroXp.kills, 1); assert.equal(s.heroXp.killXp, 10);

  s = testGame();
  const hero2 = addHero(s);
  const tank = addRed(s, 'medium_tank', 11, 20, 1); // cost 300 -> 30
  Sim.step(s);
  assert.equal(s.heroXp.killXp, 30);

  s = testGame();
  const hero3 = addHero(s);
  const heavy = addRed(s, 'heavy_tank', 11, 20, 1); // cost 520 -> 52
  Sim.step(s);
  assert.equal(s.heroXp.killXp, 52);

  // Army kill: a blue non-hero unit lands the blow, hero present elsewhere.
  s = testGame();
  addHero(s, 10, 30);
  const army = Sim.addUnit(s, 'medium_tank', 'iron_eden', 10, 20);
  army.weapons = [heroWeapon()];
  const victim = addRed(s, 'scout_buggy', 11, 20, 1);
  Sim.step(s);
  assert.equal(s.units.some(u => u.id === victim.id), false, 'victim died to army unit');
  assert.equal(s.heroXp.kills, 0); assert.equal(s.heroXp.killXp, 0, 'army kills feed 0 hero XP');

  // Projectile kill (autocannon-speed weapon): sourceId path attributes too.
  s = testGame();
  const ph = addHero(s, 10, 20, [Object.assign(heroWeapon(), { projectileSpeed: 24 })]);
  const pt = addRed(s, 'scout_buggy', 12, 20, 1);
  for (let i = 0; i < 10 && s.units.some(u => u.id === pt.id); i++) Sim.step(s);
  assert.equal(s.units.some(u => u.id === pt.id), false, 'projectile killed the target');
  assert.equal(s.heroXp.killXp, 10);

  // Splash kill: hero splash weapon kills a second enemy via splash.
  s = testGame();
  const sh = addHero(s, 10, 20, [Object.assign(heroWeapon(), { splashRadius: 3 })]);
  const t1 = addRed(s, 'scout_buggy', 11, 20, 1);
  const t2 = addRed(s, 'scout_buggy', 12, 20, 1);
  Sim.step(s);
  assert.equal(s.units.some(u => u.id === t1.id), false);
  assert.equal(s.units.some(u => u.id === t2.id), false, 'splash victim died');
  assert.equal(s.heroXp.kills, 2); assert.equal(s.heroXp.killXp, 20);

  // 0-cost structure kill grants 0, never the minimum.
  s = testGame();
  const ch = addHero(s, 10, 20);
  const core = Sim.addStructure(s, 'command_core', 'xandria', 11, 20);
  core.hp = 1;
  Sim.step(s);
  assert.equal(s.heroXp.killXp, 0, 'killing a 0-cost core grants 0 hero XP');
});

// ---- Sim: hero salvage (manual auto-collect) and Salvage Sense ----
test('phasec: hero salvage XP + Salvage Sense scrap bonus, army salvage 0 XP', () => {
  function salvageSetup(withSense) {
    const s = testGame();
    if (withSense) s.heroSkills = ['salvage_sense'];
    const hero = addHero(s, 10, 20);
    // A surviving red unit far away: without it the kill would end
    // the match (elimination) and later steps would be no-ops.
    addRed(s, 'scout_buggy', 50, 20);
    const victim = addRed(s, 'scout_buggy', 11, 20, 1);
    Sim.step(s); // hero kills victim (10 kill XP); wreck lands at (11,20)
    assert.equal(s.wrecks.length, 1, 'wreck exists');
    Sim.setManualControl(s, hero.id);
    Sim.setManualInput(s, hero.id, 0, 0, null, false);
    const scrapBefore = Sim.scrapOf(s, 'iron_eden');
    Sim.step(s); // manual hero within 1.5 tiles of the wreck collects it
    return { s, scrapBefore };
  }
  const plain = salvageSetup(false);
  assert.equal(plain.s.heroXp.salvages, 1); assert.equal(plain.s.heroXp.salvageXp, 10);
  assert.equal(plain.s.wrecks.length, 0, 'wreck collected');
  const plainGain = Sim.scrapOf(plain.s, 'iron_eden') - plain.scrapBefore;
  assert.ok(plainGain > 0, 'scrap gained');
  const sense = salvageSetup(true);
  const senseGain = Sim.scrapOf(sense.s, 'iron_eden') - sense.scrapBefore;
  assert.equal(senseGain, Math.floor(plainGain * 1.25), 'Salvage Sense pays +25% on the same decayed value');

  // Army salvage via order: no hero XP.
  const s = testGame();
  addHero(s, 10, 30);
  addRed(s, 'scout_buggy', 50, 20);
  const v = addRed(s, 'scout_buggy', 11, 20, 1);
  const killer = Sim.addUnit(s, 'medium_tank', 'iron_eden', 10, 20);
  killer.weapons = [heroWeapon()];
  Sim.step(s);
  assert.equal(s.wrecks.length, 1);
  const salvager = Sim.addUnit(s, 'scout_buggy', 'iron_eden', 10, 20);
  Sim.issueOrder(s, [salvager.id], { kind: 'salvage', wreckId: s.wrecks[0].id });
  Sim.step(s);
  assert.equal(s.heroXp.salvages, 0); assert.equal(s.heroXp.salvageXp, 0);
});

// ---- Sim: active skills ----
test('phasec: active skills — effects, cooldowns, structure immunity', () => {
  // Dash: 2x manual speed for 0.4s, cooldown 8s enforced.
  let s = testGame();
  const dh = addHero(s, 10, 20);
  Sim.setManualControl(s, dh.id);
  Sim.setManualInput(s, dh.id, 1, 0, null, false);
  assert.equal(Sim.activateSkill(s, dh.id, 'dash').ok, true);
  for (let i = 0; i < 4; i++) Sim.step(s);
  assert.ok(Math.abs(dh.x - (10 + 0.6 * 4)) < 0.01, 'dashed 0.6 tiles/tick, got ' + dh.x);
  assert.equal(Sim.activateSkill(s, dh.id, 'dash').ok, false, 'dash on cooldown');
  assert.ok(Sim.skillCooldownRemaining(s, dh.id, 'dash') > 0);

  // Field Repair: +60 capped at max HP, cooldown enforced.
  s = testGame();
  const fh = addHero(s, 10, 20); fh.hp = 100;
  assert.equal(Sim.activateSkill(s, fh.id, 'field_repair').ok, true);
  assert.equal(fh.hp, 160);
  fh.hp = 190;
  // Cooldown blocks the second cast even though it would heal.
  assert.equal(Sim.activateSkill(s, fh.id, 'field_repair').ok, false);
  for (let i = 0; i < 600; i++) Sim.step(s);
  assert.equal(Sim.activateSkill(s, fh.id, 'field_repair').ok, true);
  assert.equal(fh.hp, 200, 'repair caps at max HP');

  // Shockwave Slam: units in 2 tiles take primary x1.5, structures untouched, cooldown enforced.
  s = testGame();
  const sh = addHero(s, 10, 20, [heroWeapon(12, 6)]);
  const near = addRed(s, 'scout_buggy', 11, 20, 10);
  const far = addRed(s, 'scout_buggy', 14, 20, 10);
  const struct = Sim.addStructure(s, 'bunker', 'xandria', 11, 21);
  const structHp = struct.hp;
  // Skill radius queries need a fresh grid; a step first would let
  // the hero's hold order fire before the slam is tested.
  Sim.rebuildGrid(s);
  assert.equal(Sim.activateSkill(s, sh.id, 'shockwave_slam').ok, true);
  // Dead units leave the array only at the next step's cleanup, so
  // assert on alive here (and on removal after one step).
  assert.equal(near.alive, false, 'near enemy slammed (18 damage vs 10 HP)');
  assert.equal(far.alive, true, 'enemy outside 2 tiles untouched');
  assert.equal(struct.hp, structHp, 'structures immune to Shockwave Slam');
  // The cleanup step itself lets the hero's hold order fire at the
  // bunker, so the structure check must precede it.
  Sim.step(s);
  assert.equal(s.units.some(u => u.id === near.id), false, 'slammed unit cleaned up');
  assert.equal(Sim.activateSkill(s, sh.id, 'shockwave_slam').ok, false, 'slam on cooldown');
  assert.equal(Sim.activateSkill(s, sh.id, 'salvage_sense').ok, false, 'passives cannot be activated');
  assert.equal(Sim.activateSkill(s, sh.id, 'nope').ok, false, 'unknown skill rejected');

  // Rally Signal: allies within 8 tiles get the buff, beyond do not; speed rises 10%.
  s = testGame();
  const rh = addHero(s, 10, 20);
  const allyNear = Sim.addUnit(s, 'medium_tank', 'iron_eden', 12, 20);
  const allyFar = Sim.addUnit(s, 'medium_tank', 'iron_eden', 25, 20);
  Sim.issueOrder(s, [allyNear.id, allyFar.id], { kind: 'move', x: 30, y: 20 });
  Sim.rebuildGrid(s); // rally radius query needs a fresh grid
  assert.equal(Sim.activateSkill(s, rh.id, 'rally_signal').ok, true);
  assert.ok(allyNear.rallyBoostUntil > s.tick);
  assert.equal(allyFar.rallyBoostUntil, 0);
  const nearX0 = allyNear.x, farX0 = allyFar.x;
  for (let i = 0; i < 10; i++) Sim.step(s);
  const nearMoved = allyNear.x - nearX0, farMoved = allyFar.x - farX0;
  assert.ok(nearMoved > farMoved * 1.05, 'rallied ally outruns the unrallied one (' + nearMoved + ' vs ' + farMoved + ')');

  // Overdrive: effective interval x0.8 while active.
  s = testGame();
  const oh = addHero(s, 10, 20, [Object.assign(heroWeapon(), { interval: 0.5 })]);
  Sim.setManualControl(s, oh.id);
  const ot = addRed(s, 'scout_buggy', 11, 20, 1000);
  Sim.setManualInput(s, oh.id, 0, 0, 0, true); // aim east, firing
  Sim.step(s);
  const plainCd = oh.cooldowns[0];
  assert.ok(Math.abs(plainCd - 0.5) < 0.06, 'plain interval 0.5, got ' + plainCd);
  oh.cooldowns[0] = 0;
  assert.equal(Sim.activateSkill(s, oh.id, 'overdrive').ok, true);
  Sim.step(s);
  assert.ok(Math.abs(oh.cooldowns[0] - 0.4) < 0.06, 'overdrive interval 0.4, got ' + oh.cooldowns[0]);
});

// ---- Progression module: skills, respec, validation, tiers ----
test('phasec: skill buying, gates, respec', () => {
  const l1 = Prog.defaultRecord();
  let r = Prog.buySkill(l1, 'dash');
  assert.equal(r.ok, false); assert.ok(r.reason.includes('level 2'), 'dash gated at level 2: ' + r.reason);
  const l2 = { ...Prog.defaultRecord(), level: 2, xp: 100, skillPoints: 1 };
  r = Prog.buySkill(l2, 'dash');
  assert.equal(r.ok, true); assert.equal(r.record.skillPoints, 0); assert.deepEqual(r.record.skills, ['dash']);
  assert.equal(Prog.buySkill(r.record, 'dash').ok, false, 'duplicate buy rejected');
  assert.equal(Prog.buySkill(r.record, 'rally_signal').ok, false, 'gate-8 skill rejected at level 2');
  assert.equal(Prog.buySkill(r.record, 'overdrive').ok, false, 'no points left rejected');
  // Respec returns all points, clears skills and ability, keeps XP/level.
  const built = { ...Prog.defaultRecord(), level: 5, xp: 1000, skillPoints: 1,
    skills: ['dash', 'salvage_sense', 'overdrive'], loadout: { ...Prog.defaultLoadout(), ability: 'overdrive' } };
  const rs = Prog.respec(built);
  assert.equal(rs.skillPoints, 4); assert.deepEqual(rs.skills, []); assert.equal(rs.loadout.ability, null);
  assert.equal(rs.xp, 1000); assert.equal(rs.level, 5);
  assert.equal(l1.skillPoints, 0, 'buy/respec never mutate the input');
});

test('phasec: record validation — corruption resets, valid records pass', () => {
  assert.equal(Prog.validateRecord(Prog.defaultRecord(), Weapons).ok, true);
  assert.equal(Prog.validateRecord(null, Weapons).ok, false);
  assert.equal(Prog.validateRecord('garbage', Weapons).ok, false);
  const badLevel = { ...Prog.defaultRecord(), level: 11 };
  assert.equal(Prog.validateRecord(badLevel, Weapons).ok, false);
  const mismatch = { ...Prog.defaultRecord(), xp: 500, level: 1 };
  assert.equal(Prog.validateRecord(mismatch, Weapons).ok, false, 'level must equal levelForXp(xp)');
  const badSkill = { ...Prog.defaultRecord(), level: 2, xp: 100, skillPoints: 0, skills: ['rally_signal'] };
  assert.equal(Prog.validateRecord(badSkill, Weapons).ok, false, 'gate-8 skill at level 2 is corruption');
  const badPoints = { ...Prog.defaultRecord(), level: 2, xp: 100, skillPoints: 5, skills: [] };
  assert.equal(Prog.validateRecord(badPoints, Weapons).ok, false, 'points must balance with level');
  const badAbility = { ...Prog.defaultRecord(), level: 2, xp: 100, skillPoints: 0,
    skills: ['dash'], loadout: { ...Prog.defaultLoadout(), ability: 'overdrive' } };
  assert.equal(Prog.validateRecord(badAbility, Weapons).ok, false, 'equipped ability must be unlocked');
  const passiveAbility = { ...Prog.defaultRecord(), level: 5, xp: 1000, skillPoints: 1,
    skills: ['dash', 'salvage_sense', 'overdrive'], loadout: { ...Prog.defaultLoadout(), ability: 'salvage_sense' } };
  assert.equal(Prog.validateRecord(passiveAbility, Weapons).ok, false, 'passives cannot be the equipped ability');
  const goodL4 = { ...Prog.defaultRecord(), level: 4, xp: 600, skillPoints: 3, skills: [],
    loadout: { ...Prog.defaultLoadout(), primary: 'nw_scrapstorm_rotary_gun', armor: 'gear_armor_2' } };
  assert.equal(Prog.validateRecord(goodL4, Weapons).ok, true, 'tier-2 rows valid at level 4');
});

test('phasec: tier bands — locked below, allowed at band, reasons name the level', () => {
  assert.equal(Prog.tierBand(1), 1); assert.equal(Prog.tierBand(3), 1);
  assert.equal(Prog.tierBand(4), 2); assert.equal(Prog.tierBand(6), 2);
  assert.equal(Prog.tierBand(7), 3); assert.equal(Prog.tierBand(10), 3);
  const base = { ...Prog.defaultLoadout() };
  const t2 = Weapons.validateLoadout({ ...base, primary: 'nw_scrapstorm_rotary_gun' },
    { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: 1, levelBand: true });
  assert.equal(t2.ok, false); assert.ok(t2.reasons.join(' ').includes('level 4'), 'tier-2 reason names level 4');
  const t2ok = Weapons.validateLoadout({ ...base, primary: 'nw_scrapstorm_rotary_gun' },
    { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: 2, levelBand: true });
  assert.equal(t2ok.ok, true);
  const ab = Weapons.validateLoadout({ ...base, ability: 'dash' },
    { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: 1, allowAbility: true, ownedAbilityIds: ['dash'] });
  assert.equal(ab.ok, true, 'unlocked active skill equips');
  const abNo = Weapons.validateLoadout({ ...base, ability: 'dash' },
    { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: 1, allowAbility: true, ownedAbilityIds: [] });
  assert.equal(abNo.ok, false, 'locked skill cannot be equipped');
});

// ---- Stat caps and Phase B preservation ----
test('phasec: stat caps — level-1 anchor identical to Phase B, level-10 effective +45%/+18%', () => {
  const base = { hp: 200, armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55, movementClass: 'ground' };
  const l1 = Weapons.heroStats(Prog.defaultLoadout(), base);
  const l1c = Weapons.heroStats(Prog.defaultLoadout(), base, { level: 1, skills: [] });
  assert.deepEqual(l1c, l1, 'level-1 Phase C hero plays identically to Phase B');
  const l10 = Weapons.heroStats(Prog.defaultLoadout(), base, { level: 10, skills: [] });
  assert.equal(l10.maxHp, 290, '200 x 1.45 = 290, under the +50% ceiling of 300');
  assert.equal(l10.weapons[0].damage, 14.2, '12 x 1.18 = 14.2, under the +20% ceiling of 14.4');
  const l10rf = Weapons.heroStats(Prog.defaultLoadout(), base, { level: 10, skills: ['reinforced_frame'] });
  assert.equal(l10rf.maxHp, 320, 'Reinforced Frame additive: 200 x (1 + 0.45 + 0.15) = 320');
  const l7rfGear = Weapons.heroStats({ ...Prog.defaultLoadout(), armor: 'gear_armor_3' }, base,
    { level: 7, skills: ['reinforced_frame'] });
  assert.equal(l7rfGear.maxHp, 377, '200 x (1 + 0.30 + 0.15) x 1.30 = 377');
  assert.equal(l7rfGear.armor, 'Heavy', 'tier-3 armor steps Medium to Heavy');
  const tc = Weapons.heroStats({ ...Prog.defaultLoadout(), secondary: 'nw_rustfang' }, base,
    { level: 5, skills: ['targeting_computer'] });
  assert.equal(tc.weapons[0].accuracy, 0.95, 'primary accuracy +0.10');
  assert.equal(tc.weapons[0].range, 7, 'primary range +1');
  assert.equal(tc.weapons[1].accuracy, 0.95, 'secondary accuracy unchanged (melee baseline 0.95)');
  assert.equal(tc.weapons[1].range, 1.2, 'secondary range unchanged — Targeting Computer is primary-only');
});
