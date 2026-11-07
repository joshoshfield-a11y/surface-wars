/* Surface Wars — camera zoom + unit-path display data (pure, DOM-free).
   No sim rules here: zoom only changes what the camera shows, and path
   polylines are computed from a unit's EXISTING sim path (unit.path,
   tile coords) — this module never runs a pathfinder of its own.
   Node-exportable as SWView; in the browser it is window.SWView. */
(function (global) {
  'use strict';
  var TILE = 32;
  var ZOOM_MIN = 0.4, ZOOM_MAX = 3;
  var ZOOM_PRESETS = [0.5, 1, 2];
  // Far-zoom simplification threshold: below this zoom, render.js hides
  // dust/smoke FX and the smallest units' HP bars (see render.js).
  var FAR_ZOOM = 0.6;

  function clampZoom(z) {
    if (z < ZOOM_MIN) return ZOOM_MIN;
    if (z > ZOOM_MAX) return ZOOM_MAX;
    return z;
  }
  // Visible tiles for a canvas of viewW x viewH px at a given zoom.
  function viewTiles(viewW, viewH, zoom) {
    return { x: viewW / TILE / zoom, y: viewH / TILE / zoom };
  }
  // Clamp a tile-valued camera so the view stays on the map. If the view
  // is wider/taller than the map, the camera parks at 0 (map top-left).
  function clampCamera(cam, mapW, mapH, viewW, viewH) {
    var vt = viewTiles(viewW, viewH, cam.zoom);
    var maxX = Math.max(0, mapW - vt.x), maxY = Math.max(0, mapH - vt.y);
    return {
      x: Math.max(0, Math.min(maxX, cam.x)),
      y: Math.max(0, Math.min(maxY, cam.y)),
      zoom: cam.zoom
    };
  }
  // Zoom-to-cursor: given the world point under the cursor BEFORE the
  // zoom change, return the camera that keeps that same world point
  // under the same screen offset AFTER the zoom change. Screen offsets
  // are in px relative to the canvas top-left.
  function zoomToCursor(cam, worldBefore, offsetX, offsetY, newZoom) {
    newZoom = clampZoom(newZoom);
    return {
      x: worldBefore.x - offsetX / TILE / newZoom,
      y: worldBefore.y - offsetY / TILE / newZoom,
      zoom: newZoom
    };
  }
  // Frame a selection: smallest zoom (within limits, with padding) that
  // fits the whole bounding box, camera centred on it. bounds are in
  // tile coords {minX,minY,maxX,maxY} (unit centres, not tiles).
  function frameSelection(bounds, mapW, mapH, viewW, viewH) {
    var padTiles = 2;
    var w = Math.max(1, bounds.maxX - bounds.minX + padTiles * 2);
    var h = Math.max(1, bounds.maxY - bounds.minY + padTiles * 2);
    var zoom = clampZoom(Math.min(viewW / TILE / w, viewH / TILE / h));
    var vt = viewTiles(viewW, viewH, zoom);
    var cx = (bounds.minX + bounds.maxX) / 2;
    var cy = (bounds.minY + bounds.maxY) / 2;
    var cam = { x: cx - vt.x / 2, y: cy - vt.y / 2, zoom: zoom };
    return clampCamera(cam, mapW, mapH, viewW, viewH);
  }
  // Bounds of a list of units (tile-coord centres). null if empty.
  function selectionBounds(units) {
    if (!units || !units.length) return null;
    var b = { minX: units[0].x, maxX: units[0].x, minY: units[0].y, maxY: units[0].y };
    for (var i = 1; i < units.length; i++) {
      if (units[i].x < b.minX) b.minX = units[i].x;
      if (units[i].x > b.maxX) b.maxX = units[i].x;
      if (units[i].y < b.minY) b.minY = units[i].y;
      if (units[i].y > b.maxY) b.maxY = units[i].y;
    }
    return b;
  }

  // ---- Unit path display data ----
  // Polyline for ONE unit: unit centre, then each remaining waypoint's
  // tile centre, in sim order. Returns [] unless the unit is selected,
  // alive (caller passes only live units), and has a non-empty path.
  // The first waypoint the sim is already walking toward is path[0];
  // waypoints drop off as the sim consumes them, so this polyline
  // shortens as the unit moves — render.js draws exactly this, nothing
  // interpolated or re-pathed.
  function pathPolyline(unit, isSelected) {
    if (!unit || !isSelected || !unit.path || !unit.path.length) return [];
    var pts = [{ x: unit.x, y: unit.y }];
    for (var i = 0; i < unit.path.length; i++) {
      pts.push({ x: unit.path[i][0] + 0.5, y: unit.path[i][1] + 0.5 });
    }
    return pts;
  }
  // Destination marker = last polyline point, or null for no path.
  function pathDestination(unit, isSelected) {
    var pts = pathPolyline(unit, isSelected);
    return pts.length ? pts[pts.length - 1] : null;
  }
  // Turn dots: polyline points where the travel direction changes
  // (excluding start and destination, which get their own markers).
  function pathTurns(unit, isSelected) {
    var pts = pathPolyline(unit, isSelected);
    var turns = [];
    for (var i = 1; i < pts.length - 1; i++) {
      // Direction only (sign), not step length: a longer straight step
      // is not a turn. A* paths are axis-aligned, so sign comparison
      // is exact for the turn test.
      var dx1 = Math.sign(pts[i].x - pts[i - 1].x), dy1 = Math.sign(pts[i].y - pts[i - 1].y);
      var dx2 = Math.sign(pts[i + 1].x - pts[i].x), dy2 = Math.sign(pts[i + 1].y - pts[i].y);
      if (dx1 !== dx2 || dy1 !== dy2) turns.push(pts[i]);
    }
    return turns;
  }

  // ---- Mobile-first finish: touch equivalents (pure, tested) ----
  // Queue-append decision: Shift (desktop) OR Queue mode (touch button)
  // appends an order; neither replaces. Queue mode deliberately stays on
  // until toggled off, unlike a held Shift key, so several waypoints can
  // be queued in a row on touch.
  function queueAppend(shiftKey, queueMode) { return !!shiftKey || !!queueMode; }
  // Layout constants the mobile-first CSS implements (kept here so tests
  // can assert the documented numbers instead of them living only in CSS).
  var MOBILE_BREAKPOINT = 640; // px: at or below this width the tray starts collapsed
  var MIN_TOUCH_TARGET = 44; // px: minimum button height in style.css

  // ---- Landscape-first: orientation layout (pure, tested) ----
  // Landscape is width > height; a square viewport is treated as
  // portrait (the bottom-tray layout is the safe fallback). layoutFor
  // returns what the CSS implements, so tests assert the documented
  // numbers instead of them living only in CSS: landscape gets the
  // side panel (trayMode 'side', extra row forced visible, minimap
  // 192x120); portrait keeps the bottom tray (trayMode 'bottom',
  // minimap 132x83 on phone width) plus the rotate hint.
  function isLandscape(viewW, viewH) { return viewW > viewH; }
  function layoutFor(viewW, viewH) {
    if (isLandscape(viewW, viewH)) {
      return { orientation: 'landscape', trayMode: 'side', trayForcedExpanded: true,
        rotateHint: false, minimap: { w: 192, h: 120 } };
    }
    return { orientation: 'portrait', trayMode: 'bottom', trayForcedExpanded: false,
      rotateHint: true, minimap: { w: 132, h: 83 } };
  }

  // ---- v1.8: drag intent + next-tap hint (pure, tested) ----
  // Drag intent: what a canvas drag does. Mouse drag selects unless
  // Pan mode is on; touch drag pans unless Select mode is on. Select
  // mode is the touch mirror of mouse Pan mode: it exists so touch
  // players can drag-select without tapping units one by one, and
  // the default stays pan-on-drag, so nothing changes unless the
  // player opts in. The shell's pointer handlers mirror this helper
  // exactly (a drag-rect is only ever opened when wantsPan is false).
  function wantsPan(pointerType, panMode, selectMode) {
    if (pointerType === 'touch') return !selectMode;
    return !!panMode;
  }
  // Next-tap hint: one plain sentence stating what the next tap will
  // do for the current mode/selection/toggles — the same pattern as
  // the tutorial banner's tapHint, but for normal play. The shell
  // writes this into the feedback line on every state change, so a
  // mode quirk (Hold taps fall back to Move, Patrol waits on a
  // second point, Queue appends) is never a surprise. Pure: the
  // caller passes a snapshot, this only formats words.
  function nextTapHint(s) {
    s = s || {};
    if (s.controlling) return 'Manual control: left stick moves, right stick aims and fires. Release Control to return to orders.';
    if (s.rallyMode) return 'Next tap: tap a point on the ground — new units will move there on spawn.';
    if (s.pendingPatrol) return 'Next tap: tap a second point — your units will patrol between the two points.';
    var n = s.selected || 0;
    var units = n === 1 ? 'your 1 unit' : 'your ' + n + ' units';
    var hint;
    if (s.mode === 'patrol' && n === 0) hint = 'Select units first, then tap ground to set the first patrol point.';
    else if (s.mode === 'patrol') hint = 'Next tap: tap ground to set the first patrol point.';
    else if (n === 0) hint = s.selectMode
      ? 'Next tap: tap a blue unit to select it, or drag to select several.'
      : 'Next tap: tap a blue unit to select it.';
    else if (s.mode === 'attackMove') hint = 'Next tap: tap open ground to attack-move ' + units + ' (they fight anything they meet on the way), or tap a red unit to attack.';
    else if (s.mode === 'hold') hint = 'Hold mode: tap ground to move ' + units + ' — tap Hold again to hold them where they stand.';
    else if (s.mode === 'salvage') hint = 'Next tap: tap a wreck to salvage it with ' + units + ' (or tap ground to move).';
    else if (s.mode === 'guard') hint = 'Next tap: tap ground to guard that point with ' + units + ', or tap a friendly unit to guard it.';
    else hint = 'Next tap: tap open ground to move ' + units + ', or tap a red unit to attack.';
    if (s.queueMode) hint += ' Orders will queue.';
    if (s.addMode) hint += ' Taps add to your selection.';
    if (s.panMode) hint += ' Drag pans the camera.';
    if (s.selectMode) hint += ' Drag draws a selection box.';
    return hint;
  }

  // ---- Tutorial: steps + advance conditions (pure, DOM-free) ----
  // One short sentence each. The shell detects the action named in
  // each step; tutorialAdvance only answers "has it happened yet?"
  // given a snapshot taken when the step started and the current
  // facts. 'win' never auto-advances — it is the closing screen.
  var TUTORIAL_STEPS = [
    { id: 'look', title: 'Look around', instruction: 'Drag the ground to pan, or tap Zoom + to zoom in.', tapHint: 'Next tap: drag to pan, or tap a Zoom button.' },
    { id: 'select', title: 'Select a unit', instruction: 'Tap a blue unit to select it.', tapHint: 'Next tap: tap a blue unit.' },
    { id: 'move', title: 'Move', instruction: 'Tap open ground to move your selected unit. A dashed line shows its path.', tapHint: 'Next tap: tap open ground to move.' },
    { id: 'attack', title: 'Attack', instruction: 'Tap the pulsing red target to attack it. It cannot shoot back.', tapHint: 'Next tap: tap the red target.' },
    { id: 'build', title: 'Build', instruction: 'Tap your Command Core, then tap Scout Buggy to build one.', tapHint: 'Next tap: tap your Command Core.' },
    { id: 'salvage', title: 'Salvage', instruction: 'Select a unit, then tap the pulsing wreck to collect its scrap. It starts at 32 scrap and shrinks over 120 seconds.', tapHint: 'Next tap: tap a blue unit, then the wreck.' },
    { id: 'win', title: 'How to win', instruction: 'Win by wiping out every red unit and structure. Lose your core and all units, and you lose.', tapHint: 'You are ready — tap Play a real game.' }
  ];
  function tutorialAdvance(stepId, before, now) {
    before = before || {}; now = now || {};
    if (stepId === 'look') {
      return Math.abs((now.camX || 0) - (before.camX || 0)) > 1 ||
        Math.abs((now.camY || 0) - (before.camY || 0)) > 1 ||
        Math.abs((now.zoom || 0) - (before.zoom || 0)) > 0.02;
    }
    if (stepId === 'select') return (now.selectedUnits || 0) > 0;
    if (stepId === 'move') return now.moveOrdered === true;
    if (stepId === 'attack') return now.attackOrdered === true;
    if (stepId === 'build') return (now.scoutCount || 0) > (before.scoutCount || 0);
    if (stepId === 'salvage') return (now.scrap || 0) > (before.scrap || 0);
    return false; // 'win' and unknown steps never auto-advance
  }
  // Short mode names for the phone status line (the full mode word
  // would crowd the condensed top bar).
  function modeShort(m) {
    var map = { move: 'Move', attackMove: 'Atk-Move', hold: 'Hold', patrol: 'Patrol', salvage: 'Salvage', guard: 'Guard' };
    return map[m] || m;
  }

  // ---- Twin-Stick Phase A: stick zones, vectors, entry gate (pure) ----
  // Stick zones are fractions of the CANVAS (never the side panel):
  // left stick = left 40% of width, bottom 60% of height; right stick
  // = right 40% of width, bottom 60% of height; the middle 20% of the
  // width is stick-free. Coordinates are canvas pixels.
  var STICK_RADIUS = 60; // px: dynamic stick origin radius
  var STICK_DEADZONE = 0.35; // stick deflection below this is tremor, not input
  function stickZones(w, h) {
    return { left: { x0: 0, x1: w * 0.4, y0: h * 0.4, y1: h },
             right: { x0: w * 0.6, x1: w, y0: h * 0.4, y1: h } };
  }
  function stickZoneAt(w, h, x, y) {
    var z = stickZones(w, h);
    if (x >= z.left.x0 && x < z.left.x1 && y >= z.left.y0 && y <= z.left.y1) return 'left';
    if (x >= z.right.x0 && x <= z.right.x1 && y >= z.right.y0 && y <= z.right.y1) return 'right';
    return null;
  }
  // Stick vector from a dynamic origin: deflection is scaled by the
  // stick radius and capped at magnitude 1, so pushing past the edge
  // does not make the unit faster than its catalog speed.
  function stickVector(ox, oy, cx, cy, radius, deadzone) {
    radius = radius || STICK_RADIUS; deadzone = deadzone === undefined ? STICK_DEADZONE : deadzone;
    var dx = cx - ox, dy = cy - oy, d = Math.hypot(dx, dy);
    if (d <= deadzone * radius) return { dx: 0, dy: 0, mag: 0, active: false };
    var mag = Math.min(1, d / radius);
    return { dx: dx / d * mag, dy: dy / d * mag, mag: mag, active: true };
  }
  // Take Control entry gate: exactly one unit, armed, not a structure,
  // never in a tutorial game (hidden there, not disabled with a
  // lecture). The shell also checks faction; this helper owns the
  // selection/weapon/structure/tutorial rules so tests can assert
  // them without a browser.
  function takeControlState(selCount, isStructure, hasWeapon, tutorial) {
    if (tutorial) return { ok: false, hidden: true, reason: '' };
    if (isStructure) return { ok: false, hidden: false, reason: 'Structures cannot be controlled.' };
    if (selCount !== 1) return { ok: false, hidden: false, reason: 'Select one unit to take control.' };
    if (!hasWeapon) return { ok: false, hidden: false, reason: 'This unit has no weapon.' };
    return { ok: true, hidden: false, reason: '' };
  }
  // Production ordering gate: new production cannot be ordered while
  // controlling (the build panel is replaced by the twin-stick HUD);
  // queues already running keep advancing in the sim regardless.
  function canOrderProduction(controlling) { return !controlling; }

  // ---- Prototype 03: player-facing text hygiene ----
  // Strip stale "Prototype NN" version references from catalog text
  // before it reaches the info panel (the catalog description for the
  // Command Core still says "elimination in Prototype 01"; the catalog
  // itself is intentionally not edited, so the panel sanitises it).
  // Returns the text with every "Prototype <digits>" (and a preceding
  // " in " when present) removed, and doubled spaces collapsed.
  function stripVersionRef(text) {
    if (!text) return text;
    return String(text)
      .replace(/ in Prototype \d+/g, '')
      .replace(/Prototype \d+/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([,.])/g, '$1')
      .trim();
  }
  // ---- Prototype 03: on-screen group buttons (pure data, DOM-free) ----
  // A group button tap either recalls (normal) or assigns (when the
  // Assign toggle is on, after which the toggle switches itself off).
  // Returns { selected, assignMode, assigned } — callers prune recalled
  // ids against the live sim, exactly as the keyboard recall does.
  // Keyboard groups (Ctrl+digit / digit) are unchanged and keep using
  // assignGroup/recallGroup directly.
  function groupButtonAction(groups, key, selectedIds, assignMode) {
    if (assignMode) {
      assignGroup(groups, key, selectedIds || []);
      return { selected: (selectedIds || []).slice(), assignMode: false, assigned: key };
    }
    return { selected: recallGroup(groups, key), assignMode: false, assigned: null };
  }

  // ---- Prototype 02: unit groups (pure data, DOM-free) ----
  // Groups map a digit key ('1'..'9') to a copied array of entity ids.
  // Assign stores a copy, recall returns a copy (callers can prune dead
  // ids against the live sim without corrupting the stored group).
  function createGroups() { return {}; }
  function assignGroup(groups, key, ids) { groups[key] = (ids || []).slice(); }
  function recallGroup(groups, key) { return groups[key] ? groups[key].slice() : []; }
  // Queued-order destinations for path drawing: each queued order's
  // destination point, in queue order. Move/attackMove contribute their
  // target point; patrol contributes both patrol points; salvage and
  // attack contribute nothing here (the current path already leads to
  // the wreck/target, and the queue after them has no fixed point).
  function queuedDestinations(unit) {
    if (!unit || !unit.orderQueue || !unit.orderQueue.length) return [];
    var pts = [];
    for (var i = 0; i < unit.orderQueue.length; i++) {
      var o = unit.orderQueue[i];
      if ((o.kind === 'move' || o.kind === 'attackMove') && o.x !== undefined) {
        pts.push({ x: o.x, y: o.y });
      } else if (o.kind === 'patrol' && o.points) {
        for (var j = 0; j < o.points.length; j++) pts.push({ x: o.points[j].x, y: o.points[j].y });
      }
    }
    return pts;
  }

  var api = {
    TILE: TILE, ZOOM_MIN: ZOOM_MIN, ZOOM_MAX: ZOOM_MAX,
    ZOOM_PRESETS: ZOOM_PRESETS, FAR_ZOOM: FAR_ZOOM,
    clampZoom: clampZoom, viewTiles: viewTiles,
    clampCamera: clampCamera, zoomToCursor: zoomToCursor,
    frameSelection: frameSelection, selectionBounds: selectionBounds,
    pathPolyline: pathPolyline, pathDestination: pathDestination,
    pathTurns: pathTurns,
    createGroups: createGroups, assignGroup: assignGroup, recallGroup: recallGroup,
    stripVersionRef: stripVersionRef, groupButtonAction: groupButtonAction,
    queuedDestinations: queuedDestinations,
    queueAppend: queueAppend, MOBILE_BREAKPOINT: MOBILE_BREAKPOINT,
    MIN_TOUCH_TARGET: MIN_TOUCH_TARGET,
    isLandscape: isLandscape, layoutFor: layoutFor,
    STICK_RADIUS: STICK_RADIUS, STICK_DEADZONE: STICK_DEADZONE,
    stickZones: stickZones, stickZoneAt: stickZoneAt, stickVector: stickVector,
    takeControlState: takeControlState, canOrderProduction: canOrderProduction,
    TUTORIAL_STEPS: TUTORIAL_STEPS, tutorialAdvance: tutorialAdvance,
    modeShort: modeShort, wantsPan: wantsPan, nextTapHint: nextTapHint
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.SWView = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
