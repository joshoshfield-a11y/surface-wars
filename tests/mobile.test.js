/* Mobile-first finish: pure, testable UI logic (view.js). Pixel/layout
   checks (button heights, overflow) are done in the Playwright mobile
   emulation run and reported in MOBILE-FIRST-REPORT.md, not faked here. */
'use strict';
const assert = require('node:assert');
const { test } = require('node:test');
const View = require('../game/view.js');

test('queueAppend: shift OR queue-mode appends, neither replaces', () => {
  assert.equal(View.queueAppend(false, false), false);
  assert.equal(View.queueAppend(true, false), true);
  assert.equal(View.queueAppend(false, true), true);
  assert.equal(View.queueAppend(true, true), true);
  assert.equal(View.queueAppend(undefined, undefined), false);
  assert.equal(View.queueAppend(null, 1), true);
});

test('mobile layout constants match the documented CSS numbers', () => {
  assert.equal(View.MOBILE_BREAKPOINT, 640);
  assert.equal(View.MIN_TOUCH_TARGET, 44);
  assert.ok(View.MIN_TOUCH_TARGET >= 44, 'touch target must be at least 44px');
});

test('queueAppend does not change zoom limits or path logic', () => {
  assert.equal(View.clampZoom(0.1), 0.4);
  assert.equal(View.clampZoom(9), 3);
  const unit = { x: 5, y: 5, path: [[6, 5], [7, 5]] };
  assert.deepEqual(View.pathDestination(unit, true), { x: 7.5, y: 5.5 });
  assert.equal(View.pathDestination(unit, false), null);
});
