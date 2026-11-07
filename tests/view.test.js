// Zoom math + path display data (view.js, pure functions). No canvas
// pixels are asserted here — the data the renderer draws is.
const test = require('node:test');
const assert = require('node:assert/strict');
const View = require('../game/view.js');

test('zoom limits: clamp keeps 0.4–3, presets are inside range', () => {
  assert.equal(View.clampZoom(0.1), 0.4);
  assert.equal(View.clampZoom(5), 3);
  assert.equal(View.clampZoom(1), 1);
  for (const p of View.ZOOM_PRESETS) {
    assert.ok(p >= View.ZOOM_MIN && p <= View.ZOOM_MAX, 'preset ' + p);
  }
  assert.deepEqual(View.ZOOM_PRESETS, [0.5, 1, 2]);
});

test('zoom-to-cursor anchor: world point stays under the same screen offset', () => {
  // Camera at tile (10,10), zoom 1, cursor 64 px right / 32 px down from
  // canvas origin => world (12, 11). Zoom to 2: camera must move so the
  // same world point is still 64/32 px from the origin at zoom 2.
  const cam = { x: 10, y: 10, zoom: 1 };
  const world = { x: 12, y: 11 };
  const next = View.zoomToCursor(cam, world, 64, 32, 2);
  assert.equal(next.zoom, 2);
  // screen offset = (world - camera) * TILE * zoom
  assert.equal((world.x - next.x) * 32 * 2, 64);
  assert.equal((world.y - next.y) * 32 * 2, 32);
  // Out-of-range target zooms clamp instead of escaping limits.
  assert.equal(View.zoomToCursor(cam, world, 64, 32, 9).zoom, 3);
});

test('clampCamera keeps the view on the map, parks at 0 when view > map', () => {
  // 800x600 canvas at zoom 1 => 25 x 18.75 tiles on an 80x50 map.
  const c = View.clampCamera({ x: 70, y: 45, zoom: 1 }, 80, 50, 800, 600);
  assert.ok(c.x <= 80 - 25 && c.y <= 50 - 18.75);
  assert.equal(c.x, 55); // 80 - 25 exactly
  const parked = View.clampCamera({ x: 5, y: 5, zoom: 0.4 }, 20, 10, 800, 600);
  assert.equal(parked.x, 0);
  assert.equal(parked.y, 0);
});

test('zoom-to-selection framing: fits bounds, centres, stays in limits', () => {
  const bounds = { minX: 10, maxX: 14, minY: 20, maxY: 26 };
  const frame = View.frameSelection(bounds, 80, 50, 800, 600);
  assert.ok(frame.zoom >= View.ZOOM_MIN && frame.zoom <= View.ZOOM_MAX);
  // View in tiles at frame zoom must cover the padded bounds.
  const vt = View.viewTiles(800, 600, frame.zoom);
  assert.ok(vt.x >= (bounds.maxX - bounds.minX + 4) - 0.01);
  assert.ok(vt.y >= (bounds.maxY - bounds.minY + 4) - 0.01);
  // Centre of the view is (approx) the centre of the bounds.
  assert.ok(Math.abs((frame.x + vt.x / 2) - 12) < 0.6);
  assert.ok(Math.abs((frame.y + vt.y / 2) - 23) < 0.6);
  // Empty selection => null bounds, so callers can no-op.
  assert.equal(View.selectionBounds([]), null);
});

test('path polyline: unit centre + waypoint centres, destination last', () => {
  const unit = { x: 10.5, y: 25.5, path: [[12, 25], [20, 25], [20, 20], [40, 20]] };
  const pts = View.pathPolyline(unit, true);
  assert.deepEqual(pts[0], { x: 10.5, y: 25.5 });
  assert.deepEqual(pts[pts.length - 1], { x: 40.5, y: 20.5 });
  assert.equal(pts.length, 5);
  assert.deepEqual(View.pathDestination(unit, true), { x: 40.5, y: 20.5 });
  // Turns: only the two corners, not straight-line waypoints or ends.
  assert.deepEqual(View.pathTurns(unit, true), [{ x: 20.5, y: 25.5 }, { x: 20.5, y: 20.5 }]);
});

test('path polyline: empty path, unselected, or missing unit draws nothing', () => {
  const unit = { x: 1, y: 1, path: [[2, 2]] };
  assert.deepEqual(View.pathPolyline(unit, false), []);
  assert.deepEqual(View.pathPolyline({ x: 1, y: 1, path: [] }, true), []);
  assert.deepEqual(View.pathPolyline(null, true), []);
  assert.equal(View.pathDestination(unit, false), null);
  assert.deepEqual(View.pathTurns(unit, false), []);
});

test('path polyline: straight path has no turn dots', () => {
  const unit = { x: 5.5, y: 5.5, path: [[6, 5], [7, 5], [8, 5]] };
  assert.deepEqual(View.pathTurns(unit, true), []);
  assert.equal(View.pathPolyline(unit, true).length, 4);
});
