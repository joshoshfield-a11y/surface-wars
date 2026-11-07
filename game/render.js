/* Surface Wars Prototype 01 — canvas renderer (strict 90-degree top-down).
   Wired art: sprites-90 units/structures and tiles-overlay bases/overlays
   (see game/sprites.js and WIRING-REPORT.md). Canvas silhouettes remain
   only as a fallback for any image not yet loaded or failed. */
(function (global) {
  'use strict';
  var TILE = 32;
  var Assets = global.SWAssets || null;
  var TERRAIN_COLORS = Assets ? Assets.TERRAIN_COLORS : ['#4a7c3a', '#8a6f4d', '#6b6b6b', '#2e5d2a', '#1d4e9e', '#5a5a5a'];
  function hash(x, y) { var h = (x * 374761393 + y * 668265263) ^ 0x9e3779b9; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967296; }
  // ---- Wave-2 graphics helpers (pure, tested) ----
  // DPR cap: canvas buffer = CSS size x DPR, capped at 2 (phones).
  // Above 2 the fill-rate cost buys no visible crispness at game size.
  var DPR_CAP = 2;
  function dprFor(dpr) { var d = dpr || 1; return d > DPR_CAP ? DPR_CAP : d; }
  // HP-bar minimum on-screen size: a fixed world-size bar vanishes at
  // zoom 0.5, so the drawn bar is at least 28 px wide and 4 px tall on
  // screen at every zoom (centred on the unit's world-size bar).
  function hpBarMetrics(worldW, zoom) {
    return { w: Math.max(28, worldW), h: Math.max(4, Math.min(6, 4 * (zoom || 1))) };
  }
  // Selection-ring line width: at least 2 px on screen at every zoom.
  function ringLineWidth(zoom) { return Math.max(2, Math.min(4, 2 * zoom)); }
  // Static-ground bake key: exactly the inputs the baked layer depicts
  // (map dims + terrain + neighbour-computed overlay sets). Water is in
  // the key even though water tiles are drawn per frame (shimmer), so a
  // water change still re-bakes. Any input change -> a new key.
  function groundBakeKey(state, overlayMap) {
    var parts = [state.width, 'x', state.height, '|', state.terrain.join(','), '|'];
    if (overlayMap) {
      var keys = Object.keys(overlayMap).sort();
      for (var i = 0; i < keys.length; i++) {
        var e = overlayMap[keys[i]];
        parts.push(keys[i], ':', e.family, '/', e.variant, ';');
      }
    }
    return parts.join('');
  }
  // Bake resolution: 64 px per tile (2x the 32 px tile), so the blit
  // stays crisp at zoom 1 (2x downsample) and zoom 2 (1:1).
  var BAKE_TILE_PX = 64;
  // Baked radial-gradient glow sprites, one per FX kind, created once
  // and drawn with 'lighter'. No per-frame gradients, ever.
  var glowCache = {};
  function glowSprite(kind) {
    if (glowCache[kind]) return glowCache[kind];
    if (typeof document === 'undefined') return null;
    var color = kind === 'muzzle' ? '255,215,106' : kind === 'explosion' ? '255,154,60' : '255,106,42';
    var c = document.createElement('canvas'); c.width = 128; c.height = 128;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(' + color + ',0.85)');
    grad.addColorStop(0.4, 'rgba(' + color + ',0.35)');
    grad.addColorStop(1, 'rgba(' + color + ',0)');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    glowCache[kind] = c;
    return c;
  }
  // Static-ground bake cache (browser only). Incomplete bakes (an image
  // not ready yet) are NOT cached, so the next frame retries instead
  // of freezing a hole into the layer.
  var groundBakeCache = { key: null, canvas: null };
  function getGroundBake(state, overlayMap) {
    if (typeof document === 'undefined' || !Assets) return null;
    var key = groundBakeKey(state, overlayMap);
    if (groundBakeCache.key === key && groundBakeCache.canvas) return groundBakeCache.canvas;
    var scale = BAKE_TILE_PX;
    var c = document.createElement('canvas');
    c.width = state.width * scale; c.height = state.height * scale;
    var b = c.getContext('2d');
    var complete = true;
    for (var ty = 0; ty < state.height; ty++) for (var tx = 0; tx < state.width; tx++) {
      var terr = state.terrain[ty * state.width + tx];
      if (terr === 4) continue; // water: drawn per frame (shimmer)
      var baseImg = Assets.readyImage(Assets.basePath(terr, tx, ty));
      if (!baseImg) { complete = false; continue; }
      b.drawImage(baseImg, tx * scale, ty * scale, scale, scale);
      var terrE = tx + 1 < state.width ? state.terrain[ty * state.width + tx + 1] : terr;
      var terrS = ty + 1 < state.height ? state.terrain[(ty + 1) * state.width + tx] : terr;
      b.fillStyle = 'rgba(0,0,0,0.18)';
      if (terrE !== terr) b.fillRect((tx + 1) * scale - 4, ty * scale, 4, scale);
      if (terrS !== terr) b.fillRect(tx * scale, (ty + 1) * scale - 4, scale, 4);
      if (terr === 2) {
        var bridgeImg = Assets.readyImage(Assets.overlayPath('bridge_deck', 'straight_ew'));
        if (bridgeImg) b.drawImage(bridgeImg, tx * scale, ty * scale, scale, scale);
        else complete = false;
      }
      if (overlayMap) {
        var entry = overlayMap[tx + ',' + ty];
        if (entry) {
          var demoImg = Assets.readyImage(Assets.overlayPath(entry.family, entry.variant));
          if (demoImg) b.drawImage(demoImg, tx * scale, ty * scale, scale, scale);
          else complete = false;
        }
      }
    }
    if (!complete) return null;
    groundBakeCache = { key: key, canvas: c };
    return c;
  }
  function factionColor(catalog, faction) {
    for (var i = 0; i < catalog.factions.length; i++) if (catalog.factions[i].id === faction) return catalog.factions[i].color;
    return '#cccccc';
  }
  function unitDef(catalog, typeId) {
    for (var i = 0; i < catalog.units.length; i++) if (catalog.units[i].id === typeId) return catalog.units[i];
    return null;
  }
  function drawHull(ctx, category, sizePx, color) {
    ctx.fillStyle = color; ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
    ctx.beginPath();
    var r = sizePx;
    if (category === 'recon') { // small diamond scout, seen from directly above
      ctx.moveTo(0, -r); ctx.lineTo(r * 0.7, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.7, 0);
    } else if (category === 'anti_air' || category === 'experimental') {
      for (var k = 0; k < 8; k++) { var a = k * Math.PI / 4; var px = Math.cos(a) * r, py = Math.sin(a) * r; if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    } else { // tank / mech / artillery / support: rectangular hull
      ctx.rect(-r, -r * 0.7, r * 2, r * 1.4);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#222';
    ctx.fillRect(-r * 0.4, -r * 0.4, r * 0.8, r * 0.8);
  }
  // anim (optional, built by game.js): { time, wrecks, effects, unitAnim,
  // overlayMap }. time is sim seconds (state.time), so every animation
  // freezes when paused — no wall-clock time is used anywhere here.
  // Camera units: camera.x/y are TILES (same as game.js pan/wheel/
  // screenToWorld and the minimap). drawScene converts with
  // (tile - camera) * TILE * zoom. (Prototype 01 shipped this wrong:
  // it subtracted tile-valued camera from pixel coords, pinning the
  // view near the origin — pan/zoom barely moved anything. Fixed here;
  // no sim code was involved.)
  function drawScene(ctx, state, camera, selectedIds, viewW, viewH, anim) {
    var zoom = camera.zoom, ox = camera.x, oy = camera.y;
    anim = anim || {};
    var time = (anim.time !== undefined) ? anim.time : (state.time || 0);
    var Anim = global.SWAnim || null;
    var View = global.SWView || null;
    // Crisp scaling: pixel-art sprites stay sharp when zoomed in
    // (smoothing off at zoom >= 1); at low zoom smoothing stays on to
    // avoid shimmering, with high quality.
    ctx.imageSmoothingEnabled = zoom < 1;
    if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = 'high';
    // Far-zoom simplification: below FAR_ZOOM, dust/smoke FX and the
    // smallest units' HP bars are hidden (see below) — the map stays
    // readable instead of turning into FX noise.
    var farZoom = View ? zoom < View.FAR_ZOOM : zoom < 0.6;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, viewW, viewH);
    var x0 = Math.max(0, Math.floor(ox)), y0 = Math.max(0, Math.floor(oy));
    var x1 = Math.min(state.width - 1, Math.ceil(ox + viewW / zoom / TILE));
    var y1 = Math.min(state.height - 1, Math.ceil(oy + viewH / zoom / TILE));
    // Pre-rendered static ground layer (Wave-2): bases + neighbour-
    // computed overlays + edge shading are baked once per map load to
    // an offscreen canvas and blitted per frame. Water tiles stay
    // per-frame (shimmer variant cycles with sim time) and canopy
    // stays per-frame (zoom-dependent alpha) — both are drawn over
    // the blit below. Re-bake happens only when the bake key changes
    // (map dims, terrain, or overlay sets); see groundBakeKey.
    var overlayForBake = anim.overlayMap || (Assets ? Assets.demoOverlayMap() : null);
    var bakeCanvas = Assets ? getGroundBake(state, overlayForBake) : null;
    var bakeOk = false;
    if (bakeCanvas) {
      var bs = BAKE_TILE_PX;
      var bsx = ox * bs, bsy = oy * bs, bsw = viewW / zoom * bs, bsh = viewH / zoom * bs;
      if (bsx >= 0 && bsy >= 0 && bsx + bsw <= bakeCanvas.width && bsy + bsh <= bakeCanvas.height) {
        ctx.drawImage(bakeCanvas, bsx, bsy, bsw, bsh, 0, 0, viewW, viewH);
        bakeOk = true;
      }
    }
    for (var ty = y0; ty <= y1; ty++) for (var tx = x0; tx <= x1; tx++) {
      var terr = state.terrain[ty * state.width + tx];
      // Baked layer already covers this tile; only water (shimmer)
      // still needs its per-frame draw.
      if (bakeOk && terr !== 4) continue;
      var dx = (tx - ox) * TILE * zoom, dy = (ty - oy) * TILE * zoom;
      var dw = TILE * zoom + 1, dh = TILE * zoom + 1;
      // Water shimmer: water tiles cycle their base variant with a slow
      // sim-time phase (see animation.js). Same drawImage count as a
      // static base — no extra pass, no full-terrain redraw cost.
      var baseImg = null;
      if (Assets) {
        if (terr === 4 && Anim) {
          var wv = Anim.waterVariant(tx, ty, time);
          baseImg = Assets.readyImage('../assets/tiles-overlay/base/water_plain_v' + wv + '-512.png');
        } else {
          baseImg = Assets.readyImage(Assets.basePath(terr, tx, ty));
        }
      }
      if (baseImg) { ctx.drawImage(baseImg, dx, dy, dw, dh); }
      else {
        var shade = 0.9 + hash(tx, ty) * 0.2;
        ctx.fillStyle = TERRAIN_COLORS[terr];
        ctx.globalAlpha = shade;
        ctx.fillRect(dx, dy, dw, dh);
        ctx.globalAlpha = 1;
        if (terr === 3) { ctx.fillStyle = '#1d4218'; ctx.beginPath(); ctx.arc(((tx - ox) * TILE + 16) * zoom, ((ty - oy) * TILE + 16) * zoom, 6 * zoom, 0, Math.PI * 2); ctx.fill(); }
      }
      // Terrain edge shading (drawn, never baked into tiles): where a
      // tile's east or south neighbour is a different terrain type, a
      // soft dark edge marks the boundary — grass/dirt/water borders
      // read at a glance without touching the tile art. Baked into
      // the static layer when the bake is active.
      if (!bakeOk) {
        var terrE = tx + 1 < state.width ? state.terrain[ty * state.width + tx + 1] : terr;
        var terrS = ty + 1 < state.height ? state.terrain[(ty + 1) * state.width + tx] : terr;
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        if (terrE !== terr) ctx.fillRect(dx + dw - 2, dy, 2, dh);
        if (terrS !== terr) ctx.fillRect(dx, dy + dh - 2, dw, 2);
      }
    }
    // Overlays, cosmetic only: bridge deck over BRIDGE tiles, plus the
    // demo track/road lines from sprites.js (neither changes gameplay).
    // Bridge: the prototype bridge is a 4x4 crossing block, not a 1-tile
    // line, so every bridge tile draws straight_ew — those tiles join
    // into one solid deck. Mask-derived corner/T variants would carve
    // notches out of the block's corners and leave water under units
    // standing on bridge terrain. The autotile mask logic itself IS used
    // for the demo track/road lines below (see demoOverlayMap).
    if (Assets) {
      // Overlay map for the current map (game.js supplies the First Map
      // track/road/ford sets, or the test-map demo sets). Fallback is
      // the demo sets when game.js passes nothing.
      var demo = overlayForBake;
      for (var oy2 = y0; oy2 <= y1; oy2++) for (var ox2 = x0; ox2 <= x1; ox2++) {
        var terr2 = state.terrain[oy2 * state.width + ox2];
        var odx = (ox2 - ox) * TILE * zoom, ody = (oy2 - oy) * TILE * zoom;
        var odw = TILE * zoom + 1, odh = TILE * zoom + 1;
        if (terr2 === 2 && !bakeOk) {
          var bridgeImg = Assets.readyImage(Assets.overlayPath('bridge_deck', 'straight_ew'));
          if (bridgeImg) ctx.drawImage(bridgeImg, odx, ody, odw, odh);
        }
        // Canopy over every FOREST tile: edge variant chosen from forest
        // neighbours, so forest reads as canopy over its forest_floor
        // base instead of dark ground. Drawn before units (layer order
        // in TILING-SPEC.md: base, overlay, units).
        if (terr2 === 3) {
          var w2 = state.width;
          var hasN = oy2 > 0 && state.terrain[(oy2 - 1) * w2 + ox2] === 3;
          var hasE = ox2 < w2 - 1 && state.terrain[oy2 * w2 + ox2 + 1] === 3;
          var hasS = oy2 < state.height - 1 && state.terrain[(oy2 + 1) * w2 + ox2] === 3;
          var hasW = ox2 > 0 && state.terrain[oy2 * w2 + ox2 - 1] === 3;
          var canopyImg = Assets.readyImage(Assets.canopyPath(Assets.canopyVariantForNeighbours(hasN, hasE, hasS, hasW)));
          // Zoom-dependent canopy treatment: retinted darker tiles
          // (see assets/animation/canopy/) plus a slight alpha blend
          // at far zoom, so clusters read as forest, not neon grid.
          // Forest never drops back to bare dark ground.
          if (canopyImg) {
            var canopyAlpha = zoom < 0.6 ? 0.82 : (zoom < 0.8 ? 0.92 : 1);
            if (canopyAlpha < 1) ctx.globalAlpha = canopyAlpha;
            ctx.drawImage(canopyImg, odx, ody, odw, odh);
            ctx.globalAlpha = 1;
          }
        }
        var entry = demo ? demo[ox2 + ',' + oy2] : null;
        if (entry && !bakeOk) {
          var demoImg = Assets.readyImage(Assets.overlayPath(entry.family, entry.variant));
          if (demoImg) ctx.drawImage(demoImg, odx, ody, odw, odh);
        }
      }
    }
    // Wrecks (Prototype 02: REAL sim records from state.wrecks, passed
    // through by game.js — not render-only any more). They never block
    // movement and are not combat units. A selected wreck (anim.
    // selectedWreckId) gets a white ring, like a selected unit.
    // FX/shadow toggles (anim.showFX / anim.showShadows, default on)
    // come from the Settings panel; when FX is off, transient effects
    // and damage smoke are skipped entirely.
    var showFX = anim.showFX !== false;
    var showShadows = anim.showShadows !== false;
    if (Assets && anim.wrecks) {
      for (var wi = 0; wi < anim.wrecks.length; wi++) {
        var wk = anim.wrecks[wi];
        var wx = (wk.x - ox) * TILE * zoom, wy = (wk.y - oy) * TILE * zoom;
        var wr = (wk.radius || 0.5) * TILE * zoom;
        var wreckImg = Assets.readyImage(Assets.wreckPath(wk.typeId));
        if (wreckImg) {
          ctx.save(); ctx.translate(wx, wy); ctx.rotate(wk.rot || 0);
          ctx.drawImage(wreckImg, -wr, -wr, wr * 2, wr * 2);
          ctx.restore();
        }
        if (anim.selectedWreckId !== undefined && wk.id === anim.selectedWreckId) {
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = ringLineWidth(zoom);
          ctx.beginPath(); ctx.arc(wx, wy, wr + 3, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
        }
      }
    }
    // Structure wrecks (Wave-2, render-layer only): when a structure
    // dies, game.js appends a persistent record here (mirroring the
    // unit-wreck pattern above). Team-neutral rubble art via
    // Assets.structureWreckPath (dedicated art or generic rubble).
    // Persistent for the match; cleared on newGame. Not selectable,
    // never blocks movement, never a combat entity.
    if (Assets && anim.structureWrecks) {
      for (var swi = 0; swi < anim.structureWrecks.length; swi++) {
        var sw = anim.structureWrecks[swi];
        var swx = (sw.x - ox) * TILE * zoom, swy = (sw.y - oy) * TILE * zoom;
        var swr = (sw.radius || 1) * TILE * zoom;
        var swImg = Assets.readyImage(Assets.structureWreckPath(sw.typeId));
        if (swImg) {
          ctx.save(); ctx.translate(swx, swy); ctx.rotate(sw.rot || 0);
          ctx.drawImage(swImg, -swr, -swr, swr * 2, swr * 2);
          ctx.restore();
        }
      }
    }
    // Structures: real sprite, unrotated (structures do not turn).
    // Fallback is the old top-down footprint if the image is not ready.
    for (var si = 0; si < state.structures.length; si++) {
      var s = state.structures[si];
      var sx = (s.x - ox) * TILE * zoom, sy = (s.y - oy) * TILE * zoom, sr = s.radius * TILE * zoom;
      var structImg = Assets ? Assets.readyImage(Assets.structurePath(s.typeId, s.faction)) : null;
      // Command cores only: subtle idle pulse (scale) + a pulsing light
      // dot. Footprint and sim behaviour are untouched.
      var pulse = 1;
      if (s.typeId === 'command_core') pulse = 1 + 0.03 * Math.sin(time * 2.2 + s.id);
      // Soft drop shadow (drawn ellipse, no shadowBlur cost) — off
      // when the Settings shadows toggle is off. Wave-2: small fixed
      // directional offset (3, 4) px at zoom 1, light from upper-left,
      // replacing the old (2, 3) centred blob.
      if (showShadows) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.ellipse(sx + 3 * zoom, sy + 4 * zoom, sr * 0.95, sr * 0.7, 0, 0, Math.PI * 2); ctx.fill();
      }
      // Selected structure ring (Prototype 02: structures are selectable).
      if (selectedIds.indexOf(s.id) !== -1) {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = ringLineWidth(zoom);
        ctx.beginPath(); ctx.arc(sx, sy, sr + 3, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
      }
      // Wave-3 (recorded decision, not a silent change): the old code drew
      // the opaque team-colour block for EVERY non-core structure AFTER
      // the sprite, so no non-core structure sprite ever displayed in
      // game — every structure rendered as a team block with a black
      // centre, whatever its art file held. That is why wall-red dots
      // "did not read": the wall sprite was never visible at all, not
      // because of its strip aspect. The square draw itself preserves
      // the art's internal aspect (the 442x55 wall strip inside its
      // 512 canvas stays a strip when scaled into the square), so NO
      // aspect change is made here. The team block is now fallback-only
      // (image not ready/failed); a ready sprite gets only a thin
      // team-colour frame so faction still reads at small scale.
      // Wall-dot consequence, measured: wall footprint 1 -> 32 px draw
      // at zoom 1, strip ~3.4 px tall, each dot ~1 px — dots cannot read
      // at zoom 1 by geometry; at zoom 2 (64 px draw) the strip is
      // ~6.9 px tall and dots ~2 px, and they do read. No draw-size
      // change is made to fake this: that would misrepresent the
      // footprint.
      if (structImg) {
        ctx.drawImage(structImg, sx - sr * pulse, sy - sr * pulse, sr * 2 * pulse, sr * 2 * pulse);
        if (s.typeId === 'command_core') {
          ctx.globalAlpha = 0.15 + 0.1 * Math.sin(time * 2.2 + s.id);
          ctx.fillStyle = '#ffe066';
          ctx.beginPath(); ctx.arc(sx, sy, sr * 0.35, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        } else {
          ctx.strokeStyle = factionColor(state.catalog, s.faction);
          ctx.lineWidth = Math.max(1, zoom);
          ctx.strokeRect(sx - sr, sy - sr, sr * 2, sr * 2);
          ctx.lineWidth = 1;
        }
      }
      else if (s.typeId === 'command_core') {
        ctx.globalAlpha = 0.15 + 0.1 * Math.sin(time * 2.2 + s.id);
        ctx.fillStyle = '#ffe066';
        ctx.beginPath(); ctx.arc(sx, sy, sr * 0.35, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      else {
        ctx.fillStyle = factionColor(state.catalog, s.faction);
        ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
        ctx.strokeStyle = '#111'; ctx.strokeRect(sx - sr, sy - sr, sr * 2, sr * 2);
        ctx.fillStyle = '#222'; ctx.fillRect(sx - sr * 0.5, sy - sr * 0.5, sr, sr);
      }
      drawBar(ctx, sx - sr, sy - sr - 6 * zoom, sr * 2, s.hp / s.maxHp, zoom);
    }
    // Projectiles: real sprites, nose-up art rotated along travel
    // (angle to target + 90 degrees, same convention as unit sprites).
    // Fallback is the old dot if the sprite is not ready.
    for (var pi = 0; pi < state.projectilePool.length; pi++) {
      var pr = state.projectilePool[pi]; if (!pr.active) continue;
      var px = (pr.x - ox) * TILE * zoom, py = (pr.y - oy) * TILE * zoom;
      var projName = (Anim && pr.weapon) ? Anim.projectileForWeapon(pr.weapon) : null;
      var projImg = (Assets && projName) ? Assets.readyImage(Assets.projectilePath(projName)) : null;
      if (projImg) {
        var pa = Math.atan2(pr.ty - pr.y, pr.tx - pr.x) + Math.PI / 2;
        var ps = TILE * 0.6 * zoom;
        ctx.save(); ctx.translate(px, py); ctx.rotate(pa);
        ctx.drawImage(projImg, -ps / 2, -ps / 2, ps, ps);
        ctx.restore();
      } else {
        ctx.fillStyle = '#ffe066';
        ctx.fillRect(px - 2, py - 2, 4, 4);
      }
    }
    // Unit paths (display only, selected units only): each selected
    // alive unit's remaining sim path as a team-coloured dashed line
    // from the unit through waypoint tile centres to its destination,
    // with turn dots and a destination ring. Drawn under units, over
    // terrain. Unselected units draw NO path. After an order, game.js
    // sets anim.pathFlashUntil and the line draws thicker/brighter
    // until that sim time passes. Paths come from SWView.pathPolyline
    // over the sim's unit.path — never re-pathed here.
    if (View && anim.showPaths !== false) {
      var flashing = anim.pathFlashUntil !== undefined && time < anim.pathFlashUntil;
      for (var pui = 0; pui < state.units.length; pui++) {
        var pu = state.units[pui];
        if (selectedIds.indexOf(pu.id) === -1) continue;
        var pts = View.pathPolyline(pu, true);
        // Queued orders extend the same connected line: current path
        // waypoints, then each queued destination in queue order.
        // A unit with no current path but a queue still draws from its
        // own position through the queued points.
        if (View.queuedDestinations) {
          var qd = View.queuedDestinations(pu);
          if (qd.length) {
            if (!pts.length) pts = [{ x: pu.x, y: pu.y }];
            for (var qi = 0; qi < qd.length; qi++) pts.push(qd[qi]);
          }
        }
        if (pts.length < 2) continue;
        var pcolor = factionColor(state.catalog, pu.faction);
        ctx.save();
        ctx.strokeStyle = pcolor;
        ctx.globalAlpha = flashing ? 1 : 0.85;
        ctx.lineWidth = Math.max(1.5, Math.min(3, 2 * zoom)) * (flashing ? 1.6 : 1);
        ctx.setLineDash([Math.max(4, 6 * zoom), Math.max(3, 4 * zoom)]);
        ctx.beginPath();
        for (var ppi = 0; ppi < pts.length; ppi++) {
          var ppx = (pts[ppi].x - ox) * TILE * zoom, ppy = (pts[ppi].y - oy) * TILE * zoom;
          if (ppi === 0) ctx.moveTo(ppx, ppy); else ctx.lineTo(ppx, ppy);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        // Turn dots.
        var turns = View.pathTurns(pu, true);
        ctx.fillStyle = pcolor;
        for (var ti = 0; ti < turns.length; ti++) {
          var tpx = (turns[ti].x - ox) * TILE * zoom, tpy = (turns[ti].y - oy) * TILE * zoom;
          ctx.beginPath(); ctx.arc(tpx, tpy, Math.max(2, 3 * zoom), 0, Math.PI * 2); ctx.fill();
        }
        // Destination marker: ring + centre dot at the final waypoint.
        var dest = pts[pts.length - 1];
        var dpx = (dest.x - ox) * TILE * zoom, dpy = (dest.y - oy) * TILE * zoom;
        ctx.lineWidth = Math.max(1.5, 2 * zoom);
        ctx.beginPath(); ctx.arc(dpx, dpy, Math.max(6, 9 * zoom), 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(dpx, dpy, Math.max(1.5, 2 * zoom), 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
    // Prototype 03 markers (display only, drawn over terrain, under units):
    //  - Guard markers: for each SELECTED unit on a guard order, a ring
    //    at its guard point (or at the guarded entity's current position)
    //    plus a dashed line from the unit to the point. Unselected
    //    units draw no guard marker, like paths.
    //  - Rally markers: for each Command Core with a rally point, a
    //    ring at the rally point plus a dashed line from the core.
    //    Rally markers draw for both factions' cores (a rally point is
    //    a visible order, not hidden information) — but only the
    //    player's core rally can be set through the UI.
    if (View) {
      var guardColor = '#ffe066';
      for (var gi = 0; gi < state.units.length; gi++) {
        var gu = state.units[gi];
        if (selectedIds.indexOf(gu.id) === -1 || !gu.order || gu.order.kind !== 'guard') continue;
        var gpt = { x: gu.order.x, y: gu.order.y };
        if (gu.order.guardTargetId) {
          for (var gei = 0; gei < state.units.length; gei++) {
            if (state.units[gei].id === gu.order.guardTargetId) { gpt = { x: state.units[gei].x, y: state.units[gei].y }; break; }
          }
          if (gpt.x === gu.order.x && gpt.y === gu.order.y) {
            for (var gsi = 0; gsi < state.structures.length; gsi++) {
              if (state.structures[gsi].id === gu.order.guardTargetId) { gpt = { x: state.structures[gsi].x, y: state.structures[gsi].y }; break; }
            }
          }
        }
        var gux = (gu.x - ox) * TILE * zoom, guy = (gu.y - oy) * TILE * zoom;
        var gpx = (gpt.x - ox) * TILE * zoom, gpy = (gpt.y - oy) * TILE * zoom;
        ctx.save();
        ctx.strokeStyle = guardColor; ctx.globalAlpha = 0.9;
        ctx.lineWidth = Math.max(1.5, 2 * zoom);
        ctx.setLineDash([Math.max(4, 6 * zoom), Math.max(3, 4 * zoom)]);
        ctx.beginPath(); ctx.moveTo(gux, guy); ctx.lineTo(gpx, gpy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(gpx, gpy, Math.max(6, 9 * zoom), 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(gpx, gpy, Math.max(1.5, 2 * zoom), 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      for (var ri = 0; ri < state.structures.length; ri++) {
        var rs = state.structures[ri];
        if (rs.typeId !== 'command_core' || !rs.rally) continue;
        var rcx = (rs.x - ox) * TILE * zoom, rcy = (rs.y - oy) * TILE * zoom;
        var rpx = (rs.rally.x - ox) * TILE * zoom, rpy = (rs.rally.y - oy) * TILE * zoom;
        ctx.save();
        ctx.strokeStyle = factionColor(state.catalog, rs.faction); ctx.globalAlpha = 0.9;
        ctx.lineWidth = Math.max(1.5, 2 * zoom);
        ctx.setLineDash([Math.max(4, 6 * zoom), Math.max(3, 4 * zoom)]);
        ctx.beginPath(); ctx.moveTo(rcx, rcy); ctx.lineTo(rpx, rpy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(rpx, rpy, Math.max(6, 9 * zoom), 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(rpx, rpy, Math.max(1.5, 2 * zoom), 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
    // Units: real sprite, rotated to body facing (sprite barrels point
    // straight up in the file, so facing + 90 degrees points them along
    // the unit's facing, exactly as the old placeholder hull did). The
    // turret is part of the sprite, so no separate barrel is drawn over
    // it. Fallback is the old hull + barrel if the image is not ready.
    for (var ui = 0; ui < state.units.length; ui++) {
      var u = state.units[ui];
      var ua = (anim.unitAnim && anim.unitAnim[u.id]) || {};
      var ux = (u.x - ox) * TILE * zoom, uy = (u.y - oy) * TILE * zoom;
      // Bob (tiles -> px) + recoil (screen px, back along turret facing).
      uy += (ua.bobTiles || 0) * TILE * zoom;
      if (ua.recoilPx) { ux -= Math.cos(u.turretFacing) * ua.recoilPx * zoom; uy -= Math.sin(u.turretFacing) * ua.recoilPx * zoom; }
      var ur = Math.max(4, u.radius * TILE * zoom);
      var def = unitDef(state.catalog, u.typeId);
      var color = factionColor(state.catalog, u.faction);
      if (selectedIds.indexOf(u.id) !== -1) {
        // Scale-aware selection ring: readable at every zoom, with a
        // minimum px thickness so it never vanishes at 0.4x.
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = ringLineWidth(zoom);
        ctx.beginPath(); ctx.arc(ux, uy, ur + 3, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
      }
      // Soft drop shadow under the unit (drawn before the sprite) —
      // off when the Settings shadows toggle is off. Wave-2 fixed
      // directional offset (3, 4) px at zoom 1, as for structures.
      if (showShadows) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.ellipse(ux + 3 * zoom, uy + 4 * zoom, ur * 0.9, ur * 0.65, 0, 0, Math.PI * 2); ctx.fill();
      }
      // Rotor blur for gunship/drones: a translucent code-drawn disc,
      // no sprite file invented. Drawn under the sprite.
      if (Anim && Anim.hasRotor(u)) {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#dddddd';
        ctx.beginPath(); ctx.ellipse(ux, uy, ur * 1.35, ur * 0.55, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = '#eeeeee'; ctx.lineWidth = 1;
        var ra = time * 18 + u.id;
        ctx.beginPath(); ctx.moveTo(ux - Math.cos(ra) * ur * 1.3, uy - Math.sin(ra) * ur * 0.5);
        ctx.lineTo(ux + Math.cos(ra) * ur * 1.3, uy + Math.sin(ra) * ur * 0.5); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // Thin-chassis RENDERING treatment (Wave-2, NOT sprite art):
      // lancer/longshot (hero base chassis included) at zoom <= 1 get
      // a subtle team-tinted underlay disc + a darker outline ring
      // beneath the sprite. Draw size is UNCHANGED and sim scale is
      // untouched — this only lifts the faint chassis off the ground.
      if (Anim && Anim.thinChassisTreatment && Anim.thinChassisTreatment(u.typeId, zoom)) {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.ellipse(ux, uy, ur * 1.15, ur * 0.85, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = '#111'; ctx.lineWidth = Math.max(1.5, 2 * zoom);
        ctx.beginPath(); ctx.ellipse(ux, uy, ur * 1.15, ur * 0.85, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      var unitImg = Assets ? Assets.readyImage(Assets.unitPath(u.typeId, u.faction)) : null;
      if (unitImg) {
        ctx.save(); ctx.translate(ux, uy); ctx.rotate(u.facing + Math.PI / 2);
        ctx.drawImage(unitImg, -ur, -ur, ur * 2, ur * 2);
        ctx.restore();
      } else {
        ctx.save(); ctx.translate(ux, uy); ctx.rotate(u.facing + Math.PI / 2);
        drawHull(ctx, def ? def.category : 'main_battle', ur, color);
        ctx.restore();
        ctx.save(); ctx.translate(ux, uy); ctx.rotate(u.turretFacing);
        ctx.strokeStyle = '#111'; ctx.lineWidth = Math.max(1, 2 * zoom);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ur * 1.4, 0); ctx.stroke();
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, 0, ur * 0.35, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      // Damage decal (Wave-2, GENERATED art, not coded shapes): drawn
      // over the sprite at HP < 50% (light) and < 25% (heavy), plus
      // the existing smoke tiers below. Rotates with the unit.
      if (Assets && Anim && !farZoom && showFX && Anim.damageDecal) {
        var decalName = Anim.damageDecal(u);
        var decalImg = decalName ? Assets.readyImage(Assets.fxPath(decalName)) : null;
        if (decalImg) {
          ctx.save(); ctx.translate(ux, uy); ctx.rotate(u.facing + Math.PI / 2);
          ctx.globalAlpha = 0.9;
          var dsz = ur * 2.2;
          ctx.drawImage(decalImg, -dsz / 2, -dsz / 2, dsz, dsz);
          ctx.restore();
        }
      }
      // Far-zoom simplification: the smallest units' HP bars are hidden
      // below FAR_ZOOM; selection rings and team colours still read.
      if (!(farZoom && u.radius < 0.5)) drawBar(ctx, ux - ur, uy - ur - 6 * zoom, ur * 2, u.hp / u.maxHp, zoom);
      // Damage smoke above damaged units (light <50% HP, heavy <25%).
      // Hidden at far zoom (FX simplification) and when FX is off.
      if (Assets && Anim && !farZoom && showFX) {
        var smokeName = Anim.damageSmoke(u, time);
        var smokeImg = smokeName ? Assets.readyImage(Assets.fxPath(smokeName)) : null;
        if (smokeImg) {
          ctx.globalAlpha = 0.55 + 0.2 * Math.sin(time * 4 + u.id);
          var ss = ur * 1.7;
          ctx.drawImage(smokeImg, ux - ss / 2, uy - ur - ss * 0.8, ss, ss);
          ctx.globalAlpha = 1;
        }
      }
    }
    // Transient FX (explosions, muzzle flashes, dust, fresh-wreck fire),
    // drawn last so they read over units. Frame from sim-time elapsed;
    // expired effects are pruned by game.js, so none linger past duration.
    if (Assets && Anim && showFX && anim.effects) {
      for (var ei = 0; ei < anim.effects.length; ei++) {
        var ef = anim.effects[ei];
        // Far-zoom simplification: dust FX are skipped (damage smoke
        // is handled above and is already far-zoom-gated there).
        if (farZoom && ef.kind === 'dust') continue;
        var fr = Anim.effectFrame(ef.kind, time - ef.start);
        if (fr.done && ef.kind !== 'fire') continue;
        if (time - ef.start >= Anim.EFFECT_DURATIONS[ef.kind]) continue;
        var fxImg = fr.frame ? Assets.readyImage(Assets.fxPath(fr.frame)) : null;
        if (!fxImg) continue;
        var ex = (ef.x - ox) * TILE * zoom, ey = (ef.y - oy) * TILE * zoom;
        var es = (ef.sizeTiles || 1) * TILE * zoom;
        if (ef.kind === 'muzzle' && ef.angle !== undefined) {
          ctx.save(); ctx.translate(ex, ey); ctx.rotate(ef.angle + Math.PI / 2);
          ctx.drawImage(fxImg, -es / 2, -es / 2, es, es);
          ctx.restore();
        } else {
          ctx.drawImage(fxImg, ex - es / 2, ey - es / 2, es, es);
        }
        // Baked glow sprite (Wave-2): pre-rendered radial gradient,
        // additive 'lighter' for sparks/muzzle glow. Smoke/dust keep
        // normal alpha (they are drawn as frames above, never glowed).
        // No per-frame gradients, no per-frame allocation (cached).
        if (ef.kind === 'muzzle' || ef.kind === 'explosion' || ef.kind === 'fire') {
          var glow = glowSprite(ef.kind);
          if (glow) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = ef.kind === 'muzzle' ? 0.5 : 0.6;
            ctx.drawImage(glow, ex - es * 0.7, ey - es * 0.7, es * 1.4, es * 1.4);
            ctx.restore();
          }
        }
      }
    }
  }
  // Scale-aware HP bar: thickness stays readable across zoom, and
  // the drawn bar never shrinks below 28x4 on-screen px (see
  // hpBarMetrics) — a fixed world-size bar vanishing at 0.5x was the
  // failure mode. The minimum bar is centred on the world-size bar.
  function drawBar(ctx, x, y, w, frac, zoom) {
    var m = hpBarMetrics(w, zoom);
    var bx = x - (m.w - w) / 2;
    ctx.fillStyle = '#300'; ctx.fillRect(bx, y, m.w, m.h);
    ctx.fillStyle = frac > 0.5 ? '#3f3' : (frac > 0.25 ? '#ff3' : '#f33');
    ctx.fillRect(bx, y, m.w * Math.max(0, frac), m.h);
  }
  function drawMinimap(mctx, state, camera, mw, mh, wrecks) {
    mctx.fillStyle = '#000'; mctx.fillRect(0, 0, mw, mh);
    var sx = mw / state.width, sy = mh / state.height;
    for (var ty = 0; ty < state.height; ty++) for (var tx = 0; tx < state.width; tx++) {
      mctx.fillStyle = TERRAIN_COLORS[state.terrain[ty * state.width + tx]];
      mctx.fillRect(tx * sx, ty * sy, Math.ceil(sx), Math.ceil(sy));
    }
    if (wrecks) {
      mctx.fillStyle = '#333';
      for (var wi = 0; wi < wrecks.length; wi++) {
        mctx.fillRect(wrecks[wi].x * sx - 1, wrecks[wi].y * sy - 1, 2, 2);
      }
    }
    for (var i = 0; i < state.units.length; i++) {
      var u = state.units[i];
      mctx.fillStyle = factionColor(state.catalog, u.faction);
      mctx.fillRect(u.x * sx - 1, u.y * sy - 1, 2, 2);
    }
    for (var j = 0; j < state.structures.length; j++) {
      var s = state.structures[j];
      mctx.fillStyle = factionColor(state.catalog, s.faction);
      mctx.fillRect(s.x * sx - 2, s.y * sy - 2, 4, 4);
    }
    mctx.strokeStyle = '#fff';
    var vw = (mctx.canvas.width / 32) / camera.zoom; // approx viewport in tiles via main canvas width is set by caller through camera.viewTiles
    void vw;
    var viewTilesX = camera.viewTilesX || 20, viewTilesY = camera.viewTilesY || 12;
    mctx.strokeRect(camera.x * sx, camera.y * sy, viewTilesX * sx, viewTilesY * sy);
  }
  global.SWRender = { TILE: TILE, drawScene: drawScene, drawMinimap: drawMinimap, factionColor: factionColor,
    DPR_CAP: DPR_CAP, dprFor: dprFor, hpBarMetrics: hpBarMetrics, ringLineWidth: ringLineWidth,
    groundBakeKey: groundBakeKey, BAKE_TILE_PX: BAKE_TILE_PX };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.SWRender;
})(typeof globalThis !== 'undefined' ? globalThis : this);
