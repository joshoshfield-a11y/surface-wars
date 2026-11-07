/* Twin-Stick Phase B tests: 123 named weapons + 12 baselines, loadout
   validation, gear, hero reserve state machine, sim integration
   (custom unit, withdrawal, hero wreck, specials), deadlock and
   elimination interaction. No XP, levels, skills, or persistence in
   this phase — those words appear here only in this comment and in
   the rejection reasons the validator must produce for them.
   Run with the explicit file list:
   node --test tests/*.test.js */
const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');
const Maps = require('../game/maps.js');
const Weapons = require('../game/weapons.js');
const Hero = require('../game/hero.js');

function testGame() {
  const map = Sim.createTestMap();
  return Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 42 });
}
function stepN(s, n) { for (let i = 0; i < n; i++) Sim.step(s); }
function firstGame() {
  const map = Maps.createFirstMap();
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 20261030 });
  Maps.spawnFirstMapScenario(Sim, s);
  return s;
}
const HERO_BASE = { hp: 200, armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55, movementClass: 'ground' };
function heroUnit(s, loadout, hp) {
  const st = Weapons.heroStats(loadout || Weapons.DEFAULT_LOADOUT, HERO_BASE);
  return Sim.addCustomUnit(s, { typeId: 'lancer_mech', faction: 'iron_eden', x: 12, y: 25,
    hp: hp !== undefined ? hp : st.maxHp, maxHp: st.maxHp, armor: st.armor, speed: st.speed,
    vision: st.vision, radius: st.radius, movementClass: 'ground', weapons: st.weapons,
    isHero: true, costScrap: 380 });
}

// ---- The 123 names, in document order (the audit list) ----
const EXPECTED_NAMES = [
  // Ballistic G1 (10)
  'Scrapstorm Rotary Gun', 'Ratchet SMG', 'Rivet Cannon', 'Twin-Bore Autogun', 'Widowmaker LMG',
  'Brass Knuckle Cannon', 'Sawtooth Repeater', 'Hailstorm Minigun', 'Coil-Feed Carbine', "Salvager's Nailgun",
  // Ballistic G2 (10)
  'Breacher-12', 'Door-Kicker', 'Furnace Shotgun', 'Scatterjack', 'Double-Feed',
  'Slugger Cannon', 'Shredder-8', 'Backblast Shotgun', 'Bonecrusher', 'Maglock Shotgun',
  // Ballistic G3 (12)
  'MULE-40 Grenade Lobber', 'Burrower Rocket Pod', 'Cratermaker', 'Scrap Mortar', 'Clusterbug Launcher',
  'Breach Missile', 'Siege Nail Driver', 'Thunderclap Autocannon', 'Hopper Mine Dispenser',
  'Atlas Shoulder Howitzer', 'Furnace Bombard', 'Ricochet Cannon',
  // Energy G13 (10)
  'Plasma Spitter', 'Blueglass Rifle', 'Arc Furnace', 'Sunspot Blaster', 'Ion Needle',
  'Meltdown Cannon', 'Plasma Saw', 'Ghostlight Projector', 'Cindercoil', 'Starved Reactor',
  // Energy G14 (10)
  'Arc Thrower', 'Magnetar Cannon', 'EMP Carbine', 'Tesla Fork', 'Static Harpoon',
  'Railspike', 'Storm Cage', 'Flux Hammer', 'Capacitor Rifle', 'Blackout Emitter',
  // Energy G15 (10)
  'Redline Laser', 'Prism Rifle', 'Phase Lance', 'Mirrorbeam', 'Null Ray',
  'Helios Projector', 'Photon Scatterer', 'Afterimage Emitter', 'Horizon Cutter', 'Eventide Cannon',
  // Melee G16 (12)
  'Rustfang', 'Arc Cleaver', 'Plasma Machete', 'Monorail Blade', 'Rotary Sawarm', 'Chain Glaive',
  'Guillotine Arm', 'Vibroknife', 'Glass Edge', 'Furnace Sword', 'Splitter Axe', 'Phase Cutter',
  // Melee G17 (10)
  'Pile-Driver Fist', 'Wrecking Maul', 'Seismic Hammer', 'Anchor Fist', 'Hydraulic Crusher',
  'Bellringer', 'Corebreaker', 'Gravity Mallet', 'Demolition Ram', 'Foundry Sledge',
  // Melee G18 (12)
  'Rebar Bowcaster', 'Toaster Turret', 'Forklift Forks', 'Industrial Stapler', 'Propane Lance',
  'Compressed Junk Cannon', 'Microwave Emitter', 'Emergency Flare Gun', 'Concrete Mixer',
  'The Negotiator', 'Cursed Office Printer', 'Breakroom Special',
  // Biological 19-30 (12)
  'Acid Sprayer', 'Corrosion Needle', 'Spore Mortar', 'Leech Harpoon', 'Rust Cloud Projector',
  'Caustic Foam Gun', 'Furnace Gel Launcher', 'Cryogenic Mist Cannon', 'Cryo-Piercer',
  'Toxic Dart Array', 'Nanite Swarm Injector', 'Biomass Reclaimer',
  // Experimental 31-45 (15)
  'Probability Engine', 'Echo Rifle', 'Chrono Spike', 'Phase-Shear Cannon', 'Blackbox Launcher',
  'Singularity Projector', 'Faultline Driver', 'Mimic Gun', 'Entropy Cannon', 'Ghost Battery',
  'Redshift Rifle', 'Dead Channel', 'Mirror Core', 'Scrap Singularity', 'The Last Argument',
  // WAVE 4 (CURRENCY-12H) appendix — NOT document names: the two
  // premium-only rows, appended after the document's 123, never
  // interleaved, so the 123-name audit above still holds verbatim.
  'Ember Repeater', 'Gilded Lance',
];

test('phaseb: all 123 named weapons present, verbatim, unique ids', () => {
  // WAVE 4 JUSTIFIED CHANGE: 123 -> 125 rows, 82 -> 84 primaries.
  // Nothing was removed: the original 123 document names are still
  // present verbatim and in order (EXPECTED_NAMES[0..122]); the
  // wave adds exactly the 2 premium-only rows appended above.
  assert.equal(Weapons.NAMED_WEAPONS.length, 125);
  assert.deepEqual(Weapons.NAMED_WEAPONS.map((r) => r.name), EXPECTED_NAMES);
  assert.equal(new Set(Weapons.NAMED_WEAPONS.map((r) => r.id)).size, 125);
  assert.equal(Weapons.NAMED_WEAPONS.filter((r) => r.slot === 'primary').length, 84);
  assert.equal(Weapons.NAMED_WEAPONS.filter((r) => r.slot === 'secondary').length, 34);
  assert.equal(Weapons.NAMED_WEAPONS.filter((r) => r.slot === 'utility').length, 7);
});

test('phaseb: every row obeys the template — ≤2 multipliers, closed special, known family, tier 1-3', () => {
  for (const r of Weapons.NAMED_WEAPONS) {
    assert.ok(Object.keys(r.mult).length <= 2, r.name + ' has more than two multipliers');
    assert.ok(Weapons.SPECIALS.includes(r.special), r.name + ' special outside the closed list');
    assert.ok(Weapons.FAMILY_BASELINES[r.family], r.name + ' unknown family');
    assert.ok(r.tier >= 1 && r.tier <= 3, r.name + ' tier out of range');
    assert.equal(r.powerCost, 0, r.name + ' powerCost must be reserved 0');
  }
});

test('phaseb: 12 baselines match the catalog canonical rows exactly', () => {
  const canon = { 'Autocannon': 'w_autocannon', 'Heavy Cannon': 'w_heavy_cannon', 'Missile Launcher': 'w_missile',
    'Rocket Artillery': 'w_rocket_artillery', 'Railgun': 'w_railgun', 'Mortar': 'w_mortar',
    'Flamethrower': 'w_flamethrower', 'Anti-air Cannon': 'w_aa_cannon', 'Laser': 'w_laser',
    'Siege Cannon': 'w_siege_cannon', 'Melee Weapon': 'w_melee', 'Electronic Warfare': 'w_ew' };
  assert.equal(Object.keys(Weapons.FAMILY_BASELINES).length, 12);
  for (const [fam, wid] of Object.entries(canon)) {
    const c = catalog.weapons.find((w) => w.id === wid);
    const b = Weapons.FAMILY_BASELINES[fam];
    for (const f of ['damage', 'range', 'minRange', 'interval', 'projectileSpeed', 'splashRadius', 'falloff', 'accuracy', 'damageType']) {
      assert.equal(b[f], c[f], fam + ' baseline field ' + f);
    }
    assert.deepEqual(b.targetClasses, c.targetClasses, fam + ' target classes');
  }
});

test('phaseb: spec worked examples resolve as specified', () => {
  const sc = Weapons.resolveWeapon(Weapons.rowById('nw_scrapstorm_rotary_gun'));
  // WEAPONS-12H (Wave 1): retuned from 12 x 0.85 / 0.5 x 0.5 (34.68 DPS,
  // 1.70x the Autocannon baseline, above the cycle's 1.5x bound) to
  // 12 x 0.9 / 0.5 x 0.65 (27.82 DPS, 1.36x) with overheat kept.
  assert.equal(sc.damage, 10.8, 'Scrapstorm: 12 x 0.9');
  assert.equal(sc.interval, 0.33, 'Scrapstorm: 0.5 x 0.65');
  assert.equal(sc.special, 'overheat');
  const rp = Weapons.resolveWeapon(Weapons.rowById('nw_railspike'));
  assert.equal(rp.damage, 40); assert.equal(rp.interval, 3.5); assert.equal(rp.special, 'pierce');
  const cm = Weapons.resolveWeapon(Weapons.rowById('nw_cratermaker'));
  assert.equal(cm.damage, 55); assert.equal(cm.range, 18); assert.equal(cm.minRange, 5);
  assert.equal(cm.interval, 4.0); assert.equal(cm.splashRadius, 2.5); assert.equal(cm.special, 'none');
  const tb = Weapons.resolveWeapon(Weapons.rowById('nw_twin_bore_autogun'));
  assert.equal(tb.damage, 12); assert.equal(tb.interval, 0.5); assert.equal(tb.range, 6);
});

test('phaseb: default loadout is exactly the lancer anchor — vision 8, not the spec-proposed 10', () => {
  const lancer = catalog.units.find((u) => u.id === 'lancer_mech');
  assert.equal(lancer.hp, 200); assert.equal(lancer.armor, 'Medium');
  assert.equal(lancer.speed, 6.0); assert.equal(lancer.vision, 8, 'catalog vision is 8; the spec-proposed 10 was unconfirmed and is NOT used');
  const st = Weapons.heroStats(Weapons.DEFAULT_LOADOUT, HERO_BASE);
  assert.equal(st.maxHp, 200); assert.equal(st.armor, 'Medium');
  assert.equal(st.speed, 6.0); assert.equal(st.vision, 8);
  assert.equal(st.weapons.length, 1); assert.equal(st.weapons[0].name, 'Twin-Bore Autogun');
  assert.ok(Weapons.validateLoadout(Weapons.DEFAULT_LOADOUT, { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: 1 }).ok);
});

test('phaseb: validator rejects with reasons — tier band, secondary tier, utility, Scrapjack cap, air mounts, ability', () => {
  const base = { secondary: null, armor: null, mobility: null, reactor: null, sensor: null, ability: null };
  const t3 = Weapons.validateLoadout({ ...base, primary: 'nw_railspike' }, { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: 1 });
  assert.equal(t3.ok, false); assert.ok(t3.reasons.join(' ').includes('tier 3'));
  // Secondary tier rule, isolated from the band (cap 3): tier-2 secondary over a tier-1 primary.
  const sec = Weapons.validateLoadout({ ...base, primary: 'nw_twin_bore_autogun', secondary: 'nw_plasma_machete' },
    { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: 3 });
  assert.equal(sec.ok, false); assert.ok(sec.reasons.join(' ').includes('above the primary tier'));
  // Utility row in a weapon slot.
  const ut = Weapons.validateLoadout({ ...base, primary: 'nw_emp_carbine' }, { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: 3 });
  assert.equal(ut.ok, false); assert.ok(ut.reasons.join(' ').includes('utility'));
  // Scrapjack generalist cap, isolated from the band (cap 3).
  const sj = Weapons.validateLoadout({ ...base, primary: 'nw_cratermaker' }, { chassis: 'Scrapjack', movementClass: 'ground', phaseTierCap: 3 });
  assert.equal(sj.ok, false); assert.ok(sj.reasons.join(' ').includes('tier 2'));
  // Air mounts: Flamethrower-family primary on an air chassis.
  const air = Weapons.validateLoadout({ ...base, primary: 'nw_furnace_shotgun' }, { chassis: 'Lancer', movementClass: 'air', phaseTierCap: 3 });
  assert.equal(air.ok, false); assert.ok(air.reasons.join(' ').includes('cannot mount on air'));
  // Ability slot must stay empty in Phase B.
  const ab = Weapons.validateLoadout({ ...base, primary: 'nw_twin_bore_autogun', ability: 'dash' }, { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: 1 });
  assert.equal(ab.ok, false); assert.ok(ab.reasons.join(' ').includes('Phase C'));
  // Unknown ids are reasons, not crashes.
  const unk = Weapons.validateLoadout({ ...base, primary: 'nw_nope' }, { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: 1 });
  assert.equal(unk.ok, false);
});

test('phaseb: tier-band resolution — Phase B ships tier-1 gear only; tier 2/3 gear exists but is locked', () => {
  // WAVE 3 (UPGRADES-12H) old-test change, justified: 4 trade-off
  // gear rows added (armor T1/T2, mobility T2, sensor T2), so the
  // count moves 12 -> 16. The 12 original rows are untouched.
  assert.equal(Weapons.GEAR_ROWS.length, 16, '12 original gear rows + 4 Wave 3 trade-off rows');
  const t1 = Weapons.heroStats({ ...Weapons.DEFAULT_LOADOUT, armor: 'gear_armor_1', mobility: 'gear_mobility_1', reactor: 'gear_reactor_1', sensor: 'gear_sensor_1' }, HERO_BASE);
  assert.equal(t1.maxHp, 220, 'armor tier 1: +10% HP');
  assert.equal(t1.speed, 6.5, 'mobility tier 1: +0.5');
  assert.equal(t1.vision, 9, 'sensor tier 1: +1 vision');
  // Reactor tier 1: +5% fire rate on ENERGY weapons only.
  const energy = Weapons.heroStats({ ...Weapons.DEFAULT_LOADOUT, primary: 'nw_blueglass_rifle', reactor: 'gear_reactor_1' }, HERO_BASE);
  assert.ok(Math.abs(energy.weapons[0].interval - 0.67) < 0.01, 'laser interval 0.7 / 1.05');
  const kinetic = Weapons.heroStats({ ...Weapons.DEFAULT_LOADOUT, reactor: 'gear_reactor_1' }, HERO_BASE);
  assert.equal(kinetic.weapons[0].interval, 0.5, 'reactor does not touch Kinetic weapons');
  const locked = Weapons.validateLoadout({ ...Weapons.DEFAULT_LOADOUT, armor: 'gear_armor_2' }, { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: 1 });
  assert.equal(locked.ok, false); assert.ok(locked.reasons.join(' ').includes('Phase C'));
});

// ---- Hero reserve state machine (hero.js, no DOM) ----

test('phaseb: spawn replacement — west lancer removed, opening field 9v10, east untouched', () => {
  const s = firstGame();
  assert.equal(s.units.filter((u) => u.faction === 'iron_eden').length, 10);
  const r = Hero.applyRoster(s);
  assert.equal(r.replaced, true);
  assert.equal(s.units.filter((u) => u.faction === 'iron_eden').length, 9);
  assert.equal(s.units.filter((u) => u.faction === 'xandria').length, 10);
  assert.equal(s.units.filter((u) => u.faction === 'iron_eden' && u.typeId === 'lancer_mech').length, 0);
  assert.equal(s.units.filter((u) => u.faction === 'xandria' && u.typeId === 'lancer_mech').length, 1);
  assert.equal(Hero.applyRoster(s).replaced, false, 'second application finds no west lancer');
});

test('phaseb: canDrop — every disabled reason, and the binding constraint first', () => {
  const core = { coreAlive: true, scrap: 500, tick: 1000, dropTile: { x: 7.5, y: 25.5 } };
  const h = Hero.startMatch(Weapons.DEFAULT_LOADOUT);
  assert.equal(h.status, 'reserve'); assert.equal(h.hp, null);
  let res = Hero.canDrop(h, core);
  assert.equal(res.ok, true); assert.equal(res.cost, 0, 'fresh reserve drop is free');
  // Already on field / already dropping.
  h.status = 'field'; h.unitId = 99;
  assert.equal(Hero.canDrop(h, core).kind, 'field');
  h.status = 'dropping'; h.unitId = 0;
  assert.equal(Hero.canDrop(h, core).kind, 'dropping');
  // Core dead blocks BOTH paths.
  h.status = 'dead'; h.deathTick = 0;
  assert.equal(Hero.canDrop(h, { ...core, coreAlive: false }).kind, 'core');
  assert.ok(Hero.canDrop(h, { ...core, coreAlive: false }).reason.includes('no redeploy'));
  // No passable tile near the core.
  h.status = 'reserve';
  assert.equal(Hero.canDrop(h, { ...core, dropTile: null }).kind, 'notile');
  // Voluntary cooldown: 200 ticks free-after-10s.
  h.withdrawTick = 1000;
  let cd = Hero.canDrop(h, { ...core, tick: 1199 });
  assert.equal(cd.kind, 'cooldown'); assert.ok(cd.reason.includes('1s'));
  assert.equal(Hero.canDrop(h, { ...core, tick: 1200 }).ok, true);
  // Death path: time binds before scrap, then scrap binds.
  h.status = 'dead'; h.deathTick = 1000;
  assert.equal(Hero.canDrop(h, { ...core, tick: 1599, scrap: 0 }).kind, 'cooldown');
  const broke = Hero.canDrop(h, { ...core, tick: 1600, scrap: 199 });
  assert.equal(broke.kind, 'scrap'); assert.ok(broke.reason.includes('200 scrap'));
  const paid = Hero.canDrop(h, { ...core, tick: 1600, scrap: 200 });
  assert.equal(paid.ok, true); assert.equal(paid.cost, 200);
  assert.equal(Hero.canDrop(h, { ...core, tick: 5000, scrap: 500 }).ok, true, 'waiting if broke never grows the debt or resets the timer');
});

test('phaseb: presence transitions — drop telegraph, land, withdraw keeps HP, death never reserves', () => {
  const h = Hero.startMatch(Weapons.DEFAULT_LOADOUT);
  Hero.startDrop(h, { x: 7.5, y: 25.5 }, 100, 0);
  assert.equal(h.status, 'dropping'); assert.equal(h.dropLandingTick, 140, '2 s telegraph');
  Hero.cancelDrop(h);
  assert.equal(h.status, 'reserve', 'match-end cancel returns to the pre-drop status');
  Hero.startDrop(h, { x: 7.5, y: 25.5 }, 200, 0);
  Hero.landDrop(h, 42);
  assert.equal(h.status, 'field'); assert.equal(h.unitId, 42);
  assert.equal(Hero.canDrop(h, { coreAlive: true, scrap: 500, tick: 300, dropTile: { x: 1, y: 1 } }).kind, 'field');
  Hero.withdraw(h, 40, 300);
  assert.equal(h.status, 'reserve'); assert.equal(h.hp, 40, 'withdrawal keeps exact HP — not a heal');
  assert.equal(h.unitId, 0);
  Hero.startDrop(h, { x: 7.5, y: 25.5 }, 500, 0);
  Hero.landDrop(h, 43);
  Hero.die(h, 600);
  assert.equal(h.status, 'dead'); assert.equal(h.hp, 0); assert.equal(h.deathTick, 600);
  Hero.cancelDrop(h);
  assert.equal(h.status, 'dead', 'cancel after death never returns a dead hero to reserve');
});

// ---- Sim integration ----

test('phaseb: withdrawal removes the unit with no wreck, no scrap change', () => {
  const s = testGame();
  const before = Sim.scrapOf(s, 'iron_eden');
  const hu = heroUnit(s, null);
  assert.equal(Sim.withdrawUnit(s, hu.id).ok, true);
  assert.equal(s.units.some((u) => u.id === hu.id), false);
  assert.equal(s.wrecks.length, 0);
  assert.equal(Sim.scrapOf(s, 'iron_eden'), before);
  assert.equal(Sim.withdrawUnit(s, hu.id).ok, false);
});

test('phaseb: hero death leaves the normal wreck — 152 scrap, 120 s decay', () => {
  const s = testGame();
  const hu = heroUnit(s, null);
  hu.hp = 0; hu.alive = false;
  stepN(s, 1);
  assert.equal(s.wrecks.length, 1);
  assert.equal(s.wrecks[0].baseValue, 152, 'floor(0.4 x 380)');
  assert.equal(s.wrecks[0].expiresTick - s.wrecks[0].createdTick, 2400);
  assert.equal(s.units.some((u) => u.id === hu.id), false);
});

test('phaseb: drop location — core-adjacent passable tile, never water/rock; no-tile case', () => {
  const s = firstGame();
  const core = s.structures.find((st) => st.faction === 'iron_eden' && st.typeId === 'command_core');
  const pos = Sim.spawnPosition(s, core, 'ground');
  assert.ok(pos, 'a drop tile exists next to the First Map core');
  const t = Sim.terrainAt(s, Math.floor(pos.x), Math.floor(pos.y));
  assert.ok(t !== Sim.T.WATER && t !== Sim.T.ROCK, 'drop tile is passable ground');
  // All-water map: no passable tile in rings 1..5.
  const w = Sim.createGame({ catalog, width: 20, height: 20, terrain: new Uint8Array(400).fill(Sim.T.WATER), seed: 1 });
  const wc = Sim.addStructure(w, 'command_core', 'iron_eden', 10, 10);
  assert.equal(Sim.spawnPosition(w, wc, 'ground'), null);
  const h = Hero.startMatch(Weapons.DEFAULT_LOADOUT);
  assert.equal(Hero.canDrop(h, { coreAlive: true, scrap: 500, tick: 0, dropTile: null }).kind, 'notile');
});

test('phaseb: elimination fires with a healthy hero in reserve; reserve is not an elimination target', () => {
  const s = firstGame();
  Hero.applyRoster(s);
  const h = Hero.startMatch(Weapons.DEFAULT_LOADOUT); // reserve: not a sim entity
  assert.equal(s.units.some((u) => u.isHero), false, 'reserve hero is absent from field lists');
  s.units = s.units.filter((u) => u.faction !== 'iron_eden');
  s.structures = s.structures.filter((st) => st.faction !== 'iron_eden');
  stepN(s, 1);
  assert.equal(s.winner, 'xandria', 'defeat despite a healthy reserve hero — redeploy needs a living core');
  assert.ok(h.status === 'reserve', 'shell hero state untouched by the sim result');
});

test('phaseb: deadlock detector — reserve hero neither prevents nor causes a draw; field hero counts normally', () => {
  // Air-only, cores dead, no hero entity: deadlock holds, draw at 600.
  const s = testGame();
  Sim.addUnit(s, 'sensor_drone', 'iron_eden', 10, 10);
  Sim.addUnit(s, 'sensor_drone', 'xandria', 30, 10);
  s.factionsSeen = { iron_eden: true, xandria: true };
  // sensor_drone weapons: none (verified below) — neither side can damage.
  assert.equal(s.units[0].weapons.length, 0);
  assert.equal(Sim.checkDeadlock(s), true, 'air-only weaponless sides deadlock even with a reserve hero object existing off-sim');
  stepN(s, 600);
  assert.equal(s.winner, 'draw');
  // Field hero that CAN damage a ground enemy: no deadlock.
  const s2 = testGame();
  heroUnit(s2, null);
  Sim.addUnit(s2, 'scout_buggy', 'xandria', 14, 25);
  s2.factionsSeen = { iron_eden: true, xandria: true };
  assert.equal(Sim.checkDeadlock(s2), false, 'a field hero with a ground-capable weapon is damage capability');
});

test('phaseb: red AI treats a field hero as an ordinary enemy unit', () => {
  const s = testGame();
  const hu = heroUnit(s, null);
  const red = Sim.addUnit(s, 'scout_buggy', 'xandria', 13, 25);
  // Hold-order units auto-engage via acquireTarget inside step(); the
  // target is local to step, so the observable is damage, not a field.
  Sim.issueOrder(s, [red.id], { kind: 'hold' });
  const hpBefore = hu.hp;
  stepN(s, 40);
  assert.ok(hu.hp < hpBefore, 'red hold unit fires on the hero exactly like any blue unit');
});

test('phaseb: specials — overheat forces a 1.5 s cooldown after 4 s continuous fire', () => {
  const s = testGame();
  const w = Weapons.resolveWeapon(Weapons.rowById('nw_scrapstorm_rotary_gun'));
  w.accuracy = 1; // remove the accuracy roll so the firing cadence is deterministic
  const u = Sim.addCustomUnit(s, { typeId: 'lancer_mech', faction: 'iron_eden', x: 12, y: 20, hp: 200, maxHp: 200,
    armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55, movementClass: 'ground', weapons: [w], isHero: false, costScrap: 0 });
  // A 1000-HP weaponless target: a 60-HP scout dies at shot 6, before
  // the 8th shot that would overheat — the target must outlive the run.
  Sim.addCustomUnit(s, { typeId: 'scout_buggy', faction: 'xandria', x: 14, y: 20, hp: 1000, maxHp: 1000,
    armor: 'Light', speed: 7.0, vision: 10, radius: 0.4, movementClass: 'ground', weapons: [], isHero: false, costScrap: 0 });
  Sim.issueOrder(s, [u.id], { kind: 'hold' });
  let sawOverheat = false;
  for (let i = 0; i < 300 && !sawOverheat; i++) {
    Sim.step(s);
    if (u.cooldowns[0] === 1.5) sawOverheat = true;
  }
  assert.equal(sawOverheat, true, 'after ~8 shots (4 s) the next cooldown is the forced 1.5 s');
  // Gap reset: a lone shot after a long silence does not overheat.
  const s2 = testGame();
  const w2 = Weapons.resolveWeapon(Weapons.rowById('nw_scrapstorm_rotary_gun'));
  const u2 = Sim.addCustomUnit(s2, { typeId: 'lancer_mech', faction: 'iron_eden', x: 12, y: 20, hp: 200, maxHp: 200,
    armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55, movementClass: 'ground', weapons: [w2], isHero: false, costScrap: 0 });
  assert.equal(Sim.noteFired(s2, u2, 0, w2), 0, 'first shot never overheats');
});

test('phaseb: specials — pierce hits one extra enemy at 50%, stun halves speed, burn zones tick and expire', () => {
  // Pierce (projectile path): two enemies within 2 tiles of the impact.
  const s = testGame();
  const rp = Weapons.resolveWeapon(Weapons.rowById('nw_railspike')); rp.accuracy = 1;
  const atk = Sim.addCustomUnit(s, { typeId: 'lancer_mech', faction: 'iron_eden', x: 12, y: 20, hp: 200, maxHp: 200,
    armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55, movementClass: 'ground', weapons: [rp], isHero: false, costScrap: 0 });
  // Railspike minRange 6: targets must sit beyond it, pierce victim
  // within 2 tiles of the impact point.
  const t1 = Sim.addUnit(s, 'scout_buggy', 'xandria', 19, 20);
  const t2 = Sim.addUnit(s, 'scout_buggy', 'xandria', 20, 20);
  Sim.issueOrder(s, [atk.id], { kind: 'attack', targetId: t1.id });
  stepN(s, 5);
  assert.ok(t1.hp < 60, 'direct target damaged');
  assert.ok(t2.hp < 60 && t2.hp > t1.hp, 'pierce victim takes 50% (less than the direct hit, more than zero)');
  // Stun: target speed halves while slowUntil holds.
  const s2 = testGame();
  const emp = Weapons.resolveWeapon(Weapons.rowById('nw_emp_carbine')); emp.accuracy = 1;
  const atk2 = Sim.addCustomUnit(s2, { typeId: 'lancer_mech', faction: 'iron_eden', x: 12, y: 20, hp: 200, maxHp: 200,
    armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55, movementClass: 'ground', weapons: [emp], isHero: false, costScrap: 0 });
  const vic = Sim.addUnit(s2, 'salvage_team', 'xandria', 14, 20);
  Sim.issueOrder(s2, [atk2.id], { kind: 'attack', targetId: vic.id });
  // (25,20) is grass on the test map; (30,20) is the river, unpathable.
  Sim.issueOrder(s2, [vic.id], { kind: 'move', x: 25, y: 20 });
  stepN(s2, 10);
  assert.ok(vic.slowUntil >= s2.tick, 'stun applied slowUntil');
  const stunnedX = vic.x;
  const s3 = testGame();
  const free = Sim.addUnit(s3, 'salvage_team', 'xandria', 14, 20);
  Sim.issueOrder(s3, [free.id], { kind: 'move', x: 25, y: 20 });
  stepN(s3, 10);
  assert.ok(stunnedX - 14 < free.x - 14, 'stunned unit covers less ground than the same unit unstunned');
  // Burn: instant hit creates a zone that ticks and expires.
  const s4 = testGame();
  const cin = Weapons.resolveWeapon(Weapons.rowById('nw_cindercoil')); cin.accuracy = 1;
  const atk4 = Sim.addCustomUnit(s4, { typeId: 'lancer_mech', faction: 'iron_eden', x: 12, y: 20, hp: 200, maxHp: 200,
    armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55, movementClass: 'ground', weapons: [cin], isHero: false, costScrap: 0 });
  const vic4 = Sim.addUnit(s4, 'scout_buggy', 'xandria', 14, 20);
  // A weaponless iron bystander keeps the match alive after the
  // attacker is withdrawn — otherwise elimination freezes the sim
  // and the zones can never expire.
  Sim.addUnit(s4, 'salvage_team', 'iron_eden', 5, 5);
  Sim.issueOrder(s4, [atk4.id], { kind: 'attack', targetId: vic4.id });
  stepN(s4, 2);
  assert.equal(s4.burnZones.length, 1, 'burn hit leaves a zone');
  const hpAfterHit = vic4.hp;
  stepN(s4, 20);
  assert.ok(vic4.hp < hpAfterHit, 'zone ticks damage over time');
  // Withdraw the attacker so no fresh zone is laid, then the last
  // zone (laid ~tick 21, 3 s life) must be gone by tick 82.
  Sim.withdrawUnit(s4, atk4.id);
  stepN(s4, 60);
  assert.equal(s4.burnZones.length, 0, 'zone expires after 3 s');
});
