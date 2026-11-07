/* Sprite/terrain/overlay mapping test: every id the prototype can draw
   must map to a file that actually exists on disk. No sim logic here. */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Assets = require('../game/sprites.js');
const catalog = require('../data/catalog.json');

const ROOT = path.join(__dirname, '..');
function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }
// sprites.js paths are relative to game/ (../assets/...); strip the prefix.
function diskPath(p) { return p.replace(/^\.\.\//, ''); }

test('every catalog unit maps to blue and red -512 sprites on disk', () => {
  // MECHS-12H (2026-11-01): 49 baseline + 8 expansion units; count pin
  // updated explicitly so a silent add/remove still fails this test.
  assert.equal(catalog.units.length, 57);
  for (const u of catalog.units) {
    assert.ok(exists(diskPath(Assets.unitPath(u.id, 'iron_eden'))), 'missing blue ' + u.id);
    assert.ok(exists(diskPath(Assets.unitPath(u.id, 'xandria'))), 'missing red ' + u.id);
  }
});

test('every catalog structure maps to blue and red -512 sprites on disk', () => {
  assert.equal(catalog.structures.length, 23);
  for (const s of catalog.structures) {
    assert.ok(exists(diskPath(Assets.structurePath(s.id, 'iron_eden'))), 'missing blue ' + s.id);
    assert.ok(exists(diskPath(Assets.structurePath(s.id, 'xandria'))), 'missing red ' + s.id);
  }
});

test('team mapping: iron_eden is blue (no suffix), xandria is red', () => {
  assert.equal(Assets.teamSuffix('iron_eden'), '');
  assert.equal(Assets.teamSuffix('xandria'), '-red');
  assert.ok(Assets.unitPath('scout_buggy', 'iron_eden').endsWith('scout_buggy-512.png'));
  assert.ok(Assets.unitPath('scout_buggy', 'xandria').endsWith('scout_buggy-red-512.png'));
});

test('every sim terrain id maps to all 3 base variants on disk', () => {
  const expected = { 0: 'grass', 1: 'dirt', 2: 'water_plain', 3: 'forest_floor', 4: 'water_plain', 5: 'rocky_ground' };
  for (const [id, type] of Object.entries(expected)) {
    assert.equal(Assets.TERRAIN_BASE[id], type);
    for (let v = 1; v <= 3; v++) {
      assert.ok(exists(`assets/tiles-overlay/base/${type}_v${v}-512.png`), `missing base ${type} v${v}`);
    }
    // spot-check the hash function used by basePath
    assert.ok([1, 2, 3].includes(Assets.baseVariant(0, 0)));
    assert.ok(exists(diskPath(Assets.basePath(Number(id), 3, 7))));
  }
});

test('autotile mask table covers all 15 non-zero masks, mask 0 draws nothing', () => {
  assert.equal(Assets.variantForMask(0), null);
  const seen = new Set();
  for (let m = 1; m <= 15; m++) {
    const v = Assets.variantForMask(m);
    assert.ok(v, 'no variant for mask ' + m);
    seen.add(v);
  }
  assert.equal(seen.size, 15);
  assert.equal(Assets.variantForMask(10), 'straight_ew');
  assert.equal(Assets.variantForMask(14), 't_north'); // T_north opens north (no north arm)
});

test('every overlay variant referenced by the game exists on disk', () => {
  const families = ['bridge_deck', 'train_tracks', 'road'];
  for (const fam of families) {
    for (const variant of Object.values(Assets.MASK_TO_VARIANT)) {
      assert.ok(exists(diskPath(Assets.overlayPath(fam, variant))), `missing overlay ${fam}/${variant}`);
    }
  }
  assert.ok(exists(diskPath(Assets.overlayPath('bridge_deck', 'straight_ew'))));
});

test('cosmetic demo overlays: every tile has a neighbour-derived variant, none is mask 0', () => {
  const map = Assets.demoOverlayMap();
  const keys = Object.keys(map);
  assert.ok(keys.length > 0, 'demo map is empty');
  for (const key of keys) {
    const e = map[key];
    assert.ok(e.variant, 'demo tile ' + key + ' has no variant');
    assert.ok(exists(diskPath(Assets.overlayPath(e.family, e.variant))), 'missing demo overlay ' + e.family + '/' + e.variant);
    assert.ok(e.mask >= 1 && e.mask <= 15, 'demo tile ' + key + ' mask out of range');
  }
  // Track is an L (has a corner), road is a straight line (straight_ew + ends).
  const trackVariants = new Set(Object.values(map).filter(e => e.family === 'train_tracks').map(e => e.variant));
  assert.ok([...trackVariants].some(v => v.startsWith('corner_')), 'track demo has no corner');
  const roadVariants = new Set(Object.values(map).filter(e => e.family === 'road').map(e => e.variant));
  assert.ok(roadVariants.has('straight_ew'), 'road demo has no straight_ew');
});
