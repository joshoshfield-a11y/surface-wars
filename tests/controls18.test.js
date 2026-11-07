/* v1.8 menu-consolidation + movement-controls tests: the pure drag
   intent (View.wantsPan), the next-tap hint (View.nextTapHint), and
   the consolidated menu/tray structure in game/index.html. The shell
   (game.js) mirrors wantsPan exactly in its pointer handlers and
   writes nextTapHint into the feedback line on every state change,
   so these pure tests pin the player-facing behaviour. No mechanic,
   balance, AI, map, cost, stat, or save-format change is asserted
   here — v1.8 is UI/input only. Run: node --test tests/*.test.js */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const View = require('../game/view.js');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'game', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'game', 'style.css'), 'utf8');
const gameJs = fs.readFileSync(path.join(ROOT, 'game', 'game.js'), 'utf8');

// ---- wantsPan: drag intent matrix ----

test('wantsPan: mouse drag selects unless Pan mode is on', () => {
  assert.equal(View.wantsPan('mouse', false, false), false);
  assert.equal(View.wantsPan('mouse', true, false), true);
  assert.equal(View.wantsPan('mouse', true, true), true); // Pan wins on mouse
});

test('wantsPan: touch drag pans unless Select mode is on', () => {
  assert.equal(View.wantsPan('touch', false, false), true); // default: pan-on-drag
  assert.equal(View.wantsPan('touch', false, true), false); // Select on: drag selects
  assert.equal(View.wantsPan('touch', true, true), false); // Select wins on touch
});

test('wantsPan: pen behaves like mouse', () => {
  assert.equal(View.wantsPan('pen', false, false), false);
  assert.equal(View.wantsPan('pen', true, false), true);
});

// ---- nextTapHint: plain words per mode ----

test('nextTapHint: no selection says tap a blue unit', () => {
  const h = View.nextTapHint({ mode: 'move', selected: 0 });
  assert.match(h, /tap a blue unit/);
  assert.match(h, /Next tap/);
});

test('nextTapHint: no selection in Select mode also offers drag-select', () => {
  const h = View.nextTapHint({ mode: 'move', selected: 0, selectMode: true });
  assert.match(h, /drag to select several/);
});

test('nextTapHint: move/attackMove/salvage/guard state their target', () => {
  assert.match(View.nextTapHint({ mode: 'move', selected: 3 }), /tap open ground to move your 3 units/);
  assert.match(View.nextTapHint({ mode: 'attackMove', selected: 1 }), /attack-move your 1 unit/);
  assert.match(View.nextTapHint({ mode: 'salvage', selected: 2 }), /tap a wreck to salvage/);
  assert.match(View.nextTapHint({ mode: 'guard', selected: 2 }), /tap ground to guard/);
});

test('nextTapHint: Hold states the tap fallback in plain words', () => {
  // Shipped behaviour: a Hold tap falls back to Move. v1.8 changes
  // only what the UI says, never what Hold does.
  const h = View.nextTapHint({ mode: 'hold', selected: 2 });
  assert.match(h, /Hold mode/);
  assert.match(h, /tap ground to move/);
  assert.match(h, /tap Hold again to hold them where they stand/);
});

test('nextTapHint: patrol states first point, pending patrol states second', () => {
  assert.match(View.nextTapHint({ mode: 'patrol', selected: 0 }), /Select units first/);
  assert.match(View.nextTapHint({ mode: 'patrol', selected: 2 }), /first patrol point/);
  assert.match(View.nextTapHint({ mode: 'patrol', selected: 2, pendingPatrol: true }), /second point/);
});

test('nextTapHint: rally mode and manual control override mode hints', () => {
  assert.match(View.nextTapHint({ mode: 'move', selected: 2, rallyMode: true }), /new units will move there on spawn/);
  assert.match(View.nextTapHint({ mode: 'move', selected: 2, controlling: true }), /left stick moves, right stick aims/);
});

test('nextTapHint: queue/add/pan/select suffixes ride on the mode hint', () => {
  const h = View.nextTapHint({ mode: 'move', selected: 2, queueMode: true, addMode: true, panMode: true, selectMode: true });
  assert.match(h, /Orders will queue/);
  assert.match(h, /Taps add to your selection/);
  assert.match(h, /Drag pans the camera/);
  assert.match(h, /Drag draws a selection box/);
});

// ---- consolidated structure in index.html / style.css ----

test('main menu is sectioned: Play, Difficulty, Learn, Customize, Store, Settings', () => {
  for (const h of ['Play', 'Difficulty', 'Learn', 'Customize', 'Store', 'Settings']) {
    assert.ok(html.includes('<h3>' + h + '</h3>'), 'missing main-menu section ' + h);
  }
  // Every pre-existing main-menu entry still present, same ids.
  for (const id of ['mm-play-first', 'mm-play-second', 'mm-play-third', 'mm-play-test',
    'mm-diff-easy', 'mm-diff-normal', 'mm-diff-hard', 'mm-loadout', 'mm-store',
    'mm-tutorial', 'mm-tutorial2', 'mm-howto', 'mm-settings',
    'mm-hero-status', 'mm-hero-notice', 'mm-wallet-status', 'mm-wallet-notice']) {
    assert.ok(html.includes('id="' + id + '"'), 'missing main-menu id ' + id);
  }
});

test('pause menu is sectioned and keeps every action', () => {
  for (const h of ['Match', 'Switch map', 'Options']) {
    assert.ok(html.includes('<h3>' + h + '</h3>'), 'missing pause section ' + h);
  }
  for (const id of ['pm-resume', 'pm-restart', 'pm-first', 'pm-second', 'pm-third', 'pm-test', 'pm-settings', 'pm-quit']) {
    assert.ok(html.includes('id="' + id + '"'), 'missing pause id ' + id);
  }
});

test('command tray overflow row holds every lesser-used toggle, always visible', () => {
  assert.ok(html.includes('cmd-overflow'), 'missing cmd-overflow row');
  assert.ok(html.includes('View &amp; selection:'), 'overflow row must be clearly labeled');
  for (const id of ['btn-paths', 'btn-minimap', 'btn-panmode', 'btn-selectmode', 'btn-addmode']) {
    assert.ok(html.includes('id="' + id + '"'), 'missing overflow toggle ' + id);
  }
  // The overflow row is a sibling of cmd-main/cmd-extra, never inside
  // the collapsible cmd-extra row: it must not be hidden by collapse.
  assert.ok(!css.includes('#commands:not(.expanded).cmd-overflow'), 'overflow row must never be collapse-hidden');
  // Primary order buttons stay in cmd-main (always visible).
  for (const id of ['btn-move', 'btn-attackmove', 'btn-hold', 'btn-patrol', 'btn-salvage', 'btn-guard', 'btn-queue']) {
    assert.ok(html.includes('id="' + id + '"'), 'missing primary order ' + id);
  }
});

test('shell wires Select mode + feedback sync + drag-rect draw', () => {
  assert.ok(gameJs.includes("bindBtn('btn-selectmode'"), 'missing btn-selectmode binding');
  assert.ok(gameJs.includes('var selectMode = false'), 'missing selectMode flag');
  assert.ok(gameJs.includes('View.wantsPan(e.pointerType, panMode, selectMode)'), 'pointermove must use wantsPan');
  assert.ok(gameJs.includes('function syncFeedback()'), 'missing syncFeedback');
  assert.ok(gameJs.includes('function sayFeedback(text)'), 'missing sayFeedback');
  assert.ok(gameJs.includes("ctx.setLineDash([6, 6])") && gameJs.includes('dragRect.x0'), 'missing drag-rect draw');
});

test('panels strip no longer intercepts map taps, panels stay interactive', () => {
  assert.ok(css.includes('#panels {') && css.includes('pointer-events: none'), '#panels must pass taps through');
  assert.ok(css.includes('#panels .panel { pointer-events: auto; }'), 'panels must stay interactive');
});
