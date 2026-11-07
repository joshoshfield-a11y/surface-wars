/* Landscape-first layout helpers (view.js, pure, DOM-free).
   These assert the documented layout contract that the CSS
   implements, not pixels: landscape = side panel + forced-expanded
   tray + large minimap + no rotate hint; portrait = bottom tray +
   rotate hint. A square viewport is portrait (safe fallback). */
'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const View = require('../game/view.js');

test('landscape: width > height is landscape', () => {
  assert.equal(View.isLandscape(844, 390), true);
  assert.equal(View.isLandscape(932, 430), true);
  assert.equal(View.isLandscape(1280, 800), true);
});

test('landscape: square and tall viewports are portrait', () => {
  assert.equal(View.isLandscape(390, 390), false);
  assert.equal(View.isLandscape(390, 844), false);
});

test('layoutFor landscape: side panel, tray forced expanded, big minimap, no hint', () => {
  const l = View.layoutFor(844, 390);
  assert.equal(l.orientation, 'landscape');
  assert.equal(l.trayMode, 'side');
  assert.equal(l.trayForcedExpanded, true);
  assert.equal(l.rotateHint, false);
  assert.deepEqual(l.minimap, { w: 192, h: 120 });
});

test('layoutFor portrait: bottom tray, rotate hint, small minimap', () => {
  const l = View.layoutFor(390, 844);
  assert.equal(l.orientation, 'portrait');
  assert.equal(l.trayMode, 'bottom');
  assert.equal(l.trayForcedExpanded, false);
  assert.equal(l.rotateHint, true);
  assert.deepEqual(l.minimap, { w: 132, h: 83 });
});

test('layoutFor: larger landscape keeps the same contract', () => {
  const l = View.layoutFor(932, 430);
  assert.equal(l.orientation, 'landscape');
  assert.equal(l.trayMode, 'side');
  assert.deepEqual(l.minimap, { w: 192, h: 120 });
});
