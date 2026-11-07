// WEAPONS-12H Wave 1: first-batch hero weapon tuning.
// Every assertion here is about the tuned rows and the catalog rules
// they must keep satisfying. Family baselines are NOT changed by this
// wave (they are the catalog's canonical rows); only named-row
// multipliers/specials moved, and only for the 18 rows listed below.
const test = require('node:test');
const assert = require('node:assert/strict');
const Weapons = require('../game/weapons.js');
const Prog = require('../game/progression.js');

const HERO_BASE = { hp: 200, armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55, movementClass: 'ground' };
const ANCHOR_DPS = 20.4; // Twin-Bore Autogun: 12 x 0.85 / 0.5

// id -> [damage, interval, range, special, dps] as resolved by resolveWeapon.
const TUNED = {
  nw_scrapstorm_rotary_gun: [10.8, 0.33, 6, 'overheat', 27.82],
  nw_hailstorm_minigun: [12, 0.35, 5, 'overheat', 29.14],
  nw_widowmaker_lmg: [14.4, 0.65, 6, 'none', 18.83],
  nw_sawtooth_repeater: [9.6, 0.35, 6, 'none', 23.31],
  nw_thunderclap_autocannon: [10.2, 0.5, 7, 'none', 17.34],
  nw_double_feed: [32.2, 1.5, 7, 'none', 17.17],
  nw_slugger_cannon: [25.2, 1.2, 8, 'pierce', 16.80],
  nw_bonecrusher: [36.4, 1.68, 7, 'none', 17.33],
  nw_meltdown_cannon: [14.4, 0.7, 6, 'none', 18.51],
  nw_helios_projector: [13.6, 0.7, 10, 'none', 17.49],
  nw_horizon_cutter: [12.8, 0.45, 8, 'none', 25.60],
  nw_capacitor_rifle: [30, 2.45, 20, 'none', 11.63],
  nw_arc_thrower: [48, 4.38, 20, 'none', 10.41],
  nw_furnace_shotgun: [10.8, 0.39, 3, 'burn', 24.92],
  nw_plasma_machete: [25, 0.8, 1.5, 'none', 29.69],
  nw_guillotine_arm: [35, 1.2, 1.2, 'none', 27.71],
  nw_phase_cutter: [20, 0.56, 1.2, 'pierce', 33.93],
  nw_bellringer: [30, 1.04, 1.2, 'stun', 27.40]
};

function dpsOf(w) { return w.damage * w.accuracy / w.interval; }

test('weapons12h: nothing removed — still 123 named rows, 12 family baselines', () => {
  // WAVE 4 JUSTIFIED CHANGE: 123 -> 125. Nothing was removed: the
  // original 123 rows are all still present (herophaseb asserts
  // them verbatim); the wave adds exactly 2 premium-only rows.
  assert.equal(Weapons.NAMED_WEAPONS.length, 125);
  assert.equal(Object.keys(Weapons.FAMILY_BASELINES).length, 12);
});

test('weapons12h: every row satisfies <=2 multipliers + <=1 closed-list special + valid family/slot/tier', () => {
  const multKeys = ['dmg', 'range', 'int'];
  for (const r of Weapons.NAMED_WEAPONS) {
    assert.ok(Weapons.FAMILY_BASELINES[r.family], r.id + ' unknown family ' + r.family);
    assert.ok(['primary', 'secondary', 'utility'].includes(r.slot), r.id + ' bad slot ' + r.slot);
    assert.ok([1, 2, 3].includes(r.tier), r.id + ' bad tier ' + r.tier);
    const keys = Object.keys(r.mult || {});
    assert.ok(keys.length <= 2, r.id + ' has ' + keys.length + ' multipliers: ' + keys.join(','));
    for (const k of keys) assert.ok(multKeys.includes(k), r.id + ' multiplier key ' + k + ' is not resolved by resolveWeapon');
    assert.ok(Weapons.SPECIALS.includes(r.special), r.id + ' special ' + r.special + ' outside the closed list');
  }
});

test('weapons12h: no row exceeds 1.5x its own family baseline DPS', () => {
  for (const r of Weapons.NAMED_WEAPONS) {
    const w = Weapons.resolveWeapon(r);
    const b = Weapons.FAMILY_BASELINES[r.family];
    const baseDps = b.damage * b.accuracy / b.interval;
    assert.ok(dpsOf(w) <= 1.5 * baseDps + 1e-9,
      r.id + ' DPS ' + dpsOf(w).toFixed(2) + ' exceeds 1.5x baseline ' + baseDps.toFixed(2));
  }
});

test('weapons12h: tuned rows resolve to their retuned values', () => {
  assert.equal(Object.keys(TUNED).length, 18, 'batch size is 18');
  for (const [id, [dmg, int, range, special, dps]] of Object.entries(TUNED)) {
    const w = Weapons.resolveWeapon(Weapons.rowById(id));
    assert.equal(w.damage, dmg, id + ' damage');
    assert.equal(w.interval, int, id + ' interval');
    assert.equal(w.range, range, id + ' range');
    assert.equal(w.special, special, id + ' special');
    assert.ok(Math.abs(dpsOf(w) - dps) < 0.01, id + ' DPS ' + dpsOf(w).toFixed(2) + ' != ' + dps);
  }
});

test('weapons12h: tuned primaries stay within 1.5x the L1 anchor DPS', () => {
  for (const [id] of Object.entries(TUNED)) {
    const r = Weapons.rowById(id);
    if (r.slot !== 'primary') continue;
    const w = Weapons.resolveWeapon(r);
    assert.ok(dpsOf(w) <= 1.5 * ANCHOR_DPS,
      id + ' primary DPS ' + dpsOf(w).toFixed(2) + ' exceeds 1.5x anchor ' + (1.5 * ANCHOR_DPS));
  }
});

test('weapons12h: tier-band gating still rejects out-of-band rows and accepts in-band rows', () => {
  const base = { secondary: null, armor: null, mobility: null, reactor: null, sensor: null, ability: null };
  const opts = (cap) => ({ chassis: 'Lancer', movementClass: 'ground', phaseTierCap: cap, levelBand: true });
  // Every tuned row is rejected below its band and accepted at its band.
  for (const [id] of Object.entries(TUNED)) {
    const r = Weapons.rowById(id);
    if (r.slot === 'secondary') continue; // secondary tier rule is covered below, not by the band alone
    const below = Weapons.validateLoadout({ ...base, primary: id }, opts(r.tier - 1));
    assert.equal(below.ok, false, id + ' tier ' + r.tier + ' must be rejected at cap ' + (r.tier - 1));
    const at = Weapons.validateLoadout({ ...base, primary: id }, opts(r.tier));
    assert.equal(at.ok, true, id + ' tier ' + r.tier + ' must validate at cap ' + r.tier + ': ' + at.reasons.join(' '));
  }
  // Secondary tier must not exceed primary tier (cap 3 isolates the rule).
  const bad = Weapons.validateLoadout({ ...base, primary: 'nw_twin_bore_autogun', secondary: 'nw_plasma_machete' },
    { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: 3 });
  assert.equal(bad.ok, false);
  const good = Weapons.validateLoadout({ ...base, primary: 'nw_hailstorm_minigun', secondary: 'nw_guillotine_arm' },
    { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: 3 });
  assert.equal(good.ok, true, 'T3 secondary under a T3 primary validates: ' + good.reasons.join(' '));
  // Progression tier bands are unchanged: T1 1-3, T2 4-6, T3 7+.
  assert.equal(Prog.tierBand(1), 1); assert.equal(Prog.tierBand(4), 2); assert.equal(Prog.tierBand(7), 3);
});

test('weapons12h: heroStats resolves every tuned row without error, at L1 and at its band level', () => {
  for (const [id] of Object.entries(TUNED)) {
    const r = Weapons.rowById(id);
    const loadout = r.slot === 'primary'
      ? { primary: id, secondary: null, armor: null, mobility: null, reactor: null, sensor: null, ability: null }
      : { primary: 'nw_hailstorm_minigun', secondary: id, armor: null, mobility: null, reactor: null, sensor: null, ability: null };
    const st1 = Weapons.heroStats(loadout, HERO_BASE, { level: 1, skills: [] });
    assert.ok(st1.weapons.length >= 1, id + ' resolves no weapons at L1');
    const level = r.tier >= 3 ? 7 : (r.tier === 2 ? 4 : 1);
    const stB = Weapons.heroStats(loadout, HERO_BASE, { level, skills: [] });
    assert.ok(stB.weapons.length >= 1, id + ' resolves no weapons at level ' + level);
    // Tuning rows alone never changes the hero chassis: HP/speed/vision
    // at L1 are the lancer anchor regardless of weapon.
    assert.equal(st1.maxHp, 200); assert.equal(st1.speed, 6.0); assert.equal(st1.vision, 8);
  }
});

test('weapons12h: L1 anchor unchanged — default loadout heroStats equals the lancer baseline', () => {
  const st = Weapons.heroStats(Weapons.DEFAULT_LOADOUT, HERO_BASE);
  assert.equal(st.maxHp, 200); assert.equal(st.armor, 'Medium');
  assert.equal(st.speed, 6.0); assert.equal(st.vision, 8);
  assert.equal(st.weapons.length, 1);
  assert.equal(st.weapons[0].name, 'Twin-Bore Autogun');
  assert.equal(st.weapons[0].damage, 12); assert.equal(st.weapons[0].interval, 0.5);
  assert.equal(st.weapons[0].range, 6);
  assert.ok(Math.abs(dpsOf(st.weapons[0]) - ANCHOR_DPS) < 1e-9);
  assert.ok(Weapons.validateLoadout(Weapons.DEFAULT_LOADOUT,
    { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: 1 }).ok);
});

test('weapons12h: family baselines untouched (spot values for all 12 families)', () => {
  const expect = {
    'Autocannon': [12, 6, 0.5, 0.85], 'Heavy Cannon': [28, 7, 1.2, 0.80],
    'Missile Launcher': [22, 9, 1.4, 0.85], 'Rocket Artillery': [30, 16, 3.0, 0.80],
    'Railgun': [40, 20, 3.5, 0.95], 'Mortar': [20, 12, 2.0, 0.80],
    'Flamethrower': [9, 3, 0.3, 0.90], 'Anti-air Cannon': [10, 7, 0.4, 0.85],
    'Laser': [16, 8, 0.7, 0.90], 'Siege Cannon': [55, 18, 4.0, 0.80],
    'Melee Weapon': [25, 1.2, 0.8, 0.95], 'Electronic Warfare': [6, 7, 2.0, 0.90]
  };
  for (const [fam, [dmg, range, int, acc]] of Object.entries(expect)) {
    const b = Weapons.FAMILY_BASELINES[fam];
    assert.equal(b.damage, dmg, fam + ' damage'); assert.equal(b.range, range, fam + ' range');
    assert.equal(b.interval, int, fam + ' interval'); assert.equal(b.accuracy, acc, fam + ' accuracy');
  }
});
