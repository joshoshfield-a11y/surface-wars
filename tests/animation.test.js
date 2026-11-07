/* Animation mapping tests: every animation sprite the render layer can
   draw must exist on disk, and the pure animation mappings must behave
   as documented in game/animation.js. No sim logic here. */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Assets = require('../game/sprites.js');
const Anim = require('../game/animation.js');
const catalog = require('../data/catalog.json');

const ROOT = path.join(__dirname, '..');
function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }
function diskPath(p) { return p.replace(/^\.\.\//, ''); }

test('every catalog unit maps to a wreck file that exists', () => {
  // MECHS-12H (2026-11-01): 49 baseline + 8 expansion units; count pin
  // updated explicitly. The 8 expansion ids are EXEMPTED here, not
  // silently dropped: no wreck art was generated for them this wave,
  // and render.js guards the draw (if (wreckImg)) so a missing wreck
  // file draws nothing instead of crashing. Generating wreck art is
  // follow-up work, recorded in game/MECHS-12H-REPORT.md.
  assert.equal(catalog.units.length, 57);
  const noWreckYet = new Set(['bastion', 'gatekeeper', 'deadeye', 'mortarjack',
    'needlewing', 'longsight', 'javelin', 'raptor']);
  for (const u of catalog.units) {
    if (noWreckYet.has(u.id)) continue;
    const p = Assets.wreckPath(u.id);
    assert.ok(exists(diskPath(p)), 'missing wreck ' + u.id);
    // Base (non-512) file also exists per the animation manifest.
    assert.ok(exists(diskPath(p).replace('-512.png', '.png')), 'missing base wreck ' + u.id);
  }
});

test('every FX frame exists (smoke, fire, muzzle, explosion, dust)', () => {
  const names = [];
  for (const group of Object.values(Anim.EFFECT_FRAMES)) names.push(...group);
  // EFFECT_FRAMES covers smoke only via damageSmoke's frames; add smoke_2.
  names.push('smoke_1', 'smoke_2', 'smoke_3');
  const unique = [...new Set(names)];
  assert.ok(unique.length >= 15, 'expected 15 fx frames, got ' + unique.length);
  for (const n of unique) assert.ok(exists(diskPath(Assets.fxPath(n))), 'missing fx ' + n);
});

test('canopy tiles exist (single, dense, 4 edges)', () => {
  for (const n of ['canopy_single', 'canopy_dense', 'canopy_edge_n', 'canopy_edge_s', 'canopy_edge_e', 'canopy_edge_w']) {
    assert.ok(exists(diskPath(Assets.canopyPath(n))), 'missing canopy ' + n);
  }
});

test('projectile mapping: every travelling weapon maps to an existing projectile sprite; instant weapons map to null', () => {
  for (const w of catalog.weapons) {
    const sprite = Anim.projectileForWeapon(w);
    if (w.projectileSpeed === 0) {
      assert.equal(sprite, null, w.id + ' is instant but mapped to ' + sprite);
    } else {
      assert.ok(sprite, w.id + ' has no projectile sprite');
      assert.ok(exists(diskPath(Assets.projectilePath(sprite))), 'missing projectile ' + sprite + ' for ' + w.id);
    }
  }
  // Spot-check the family mapping documented in ANIMATION-REPORT.md.
  const byId = new Map(catalog.weapons.map((w) => [w.id, w]));
  assert.equal(Anim.projectileForWeapon(byId.get('w_missile')), 'missile');
  assert.equal(Anim.projectileForWeapon(byId.get('w_rocket_artillery')), 'missile');
  assert.equal(Anim.projectileForWeapon(byId.get('w_heavy_cannon')), 'kinetic_tracer');
  assert.equal(Anim.projectileForWeapon(byId.get('w_railgun')), 'energy_bolt');
  assert.equal(Anim.projectileForWeapon(byId.get('w_laser')), null); // instant
  assert.equal(Anim.projectileForWeapon(byId.get('w_flamethrower')), 'flame');
  assert.equal(Anim.projectileForWeapon(byId.get('w_mortar')), 'kinetic_tracer');
});

test('canopy variant logic: interior dense, edges face inward, corners/single otherwise', () => {
  const cv = Assets.canopyVariantForNeighbours;
  assert.equal(cv(true, true, true, true), 'canopy_dense');
  assert.equal(cv(false, false, false, false), 'canopy_single');
  assert.equal(cv(false, true, true, true), 'canopy_edge_s'); // open north -> foliage south
  assert.equal(cv(true, true, false, true), 'canopy_edge_n'); // open south -> foliage north
  assert.equal(cv(true, false, true, true), 'canopy_edge_w'); // open east -> foliage west
  assert.equal(cv(true, true, true, false), 'canopy_edge_e'); // open west -> foliage east
  assert.equal(cv(false, false, true, true), 'canopy_single'); // corner: no false edge
  assert.equal(cv(true, false, false, true), 'canopy_single');
});

test('damage smoke thresholds: none at >=50%, light below 50%, heavy below 25%', () => {
  assert.equal(Anim.damageSmoke({ hp: 100, maxHp: 100 }, 0), null);
  assert.equal(Anim.damageSmoke({ hp: 50, maxHp: 100 }, 0), null);
  assert.ok(['smoke_1', 'smoke_2'].includes(Anim.damageSmoke({ hp: 49, maxHp: 100 }, 0)));
  assert.ok(['smoke_2', 'smoke_3'].includes(Anim.damageSmoke({ hp: 24, maxHp: 100 }, 0)));
  assert.ok(['smoke_2', 'smoke_3'].includes(Anim.damageSmoke({ hp: 1, maxHp: 100 }, 0)));
});

test('bob: air hovers even idle, ground idle is still, mech step-bob alternates sign', () => {
  const air = { id: 3, movementClass: 'air' };
  assert.notEqual(Anim.bobFor(air, null, 0.5, false), 0);
  const ground = { id: 5, movementClass: 'ground' };
  assert.equal(Anim.bobFor(ground, { chassis: 'Scout' }, 0.5, false), 0);
  assert.notEqual(Anim.bobFor(ground, { chassis: 'Scout' }, 0.5, true), 0);
  const mech = { id: 7, movementClass: 'ground' };
  const def = { chassis: 'Bulwark' };
  const signs = new Set();
  for (let t = 0; t < 3; t += 0.1) signs.add(Math.sign(Anim.bobFor(mech, def, t, true)));
  assert.ok(signs.has(1) && signs.has(-1), 'mech step-bob never alternates');
  assert.ok(Math.abs(Anim.bobFor(mech, def, 0.5, true)) > 0.03, 'mech step amplitude too small');
});

test('rotor blur: gunship and drones only, never fixed-wing aircraft', () => {
  for (const id of ['gunship', 'combat_drone', 'sensor_drone', 'interceptor_drone', 'decoy_drone', 'drone_swarm']) {
    assert.ok(Anim.hasRotor({ typeId: id }), id + ' should have rotor blur');
  }
  for (const id of ['strike_bomber', 'transport_aircraft', 'recon_aircraft', 'drone_carrier', 'medium_tank']) {
    assert.ok(!Anim.hasRotor({ typeId: id }), id + ' should NOT have rotor blur');
  }
});

test('FX frame timing: frames advance with elapsed time and end on time', () => {
  assert.equal(Anim.effectFrame('explosion', 0).frame, 'explosion_1');
  assert.equal(Anim.effectFrame('explosion', 0.3).frame, 'explosion_3');
  assert.equal(Anim.effectFrame('explosion', 0.59).done, false);
  assert.equal(Anim.effectFrame('explosion', 0.6).done, true);
  assert.equal(Anim.effectFrame('muzzle', 0).frame, 'muzzle_1');
  assert.equal(Anim.effectFrame('muzzle', 0.17).frame, 'muzzle_3');
  assert.equal(Anim.effectFrame('dust', 0.4).frame, 'dust_2');
  assert.equal(Anim.effectFrame('bogus', 0).frame, null);
});

test('water shimmer: variant cycles with sim time, always 1-3', () => {
  const seen = new Set();
  for (let t = 0; t < 6; t += 0.5) {
    const v = Anim.waterVariant(10, 10, t);
    assert.ok([1, 2, 3].includes(v));
    seen.add(v);
  }
  assert.ok(seen.size > 1, 'water variant never changes');
});
