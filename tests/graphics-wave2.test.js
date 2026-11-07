/* Wave-2 graphics tests: DPR cap, static-ground bake key, damage tiers,
   structure-wreck art mapping, badge/HP minimum on-screen sizes, and the
   thin-chassis render treatment. Pure render-layer logic only — no sim,
   economy, AI, or balance rules are touched here. */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Anim = require('../game/animation.js');
const Assets = require('../game/sprites.js');
const Render = require('../game/render.js');
const catalog = require('../data/catalog.json');

const ROOT = path.join(__dirname, '..');
function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }
function diskPath(p) { return p.replace(/^\.\.\//, ''); }
function unit(hp, maxHp) { return { hp: hp, maxHp: maxHp }; }

// ---- 1. DPR cap ----
test('DPR cap is 2: dprFor clamps above 2 and passes smaller values through', () => {
  assert.equal(Render.DPR_CAP, 2);
  assert.equal(Render.dprFor(3), 2);
  assert.equal(Render.dprFor(2.75), 2);
  assert.equal(Render.dprFor(2), 2);
  assert.equal(Render.dprFor(1.5), 1.5);
  assert.equal(Render.dprFor(1), 1);
  assert.equal(Render.dprFor(undefined), 1);
});

// ---- 2. Static-ground bake key ----
function bakeState() {
  return { width: 4, height: 3, terrain: [0, 0, 1, 1, 0, 3, 3, 4, 5, 2, 2, 4] };
}
function bakeOverlays() {
  return { '1,1': { family: 'road', variant: 'straight_ew' } };
}
test('bake key is stable for identical inputs', () => {
  assert.equal(Render.groundBakeKey(bakeState(), bakeOverlays()),
    Render.groundBakeKey(bakeState(), bakeOverlays()));
});
test('bake key changes when terrain changes', () => {
  const a = bakeState(), b = bakeState();
  b.terrain[0] = 5;
  assert.notEqual(Render.groundBakeKey(a, bakeOverlays()),
    Render.groundBakeKey(b, bakeOverlays()));
});
test('bake key changes when an overlay variant changes or an overlay is added', () => {
  const over2 = { '1,1': { family: 'road', variant: 'corner_ne' } };
  assert.notEqual(Render.groundBakeKey(bakeState(), bakeOverlays()),
    Render.groundBakeKey(bakeState(), over2));
  const over3 = { '1,1': { family: 'road', variant: 'straight_ew' },
    '2,1': { family: 'road', variant: 'straight_ew' } };
  assert.notEqual(Render.groundBakeKey(bakeState(), bakeOverlays()),
    Render.groundBakeKey(bakeState(), over3));
});
test('bake key changes when map dimensions change and is overlay-order independent', () => {
  const wide = bakeState(); wide.width = 5;
  assert.notEqual(Render.groundBakeKey(bakeState(), bakeOverlays()),
    Render.groundBakeKey(wide, bakeOverlays()));
  const o1 = { '0,0': { family: 'road', variant: 'straight_ew' },
    '1,0': { family: 'road', variant: 'straight_ns' } };
  const o2 = { '1,0': { family: 'road', variant: 'straight_ns' },
    '0,0': { family: 'road', variant: 'straight_ew' } };
  assert.equal(Render.groundBakeKey(bakeState(), o1),
    Render.groundBakeKey(bakeState(), o2));
});
test('bake tile resolution is 64 px per tile', () => {
  assert.equal(Render.BAKE_TILE_PX, 64);
});

// ---- 3. Damage tiers (50% / 25% boundaries, exact) ----
test('damage tiers: 50% is undamaged, 25% is light, below 25% is heavy', () => {
  assert.equal(Anim.damageTier(unit(100, 100)), 'none');
  assert.equal(Anim.damageTier(unit(50, 100)), 'none');
  assert.equal(Anim.damageTier(unit(49, 100)), 'light');
  assert.equal(Anim.damageTier(unit(25, 100)), 'light');
  assert.equal(Anim.damageTier(unit(24, 100)), 'heavy');
  assert.equal(Anim.damageTier(unit(0, 100)), 'heavy');
  assert.equal(Anim.damageTier(unit(10, 0)), 'none');
});
test('damage decals map tiers to generated art, none to null', () => {
  assert.equal(Anim.damageDecal(unit(80, 100)), null);
  assert.equal(Anim.damageDecal(unit(40, 100)), 'damage_light');
  assert.equal(Anim.damageDecal(unit(10, 100)), 'damage_heavy');
  assert.ok(exists(diskPath(Assets.fxPath('damage_light'))), 'missing damage_light');
  assert.ok(exists(diskPath(Assets.fxPath('damage_heavy'))), 'missing damage_heavy');
});

// ---- 4. Structure wrecks: dedicated vs generic, all files on disk ----
test('all 23 catalog structures map to a structure-wreck file that exists', () => {
  assert.equal(catalog.structures.length, 23);
  for (const s of catalog.structures) {
    assert.ok(exists(diskPath(Assets.structureWreckPath(s.id))), 'missing wreck for ' + s.id);
  }
});
// WAVE-3 CHANGE, EXPLICIT AND JUSTIFIED (see game/GRAPHICS-WAVE3-REPORT.md
// §1): wave 3 generated dedicated wreck art for the 8 types this test
// previously asserted as generic-rubble, so the generic set is now empty
// and the mapping covers all 23 types. The old expectation is superseded
// by the wave-3 scope item 1, not by a behaviour regression: every type
// still maps to a wreck file on disk (test above, unchanged), and the
// generic 'rubble' file remains on disk as an unused fallback stem.
test('dedicated wreck art covers all 23 types (wave 3 closed the generic 8)', () => {
  const dedicated = ['command_core', 'light_turret', 'heavy_turret', 'aa_turret',
    'missile_turret', 'bunker', 'wall', 'light_factory', 'scrap_extractor',
    'power_plant', 'research_lab', 'repair_depot', 'radar_station', 'ammo_depot',
    'shield_generator', 'advanced_reactor', 'vehicle_factory', 'mech_bay',
    'aircraft_hangar', 'heavy_plant', 'salvage_processor', 'logistics_hub',
    'experimental_facility'];
  assert.equal(dedicated.length, 23);
  for (const id of dedicated) assert.notEqual(Assets.structureWreckStem(id), 'rubble', id);
  // Turret types share one turret wreck (same silhouette family).
  for (const id of ['light_turret', 'heavy_turret', 'aa_turret', 'missile_turret']) {
    assert.equal(Assets.structureWreckStem(id), 'turret_wreck');
  }
  assert.equal(Object.keys(Assets.STRUCTURE_WRECK_ART).length, 23);
});

// ---- 5. Badge / HP-bar minimum on-screen sizes at zoom 0.5 / 1 / 2 ----
test('HP bars never shrink below 28x4 on-screen px at zoom 0.5, 1, or 2', () => {
  for (const zoom of [0.5, 1, 2]) {
    for (const worldW of [12, 20, 60]) {
      const m = Render.hpBarMetrics(worldW, zoom);
      assert.ok(m.w >= 28, 'width at zoom ' + zoom + ' worldW ' + worldW);
      assert.ok(m.h >= 4, 'height at zoom ' + zoom);
    }
  }
  assert.deepEqual(Render.hpBarMetrics(12, 0.5), { w: 28, h: 4 });
  assert.deepEqual(Render.hpBarMetrics(20, 1), { w: 28, h: 4 });
  assert.deepEqual(Render.hpBarMetrics(60, 2), { w: 60, h: 6 });
});
test('selection-ring line width never drops below 2 px at zoom 0.5, 1, or 2', () => {
  assert.equal(Render.ringLineWidth(0.5), 2);
  assert.equal(Render.ringLineWidth(1), 2);
  assert.equal(Render.ringLineWidth(2), 4);
});

// ---- 6. Thin-chassis treatment: zoom <= 1, lancer/longshot only ----
test('thin-chassis treatment is active only at zoom <= 1 and only for lancer/longshot', () => {
  assert.ok(Anim.THIN_CHASSIS_TYPES.includes('lancer_mech'));
  assert.ok(Anim.THIN_CHASSIS_TYPES.includes('longshot_mech'));
  for (const typeId of ['lancer_mech', 'longshot_mech']) {
    assert.equal(Anim.thinChassisTreatment(typeId, 0.5), true);
    assert.equal(Anim.thinChassisTreatment(typeId, 1), true);
    assert.equal(Anim.thinChassisTreatment(typeId, 1.5), false);
    assert.equal(Anim.thinChassisTreatment(typeId, 2), false);
  }
  for (const typeId of ['medium_tank', 'bulwark_mech', 'scout_buggy', 'heavy_tank']) {
    assert.equal(Anim.thinChassisTreatment(typeId, 0.5), false);
    assert.equal(Anim.thinChassisTreatment(typeId, 1), false);
  }
});

// ---- 7. UI icons exist on disk for all seven order buttons ----
test('all seven order-button icons exist on disk', () => {
  const names = ['move', 'attack-move', 'hold', 'patrol', 'salvage', 'guard', 'drop-back-in'];
  for (const n of names) {
    assert.ok(exists(diskPath(Assets.iconPath(n))), 'missing icon ' + n);
  }
});
