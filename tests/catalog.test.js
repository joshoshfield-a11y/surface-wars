const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../game/catalog.js');

const unitsById = new Map(catalog.units.map((u) => [u.id, u]));
const weaponsById = new Map(catalog.weapons.map((w) => [w.id, w]));

test('catalog: no duplicate ids anywhere', () => {
  for (const [label, list] of [['units', catalog.units], ['weapons', catalog.weapons], ['factions', catalog.factions], ['structures', catalog.structures], ['chassis', catalog.chassis]]) {
    const ids = list.map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate id in ${label}`);
  }
});

test('catalog: every unit references an existing weapon, chassis, armor class, and valid category', () => {
  const categories = ['recon', 'main_battle', 'artillery', 'anti_air', 'support', 'experimental'];
  const chassisIds = new Set(catalog.chassis.map((c) => c.id));
  for (const u of catalog.units) {
    assert.ok(categories.includes(u.category), `${u.id} bad category ${u.category}`);
    assert.ok(chassisIds.has(u.chassis), `${u.id} bad chassis ${u.chassis}`);
    assert.ok(catalog.armorClasses.includes(u.armor), `${u.id} bad armor ${u.armor}`);
    assert.ok(['ground', 'hover', 'air'].includes(u.movementClass), `${u.id} bad movement ${u.movementClass}`);
    for (const wid of u.weapons) assert.ok(weaponsById.has(wid), `${u.id} missing weapon ${wid}`);
  }
});

test('catalog: every weapon references a valid family, damage type, and target class, with sane numbers', () => {
  for (const w of catalog.weapons) {
    assert.ok(catalog.weaponFamilies.includes(w.family), `${w.id} bad family ${w.family}`);
    assert.ok(catalog.damageTypes.includes(w.damageType), `${w.id} bad damage type`);
    assert.ok(catalog.armorMatrix[w.damageType], `${w.id} missing armor row`);
    for (const a of catalog.armorClasses) assert.ok(typeof catalog.armorMatrix[w.damageType][a] === 'number', `${w.id} missing matrix ${a}`);
    for (const t of w.targetClasses) assert.ok(['ground', 'air', 'structure'].includes(t), `${w.id} bad target ${t}`);
    assert.ok(w.damage >= 0 && w.range > 0 && w.range >= w.minRange && w.accuracy > 0 && w.accuracy <= 1 && w.interval > 0, `${w.id} bad numbers`);
  }
});

test('catalog: every faction roster answers armour, artillery, air, and light-mass', () => {
  function rosterUnits(f) { return f.roster.map((id) => unitsById.get(id)); }
  function has(f, pred) { return rosterUnits(f).some(pred); }
  for (const f of catalog.factions) {
    for (const id of f.roster) assert.ok(unitsById.has(id), `${f.id} roster missing unit ${id}`);
    // Anti-armour: a weapon with Siege damage, or Heavy Cannon vs Heavy targets.
    assert.ok(has(f, (u) => u.weapons.some((wid) => {
      const w = weaponsById.get(wid);
      return w.damageType === 'Siege' || (w.family === 'Heavy Cannon' && w.damage >= 25);
    })), `${f.id} has no anti-armour answer`);
    // Artillery: a unit in the artillery category.
    assert.ok(has(f, (u) => u.category === 'artillery'), `${f.id} has no artillery`);
    // Anti-air: a weapon that can hit air targets.
    assert.ok(has(f, (u) => u.weapons.some((wid) => weaponsById.get(wid).targetClasses.includes('air'))), `${f.id} has no anti-air answer`);
    // Anti-light-mass: a splash weapon or flamethrower.
    assert.ok(has(f, (u) => u.weapons.some((wid) => {
      const w = weaponsById.get(wid);
      return w.splashRadius > 0 || w.family === 'Flamethrower';
    })), `${f.id} has no anti-light-mass answer`);
  }
});

test('catalog: categories from spec section 6 are all represented', () => {
  const present = new Set(catalog.units.map((u) => u.category));
  for (const c of ['recon', 'main_battle', 'artillery', 'anti_air', 'support', 'experimental']) {
    assert.ok(present.has(c), `missing category ${c}`);
  }
  assert.ok(catalog.units.length >= 40, `roster too small: ${catalog.units.length}`);
});

test('catalog: structures reference valid armor classes', () => {
  for (const s of catalog.structures) assert.ok(catalog.armorClasses.includes(s.armor), `${s.id} bad armor`);
});
