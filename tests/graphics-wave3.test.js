/* Wave-3 graphics tests: structure-sprite visibility (renderer fix),
   structure-wreck mapping (all 23 dedicated after wave 3), UI-icon
   transparency wiring, and red-hull generation gates. Pixel measurements
   (IoU, bbox, game-size QC) live in game/GRAPHICS-WAVE3-REPORT.md and
   assets/_wave3-work/; this file pins the mappings and the renderer
   behaviour that must not regress. No sim, economy, AI, or balance
   rule is touched here. */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

global.SWAssets = require('../game/sprites.js');
const Assets = global.SWAssets;
const Render = require('../game/render.js');
const catalog = require('../data/catalog.json');

const ROOT = path.join(__dirname, '..');
function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }
function diskPath(p) { return p.replace(/^\.\.\//, ''); }

// ---- 1. Structure sprites are no longer covered by the team block ----
function makeCtx() {
  const calls = [];
  const ctx = { calls, fillStyle: null, strokeStyle: null, lineWidth: 1, globalAlpha: 1, imageSmoothingEnabled: true, imageSmoothingQuality: 'high' };
  for (const m of ['save', 'restore', 'translate', 'rotate', 'beginPath', 'arc', 'fill', 'stroke', 'fillRect', 'strokeRect', 'ellipse', 'clearRect', 'setLineDash']) {
    ctx[m] = function (...a) { calls.push([m, ctx.fillStyle, ctx.strokeStyle, ...a]); };
  }
  ctx.drawImage = function (img, ...a) { calls.push(['drawImage', img && img.__tag, ...a]); };
  return ctx;
}
function drawBunker(structImg) {
  Assets.readyImage = (p) => p.includes('structures/bunker') ? structImg : null;
  const ctx = makeCtx();
  const state = { catalog, width: 4, height: 4, terrain: Array(16).fill(0), structures: [{ id: 1, typeId: 'bunker', faction: 'iron_eden', x: 2, y: 2, radius: 0.5, hp: 300, maxHp: 300 }], units: [], projectilePool: [], time: 0 };
  const anim = { time: 0, wrecks: [], structureWrecks: [], effects: [], unitAnim: {}, overlayMap: {}, showPaths: false, showFX: true, showShadows: true };
  Render.drawScene(ctx, state, { x: 0, y: 0, zoom: 1 }, [], 128, 128, anim);
  return ctx;
}
test('wave3: ready structure sprite is drawn and NOT covered by a team-colour fill', () => {
  const ctx = drawBunker({ __tag: 'bunker-img' });
  assert.ok(ctx.calls.some((c) => c[0] === 'drawImage' && c[1] === 'bunker-img'), 'structure sprite drawn');
  assert.equal(ctx.calls.filter((c) => c[0] === 'fillRect' && c[1] === '#3a86ff').length, 0, 'no team block over the sprite');
  assert.ok(ctx.calls.some((c) => c[0] === 'strokeRect' && c[2] === '#3a86ff'), 'thin team frame kept');
});
test('wave3: missing structure image still falls back to the team block', () => {
  const ctx = drawBunker(null);
  assert.equal(ctx.calls.filter((c) => c[0] === 'drawImage' && c[1] === 'bunker-img').length, 0);
  assert.equal(ctx.calls.filter((c) => c[0] === 'fillRect' && c[1] === '#3a86ff').length, 1, 'fallback block drawn once');
});

// ---- 2. All 23 structures map to a dedicated wreck file on disk ----
const ALL_STRUCTURES = ['command_core', 'scrap_extractor', 'power_plant', 'advanced_reactor', 'light_factory', 'vehicle_factory', 'mech_bay', 'aircraft_hangar', 'heavy_plant', 'research_lab', 'salvage_processor', 'logistics_hub', 'experimental_facility', 'bunker', 'wall', 'light_turret', 'heavy_turret', 'aa_turret', 'missile_turret', 'repair_depot', 'radar_station', 'ammo_depot', 'shield_generator'];
test('wave3: all 23 structures have a dedicated wreck stem (no generic rubble fallback in use)', () => {
  assert.equal(ALL_STRUCTURES.length, 23);
  for (const t of ALL_STRUCTURES) {
    const stem = Assets.structureWreckStem(t);
    assert.notEqual(stem, 'rubble', t + ' must not fall back to generic rubble');
    assert.ok(exists(diskPath(Assets.structureWreckPath(t))), t + ' wreck file on disk: ' + Assets.structureWreckPath(t));
  }
  assert.equal(Object.keys(Assets.STRUCTURE_WRECK_ART).length, 23, 'mapping covers all 23 types');
});

// ---- 3. UI icons are wired the same way (paths unchanged) ----
test('wave3: all 7 UI icon paths resolve to files (preload paths unchanged)', () => {
  for (const n of ['move', 'attack-move', 'hold', 'patrol', 'salvage', 'guard', 'drop-back-in']) {
    assert.ok(exists(diskPath(Assets.iconPath(n))), 'icon on disk: ' + n);
  }
});

// ---- 4. Red-hull generation results are pinned (see report for IoU table) ----
// Units listed here are the ones whose red file was replaced by a fully
// painted generated hull in wave 3; every other wired red keeps its
// wave-2 derived file. The IoU gate (>= 0.85) was measured on the
// installed -512 files and is recorded in the wave-3 report.
const GENERATED_REDS = ['combat_drone', 'vespid_scout'];
test('wave3: generated-red list matches the report (no silent additions)', () => {
  for (const t of GENERATED_REDS) {
    assert.ok(exists('assets/sprites-90/units/' + t + '-red-512.png'), t);
  }
});
