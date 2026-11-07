/* Surface Wars Prototype 01 — DOM-free simulation.
   Strict 90-degree top-down. Fixed timestep, spatial grid, pooled projectiles.
   No DOM, no canvas, no network access here: render.js / game.js own the UI. */
(function (global) {
  'use strict';
  var TICK_DT = 0.05; // 20 ticks per second
  // Prototype 02 economy constants (documented in MENUS-CONTROLS-MECHANICS-REPORT.md).
  // Prototype 03: BOTH factions start at 500 — the P02 "xandria starts at 0"
  // rule is superseded by the red AI economy (see PROTOTYPE03-REPORT.md).
  // The P02 test asserting xandria = 0 was updated for this, and is the
  // ONLY old test whose expectation changed in P03.
  var STARTING_SCRAP = 500; // starting scrap for iron_eden AND xandria in P03
  var SALVAGE_FRACTION = 0.4; // wreck base value = floor(0.4 * dead unit's catalog scrap cost), never full value
  var WRECK_LIFETIME_TICKS = 2400; // 120 seconds at 20 ticks/s; value decays linearly to 0, then the wreck expires
  var SALVAGE_RANGE = 1.5; // tiles: salvager must get this close to collect
  // Prototype 03 AI economy constants (documented in PROTOTYPE03-REPORT.md).
  var AI_QUEUE_CAP = 3; // max production-queue items the AI may hold at once
  var AI_PER_TYPE_CAP = 3; // max live units of one type the AI will build toward
  var AI_SALVAGE_RANGE = 15; // tiles: AI only salvages wrecks within this of an idle unit
  var AI_THINK_TICKS = 20; // AI thinks once per second of sim time (20 ticks/s)
  // Generation Cycle 3: endgame deadlock grace. 600 ticks = 30 seconds of
  // sim time. Long enough that a draw is never declared on a fleeting
  // frame and the player can see the endgame arrive, short enough that
  // a deadlocked match ends far inside any reasonable match length.
  // The trigger itself is state-based (see checkDeadlock), so the grace
  // is a display/confirmation delay, not a race against changing state:
  // once both cores are dead and neither side can damage the other,
  // no new damage capability can appear (no production, no new wrecks
  // without damage), so the counter can only be reset by the check
  // itself, never by play.
  var DEADLOCK_GRACE_TICKS = 600;
  // Twin-Stick Phase A: aim cone. A manually controlled unit fires only
  // at an enemy whose direction from the unit is within this half-angle
  // of the aim-stick / mouse-aim direction, AND which passes every
  // normal firing gate (weapon range, min-range, LOS, target class,
  // cooldown, accuracy, armour matrix). 30 degrees is wide enough
  // that a thumb-aimed shot at a visible target lands, and narrow
  // enough that aiming 90 degrees away from a target never fires.
  // This is an input rule, not a damage or stat change: the same
  // weapons, cooldowns, and damage apply as under RTS orders.
  var MANUAL_AIM_CONE_DEG = 30;
  var MANUAL_AIM_CONE_RAD = MANUAL_AIM_CONE_DEG * Math.PI / 180;
  var CELL = 4; // spatial grid cell size, in tiles
  // Terrain ids (must match the tile painter in render.js)
  var T = { GRASS: 0, DIRT: 1, BRIDGE: 2, FOREST: 3, WATER: 4, ROCK: 5 };

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function tileIndex(state, tx, ty) { return ty * state.width + tx; }
  function terrainAt(state, tx, ty) {
    if (tx < 0 || ty < 0 || tx >= state.width || ty >= state.height) return T.ROCK;
    return state.terrain[tileIndex(state, tx, ty)];
  }
  function blocksMovement(terrain, movementClass) {
    if (movementClass === 'air') return false;
    if (terrain === T.WATER) return movementClass !== 'hover';
    if (terrain === T.ROCK) return movementClass !== 'air';
    return false;
  }
  function movementCost(terrain, movementClass) {
    if (movementClass === 'air') return 1;
    if (terrain === T.FOREST && movementClass === 'ground') return 2;
    return 1;
  }
  function isPassable(state, tx, ty, movementClass) {
    if (tx < 0 || ty < 0 || tx >= state.width || ty >= state.height) return false;
    return !blocksMovement(terrainAt(state, tx, ty), movementClass);
  }

  // Binary-heap A* over the tile grid. Returns tile steps excluding the start
  // tile, including the target tile, or null when unreachable.
  function findPath(state, sx, sy, tx, ty, movementClass) {
    if (!isPassable(state, tx, ty, movementClass)) return null;
    if (sx === tx && sy === ty) return [];
    var w = state.width, h = state.height, n = w * h;
    var gScore = new Float64Array(n); gScore.fill(Infinity);
    var cameFrom = new Int32Array(n); cameFrom.fill(-1);
    var closed = new Uint8Array(n);
    var start = sy * w + sx, goal = ty * w + tx;
    gScore[start] = 0;
    // heap of [f, index]
    var heap = [[Math.abs(tx - sx) + Math.abs(ty - sy), start]];
    function heapPush(item) {
      heap.push(item); var i = heap.length - 1;
      while (i > 0) { var p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; var t = heap[p]; heap[p] = heap[i]; heap[i] = t; i = p; }
    }
    function heapPop() {
      var top = heap[0], last = heap.pop();
      if (heap.length) { heap[0] = last; var i = 0; for (;;) { var l = 2 * i + 1, r = l + 1, m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; var t = heap[m]; heap[m] = heap[i]; heap[i] = t; i = m; } }
      return top;
    }
    var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (heap.length) {
      var cur = heapPop()[1];
      if (closed[cur]) continue;
      closed[cur] = 1;
      if (cur === goal) break;
      var cx = cur % w, cy = (cur / w) | 0;
      for (var d = 0; d < 4; d++) {
        var nx = cx + DIRS[d][0], ny = cy + DIRS[d][1];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        var ni = ny * w + nx;
        if (closed[ni]) continue;
        var terr = state.terrain[ni];
        if (blocksMovement(terr, movementClass)) continue;
        var ng = gScore[cur] + movementCost(terr, movementClass);
        if (ng < gScore[ni]) {
          gScore[ni] = ng; cameFrom[ni] = cur;
          heapPush([ng + Math.abs(tx - nx) + Math.abs(ty - ny), ni]);
        }
      }
    }
    if (cameFrom[goal] === -1 && goal !== start) return null;
    var path = [], cur2 = goal;
    while (cur2 !== start) { path.push([cur2 % w, (cur2 / w) | 0]); cur2 = cameFrom[cur2]; if (cur2 === -1) return null; }
    path.reverse();
    return path;
  }

  // Bresenham line of sight. ROCK blocks; endpoints are not blocking.
  function hasLOS(state, x1, y1, x2, y2) {
    var tx1 = Math.floor(x1), ty1 = Math.floor(y1), tx2 = Math.floor(x2), ty2 = Math.floor(y2);
    var dx = Math.abs(tx2 - tx1), dy = Math.abs(ty2 - ty1);
    var sx = tx1 < tx2 ? 1 : -1, sy = ty1 < ty2 ? 1 : -1, err = dx - dy;
    var x = tx1, y = ty1;
    for (var guard = 0; guard < 10000; guard++) {
      if (!((x === tx1 && y === ty1) || (x === tx2 && y === ty2))) {
        if (terrainAt(state, x, y) === T.ROCK) return false;
      }
      if (x === tx2 && y === ty2) return true;
      var e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
    return true;
  }

  function computeDamage(catalog, weapon, targetArmor, distanceFromBlast) {
    var mult = 1;
    if (catalog && catalog.armorMatrix && catalog.armorMatrix[weapon.damageType]) {
      var row = catalog.armorMatrix[weapon.damageType];
      if (row[targetArmor] !== undefined) mult = row[targetArmor];
    }
    var fall = 1;
    if (weapon.splashRadius > 0) {
      var f = Math.min(1, distanceFromBlast / weapon.splashRadius);
      fall = 1 - weapon.falloff * f;
    }
    return weapon.damage * mult * fall;
  }

  function createGame(opts) {
    opts = opts || {};
    var catalog = opts.catalog;
    var width = opts.width || 64, height = opts.height || 40;
    var terrain = opts.terrain || new Uint8Array(width * height);
    var cols = Math.ceil(width / CELL), rows = Math.ceil(height / CELL);
    var buckets = [];
    for (var i = 0; i < cols * rows; i++) buckets.push([]);
    var state = {
      catalog: catalog, width: width, height: height, terrain: terrain,
      units: [], structures: [], time: 0, tick: 0, winner: null, deadlockTicks: 0,
      rng: mulberry32(opts.seed !== undefined ? opts.seed : 1337),
      nextId: 1, gridCols: cols, gridRows: rows, buckets: buckets,
      // Prototype 02: scrap economy, production queues, sim wrecks.
      // tutorial: false in normal games; the shell sets it true for
      // tutorial games only (red side held — see the AI gate in step()).
      tutorial: false,
      scrap: {}, queues: {}, wrecks: [], wrecksCreated: 0, nextWreckId: 1,
      factionsSeen: {}, projectilePool: [], projectileActive: 0,
      // Twin-Stick Phase B: burn zones from 'burn' special hits. Each
      // {x, y, expiresTick, weapon, faction}; damage is applied per
      // tick in step(), never by allocation in the hot loop beyond
      // the zone record itself. Bounded in processBurnZones.
      burnZones: [],
      // Twin-Stick Phase C: hero match events, accumulated by the sim
      // during the match and read by the shell ONLY at match end
      // (victory/defeat/draw panel). Never written mid-match by the
      // shell, never carried into the next match (a fresh state
      // starts at 0). heroSkills is shell-set at match start from
      // the progression record (unlocked skill ids); the sim reads
      // it for Salvage Sense only — no other skill needs sim-side
      // knowledge, and the red AI never reads it.
      heroXp: { killXp: 0, salvageXp: 0, kills: 0, salvages: 0 },
      heroSkills: [],
    };
    state.scrap.iron_eden = STARTING_SCRAP;
    state.scrap.xandria = STARTING_SCRAP; // P03: red AI economy starts equal
    if (opts.scrap) for (var sf in opts.scrap) state.scrap[sf] = opts.scrap[sf];
    // Pre-allocated projectile pool (no per-tick allocation for projectiles).
    for (var p = 0; p < 2048; p++) {
      state.projectilePool.push({ active: false, x: 0, y: 0, tx: 0, ty: 0, target: null, weapon: null, faction: null, sourceId: 0 });
    }
    return state;
  }

  function unitDef(state, typeId) {
    var units = state.catalog.units;
    for (var i = 0; i < units.length; i++) if (units[i].id === typeId) return units[i];
    throw new Error('unknown unit type: ' + typeId);
  }
  function weaponDef(state, weaponId) {
    var ws = state.catalog.weapons;
    for (var i = 0; i < ws.length; i++) if (ws[i].id === weaponId) return ws[i];
    throw new Error('unknown weapon: ' + weaponId);
  }
  function structDef(state, typeId) {
    var ss = state.catalog.structures;
    for (var i = 0; i < ss.length; i++) if (ss[i].id === typeId) return ss[i];
    throw new Error('unknown structure: ' + typeId);
  }

  function addUnit(state, typeId, faction, x, y) {
    var def = unitDef(state, typeId);
    var weapons = [];
    for (var i = 0; i < def.weapons.length; i++) weapons.push(weaponDef(state, def.weapons[i]));
    var u = { id: state.nextId++, kind: 'unit', typeId: typeId, faction: faction,
      x: x, y: y, hp: def.hp, maxHp: def.hp, armor: def.armor, radius: def.size,
      speed: def.speed, vision: def.vision, movementClass: def.movementClass,
      weapons: weapons, cooldowns: [], facing: 0, turretFacing: 0,
      order: { kind: 'hold' }, orderQueue: [], path: [], targetId: 0, alive: true,
      // Twin-Stick Phase B: per-weapon overheat accumulators (parallel
      // to weapons, lazily filled by noteFired) and the tick until
      // which a 'stun' hit halves this unit's speed. Both default to
      // inactive for catalog units; only special-carrying weapons
      // ever write them.
      heat: [], slowUntil: 0,
      // Twin-Stick Phase C: active-skill state (hero only in
      // practice — the hero is the only unit with skill buttons —
      // but stored per unit so no special-casing leaks into step()).
      // skillCooldowns maps skill id -> tick when it is ready again;
      // dash/overdrive/rally *Until are buff expiry ticks.
      skillCooldowns: {}, dashUntil: 0, overdriveUntil: 0, rallyBoostUntil: 0 };
    for (var j = 0; j < weapons.length; j++) u.cooldowns.push(0);
    state.units.push(u); state.factionsSeen[faction] = true;
    return u;
  }
  // Twin-Stick Phase B: add a unit from an explicit spec instead of a
  // catalog row — the hero path. spec: {typeId (sprite + wreck type),
  // faction, x, y, hp, maxHp, armor, speed, vision, radius,
  // movementClass, weapons (resolved sim weapon objects, fresh),
  // isHero, costScrap (wreck value basis)}. The unit is an ordinary
  // field entity once added: the red AI targets it, the deadlock
  // detector counts it, and death leaves a normal wreck — reserve is
  // a shell-side absence, never a flag on a field unit.
  function addCustomUnit(state, spec) {
    var weapons = spec.weapons.slice();
    var u = { id: state.nextId++, kind: 'unit', typeId: spec.typeId, faction: spec.faction,
      x: spec.x, y: spec.y, hp: spec.hp, maxHp: spec.maxHp, armor: spec.armor, radius: spec.radius,
      speed: spec.speed, vision: spec.vision, movementClass: spec.movementClass,
      weapons: weapons, cooldowns: [], facing: 0, turretFacing: 0,
      order: { kind: 'hold' }, orderQueue: [], path: [], targetId: 0, alive: true,
      heat: [], slowUntil: 0, skillCooldowns: {}, dashUntil: 0, overdriveUntil: 0, rallyBoostUntil: 0,
      isHero: !!spec.isHero,
      costScrap: spec.costScrap !== undefined ? spec.costScrap : 0 };
    for (var j = 0; j < weapons.length; j++) u.cooldowns.push(0);
    state.units.push(u); state.factionsSeen[spec.faction] = true;
    return u;
  }
  // Twin-Stick Phase B: remove a field unit WITHOUT a wreck, scrap,
  // or XP effect — the hero's voluntary withdrawal to reserve. Any
  // other removal (death) goes through the normal cleanup path and
  // leaves a wreck. Returns {ok} / {ok:false, reason}.
  function withdrawUnit(state, unitId) {
    for (var i = 0; i < state.units.length; i++) {
      if (state.units[i].id === unitId) { state.units.splice(i, 1); return { ok: true }; }
    }
    return { ok: false, reason: 'no-unit' };
  }
  function addStructure(state, typeId, faction, x, y) {
    var def = structDef(state, typeId);
    var s = { id: state.nextId++, kind: 'structure', typeId: typeId, faction: faction,
      x: x, y: y, hp: def.hp, maxHp: def.hp, armor: def.armor, radius: def.footprint / 2,
      weapons: [], cooldowns: [], facing: 0, turretFacing: 0, order: { kind: 'hold' },
      path: [], targetId: 0, alive: true, rally: null };
    state.structures.push(s); state.factionsSeen[faction] = true;
    return s;
  }
  function findEntity(state, id) {
    for (var i = 0; i < state.units.length; i++) if (state.units[i].id === id) return state.units[i];
    for (var j = 0; j < state.structures.length; j++) if (state.structures[j].id === id) return state.structures[j];
    return null;
  }
  function findWreck(state, id) {
    for (var i = 0; i < state.wrecks.length; i++) if (state.wrecks[i].id === id) return state.wrecks[i];
    return null;
  }
  function copyOrder(order) {
    var o = { kind: order.kind, x: order.x, y: order.y, targetId: order.targetId || 0, wreckId: order.wreckId || 0, leg: order.leg || 0,
      guardTargetId: order.guardTargetId || 0, guardArrived: !!order.guardArrived };
    if (order.points) o.points = order.points.map(function (pt) { return { x: pt.x, y: pt.y }; });
    return o;
  }
  // Set a unit's CURRENT order (replacing it) and compute its path.
  // Patrol: order.points is [A, B], order.leg is the leg being walked (0/1).
  // Salvage: order.wreckId; path leads to the wreck's tile.
  // Guard (P03): order.x/y is the guard point, or order.guardTargetId is a
  // friendly unit/structure to guard (point follows it while alive). The
  // unit first moves to the point, then holds there, engages enemies in
  // range, and returns to the point if displaced — unlike Hold, which
  // never moves to a point and never returns after displacement.
  function applyOrderToUnit(state, u, order) {
    u.order = copyOrder(order);
    u.targetId = order.targetId || 0;
    u.pathTargetId = 0;
    if (order.kind === 'move' || order.kind === 'attackMove') {
      var path = findPath(state, Math.floor(u.x), Math.floor(u.y), Math.floor(order.x), Math.floor(order.y), u.movementClass);
      u.path = path || [];
    } else if (order.kind === 'guard') {
      var gx = order.x, gy = order.y;
      if (order.guardTargetId) {
        var ge = findEntity(state, order.guardTargetId);
        if (ge && ge.alive) { gx = ge.x; gy = ge.y; u.order.x = gx; u.order.y = gy; }
      }
      u.order.guardArrived = Math.hypot(gx - u.x, gy - u.y) <= 0.6;
      if (!u.order.guardArrived) {
        var gpath = findPath(state, Math.floor(u.x), Math.floor(u.y), Math.floor(gx), Math.floor(gy), u.movementClass);
        u.path = gpath || [];
      } else { u.path = []; }
    } else if (order.kind === 'patrol' && order.points && order.points.length >= 2) {
      var legPt = order.points[u.order.leg || 0];
      var ppath = findPath(state, Math.floor(u.x), Math.floor(u.y), Math.floor(legPt.x), Math.floor(legPt.y), u.movementClass);
      u.path = ppath || [];
    } else if (order.kind === 'salvage') {
      var wk = findWreck(state, order.wreckId);
      if (wk) {
        var spath = findPath(state, Math.floor(u.x), Math.floor(u.y), Math.floor(wk.x), Math.floor(wk.y), u.movementClass);
        u.path = spath || [];
      } else { u.path = []; }
    } else { u.path = []; }
  }
  // Advance a unit to its next queued order. Returns true if one was applied.
  function advanceQueue(state, u) {
    if (!u.orderQueue || !u.orderQueue.length) return false;
    applyOrderToUnit(state, u, u.orderQueue.shift());
    return true;
  }
  // Issue an order. Default replaces the current order and clears the queue
  // (Prototype 01 behaviour, preserved). With opts.append and a live
  // (non-hold) current order, the order is APPENDED to the queue instead.
  function issueOrder(state, ids, order, opts) {
    opts = opts || {};
    for (var i = 0; i < state.units.length; i++) {
      var u = state.units[i];
      if (ids.indexOf(u.id) === -1) continue;
      if (opts.append && u.order && u.order.kind !== 'hold') {
        if (!u.orderQueue) u.orderQueue = [];
        u.orderQueue.push(copyOrder(order));
      } else {
        u.orderQueue = [];
        applyOrderToUnit(state, u, order);
      }
    }
  }
  // ---- Twin-Stick Phase A: manual control (input only) ----
  // The control flag lives on the unit object but is set/cleared ONLY
  // through these shell-facing functions; the red AI never reads it
  // (it iterates xandria units only, and a controlled unit is always
  // an iron_eden unit). While manual is set, step() runs the manual
  // branch below instead of the unit's orders: movement from the
  // stick/key vector at catalog speed, firing only at aim-cone
  // targets through the normal firing gates and the pooled
  // projectile pool. No stat, damage, cooldown, or economy change.
  function angleDiff(a, b) {
    var d = a - b;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return d;
  }
  function setManualControl(state, unitId) {
    var u = findEntity(state, unitId);
    if (!u || u.kind !== 'unit' || !u.alive) return { ok: false, reason: 'no-unit' };
    u.manual = { moveX: 0, moveY: 0, aimAngle: null, firing: false };
    u.order = { kind: 'hold' }; u.orderQueue = []; u.path = []; u.targetId = 0;
    return { ok: true };
  }
  function clearManualControl(state, unitId) {
    var u = findEntity(state, unitId);
    if (!u || !u.manual) return { ok: false, reason: 'not-controlled' };
    u.manual = null;
    u.order = { kind: 'hold' }; u.orderQueue = []; u.path = []; u.targetId = 0;
    return { ok: true };
  }
  function setManualInput(state, unitId, moveX, moveY, aimAngle, firing) {
    var u = findEntity(state, unitId);
    if (!u || !u.manual) return { ok: false, reason: 'not-controlled' };
    var m = Math.hypot(moveX || 0, moveY || 0);
    if (m > 1) { moveX /= m; moveY /= m; }
    u.manual.moveX = moveX || 0; u.manual.moveY = moveY || 0;
    u.manual.aimAngle = (aimAngle === null || aimAngle === undefined) ? null : aimAngle;
    u.manual.firing = !!firing;
    return { ok: true };
  }
  // Formation offsets: distinct destination offsets (tiles) around a target
  // point for a group of n units. A centred grid, 2 tiles apart, so units
  // do not all path to the exact same tile. Index 0 is the centre-ish cell.
  function formationOffsets(count) {
    if (count <= 1) return [[0, 0]];
    var cols = Math.ceil(Math.sqrt(count));
    var rows = Math.ceil(count / cols);
    var offs = [];
    for (var i = 0; i < count; i++) {
      var col = i % cols, row = (i / cols) | 0;
      offs.push([(col - (cols - 1) / 2) * 2, (row - (rows - 1) / 2) * 2]);
    }
    return offs;
  }
  // Issue a move/attackMove order to a group with formation offsets.
  // Each unit gets its own destination (target + its offset, clamped to
  // the map); a unit whose offset tile is unreachable gets an empty path
  // and holds (it does not teleport and does not steal another unit's spot).
  function issueFormationOrder(state, ids, order, opts) {
    var offs = formationOffsets(ids.length);
    for (var i = 0; i < ids.length; i++) {
      var u = findEntity(state, ids[i]);
      if (!u || u.kind !== 'unit') continue;
      var dest = { kind: order.kind,
        x: Math.max(0.5, Math.min(state.width - 0.5, order.x + offs[i][0])),
        y: Math.max(0.5, Math.min(state.height - 0.5, order.y + offs[i][1])),
        targetId: order.targetId || 0 };
      if (opts && opts.append && u.order && u.order.kind !== 'hold') {
        if (!u.orderQueue) u.orderQueue = [];
        u.orderQueue.push(copyOrder(dest));
      } else {
        u.orderQueue = [];
        applyOrderToUnit(state, u, dest);
      }
    }
  }

  // ---- Prototype 02 economy ----
  function scrapOf(state, faction) { return state.scrap[faction] || 0; }
  // Units the faction may build in P02: its catalog roster, restricted to
  // units with zero Power and zero Components cost, because those two
  // economy layers do not exist yet. Scrap cost and buildTime come
  // straight from the catalog — no second cost system is invented.
  function producibleUnits(state, faction) {
    var roster = null;
    for (var i = 0; i < state.catalog.factions.length; i++) {
      if (state.catalog.factions[i].id === faction) roster = state.catalog.factions[i].roster;
    }
    if (!roster) return [];
    return state.catalog.units.filter(function (u) {
      return roster.indexOf(u.id) !== -1 && u.cost.power === 0 && u.cost.components === 0;
    });
  }
  function productionQueue(state, faction) {
    if (!state.queues[faction]) state.queues[faction] = { coreId: 0, items: [] };
    return state.queues[faction];
  }
  // Queue a unit for production at a Command Core. Scrap is deducted when
  // QUEUED (not when finished); cancelling refunds the full cost.
  function queueProduction(state, faction, coreId, typeId) {
    var core = findEntity(state, coreId);
    if (!core || core.kind !== 'structure' || core.typeId !== 'command_core' || core.faction !== faction) {
      return { ok: false, reason: 'no-core' };
    }
    var def = null, prod = producibleUnits(state, faction);
    for (var i = 0; i < prod.length; i++) if (prod[i].id === typeId) def = prod[i];
    if (!def) return { ok: false, reason: 'not-producible' };
    if (scrapOf(state, faction) < def.cost.scrap) return { ok: false, reason: 'insufficient-scrap' };
    state.scrap[faction] = scrapOf(state, faction) - def.cost.scrap;
    var q = productionQueue(state, faction);
    q.coreId = coreId;
    q.items.push({ typeId: typeId, cost: def.cost.scrap, totalTicks: Math.round(def.buildTime / TICK_DT), remainingTicks: Math.round(def.buildTime / TICK_DT) });
    return { ok: true };
  }
  function cancelProduction(state, faction, index) {
    var q = productionQueue(state, faction);
    if (index < 0 || index >= q.items.length) return { ok: false, reason: 'bad-index' };
    var item = q.items.splice(index, 1)[0];
    state.scrap[faction] = scrapOf(state, faction) + item.cost;
    return { ok: true, refund: item.cost };
  }
  // First passable tile for a unit of movementClass, spiralling out from
  // the core (Chebyshev rings 1..5). Returns {x, y} tile centres or null.
  function spawnPosition(state, core, movementClass) {
    var bx = Math.floor(core.x), by = Math.floor(core.y);
    for (var r = 1; r <= 5; r++) {
      for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        var tx = bx + dx, ty = by + dy;
        if (isPassable(state, tx, ty, movementClass)) return { x: tx + 0.5, y: ty + 0.5 };
      }
    }
    return null;
  }
  // ---- Prototype 03: rally points ----
  // Set a Command Core's rally point. Newly produced units move there on
  // spawn instead of idling next to the core. Returns {ok} / {ok:false,
  // reason}. The point is clamped to the map; it is NOT validated as
  // passable — a ground unit rallied into water holds next to the core
  // (its path is empty), exactly like an unreachable move order.
  function setRally(state, faction, coreId, x, y) {
    var core = findEntity(state, coreId);
    if (!core || core.kind !== 'structure' || core.typeId !== 'command_core' || core.faction !== faction || !core.alive) {
      return { ok: false, reason: 'no-core' };
    }
    core.rally = {
      x: Math.max(0.5, Math.min(state.width - 0.5, x)),
      y: Math.max(0.5, Math.min(state.height - 0.5, y))
    };
    return { ok: true, rally: core.rally };
  }
  // Advance production queues: one unit at a time per faction, head first.
  // If the core is gone, the whole queue is refunded (the producer died).
  // If no spawn tile is free, the finished item waits at 0 ticks and
  // retries each tick — the paid unit is never silently dropped.
  function processProduction(state) {
    for (var faction in state.queues) {
      var q = state.queues[faction];
      if (!q.items.length) continue;
      var core = findEntity(state, q.coreId);
      // Wave-2 decision (beta wave-1 OBS-1): a dead core refunds the
      // whole queue IMMEDIATELY, in the tick its death is processed,
      // not when the head item's timer would have expired. The old
      // deferred timing made scrap unavailable for up to a full build
      // time after the producer died, while CONTROLS.md promised the
      // whole queue refunded with no timing qualifier.
      if (!core || !core.alive) {
        for (var i = 0; i < q.items.length; i++) state.scrap[faction] = scrapOf(state, faction) + q.items[i].cost;
        q.items = [];
        continue;
      }
      var head = q.items[0];
      if (head.remainingTicks > 0) head.remainingTicks--;
      if (head.remainingTicks > 0) continue;
      var def = unitDef(state, head.typeId);
      var pos = spawnPosition(state, core, def.movementClass);
      if (!pos) continue; // retry next tick
      var spawned = addUnit(state, head.typeId, faction, pos.x, pos.y);
      // P03 rally: a produced unit with a rally point moves there on
      // spawn instead of idling next to the core.
      if (core.rally) applyOrderToUnit(state, spawned, { kind: 'move', x: core.rally.x, y: core.rally.y });
      q.items.shift();
    }
  }
  // ---- Prototype 02 wrecks ----
  function createWreck(state, deadUnit) {
    var def = unitDef(state, deadUnit.typeId);
    // Twin-Stick Phase B: a custom unit (the hero) carries its own
    // scrap basis — 380 for the lancer-chassis hero, so its wreck is
    // floor(0.4 * 380) = 152 at full value, exactly like the catalog
    // lancer it replaces. Catalog units never set costScrap, so their
    // path is unchanged.
    var cost = deadUnit.costScrap !== undefined ? deadUnit.costScrap : def.cost.scrap;
    var base = Math.floor(cost * SALVAGE_FRACTION);
    var wk = { id: state.nextWreckId++, typeId: deadUnit.typeId, faction: deadUnit.faction,
      x: deadUnit.x, y: deadUnit.y, radius: deadUnit.radius,
      baseValue: base, value: base,
      createdTick: state.tick, expiresTick: state.tick + WRECK_LIFETIME_TICKS };
    state.wrecks.push(wk);
    state.wrecksCreated++;
    return wk;
  }
  function processWreckDecay(state) {
    for (var i = state.wrecks.length - 1; i >= 0; i--) {
      var wk = state.wrecks[i];
      var age = state.tick - wk.createdTick;
      if (age >= WRECK_LIFETIME_TICKS) { state.wrecks.splice(i, 1); continue; }
      wk.value = Math.floor(wk.baseValue * (WRECK_LIFETIME_TICKS - age) / WRECK_LIFETIME_TICKS);
    }
  }
  // Twin-Stick Phase C: salvager is the collecting unit (or null
  // from legacy callers). A hero salvager with Salvage Sense
  // (state.heroSkills, shell-set at match start) collects +25%
  // scrap, rounded down, and every hero salvage records 10 XP in
  // heroXp — read by the shell at match end only. Army salvages
  // are unchanged and record no hero XP.
  function salvageWreck(state, faction, wreckId, salvager) {
    var wk = findWreck(state, wreckId);
    if (!wk) return { ok: false, reason: 'no-wreck' };
    var gained = wk.value;
    var isHeroSalvage = !!(salvager && salvager.isHero);
    if (isHeroSalvage && state.heroSkills && state.heroSkills.indexOf('salvage_sense') !== -1) {
      gained = Math.floor(wk.value * 1.25);
    }
    state.scrap[faction] = scrapOf(state, faction) + gained;
    state.wrecks.splice(state.wrecks.indexOf(wk), 1);
    if (isHeroSalvage) { state.heroXp.salvageXp += 10; state.heroXp.salvages++; }
    return { ok: true, gained: gained };
  }
  // Twin-Stick Phase C: active-skill activation for a field unit.
  // The shell only offers this for the controlled hero with an
  // equipped active skill, but the sim validates everything itself:
  // unit alive, skill is an active skill id, cooldown ready. Passives
  // and unknown ids are rejected, never silently applied. Durations
  // and cooldowns are the spec's PROPOSED numbers, in ticks at
  // 20 ticks/s: Dash 0.4s/8s, Overdrive 5s/20s, Field Repair 60 HP/
  // 30s, Shockwave Slam 2 tiles, primary x1.5, no structures/25s,
  // Rally Signal 8 tiles, +10% speed, 8s/30s. Shockwave damage
  // goes through applyDamage with the hero as src, so its killing
  // blows count as hero kills like any other hero weapon.
  // WAVE 3: Concussive Pulse 3 tiles, slow (half speed via the
  // existing slowUntil/speedMult path, the same field the stun
  // special writes) for 5s/25s cooldown. It deals NO damage and
  // touches no structures, so it cannot create hero-kill XP or
  // change the damage economy — it only buys positioning time.
  var SKILL_DEFS = {
    dash: { cooldown: 160, duration: 8 },
    overdrive: { cooldown: 400, duration: 100 },
    field_repair: { cooldown: 600 },
    shockwave_slam: { cooldown: 500 },
    rally_signal: { cooldown: 600, duration: 160, radius: 8 },
    concussive_pulse: { cooldown: 500, radius: 3, duration: 100 }
  };
  function skillCooldownRemaining(state, unitId, skillId) {
    var u = findEntity(state, unitId);
    if (!u || !u.skillCooldowns) return 0;
    var ready = u.skillCooldowns[skillId] || 0;
    return Math.max(0, ready - state.tick);
  }
  function activateSkill(state, unitId, skillId) {
    var u = findEntity(state, unitId);
    if (!u || !u.alive) return { ok: false, reason: 'Unit is not on the field.' };
    var def = SKILL_DEFS[skillId];
    if (!def) return { ok: false, reason: 'Not an active skill: ' + skillId + '.' };
    var ready = u.skillCooldowns[skillId] || 0;
    if (state.tick < ready) return { ok: false, reason: 'Skill on cooldown for ' + Math.ceil((ready - state.tick) / 20) + 's.' };
    u.skillCooldowns[skillId] = state.tick + def.cooldown;
    if (skillId === 'dash') { u.dashUntil = state.tick + def.duration; return { ok: true }; }
    if (skillId === 'overdrive') { u.overdriveUntil = state.tick + def.duration; return { ok: true }; }
    if (skillId === 'field_repair') { u.hp = Math.min(u.maxHp, u.hp + 60); return { ok: true }; }
    if (skillId === 'shockwave_slam') {
      var primary = u.weapons[0];
      if (!primary) return { ok: false, reason: 'No primary weapon.' };
      var slam = {}; for (var k in primary) slam[k] = primary[k];
      slam.damage = primary.damage * 1.5; slam.accuracy = 1; slam.splashRadius = 0;
      slam.targetClasses = primary.targetClasses.slice();
      forEachInRadius(state, u.x, u.y, 2, function (e) {
        if (e.kind !== 'unit' || e.faction === u.faction || !e.alive) return;
        applyDamage(state, e, slam, 0, true, u);
      });
      return { ok: true };
    }
    if (skillId === 'concussive_pulse') {
      forEachInRadius(state, u.x, u.y, def.radius, function (e) {
        if (e.kind !== 'unit' || e.faction === u.faction || !e.alive) return;
        if (e.slowUntil < state.tick + def.duration) e.slowUntil = state.tick + def.duration;
      });
      return { ok: true };
    }
    if (skillId === 'rally_signal') {
      forEachInRadius(state, u.x, u.y, def.radius, function (e) {
        if (e.kind !== 'unit' || e.faction !== u.faction || !e.alive) return;
        e.rallyBoostUntil = state.tick + def.duration;
      });
      return { ok: true };
    }
    return { ok: false, reason: 'Unhandled skill: ' + skillId + '.' };
  }
  // Effective weapon interval for a unit (Overdrive: fire rate +25%
  // means interval x0.8 while the buff lasts). Used by both the
  // manual and auto firing branches so the buff cannot be dodged
  // by one path or the other.
  function effInterval(state, u, weapon) {
    if (u.overdriveUntil && state.tick < u.overdriveUntil) return weapon.interval * 0.8;
    return weapon.interval;
  }
  // Speed multiplier from timed modifiers: stun halves, Rally
  // Signal adds 10%. Both stack multiplicatively (0.5 x 1.1).
  function speedMult(state, u) {
    var m = 1;
    if (state.tick < u.slowUntil) m *= 0.5;
    if (u.rallyBoostUntil && state.tick < u.rallyBoostUntil) m *= 1.1;
    return m;
  }
  // ---- Prototype 03: red AI economy (sim-side, not browser-only) ----
  // Xandria gets the SAME economy rules as the player — starting scrap
  // 500, catalog costs/times, the same producible filter, the same
  // salvage fraction/decay — and NO free scrap, NO free units, NO extra
  // vision. Its combat behaviour is unchanged: the demo attack-move
  // driver in game.js still issues combat orders; this function only
  // adds production + salvage decisions on top of it.
  // Rules (all stated, all testable):
  //  - Thinks once per AI_THINK_TICKS (20 ticks = 1 sim second).
  //  - Production: if its Command Core is alive and its queue holds
  //    fewer than AI_QUEUE_CAP (3) items, queue the CHEAPEST affordable
  //    producible unit whose live + already-queued count is below
  //    AI_PER_TYPE_CAP (3).
  //    Cheapest-first with a per-type cap keeps the AI from spamming
  //    one unit forever and from snowballing invisibly behind a queue.
  //  - Salvage: each idle (hold-order, empty-queue) red unit may be
  //    sent to at most one wreck, and each wreck gets at most one
  //    salvager, only when the wreck is within AI_SALVAGE_RANGE (15
  //    tiles) of that unit and is still worth something (value > 0).
  //    Units already salvaging, moving, or fighting are never retargeted.
  //  - The AI never touches the iron_eden queue or scrap, and never
  //    acts when its core is dead or missing.
  function runAiEconomy(state) {
    var faction = 'xandria';
    var core = null;
    for (var si = 0; si < state.structures.length; si++) {
      var s = state.structures[si];
      if (s.faction === faction && s.typeId === 'command_core' && s.alive) { core = s; break; }
    }
    if (!core) return;
    var q = productionQueue(state, faction);
    if (q.items.length < AI_QUEUE_CAP) {
      var prod = producibleUnits(state, faction).slice().sort(function (a, b) { return a.cost.scrap - b.cost.scrap; });
      for (var pi = 0; pi < prod.length; pi++) {
        var def = prod[pi];
        // Count live units PLUS units already queued of this type, so
        // the per-type cap is a real ceiling (3), not just a queueing
        // hint that a queued backlog could push past.
        var count = 0;
        for (var ui = 0; ui < state.units.length; ui++) {
          if (state.units[ui].faction === faction && state.units[ui].typeId === def.id) count++;
        }
        for (var qi = 0; qi < q.items.length; qi++) {
          if (q.items[qi].typeId === def.id) count++;
        }
        if (count >= AI_PER_TYPE_CAP) continue;
        if (scrapOf(state, faction) < def.cost.scrap) continue;
        // queueProduction re-checks core/producible/affordability, so a
        // failed attempt here can never corrupt scrap or the queue.
        if (queueProduction(state, faction, core.id, def.id).ok) break;
      }
    }
    // Salvage: collect the set of wrecks already targeted by red
    // salvagers so two units are never sent to the same wreck.
    var targeted = {};
    for (var ti = 0; ti < state.units.length; ti++) {
      var tu = state.units[ti];
      if (tu.faction === faction && tu.order && tu.order.kind === 'salvage' && tu.order.wreckId) targeted[tu.order.wreckId] = true;
    }
    for (var wi = 0; wi < state.wrecks.length; wi++) {
      var wk = state.wrecks[wi];
      if (targeted[wk.id] || wk.value <= 0) continue;
      var best = null, bestDist = Infinity;
      for (var uj = 0; uj < state.units.length; uj++) {
        var u = state.units[uj];
        if (u.faction !== faction || !u.alive) continue;
        if (u.order.kind !== 'hold' || (u.orderQueue && u.orderQueue.length)) continue;
        var d = Math.hypot(wk.x - u.x, wk.y - u.y);
        if (d <= AI_SALVAGE_RANGE && d < bestDist) { best = u; bestDist = d; }
      }
      if (best) {
        applyOrderToUnit(state, best, { kind: 'salvage', wreckId: wk.id });
        targeted[wk.id] = true;
      }
    }
  }
  // ---- Generation Cycle 2: red COMBAT AI (sim-side, not browser-only) ----
  // Replaces the old browser trickle-driver (game.js issued attackMove
  // to every idle red unit every 40 ticks). The combat decision layer
  // lives here so headless tests and the browser run the same AI.
  // Seed: one squad state machine, reused across unit types and maps:
  // DEFEND (guard a ring around the core) / GATHER (guard a staging
  // ring toward the enemy) / ATTACK (squads attackMove to a chosen
  // target, two of three squads via a north/south detour so a
  // two-crossing map is not attacked down one bridge only) /
  // FALL-BACK (a damaged unit guards the core and stays a defender).
  // Rules (all stated, all testable):
  //  - Thinks once per AI_THINK_TICKS, after the economy, only while
  //    the red Command Core is alive, never in a tutorial game.
  //  - Uses ONLY the same information any player has in this no-fog
  //    game: unit positions, HP, and terrain are all visible to both
  //    sides. It reads no hidden state, and it never touches the
  //    iron_eden queue, scrap, or units.
  //  - No free anything: production and salvage are still
  //    runAiEconomy, unchanged. Combat orders move existing units
  //    only; they never create scrap, units, or stat changes.
  //  - Never interrupts a salvage in progress, and never reassigns a
  //    unit mid-chain (a unit with a queued order finishes its chain).
  //  - Reinforcements do not trickle into an ongoing attack either:
  //    a unit that spawns while the AI is attacking guards a staging
  //    ring near the core until 3 staged units are ready, then the
  //    batch is sent attacking together. The grouping gate therefore
  //    applies to launching an attack AND to reinforcing one.
  //  - Mode hysteresis: attack needs 8 combat units to enter and
  //    only drops out below 5, and attack<->gather changes wait 100
  //    ticks — except entering DEFEND, which is immediate when the
  //    core is threatened (3+ blue units within 25 tiles, or the
  //    nearest blue unit within 14). This stops mode flip-flop.
  //  - Target selection: the blue Command Core while it lives, else
  //    the weakest blue structure, else the centroid of blue units.
  //    Individual firing targets are still the sim's acquireTarget
  //    (nearest hittable in range), unchanged.
  //  - Fall-back: a combat unit below 35% HP with an enemy within 12
  //    tiles, and more than 8 tiles from its core, is sent to guard
  //    the core ring and is never sent attacking again (there is no
  //    repair in this slice, so a damaged unit that re-attacked would
  //    just fall back again). It stays a core defender.
  //  - Ground orders are always routed through the existing A*
  //    pathfinding, and every destination is snapped to the nearest
  //    passable tile for that unit's movement class — the AI never
  //    orders a ground unit into water, and adds no path system.
  var AI_COMBAT_DEFEND_RANGE = 25;
  var AI_COMBAT_DEFEND_COUNT = 3;
  var AI_COMBAT_CORE_DANGER = 14;
  var AI_COMBAT_GATHER_COUNT = 8;
  var AI_COMBAT_ATTACK_FLOOR = 5;
  var AI_COMBAT_RETREAT_HP = 0.35;
  var AI_COMBAT_RETREAT_RANGE = 12;
  var AI_COMBAT_MODE_MIN_TICKS = 100;
  var AI_COMBAT_STAGING_BATCH = 3;
  // Gameplay Completion: difficulty param sets. These are the ONLY
  // things a difficulty setting changes: red AI behaviour
  // thresholds, nothing else. Same costs, same economy, same unit
  // stats, no free scrap/units, no vision change, no stat change
  // on any difficulty — the AI still only moves existing units
  // with the same weapons. 'normal' is byte-for-byte the shipped
  // constants above (verified by test: every normal value equals
  // its AI_COMBAT_* constant), so a player who never touches the
  // setting plays exactly the shipped game. 'easy' is cautious
  // and slow to commit: it needs more units before attacking,
  // drops out of attacks sooner, falls damaged units back
  // earlier and from further away, waits longer between mode
  // changes, and stages reinforcements in larger batches.
  // 'hard' is the mirror: fewer units to attack, holds attacks
  // with fewer survivors, falls back only when badly hurt and
  // close to an enemy, reacts faster, and sends reinforcement
  // batches sooner. Keys match the state.aiCombatParams seam
  // below (plus stagingBatch, the reinforcement-batch size).
  var DIFFICULTY_PARAMS = {
    easy: { defendRange: 20, defendCount: 5, coreDanger: 10, gatherCount: 12, attackFloor: 8, retreatHp: 0.50, retreatRange: 16, modeMinTicks: 200, stagingBatch: 5 },
    normal: { defendRange: 25, defendCount: 3, coreDanger: 14, gatherCount: 8, attackFloor: 5, retreatHp: 0.35, retreatRange: 12, modeMinTicks: 100, stagingBatch: 3 },
    hard: { defendRange: 30, defendCount: 2, coreDanger: 18, gatherCount: 5, attackFloor: 3, retreatHp: 0.20, retreatRange: 8, modeMinTicks: 50, stagingBatch: 2 }
  };
  function aiCombatCore(state) {
    for (var i = 0; i < state.structures.length; i++) {
      var s = state.structures[i];
      if (s.faction === 'xandria' && s.typeId === 'command_core' && s.alive) return s;
    }
    return null;
  }
  function aiNearestPassable(state, x, y, movementClass) {
    var bx = Math.floor(x), by = Math.floor(y);
    for (var r = 0; r <= 6; r++) {
      for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        var tx = bx + dx, ty = by + dy;
        if (isPassable(state, tx, ty, movementClass)) return { x: tx + 0.5, y: ty + 0.5 };
      }
    }
    return { x: Math.max(0.5, Math.min(state.width - 0.5, x)), y: Math.max(0.5, Math.min(state.height - 0.5, y)) };
  }
  function aiBlueTarget(state) {
    var core = null, weakest = null, weakestFrac = Infinity, sx = 0, sy = 0, n = 0;
    for (var i = 0; i < state.structures.length; i++) {
      var s = state.structures[i];
      if (s.faction !== 'iron_eden' || !s.alive) continue;
      if (s.typeId === 'command_core') core = s;
      var frac = s.hp / s.maxHp;
      if (frac < weakestFrac) { weakest = s; weakestFrac = frac; }
    }
    if (core) return { x: core.x, y: core.y };
    if (weakest) return { x: weakest.x, y: weakest.y };
    for (var j = 0; j < state.units.length; j++) {
      var u = state.units[j];
      if (u.faction === 'iron_eden' && u.alive) { sx += u.x; sy += u.y; n++; }
    }
    if (!n) return null;
    return { x: sx / n, y: sy / n };
  }
  function aiRingPoint(cx, cy, index, total, radius) {
    if (total <= 1) return { x: cx, y: cy };
    var ang = (index / total) * Math.PI * 2;
    return { x: cx + Math.cos(ang) * radius, y: cy + Math.sin(ang) * radius };
  }
  function runAiCombat(state) {
    var ai = state.aiCombat;
    // modeSince starts a full hysteresis window in the past, so the
    // FIRST mode decision is not delayed 100 ticks for no reason;
    // the wait applies after a mode has actually been held.
    if (!ai) { ai = { mode: 'gather', modeSince: -AI_COMBAT_MODE_MIN_TICKS }; state.aiCombat = ai; }
    // Variant seam: state.aiCombatParams overrides the shipped
    // constants for one game. Set by the headless match harness,
    // by tests, and by the browser shell from DIFFICULTY_PARAMS
    // (game.js: the menu difficulty, Normal = the defaults below,
    // so an unset or Normal game runs the shipped constants).
    // Tutorial games never reach this function (step() gates the
    // AI on state.tutorial), so a tutorial game runs Normal
    // behaviour in the only sense that matters: no AI at all.
    var P = state.aiCombatParams || {};
    var DEFEND_RANGE = P.defendRange !== undefined ? P.defendRange : AI_COMBAT_DEFEND_RANGE;
    var DEFEND_COUNT = P.defendCount !== undefined ? P.defendCount : AI_COMBAT_DEFEND_COUNT;
    var CORE_DANGER = P.coreDanger !== undefined ? P.coreDanger : AI_COMBAT_CORE_DANGER;
    var GATHER_COUNT = P.gatherCount !== undefined ? P.gatherCount : AI_COMBAT_GATHER_COUNT;
    var ATTACK_FLOOR = P.attackFloor !== undefined ? P.attackFloor : AI_COMBAT_ATTACK_FLOOR;
    var RETREAT_HP = P.retreatHp !== undefined ? P.retreatHp : AI_COMBAT_RETREAT_HP;
    var RETREAT_RANGE = P.retreatRange !== undefined ? P.retreatRange : AI_COMBAT_RETREAT_RANGE;
    var MODE_MIN_TICKS = P.modeMinTicks !== undefined ? P.modeMinTicks : AI_COMBAT_MODE_MIN_TICKS;
    var STAGING_BATCH = P.stagingBatch !== undefined ? P.stagingBatch : AI_COMBAT_STAGING_BATCH;
    var combat = [], blue = [];
    for (var ci = 0; ci < state.units.length; ci++) {
      var cu = state.units[ci];
      if (!cu.alive) continue;
      if (cu.faction === 'xandria' && cu.weapons && cu.weapons.length) combat.push(cu);
      if (cu.faction === 'iron_eden') blue.push(cu);
    }
    var core = aiCombatCore(state);
    if (!core) {
      // Last stand: the economy stops when the core dies (that rule
      // is unchanged), but combat does NOT switch off — survivors
      // would otherwise freeze on a dead guard point forever while
      // the sim waits for a winner that can never arrive. With no
      // core left to defend or gather around, every combat unit
      // attacks the chosen blue target. Fallen-back units attack
      // too: there is no core left for them to defend.
      // Gate: only if a core was present at an earlier AI think.
      // A game that never had a core (unit-only test setups, and
      // any scenario without a command core) keeps the old
      // behaviour — the AI does nothing — instead of attacking
      // out of nowhere.
      if (!state.aiHadCore) return;
      if (!combat.length) return;
      var lastTarget = aiBlueTarget(state);
      if (!lastTarget) return;
      var lastChanged = ai.mode !== 'attack';
      ai.mode = 'attack'; ai.stagingIds = [];
      for (var li = 0; li < combat.length; li++) {
        var lu = combat[li];
        if (lu.order.kind === 'salvage' || (lu.orderQueue && lu.orderQueue.length)) continue;
        var lastNeeds = lastChanged || lu.order.kind === 'hold';
        if (!lastNeeds && lu.order.kind === 'attackMove' && !lu.path.length) {
          var lb = Infinity;
          for (var ln = 0; ln < blue.length; ln++) {
            var ld = Math.hypot(blue[ln].x - lu.x, blue[ln].y - lu.y);
            if (ld < lb) lb = ld;
          }
          if (lb > 20) lastNeeds = true;
        }
        if (!lastNeeds) continue;
        var lastDest = aiNearestPassable(state, lastTarget.x, lastTarget.y, lu.movementClass);
        var lastSquad = li % 3;
        if (lastSquad === 0) {
          applyOrderToUnit(state, lu, { kind: 'attackMove', x: lastDest.x, y: lastDest.y });
        } else {
          var lastDetourY = Math.max(0.5, Math.min(state.height - 0.5, lastTarget.y + (lastSquad === 1 ? -14 : 14)));
          var lastWp = aiNearestPassable(state, lastTarget.x, lastDetourY, lu.movementClass);
          applyOrderToUnit(state, lu, { kind: 'attackMove', x: lastWp.x, y: lastWp.y });
          issueOrder(state, [lu.id], { kind: 'attackMove', x: lastDest.x, y: lastDest.y }, { append: true });
        }
      }
      return;
    }
    // A core is present at this think: remember it, so the
    // last-stand branch above can tell "core died" from "never
    // had a core" on later thinks.
    state.aiHadCore = true;
    // Threat: blue units near the core, and the nearest blue unit.
    var threat = 0, nearest = Infinity;
    for (var b = 0; b < blue.length; b++) {
      var d = Math.hypot(blue[b].x - core.x, blue[b].y - core.y);
      if (d <= DEFEND_RANGE) threat++;
      if (d < nearest) nearest = d;
    }
    // Fall-back pass, before mode assignment: damaged units become
    // permanent core defenders, unless they are mid-salvage or
    // mid-chain (those are never interrupted).
    for (var f = 0; f < combat.length; f++) {
      var fu = combat[f];
      if (fu.aiFellBack || fu.order.kind === 'salvage' || (fu.orderQueue && fu.orderQueue.length)) continue;
      if (fu.hp / fu.maxHp >= RETREAT_HP) continue;
      if (Math.hypot(fu.x - core.x, fu.y - core.y) <= 8) continue;
      var nearEnemy = false;
      for (var eb = 0; eb < blue.length; eb++) {
        if (Math.hypot(blue[eb].x - fu.x, blue[eb].y - fu.y) <= RETREAT_RANGE) { nearEnemy = true; break; }
      }
      if (!nearEnemy) continue;
      fu.aiFellBack = true;
      var fb = aiRingPoint(core.x, core.y, f, combat.length, 6);
      fb = aiNearestPassable(state, fb.x, fb.y, fu.movementClass);
      applyOrderToUnit(state, fu, { kind: 'guard', x: fb.x, y: fb.y });
    }
    // Mode selection with hysteresis (defend overrides immediately).
    var newMode = ai.mode;
    if (threat >= DEFEND_COUNT || nearest <= CORE_DANGER) newMode = 'defend';
    else if (ai.mode === 'attack' && combat.length < ATTACK_FLOOR) newMode = 'gather';
    else if (ai.mode !== 'attack' && combat.length >= GATHER_COUNT) newMode = 'attack';
    var modeChanged = false;
    if (newMode !== ai.mode) {
      if (newMode === 'defend' || state.tick - ai.modeSince >= MODE_MIN_TICKS) {
        ai.mode = newMode; ai.modeSince = state.tick; modeChanged = true;
        if (newMode !== 'attack') ai.stagingIds = [];
      }
    }
    var mode = ai.mode;
    var target = aiBlueTarget(state);
    if (mode === 'defend' || mode === 'gather') {
      var centre = { x: core.x, y: core.y };
      if (mode === 'gather' && target) {
        var dir = target.x > core.x ? 1 : (target.x < core.x ? -1 : 0);
        centre = { x: Math.max(0.5, Math.min(state.width - 0.5, core.x + dir * 6)), y: core.y };
      }
      var radius = mode === 'defend' ? 6 : 3;
      for (var gi = 0; gi < combat.length; gi++) {
        var gu = combat[gi];
        if (gu.order.kind === 'salvage') continue;
        var gp = aiRingPoint(centre.x, centre.y, gi, combat.length, radius);
        gp = aiNearestPassable(state, gp.x, gp.y, gu.movementClass);
        if (gu.order.kind === 'guard' && Math.hypot(gu.order.x - gp.x, gu.order.y - gp.y) < 1.5) continue;
        applyOrderToUnit(state, gu, { kind: 'guard', x: gp.x, y: gp.y });
      }
      return;
    }
    // ATTACK: reassign on a mode change, or for a unit sitting at a
    // dead destination with no enemy within 20 tiles. Units already
    // attacking, and units mid-chain, are left alone — reissuing
    // every think tick would reset their paths and look like a
    // trickle. A unit that SPAWNS during an attack does not go out
    // alone: it guards a staging ring near the core until 3 staged
    // units are ready, then the batch attacks together.
    if (!target) return;
    function sendAttacking(u, squadIndex) {
      var unitDest = aiNearestPassable(state, target.x, target.y, u.movementClass);
      var squad = squadIndex % 3;
      if (squad === 0) {
        applyOrderToUnit(state, u, { kind: 'attackMove', x: unitDest.x, y: unitDest.y });
      } else {
        var detourY = Math.max(0.5, Math.min(state.height - 0.5, target.y + (squad === 1 ? -14 : 14)));
        var wp = aiNearestPassable(state, target.x, detourY, u.movementClass);
        applyOrderToUnit(state, u, { kind: 'attackMove', x: wp.x, y: wp.y });
        issueOrder(state, [u.id], { kind: 'attackMove', x: unitDest.x, y: unitDest.y }, { append: true });
      }
    }
    if (!ai.stagingIds) ai.stagingIds = [];
    // Prune the staging list: dead, fallen-back, salvaging, or no
    // longer guarding near the core are not staged reinforcements.
    ai.stagingIds = ai.stagingIds.filter(function (id) {
      var e = findEntity(state, id);
      return e && e.alive && e.faction === 'xandria' && !e.aiFellBack &&
        e.order.kind === 'guard' && Math.hypot(e.x - core.x, e.y - core.y) <= 15;
    });
    for (var ai2 = 0; ai2 < combat.length; ai2++) {
      var au = combat[ai2];
      if (au.aiFellBack || au.order.kind === 'salvage' || (au.orderQueue && au.orderQueue.length)) continue;
      if (modeChanged) { sendAttacking(au, ai2); continue; }
      if (au.order.kind === 'hold') {
        // Stage, do not send alone.
        if (ai.stagingIds.indexOf(au.id) === -1) ai.stagingIds.push(au.id);
        var stageCentre = { x: core.x + (target.x > core.x ? 6 : -6), y: core.y };
        var sp = aiRingPoint(stageCentre.x, stageCentre.y, ai.stagingIds.indexOf(au.id), 3, 3);
        sp = aiNearestPassable(state, sp.x, sp.y, au.movementClass);
        if (!(au.order.kind === 'guard' && Math.hypot(au.order.x - sp.x, au.order.y - sp.y) < 1.5)) {
          applyOrderToUnit(state, au, { kind: 'guard', x: sp.x, y: sp.y });
        }
        continue;
      }
      if (au.order.kind === 'attackMove' && !au.path.length) {
        var nearestBlue = Infinity;
        for (var nb = 0; nb < blue.length; nb++) {
          var nd = Math.hypot(blue[nb].x - au.x, blue[nb].y - au.y);
          if (nd < nearestBlue) nearestBlue = nd;
        }
        if (nearestBlue > 20) sendAttacking(au, ai2);
      }
    }
    // A full staging batch attacks together (batch size is the
    // stagingBatch difficulty param; shipped default 3).
    if (ai.stagingIds.length >= STAGING_BATCH) {
      var batch = ai.stagingIds.slice();
      ai.stagingIds = [];
      for (var bi = 0; bi < batch.length; bi++) {
        var bu = findEntity(state, batch[bi]);
        if (bu && bu.alive && bu.order.kind === 'guard') sendAttacking(bu, bi);
      }
    }
  }
  // Generation Cycle 3: endgame deadlock detection. A faction can
  // damage an enemy if any of its alive units has a weapon whose
  // target classes include the class of any alive enemy entity
  // (unit or structure). This is the sim's actual firing gate
  // (weaponCanHit, used by acquireTarget): splash damage only fires
  // on a direct hit, so there is no indirect damage path that could
  // break a deadlock weaponCanHit cannot see, and structures never
  // fire (their weapons list is empty), so a structure-only side
  // can never damage anyone. A faction can produce only through a
  // living Command Core; scrap on hand is deliberately NOT part of
  // the test — a core with no scrap today can salvage tomorrow, so
  // only a dead core means production is truly gone.
  function factionCanDamage(state, fac) {
    for (var i = 0; i < state.units.length; i++) {
      var u = state.units[i];
      if (!u.alive || u.faction !== fac) continue;
      for (var w = 0; w < u.weapons.length; w++) {
        for (var j = 0; j < state.units.length; j++) {
          var eu = state.units[j];
          if (eu.alive && eu.faction !== fac && weaponCanHit(u.weapons[w], eu)) return true;
        }
        for (var k = 0; k < state.structures.length; k++) {
          var es = state.structures[k];
          if (es.alive && es.faction !== fac && weaponCanHit(u.weapons[w], es)) return true;
        }
      }
    }
    return false;
  }
  function factionCanProduce(state, fac) {
    for (var i = 0; i < state.structures.length; i++) {
      var s = state.structures[i];
      if (s.alive && s.faction === fac && s.typeId === 'command_core') return true;
    }
    return false;
  }
  function checkDeadlock(state) {
    // Distinct factions among alive entities. Fewer than two means
    // the game is already over (or never started) — not a deadlock.
    var facs = [];
    function note(f) { if (facs.indexOf(f) === -1) facs.push(f); }
    for (var i = 0; i < state.units.length; i++) if (state.units[i].alive) note(state.units[i].faction);
    for (var j = 0; j < state.structures.length; j++) if (state.structures[j].alive) note(state.structures[j].faction);
    if (facs.length < 2) return false;
    for (var f = 0; f < facs.length; f++) {
      if (factionCanProduce(state, facs[f])) return false;
      if (factionCanDamage(state, facs[f])) return false;
    }
    return true;
  }
  function victoryStats(state) {
    if (!state.winner) return null;
    var iron = 0, xan = 0;
    for (var i = 0; i < state.units.length; i++) {
      if (!state.units[i].alive) continue;
      if (state.units[i].faction === 'iron_eden') iron++;
      else if (state.units[i].faction === 'xandria') xan++;
    }
    var remaining = state.winner === 'draw' ? iron + xan
      : (state.winner === 'iron_eden' ? iron : xan);
    return { winner: state.winner, tick: state.tick, time: state.time,
      unitsRemaining: remaining, ironRemaining: iron, xandriaRemaining: xan,
      wrecksCreated: state.wrecksCreated, wrecksRemaining: state.wrecks.length };
  }

  function rebuildGrid(state) {
    for (var i = 0; i < state.buckets.length; i++) state.buckets[i].length = 0;
    function put(e) {
      var cx = Math.floor(e.x / CELL), cy = Math.floor(e.y / CELL);
      if (cx < 0) cx = 0; if (cy < 0) cy = 0; if (cx >= state.gridCols) cx = state.gridCols - 1; if (cy >= state.gridRows) cy = state.gridRows - 1;
      state.buckets[cy * state.gridCols + cx].push(e);
    }
    for (var a = 0; a < state.units.length; a++) if (state.units[a].alive) put(state.units[a]);
    for (var b = 0; b < state.structures.length; b++) if (state.structures[b].alive) put(state.structures[b]);
  }
  // Iterate entities within radius of (x,y) without allocating a list.
  function forEachInRadius(state, x, y, radius, fn) {
    var cx0 = Math.floor((x - radius) / CELL), cx1 = Math.floor((x + radius) / CELL);
    var cy0 = Math.floor((y - radius) / CELL), cy1 = Math.floor((y + radius) / CELL);
    if (cx0 < 0) cx0 = 0; if (cy0 < 0) cy0 = 0; if (cx1 >= state.gridCols) cx1 = state.gridCols - 1; if (cy1 >= state.gridRows) cy1 = state.gridRows - 1;
    for (var cy = cy0; cy <= cy1; cy++) for (var cx = cx0; cx <= cx1; cx++) {
      var bucket = state.buckets[cy * state.gridCols + cx];
      for (var i = 0; i < bucket.length; i++) {
        var e = bucket[i];
        var dx = e.x - x, dy = e.y - y;
        if (dx * dx + dy * dy <= radius * radius) fn(e);
      }
    }
  }
  function targetClassOf(e) { return e.kind === 'structure' ? 'structure' : (e.movementClass === 'air' ? 'air' : 'ground'); }
  function weaponCanHit(weapon, e) {
    return weapon.targetClasses.indexOf(targetClassOf(e)) !== -1 || weapon.targetClasses.indexOf('all') !== -1;
  }
  // Twin-Stick Phase C: src is the firing entity (or null when the
  // firer is unknown, e.g. an orphaned burn zone). It exists ONLY
  // for hero killing-blow attribution: when a hero unit lands the
  // killing blow on an enemy, heroXp gains floor(0.10 x victim
  // catalog scrap cost), minimum 10, and only when the victim cost
  // is above 0 (a 0-cost structure grants 0, never the minimum).
  // Army kills, splash victims of army weapons, and burn-zone kills
  // with no recorded firer feed 0 hero XP. The shell reads heroXp
  // at match end only; nothing here writes to any record.
  function applyDamage(state, target, weapon, distanceFromBlast, isSplash, src) {
    if (!target.alive) return 0;
    if (!isSplash && state.rng() >= weapon.accuracy) return 0; // miss
    var dmg = computeDamage(state.catalog, weapon, target.armor, distanceFromBlast);
    target.hp -= dmg;
    if (target.hp <= 0) {
      target.hp = 0; target.alive = false;
      if (src && src.isHero && src.faction !== target.faction) {
        var cost = 0;
        if (target.kind === 'structure') { try { cost = structDef(state, target.typeId).cost.scrap; } catch (e) { cost = 0; } }
        else cost = target.costScrap !== undefined ? target.costScrap : unitDef(state, target.typeId).cost.scrap;
        if (cost > 0) {
          var xp = Math.max(10, Math.floor(cost * 0.10));
          state.heroXp.killXp += xp; state.heroXp.kills++;
        }
      }
    }
    return dmg;
  }
  // Twin-Stick Phase B: named-weapon special effects. All four trigger
  // on DIRECT hits only (never on splash victims), and all reuse the
  // sim's existing gates — no new damage type, target class, or stat.
  // - overheat: a weapon fired continuously for 4 s of wall time
  //   (each shot adds its interval; a gap over 2 ticks past the
  //   interval resets the accumulator) forces a 1.5 s cooldown
  //   instead of its normal interval. noteFired returns that forced
  //   cooldown, or 0.
  // - pierce: one additional enemy within 2 tiles of the impact takes
  //   50% damage. This is the Phase B approximation of pass-through:
  //   true line penetration (every unit on the segment) is a later
  //   refinement, and the Phase B report says so.
  // - burn: a 3 s zone, 1.5 tile radius, dealing 25% of weapon damage
  //   per second to enemies standing in it (armour matrix applied).
  // - stun: the target's speed is halved for 1.5 s (30 ticks).
  function noteFired(state, src, wi, weapon) {
    if (weapon.special !== 'overheat') return 0;
    if (!src.heat) src.heat = [];
    var h = src.heat[wi] || (src.heat[wi] = { lastTick: -1e9, heatTime: 0 });
    var gapTicks = weapon.interval / TICK_DT + 2;
    if (state.tick - h.lastTick > gapTicks) h.heatTime = 0;
    h.heatTime += weapon.interval; h.lastTick = state.tick;
    if (h.heatTime >= 4) { h.heatTime = 0; return 1.5; }
    return 0;
  }
  function copyWeaponScaled(weapon, scale) {
    var c = {};
    for (var k in weapon) c[k] = weapon[k];
    c.damage = weapon.damage * scale;
    c.targetClasses = weapon.targetClasses.slice();
    return c;
  }
  function applyHitEffects(state, src, weapon, target) {
    if (!weapon.special || weapon.special === 'none') return;
    if (weapon.special === 'stun') { target.slowUntil = state.tick + 30; return; }
    if (weapon.special === 'pierce') {
      var extra = null, extraD = Infinity;
      forEachInRadius(state, target.x, target.y, 2, function (e) {
        if (e === target || e.faction === src.faction || !e.alive) return;
        var d = Math.sqrt((e.x - target.x) * (e.x - target.x) + (e.y - target.y) * (e.y - target.y));
        if (d < extraD) { extra = e; extraD = d; }
      });
      if (extra) applyDamage(state, extra, copyWeaponScaled(weapon, 0.5), 0, true, src);
      return;
    }
    if (weapon.special === 'burn') {
      if (state.burnZones.length >= 64) state.burnZones.shift();
      // Phase C: record the firer so a burn-zone killing blow by the
      // hero still attributes (a zone with no live firer attributes
      // to nobody, never to the army at large).
      state.burnZones.push({ x: target.x, y: target.y, expiresTick: state.tick + 60, weapon: weapon, faction: src.faction, sourceId: src.id || 0 });
      return;
    }
  }
  function processBurnZones(state) {
    for (var i = state.burnZones.length - 1; i >= 0; i--) {
      var z = state.burnZones[i];
      if (state.tick >= z.expiresTick) { state.burnZones.splice(i, 1); continue; }
      var dmg = copyWeaponScaled(z.weapon, 0.25 * TICK_DT);
      var zsrc = z.sourceId ? findEntity(state, z.sourceId) : null;
      if (zsrc && !zsrc.alive) zsrc = null;
      forEachInRadius(state, z.x, z.y, 1.5, function (e) {
        if (e.faction === z.faction || !e.alive) return;
        applyDamage(state, e, dmg, 0, true, zsrc);
      });
    }
  }
  function fireWeapon(state, src, weapon, target) {
    var dx = target.x - src.x, dy = target.y - src.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
    src.turretFacing = Math.atan2(dy, dx);
    if (weapon.projectileSpeed === 0) {
      applyDamage(state, target, weapon, 0, false, src);
      if (weapon.splashRadius > 0) {
        forEachInRadius(state, target.x, target.y, weapon.splashRadius, function (e) {
          if (e === target || e.faction === src.faction || !e.alive) return;
          var d = Math.sqrt((e.x - target.x) * (e.x - target.x) + (e.y - target.y) * (e.y - target.y));
          applyDamage(state, e, weapon, d, true, src);
        });
      }
      applyHitEffects(state, src, weapon, target);
      return;
    }
    // Pooled projectile: reuse an inactive slot, never allocate in the hot loop.
    for (var i = 0; i < state.projectilePool.length; i++) {
      var pr = state.projectilePool[i];
      if (!pr.active) {
        pr.active = true; pr.x = src.x; pr.y = src.y; pr.tx = target.x; pr.ty = target.y;
        pr.target = target; pr.weapon = weapon; pr.faction = src.faction; pr.sourceId = src.id;
        state.projectileActive++;
        return;
      }
    }
    // Pool exhausted: drop the shot rather than allocating.
  }
  function acquireTarget(state, src) {
    // Nearest enemy any of src's weapons can hit, within vision and weapon range.
    var best = null, bestDist = Infinity;
    var maxRange = 0;
    for (var w = 0; w < src.weapons.length; w++) if (src.weapons[w].range > maxRange) maxRange = src.weapons[w].range;
    var radius = Math.min(src.vision, maxRange) + 1;
    forEachInRadius(state, src.x, src.y, radius, function (e) {
      if (e.faction === src.faction || !e.alive) return;
      var dx = e.x - src.x, dy = e.y - src.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d > bestDist) return;
      for (var wi = 0; wi < src.weapons.length; wi++) {
        var wp = src.weapons[wi];
        if (!weaponCanHit(wp, e)) continue;
        if (d <= wp.range && d >= wp.minRange && hasLOS(state, src.x, src.y, e.x, e.y)) { best = e; bestDist = d; break; }
      }
    });
    return best;
  }
  function moveAlongPath(state, u, stepDist) {
    if (!u.path.length) return false;
    var wp = u.path[0];
    var tx = wp[0] + 0.5, ty = wp[1] + 0.5;
    var dx = tx - u.x, dy = ty - u.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d <= stepDist) { u.x = tx; u.y = ty; u.path.shift(); return true; }
    u.x += dx / d * stepDist; u.y += dy / d * stepDist;
    u.facing = Math.atan2(dy, dx);
    return true;
  }

  function step(state) {
    if (state.winner) return;
    state.time += TICK_DT; state.tick++;
    rebuildGrid(state);
    // 1. Orders, targeting, firing, movement.
    for (var i = 0; i < state.units.length; i++) {
      var u = state.units[i];
      if (!u.alive) continue;
      for (var c = 0; c < u.cooldowns.length; c++) u.cooldowns[c] -= TICK_DT;
      // Twin-Stick Phase A: manual input replaces orders entirely for
      // this unit this tick. The unit does not auto-engage, chase, or
      // follow a path while controlled — it moves only on the stick /
      // key vector and fires only while the aim input is firing, at
      // aim-cone targets through every normal gate. Group, guard,
      // rally, and patrol orders are therefore ignored, not queued:
      // they were cleared on entry, and release re-issues hold.
      if (u.manual) {
        var mv = u.manual;
        var mTerr = terrainAt(state, Math.floor(u.x), Math.floor(u.y));
        // Phase C: Dash doubles manual speed while active; Rally
        // Signal and stun stack through speedMult (see helper).
        var mDash = (u.dashUntil && state.tick < u.dashUntil) ? 2 : 1;
        var mStep = u.speed * TICK_DT / movementCost(mTerr, u.movementClass) * speedMult(state, u) * mDash;
        if (mv.moveX || mv.moveY) {
          var mNx = u.x + mv.moveX * mStep, mNy = u.y + mv.moveY * mStep;
          // Axis-separated blocking: a diagonal drive into a water /
          // rock corner still slides along the passable axis instead
          // of sticking, and never enters a blocking tile.
          if (isPassable(state, Math.floor(mNx), Math.floor(mNy), u.movementClass)) { u.x = mNx; u.y = mNy; }
          else {
            if (isPassable(state, Math.floor(mNx), Math.floor(u.y), u.movementClass)) u.x = mNx;
            if (isPassable(state, Math.floor(u.x), Math.floor(mNy), u.movementClass)) u.y = mNy;
          }
          u.x = Math.max(0.5, Math.min(state.width - 0.5, u.x));
          u.y = Math.max(0.5, Math.min(state.height - 0.5, u.y));
          u.facing = Math.atan2(mv.moveY, mv.moveX);
        }
        // Phase C: the hero is on the field ONLY while manually
        // controlled, so it can never be issued an RTS salvage order
        // (release withdraws it). Its spec XP source "hero salvage"
        // therefore fires here: a manually driven hero that ends a
        // tick within salvage range of a wreck collects it — scrap
        // (with Salvage Sense, when unlocked) and 10 hero XP, via
        // salvageWreck. Army units are untouched by this path.
        if (u.isHero) {
          for (var wi2 = 0; wi2 < state.wrecks.length; wi2++) {
            var hwk = state.wrecks[wi2];
            var hdx = hwk.x - u.x, hdy = hwk.y - u.y;
            if (Math.sqrt(hdx * hdx + hdy * hdy) <= SALVAGE_RANGE) {
              salvageWreck(state, u.faction, hwk.id, u);
              break;
            }
          }
        }
        if (mv.firing && mv.aimAngle !== null && mv.aimAngle !== undefined) {
          u.turretFacing = mv.aimAngle;
          for (var mwi = 0; mwi < u.weapons.length; mwi++) {
            var mwp = u.weapons[mwi];
            if (u.cooldowns[mwi] > 0) continue;
            var mBest = null, mBestD = Infinity;
            (function (wp, wi) {
              forEachInRadius(state, u.x, u.y, wp.range + 1, function (e) {
                if (e.faction === u.faction || !e.alive) return;
                var ddx = e.x - u.x, ddy = e.y - u.y, dd = Math.sqrt(ddx * ddx + ddy * ddy);
                if (dd > mBestD || dd > wp.range || dd < wp.minRange) return;
                if (!weaponCanHit(wp, e)) return;
                if (Math.abs(angleDiff(Math.atan2(ddy, ddx), mv.aimAngle)) > MANUAL_AIM_CONE_RAD) return;
                if (!hasLOS(state, u.x, u.y, e.x, e.y)) return;
                mBest = e; mBestD = dd;
              });
            })(mwp, mwi);
            if (mBest) { fireWeapon(state, u, mwp, mBest); u.cooldowns[mwi] = Math.max(effInterval(state, u, mwp), noteFired(state, u, mwi, mwp)); }
          }
        }
        continue;
      }
      var target = null;
      if (u.order.kind === 'attack' && u.targetId) {
        target = findEntity(state, u.targetId);
        if (target && !target.alive) {
          target = null; u.targetId = 0;
          if (!advanceQueue(state, u)) { u.order = { kind: 'hold' }; }
        }
      }
      if (!target && (u.order.kind === 'hold' || u.order.kind === 'attackMove' || u.order.kind === 'patrol' || u.order.kind === 'guard' || !u.order.kind)) {
        target = acquireTarget(state, u);
      }
      var terrain = terrainAt(state, Math.floor(u.x), Math.floor(u.y));
      var stepDist = u.speed * TICK_DT / movementCost(terrain, u.movementClass) * speedMult(state, u);
      if (target) {
        var dx = target.x - u.x, dy = target.y - u.y, dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        var inRange = false;
        for (var w = 0; w < u.weapons.length; w++) {
          var wp = u.weapons[w];
          if (!weaponCanHit(wp, target)) continue;
          if (dist <= wp.range && dist >= wp.minRange && hasLOS(state, u.x, u.y, target.x, target.y)) {
            inRange = true;
            if (u.cooldowns[w] <= 0) { fireWeapon(state, u, wp, target); u.cooldowns[w] = Math.max(effInterval(state, u, wp), noteFired(state, u, w, wp)); }
          }
        }
        if (!inRange) {
          var minR = Infinity;
          for (var mi = 0; mi < u.weapons.length; mi++) if (weaponCanHit(u.weapons[mi], target)) minR = Math.min(minR, u.weapons[mi].minRange);
          if (dist < minR) {
            // Too close for a min-range weapon: back away from the target.
            var bx = u.x - dx / dist * 2, by = u.y - dy / dist * 2;
            var bpath = findPath(state, Math.floor(u.x), Math.floor(u.y), Math.floor(bx), Math.floor(by), u.movementClass);
            u.path = bpath || [];
            moveAlongPath(state, u, stepDist);
          } else {
            if (u.movementClass === 'air') {
              u.x += dx / dist * stepDist; u.y += dy / dist * stepDist; u.facing = Math.atan2(dy, dx);
            } else {
              if (!u.path.length || u.pathTargetId !== target.id) {
                var p = findPath(state, Math.floor(u.x), Math.floor(u.y), Math.floor(target.x), Math.floor(target.y), u.movementClass);
                u.path = p || []; u.pathTargetId = target.id;
              }
              if (u.path.length) moveAlongPath(state, u, stepDist);
            }
          }
        }
      } else if (u.order.kind === 'salvage') {
        var wk = findWreck(state, u.order.wreckId);
        if (!wk) {
          if (!advanceQueue(state, u)) { u.order = { kind: 'hold' }; u.targetId = 0; }
        } else {
          var wdx = wk.x - u.x, wdy = wk.y - u.y, wdist = Math.sqrt(wdx * wdx + wdy * wdy);
          if (wdist <= SALVAGE_RANGE) {
            salvageWreck(state, u.faction, wk.id, u);
            if (!advanceQueue(state, u)) { u.order = { kind: 'hold' }; }
          } else {
            if (!u.path.length) {
              var wpath = findPath(state, Math.floor(u.x), Math.floor(u.y), Math.floor(wk.x), Math.floor(wk.y), u.movementClass);
              u.path = wpath || [];
            }
            if (u.path.length) moveAlongPath(state, u, stepDist);
          }
        }
      } else if (u.order.kind === 'guard') {
        // Guard: resolve the point (a live guarded entity moves the
        // point with it; a dead one leaves the last known point), move
        // to it if not arrived, and return to it if displaced after
        // arriving. When a target exists, the firing block above runs
        // instead, so a guard never chases beyond weapon range.
        var gp = { x: u.order.x, y: u.order.y };
        if (u.order.guardTargetId) {
          var ge = findEntity(state, u.order.guardTargetId);
          if (ge && ge.alive) { gp = { x: ge.x, y: ge.y }; u.order.x = gp.x; u.order.y = gp.y; }
        }
        var gdx = gp.x - u.x, gdy = gp.y - u.y, gdist = Math.sqrt(gdx * gdx + gdy * gdy);
        if (!u.order.guardArrived && gdist <= 0.6) { u.order.guardArrived = true; u.path = []; }
        if (u.order.guardArrived && gdist > 0.6) {
          if (!u.path.length) {
            var rpath = findPath(state, Math.floor(u.x), Math.floor(u.y), Math.floor(gp.x), Math.floor(gp.y), u.movementClass);
            u.path = rpath || [];
          }
          if (u.path.length) moveAlongPath(state, u, stepDist);
        } else if (!u.order.guardArrived) {
          if (u.order.guardTargetId && u.path.length) {
            var lastWp = u.path[u.path.length - 1];
            if (lastWp[0] !== Math.floor(gp.x) || lastWp[1] !== Math.floor(gp.y)) u.path = [];
          }
          if (!u.path.length) {
            var gpath2 = findPath(state, Math.floor(u.x), Math.floor(u.y), Math.floor(gp.x), Math.floor(gp.y), u.movementClass);
            u.path = gpath2 || [];
          }
          if (u.path.length) moveAlongPath(state, u, stepDist);
        }
      } else if (u.order.kind === 'patrol') {
        var pts = u.order.points;
        if (!pts || pts.length < 2) {
          if (!advanceQueue(state, u)) { u.order = { kind: 'hold' }; }
        } else {
          // A stale chase path (from engaging a now-dead target) is
          // dropped so the unit resumes its patrol leg, not the corpse.
          if (u.pathTargetId) { u.path = []; u.pathTargetId = 0; }
          var leg = u.order.leg || 0, curPt = pts[leg];
          var ldx = curPt.x - u.x, ldy = curPt.y - u.y;
          if (Math.sqrt(ldx * ldx + ldy * ldy) < 0.6) {
            leg = (leg + 1) % 2; u.order.leg = leg; curPt = pts[leg];
            var lpath = findPath(state, Math.floor(u.x), Math.floor(u.y), Math.floor(curPt.x), Math.floor(curPt.y), u.movementClass);
            u.path = lpath || [];
          }
          if (!u.path.length) {
            var lpath2 = findPath(state, Math.floor(u.x), Math.floor(u.y), Math.floor(curPt.x), Math.floor(curPt.y), u.movementClass);
            u.path = lpath2 || [];
          }
          if (u.path.length) moveAlongPath(state, u, stepDist);
        }
      } else if (u.order.kind === 'move' || u.order.kind === 'attackMove') {
        if (u.path.length) moveAlongPath(state, u, stepDist);
        else advanceQueue(state, u); // arrived (or unreachable): next queued order, if any
      }
    }
    // 2. Separation (same-domain entities only), using a fresh grid.
    rebuildGrid(state);
    for (var s = 0; s < state.units.length; s++) {
      var a = state.units[s]; if (!a.alive) continue;
      forEachInRadius(state, a.x, a.y, a.radius + 1, function (b) {
        if (b === a || !b.alive || b.kind !== 'unit') return;
        if ((a.movementClass === 'air') !== (b.movementClass === 'air')) return;
        var ddx = a.x - b.x, ddy = a.y - b.y, dd = Math.sqrt(ddx * ddx + ddy * ddy);
        var min = (a.radius + b.radius) * 0.9;
        if (dd > 0 && dd < min) { var push = (min - dd) / 2; a.x += ddx / dd * push; a.y += ddy / dd * push; }
      });
    }
    // 3. Projectiles.
    for (var pi = 0; pi < state.projectilePool.length; pi++) {
      var pr = state.projectilePool[pi]; if (!pr.active) continue;
      var tgt = pr.target;
      if (tgt && tgt.alive) { pr.tx = tgt.x; pr.ty = tgt.y; }
      var pdx = pr.tx - pr.x, pdy = pr.ty - pr.y, pd = Math.sqrt(pdx * pdx + pdy * pdy);
      var pstep = pr.weapon.projectileSpeed * TICK_DT;
      if (pd <= Math.max(pstep, 0.3)) {
        pr.active = false; state.projectileActive--;
        var hit = tgt && tgt.alive ? tgt : null;
        var psrc = findEntity(state, pr.sourceId);
        if (psrc && !psrc.alive) psrc = null;
        if (hit) applyDamage(state, hit, pr.weapon, 0, false, psrc);
        if (pr.weapon.splashRadius > 0) {
          forEachInRadius(state, pr.tx, pr.ty, pr.weapon.splashRadius, function (e) {
            if (e === hit || e.faction === pr.faction || !e.alive) return;
            var ed = Math.sqrt((e.x - pr.tx) * (e.x - pr.tx) + (e.y - pr.ty) * (e.y - pr.ty));
            applyDamage(state, e, pr.weapon, ed, true, psrc);
          });
        }
        if (hit) applyHitEffects(state, psrc || { faction: pr.faction }, pr.weapon, hit);
      } else { pr.x += pdx / pd * pstep; pr.y += pdy / pd * pstep; }
    }
    // 3b. Burn zones tick after projectiles, before cleanup, so a unit
    // killed by a zone leaves its wreck in the same tick's cleanup.
    processBurnZones(state);
    // 4. Cleanup (swap-remove, no allocation), sim wrecks, production, decay, victory.
    for (var ui = state.units.length - 1; ui >= 0; ui--) {
      if (!state.units[ui].alive) {
        // A dead unit leaves a REAL sim wreck (structures do not — their
        // destruction is explosion/fire only, as in Prototype 01).
        // Wrecks never block movement and are not combat units.
        createWreck(state, state.units[ui]);
        state.units[ui] = state.units[state.units.length - 1]; state.units.pop();
      }
    }
    processProduction(state);
    processWreckDecay(state);
    for (var si = state.structures.length - 1; si >= 0; si--) {
      if (!state.structures[si].alive) { state.structures[si] = state.structures[state.structures.length - 1]; state.structures.pop(); }
    }
    // P03 + Generation Cycle 2: the red AI thinks once per second,
    // after production and decay, before victory is checked. Economy
    // first (so salvage assignments exist before combat skips them),
    // then combat. It never runs on a frozen (winner-declared) sim
    // because step() returns early then, and never in a tutorial
    // game: state.tutorial is a shell-set flag (game.js) that holds
    // the red side — no AI economy, no AI combat — so a tutorial
    // game can never leak red behaviour into a normal game or
    // vice versa.
    if (!state.tutorial && state.tick % AI_THINK_TICKS === 0) { runAiEconomy(state); runAiCombat(state); }
    var seen = Object.keys(state.factionsSeen);
    if (seen.length >= 2) {
      for (var f = 0; f < seen.length; f++) {
        var fac = seen[f];
        var hasUnits = state.units.some(function (e) { return e.faction === fac; });
        var hasStruct = state.structures.some(function (e) { return e.faction === fac; });
        if (!hasUnits && !hasStruct) {
          var others = seen.filter(function (x) { return x !== fac; });
          if (others.length === 1) { state.winner = others[0]; break; }
        }
      }
    }
    // Generation Cycle 3: endgame deadlock. Elimination above takes
    // precedence — a side with nothing left loses, never draws. Only
    // when nobody is eliminated, nobody can damage anybody, and
    // nobody can produce does the counter advance; any other state
    // resets it, so a transient air-only moment (a core still alive,
    // a producing side, or a hittable enemy anywhere) can never
    // trigger a draw. Tutorial games are excluded: they have their
    // own end screen and the red side is held, so a draw panel
    // could never be reached honestly there. No weapon stat, range,
    // or target class is changed anywhere by this check.
    if (!state.winner && !state.tutorial) {
      if (checkDeadlock(state)) {
        state.deadlockTicks++;
        if (state.deadlockTicks >= DEADLOCK_GRACE_TICKS) state.winner = 'draw';
      } else state.deadlockTicks = 0;
    }
  }

  // Test map: 64x40, river columns 30-33, single bridge rows 18-21.
  function createTestMap() {
    var w = 64, h = 40, terrain = new Uint8Array(w * h);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      terrain[y * w + x] = x < 30 ? T.GRASS : T.DIRT;
    }
    for (var ry = 0; ry < h; ry++) for (var rx = 30; rx <= 33; rx++) terrain[ry * w + rx] = T.WATER;
    for (var by = 18; by <= 21; by++) for (var bx = 30; bx <= 33; bx++) terrain[by * w + bx] = T.BRIDGE;
    // Forest clusters (west) and rock clusters (LOS blockers, never on the bridge).
    var forests = [[8, 8], [9, 8], [8, 9], [14, 30], [15, 30], [14, 31], [22, 6], [23, 6]];
    forests.forEach(function (c) { terrain[c[1] * w + c[0]] = T.FOREST; });
    var rocks = [[15, 10], [16, 10], [45, 12], [46, 12], [50, 28], [20, 22]];
    rocks.forEach(function (c) { terrain[c[1] * w + c[0]] = T.ROCK; });
    return { width: w, height: h, terrain: terrain };
  }
  function spawnScenario(state) {
    addStructure(state, 'command_core', 'iron_eden', 6, 20);
    addStructure(state, 'command_core', 'xandria', 57, 20);
    var west = [['scout_buggy', 10, 16], ['scout_buggy', 10, 24], ['medium_tank', 12, 18], ['medium_tank', 12, 20], ['medium_tank', 12, 22], ['heavy_tank', 14, 20], ['bulwark_mech', 14, 17], ['lancer_mech', 11, 20], ['longshot_mech', 9, 20], ['flak_tank', 13, 23]];
    var east = [['scout_buggy', 53, 16], ['scout_buggy', 53, 24], ['medium_tank', 51, 18], ['medium_tank', 51, 20], ['medium_tank', 51, 22], ['heavy_tank', 49, 20], ['bulwark_mech', 49, 17], ['lancer_mech', 52, 20], ['longshot_mech', 54, 20], ['flak_tank', 50, 23]];
    west.forEach(function (s) { addUnit(state, s[0], 'iron_eden', s[1], s[2]); });
    east.forEach(function (s) { addUnit(state, s[0], 'xandria', s[1], s[2]); });
  }

  var api = { TICK_DT: TICK_DT, T: T, createGame: createGame, addUnit: addUnit, addCustomUnit: addCustomUnit, withdrawUnit: withdrawUnit, addStructure: addStructure,
    issueOrder: issueOrder, issueFormationOrder: issueFormationOrder, formationOffsets: formationOffsets,
    step: step, findPath: findPath, hasLOS: hasLOS,
    STARTING_SCRAP: STARTING_SCRAP, SALVAGE_FRACTION: SALVAGE_FRACTION,
    // Phase C: rebuildGrid is exported for test harnesses that call
    // activateSkill between steps (in real play the grid is fresh
    // from the last step; a fresh game has empty buckets).
    rebuildGrid: rebuildGrid,
    WRECK_LIFETIME_TICKS: WRECK_LIFETIME_TICKS, SALVAGE_RANGE: SALVAGE_RANGE,
    AI_QUEUE_CAP: AI_QUEUE_CAP, AI_PER_TYPE_CAP: AI_PER_TYPE_CAP,
    AI_SALVAGE_RANGE: AI_SALVAGE_RANGE, AI_THINK_TICKS: AI_THINK_TICKS,
    scrapOf: scrapOf, producibleUnits: producibleUnits, productionQueue: productionQueue,
    queueProduction: queueProduction, cancelProduction: cancelProduction,
    setRally: setRally, runAiEconomy: runAiEconomy, runAiCombat: runAiCombat,
    AI_COMBAT_DEFEND_RANGE: AI_COMBAT_DEFEND_RANGE, AI_COMBAT_DEFEND_COUNT: AI_COMBAT_DEFEND_COUNT,
    AI_COMBAT_CORE_DANGER: AI_COMBAT_CORE_DANGER, AI_COMBAT_GATHER_COUNT: AI_COMBAT_GATHER_COUNT,
    AI_COMBAT_ATTACK_FLOOR: AI_COMBAT_ATTACK_FLOOR, AI_COMBAT_RETREAT_HP: AI_COMBAT_RETREAT_HP,
    AI_COMBAT_RETREAT_RANGE: AI_COMBAT_RETREAT_RANGE, AI_COMBAT_MODE_MIN_TICKS: AI_COMBAT_MODE_MIN_TICKS,
    AI_COMBAT_STAGING_BATCH: AI_COMBAT_STAGING_BATCH, DIFFICULTY_PARAMS: DIFFICULTY_PARAMS,
    DEADLOCK_GRACE_TICKS: DEADLOCK_GRACE_TICKS, checkDeadlock: checkDeadlock,
    MANUAL_AIM_CONE_DEG: MANUAL_AIM_CONE_DEG, MANUAL_AIM_CONE_RAD: MANUAL_AIM_CONE_RAD,
    noteFired: noteFired, applyHitEffects: applyHitEffects,
    setManualControl: setManualControl, clearManualControl: clearManualControl,
    setManualInput: setManualInput, angleDiff: angleDiff,
    activateSkill: activateSkill, skillCooldownRemaining: skillCooldownRemaining,
    SKILL_DEFS: SKILL_DEFS,
    factionCanDamage: factionCanDamage, factionCanProduce: factionCanProduce,
    findWreck: findWreck, salvageWreck: salvageWreck, victoryStats: victoryStats,
    computeDamage: computeDamage, createTestMap: createTestMap, spawnScenario: spawnScenario,
    findEntity: findEntity, terrainAt: terrainAt, isPassable: isPassable, mulberry32: mulberry32,
    spawnPosition: spawnPosition };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.SWSim = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
