/* Surface Wars — First Map (80x50) + map definitions.
   Render/map data only: this file builds a terrain grid and a spawn
   list. It changes NO sim rules — movement, pathfinding, damage and
   the red AI (economy + combat) all still live in sim.js, untouched
   by this file.
   Terrain ids are sim.js T: 0 GRASS, 1 DIRT, 2 BRIDGE, 3 FOREST,
   4 WATER, 5 ROCK.

   FIRST MAP, PROMINENT LIMIT — THE FORD IS VISUAL ONLY:
   A stepping-stone line crosses the river at y=12, drawn with the
   stepping_stones overlay family (autotile mask logic, same as the
   track/road lines). It is COSMETIC ONLY: the tiles underneath are
   still WATER terrain, so ground units CANNOT cross there. The only
   ground crossing is the bridge at rows 23-26. Any ground pathfinding
   between the banks routes through the bridge — see the ford test in
   tests/firstmap.test.js, which asserts exactly that. */
(function (global) {
  'use strict';
  var T = { GRASS: 0, DIRT: 1, BRIDGE: 2, FOREST: 3, WATER: 4, ROCK: 5 };
  var W = 80, H = 50;
  var RIVER_X0 = 39, RIVER_X1 = 42; // north-south river, 4 tiles wide
  var BRIDGE_Y0 = 23, BRIDGE_Y1 = 26; // single bridge, 4 tiles tall
  var WEST_CORE = { x: 6, y: 25 };
  var EAST_CORE = { x: 73, y: 25 };

  function set(terrain, x, y, t) {
    if (x >= 0 && y >= 0 && x < W && y < H) terrain[y * W + x] = t;
  }
  function rect(terrain, x0, y0, x1, y1, t) {
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) set(terrain, x, y, t);
  }
  // Rough blob: tiles within Manhattan distance r of centre, minus the
  // far corners, so clusters read as organic rather than squares.
  function blob(terrain, cx, cy, r, t) {
    for (var y = cy - r; y <= cy + r; y++) for (var x = cx - r; x <= cx + r; x++) {
      var d = Math.abs(x - cx) + Math.abs(y - cy);
      if (d <= r && !(d === r && ((x + y) % 2 === 0))) set(terrain, x, y, t);
    }
  }

  // Cosmetic overlay lines (NOT terrain — drawn by render.js from these
  // lists via sprites.js autotile mask logic; they change no gameplay).
  // Track: west grass, row y=6 from x=4 to x=34, turning south to y=15.
  var FIRST_TRACK = [];
  for (var x = 4; x <= 34; x++) FIRST_TRACK.push([x, 6]);
  for (var y = 7; y <= 15; y++) FIRST_TRACK.push([34, y]);
  // Road: east dirt, row y=43 from x=48 to x=75, spur north at x=70.
  var FIRST_ROAD = [];
  for (var rx = 48; rx <= 75; rx++) FIRST_ROAD.push([rx, 43]);
  for (var ry = 37; ry <= 42; ry++) FIRST_ROAD.push([70, ry]);
  // FORD (VISUAL ONLY — see header): stepping stones across the river
  // at y=12, bank to bank (x=38 grass bank, x=39-42 water, x=43 dirt).
  // Ground units still cannot cross water here; only the bridge works.
  var FIRST_FORD = [];
  for (var fx = 38; fx <= 43; fx++) FIRST_FORD.push([fx, 12]);

  function createFirstMap() {
    var terrain = new Uint8Array(W * H);
    // Base zones: grass west of the river, dirt east, with patches of
    // each on the far side so neither half reads as one flat colour.
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      terrain[y * W + x] = x < RIVER_X0 ? T.GRASS : T.DIRT;
    }
    rect(terrain, 20, 40, 26, 44, T.DIRT); // west wasteland patch
    rect(terrain, 4, 32, 8, 34, T.DIRT); // west dirt patch
    rect(terrain, 60, 22, 64, 24, T.GRASS); // east grass patch
    rect(terrain, 48, 36, 52, 38, T.GRASS); // east grass patch
    // River, full height, then the single bridge punched through it.
    for (var ry = 0; ry < H; ry++) for (var rxx = RIVER_X0; rxx <= RIVER_X1; rxx++) {
      terrain[ry * W + rxx] = T.WATER;
    }
    for (var by = BRIDGE_Y0; by <= BRIDGE_Y1; by++) for (var bx = RIVER_X0; bx <= RIVER_X1; bx++) {
      terrain[by * W + bx] = T.BRIDGE;
    }
    // Forest clusters WITH canopy overlays (render draws a canopy tile
    // over every FOREST tile's forest_floor base, so forest reads as
    // canopy, not dark ground). The bridge approach corridor
    // (x 35-48, y 20-29) is kept clear of forest and rock.
    blob(terrain, 11, 9, 2, T.FOREST);
    blob(terrain, 20, 36, 2, T.FOREST);
    blob(terrain, 27, 13, 2, T.FOREST);
    blob(terrain, 8, 41, 2, T.FOREST);
    blob(terrain, 30, 33, 1, T.FOREST);
    blob(terrain, 36, 6, 1, T.FOREST);
    blob(terrain, 53, 9, 2, T.FOREST);
    blob(terrain, 62, 31, 2, T.FOREST);
    blob(terrain, 70, 16, 2, T.FOREST);
    blob(terrain, 58, 41, 1, T.FOREST);
    blob(terrain, 46, 44, 1, T.FOREST);
    // Rock clusters (LOS blockers; never on the bridge, never in the
    // approach corridor, never on a base or a spawn tile).
    blob(terrain, 24, 9, 1, T.ROCK);
    blob(terrain, 16, 45, 1, T.ROCK);
    blob(terrain, 30, 16, 1, T.ROCK);
    blob(terrain, 36, 31, 1, T.ROCK);
    blob(terrain, 56, 10, 1, T.ROCK);
    blob(terrain, 66, 34, 1, T.ROCK);
    blob(terrain, 49, 44, 1, T.ROCK);
    blob(terrain, 44, 18, 1, T.ROCK);
    // Bases sit on clear ground, never on forest/rock/river tiles.
    return { width: W, height: H, terrain: terrain };
  }

  // Same 10v10 scenario shape as sim.spawnScenario, re-based on the
  // First Map cores (west core 6,25; east core 73,25). Sim is passed in
  // so this file never depends on sim.js load order in the browser.
  function spawnFirstMapScenario(Sim, state) {
    Sim.addStructure(state, 'command_core', 'iron_eden', WEST_CORE.x, WEST_CORE.y);
    Sim.addStructure(state, 'command_core', 'xandria', EAST_CORE.x, EAST_CORE.y);
    var west = [['scout_buggy', 10, 21], ['scout_buggy', 10, 29], ['medium_tank', 12, 23], ['medium_tank', 12, 25], ['medium_tank', 12, 27], ['heavy_tank', 14, 25], ['bulwark_mech', 14, 22], ['lancer_mech', 11, 25], ['longshot_mech', 9, 25], ['flak_tank', 13, 28]];
    var east = [['scout_buggy', 69, 21], ['scout_buggy', 69, 29], ['medium_tank', 67, 23], ['medium_tank', 67, 25], ['medium_tank', 67, 27], ['heavy_tank', 65, 25], ['bulwark_mech', 65, 22], ['lancer_mech', 68, 25], ['longshot_mech', 70, 25], ['flak_tank', 66, 28]];
    west.forEach(function (s) { Sim.addUnit(state, s[0], 'iron_eden', s[1], s[2]); });
    east.forEach(function (s) { Sim.addUnit(state, s[0], 'xandria', s[1], s[2]); });
  }

  function firstMapOverlaySets() {
    return [
      { tiles: FIRST_TRACK, family: 'train_tracks' },
      { tiles: FIRST_ROAD, family: 'road' },
      { tiles: FIRST_FORD, family: 'stepping_stones' }
    ];
  }

  // ---- SECOND MAP: "Twin Bridges" (80x50) ----
  // Terrain problem, different from the First Map's single river +
  // single bridge: a central lake (x 33-47, y 10-39) crossed by TWO
  // bridges (upper y 16-17, lower y 32-33), with open land corridors
  // around the lake's north and south ends. The fight is therefore
  // about splitting defence across two crossings and watching the
  // flanks, instead of holding one choke. Built from the same seeds
  // as the First Map: same base zones, rect/blob builders, same
  // 10v10 scenario shape mirrored on the same cores, same cosmetic
  // overlay families. No new terrain type, no new mechanic: lake
  // tiles are plain WATER, bridges are plain BRIDGE.
  var LAKE_X0 = 33, LAKE_X1 = 47, LAKE_Y0 = 10, LAKE_Y1 = 39;
  var UPPER_Y0 = 16, UPPER_Y1 = 17, LOWER_Y0 = 32, LOWER_Y1 = 33;
  var SECOND_TRACK = [];
  for (var sx = 4; sx <= 32; sx++) SECOND_TRACK.push([sx, 6]);
  for (var ax = 20; ax <= 32; ax++) SECOND_TRACK.push([ax, 16]);
  var SECOND_ROAD = [];
  for (var srx = 48; srx <= 75; srx++) SECOND_ROAD.push([srx, 43]);
  for (var sry = 37; sry <= 42; sry++) SECOND_ROAD.push([70, sry]);
  for (var bx2 = 48; bx2 <= 70; bx2++) SECOND_ROAD.push([bx2, 33]);

  function createSecondMap() {
    var terrain = new Uint8Array(W * H);
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      terrain[y * W + x] = x < LAKE_X0 ? T.GRASS : T.DIRT;
    }
    rect(terrain, 20, 40, 26, 44, T.DIRT);
    rect(terrain, 4, 32, 8, 34, T.DIRT);
    rect(terrain, 60, 22, 64, 24, T.GRASS);
    rect(terrain, 48, 36, 52, 38, T.GRASS);
    // Central lake, then the two bridges punched through it.
    rect(terrain, LAKE_X0, LAKE_Y0, LAKE_X1, LAKE_Y1, T.WATER);
    for (var uy = UPPER_Y0; uy <= UPPER_Y1; uy++) for (var ux = LAKE_X0; ux <= LAKE_X1; ux++) {
      terrain[uy * W + ux] = T.BRIDGE;
    }
    for (var ly = LOWER_Y0; ly <= LOWER_Y1; ly++) for (var lx = LAKE_X0; lx <= LAKE_X1; lx++) {
      terrain[ly * W + lx] = T.BRIDGE;
    }
    // Forest clusters. Kept OUT of: both bridge approach corridors
    // (x 28-52, y 13-20 and y 29-36), both cores, and all spawn tiles.
    blob(terrain, 11, 9, 2, T.FOREST);
    blob(terrain, 22, 7, 2, T.FOREST);
    blob(terrain, 8, 41, 2, T.FOREST);
    blob(terrain, 20, 43, 2, T.FOREST);
    blob(terrain, 58, 9, 2, T.FOREST);
    blob(terrain, 70, 16, 2, T.FOREST);
    blob(terrain, 62, 31, 2, T.FOREST);
    blob(terrain, 58, 41, 1, T.FOREST);
    blob(terrain, 46, 44, 1, T.FOREST);
    // Rock clusters (LOS blockers). Same keep-out zones as forest,
    // plus never on a bridge or lake tile.
    blob(terrain, 24, 9, 1, T.ROCK);
    blob(terrain, 16, 45, 1, T.ROCK);
    blob(terrain, 26, 10, 1, T.ROCK);
    blob(terrain, 18, 16, 1, T.ROCK);
    blob(terrain, 24, 31, 1, T.ROCK);
    blob(terrain, 56, 10, 1, T.ROCK);
    blob(terrain, 56, 20, 1, T.ROCK);
    blob(terrain, 66, 34, 1, T.ROCK);
    blob(terrain, 49, 44, 1, T.ROCK);
    return { width: W, height: H, terrain: terrain };
  }

  // Same 10v10 scenario shape as the First Map, same cores
  // (west 6,25; east 73,25) — only the ground under it changed.
  function spawnSecondMapScenario(Sim, state) {
    Sim.addStructure(state, 'command_core', 'iron_eden', WEST_CORE.x, WEST_CORE.y);
    Sim.addStructure(state, 'command_core', 'xandria', EAST_CORE.x, EAST_CORE.y);
    var west = [['scout_buggy', 10, 21], ['scout_buggy', 10, 29], ['medium_tank', 12, 23], ['medium_tank', 12, 25], ['medium_tank', 12, 27], ['heavy_tank', 14, 25], ['bulwark_mech', 14, 22], ['lancer_mech', 11, 25], ['longshot_mech', 9, 25], ['flak_tank', 13, 28]];
    var east = [['scout_buggy', 69, 21], ['scout_buggy', 69, 29], ['medium_tank', 67, 23], ['medium_tank', 67, 25], ['medium_tank', 67, 27], ['heavy_tank', 65, 25], ['bulwark_mech', 65, 22], ['lancer_mech', 68, 25], ['longshot_mech', 70, 25], ['flak_tank', 66, 28]];
    west.forEach(function (s) { Sim.addUnit(state, s[0], 'iron_eden', s[1], s[2]); });
    east.forEach(function (s) { Sim.addUnit(state, s[0], 'xandria', s[1], s[2]); });
  }

  function secondMapOverlaySets() {
    return [
      { tiles: SECOND_TRACK, family: 'train_tracks' },
      { tiles: SECOND_ROAD, family: 'road' }
    ];
  }

  // ---- THIRD MAP: "Forest Belt" (80x50) ----
  // Terrain problem, different from BOTH earlier maps: there is no
  // spanning water barrier and no bridge choke at all. A dense
  // forest belt (x 30-49, y 4-45) covers the middle of the map.
  // Forest slows ground units (sim movement cost 2, vs 1 on open
  // ground) and rock clusters inside the belt block line of sight,
  // so the fight is about lane choice and ambush, not choke
  // holding: three clear lanes are cut through the belt
  // (y 14-16, y 24-26, y 34-36) — fast, open, and exposed — while
  // pushing through the trees is slow and blind. Scattered ponds
  // (small water blobs, never spanning) are circumventable on
  // land, so no bridge is needed anywhere on this map. Built from
  // the same seeds as the other maps: same base zones, rect/blob
  // builders, same 10v10 scenario shape on the same cores, same
  // cosmetic overlay families. No new terrain type, no new
  // mechanic: forest is plain FOREST, ponds are plain WATER.
  var BELT_X0 = 30, BELT_X1 = 49, BELT_Y0 = 4, BELT_Y1 = 45;
  var THIRD_LANES = [[14, 16], [24, 26], [34, 36]];
  // Pond centres all have an even x+y sum: the blob builder drops
  // a radius-1 arm whose x+y sum is even, so an odd-sum centre
  // would collapse to a single tile instead of a pond.
  var THIRD_PONDS = [[18, 42], [62, 10], [60, 40]];
  var THIRD_TRACK = [];
  for (var tx3 = 4; tx3 <= 29; tx3++) THIRD_TRACK.push([tx3, 6]);
  var THIRD_ROAD = [];
  for (var rx3 = 50; rx3 <= 75; rx3++) THIRD_ROAD.push([rx3, 43]);

  function createThirdMap() {
    var terrain = new Uint8Array(W * H);
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      terrain[y * W + x] = x < BELT_X0 ? T.GRASS : T.DIRT;
    }
    rect(terrain, 20, 40, 26, 44, T.DIRT);
    rect(terrain, 4, 32, 8, 34, T.DIRT);
    rect(terrain, 60, 22, 64, 24, T.GRASS);
    rect(terrain, 48, 36, 52, 38, T.GRASS);
    // Dense belt, then the three lanes cut back to open ground
    // (base zone by side: grass west of x=30, dirt east of it —
    // the belt spans the boundary, so lanes follow the same rule).
    rect(terrain, BELT_X0, BELT_Y0, BELT_X1, BELT_Y1, T.FOREST);
    for (var li = 0; li < THIRD_LANES.length; li++) {
      for (var ly2 = THIRD_LANES[li][0]; ly2 <= THIRD_LANES[li][1]; ly2++) {
        for (var lx2 = BELT_X0; lx2 <= BELT_X1; lx2++) {
          terrain[ly2 * W + lx2] = lx2 < BELT_X0 ? T.GRASS : T.DIRT;
        }
      }
    }
    // Forest clusters outside the belt. Kept OUT of both cores
    // and all spawn tiles (west spawns x 9-14, east spawns
    // x 65-70, y 21-29).
    blob(terrain, 11, 9, 2, T.FOREST);
    blob(terrain, 22, 7, 2, T.FOREST);
    blob(terrain, 8, 41, 2, T.FOREST);
    blob(terrain, 20, 43, 2, T.FOREST);
    blob(terrain, 58, 9, 2, T.FOREST);
    blob(terrain, 70, 16, 2, T.FOREST);
    blob(terrain, 62, 31, 2, T.FOREST);
    blob(terrain, 58, 41, 1, T.FOREST);
    // Rock clusters (LOS blockers + movement obstacles). Belt
    // rocks sit BETWEEN lanes (never on a lane tile, never on a
    // core or spawn tile); outside rocks mirror the other maps.
    blob(terrain, 34, 20, 1, T.ROCK);
    blob(terrain, 44, 29, 1, T.ROCK);
    blob(terrain, 38, 40, 1, T.ROCK);
    blob(terrain, 48, 10, 1, T.ROCK);
    blob(terrain, 24, 9, 1, T.ROCK);
    blob(terrain, 16, 45, 1, T.ROCK);
    blob(terrain, 66, 34, 1, T.ROCK);
    blob(terrain, 49, 44, 1, T.ROCK);
    // Ponds LAST, so no forest/rock blob overwrites a water tile
    // (a forest blob near (60,40) would otherwise eat a pond edge).
    // Each pond is a radius-1 blob: circumventable, never spanning.
    for (var pi = 0; pi < THIRD_PONDS.length; pi++) {
      blob(terrain, THIRD_PONDS[pi][0], THIRD_PONDS[pi][1], 1, T.WATER);
    }
    return { width: W, height: H, terrain: terrain };
  }

  // Same 10v10 scenario shape as the First Map, same cores
  // (west 6,25; east 73,25) — only the ground under it changed.
  // Note: the central lane (y 24-26) runs straight through both
  // cores' row, so the opening armies face each other down a
  // clear lane, with the forest belt between them.
  function spawnThirdMapScenario(Sim, state) {
    Sim.addStructure(state, 'command_core', 'iron_eden', WEST_CORE.x, WEST_CORE.y);
    Sim.addStructure(state, 'command_core', 'xandria', EAST_CORE.x, EAST_CORE.y);
    var west = [['scout_buggy', 10, 21], ['scout_buggy', 10, 29], ['medium_tank', 12, 23], ['medium_tank', 12, 25], ['medium_tank', 12, 27], ['heavy_tank', 14, 25], ['bulwark_mech', 14, 22], ['lancer_mech', 11, 25], ['longshot_mech', 9, 25], ['flak_tank', 13, 28]];
    var east = [['scout_buggy', 69, 21], ['scout_buggy', 69, 29], ['medium_tank', 67, 23], ['medium_tank', 67, 25], ['medium_tank', 67, 27], ['heavy_tank', 65, 25], ['bulwark_mech', 65, 22], ['lancer_mech', 68, 25], ['longshot_mech', 70, 25], ['flak_tank', 66, 28]];
    west.forEach(function (s) { Sim.addUnit(state, s[0], 'iron_eden', s[1], s[2]); });
    east.forEach(function (s) { Sim.addUnit(state, s[0], 'xandria', s[1], s[2]); });
  }

  function thirdMapOverlaySets() {
    return [
      { tiles: THIRD_TRACK, family: 'train_tracks' },
      { tiles: THIRD_ROAD, family: 'road' }
    ];
  }

  var api = {
    T: T, WIDTH: W, HEIGHT: H, RIVER_X0: RIVER_X0, RIVER_X1: RIVER_X1,
    BRIDGE_Y0: BRIDGE_Y0, BRIDGE_Y1: BRIDGE_Y1,
    WEST_CORE: WEST_CORE, EAST_CORE: EAST_CORE,
    FIRST_TRACK: FIRST_TRACK, FIRST_ROAD: FIRST_ROAD, FIRST_FORD: FIRST_FORD,
    LAKE_X0: LAKE_X0, LAKE_X1: LAKE_X1, LAKE_Y0: LAKE_Y0, LAKE_Y1: LAKE_Y1,
    UPPER_Y0: UPPER_Y0, UPPER_Y1: UPPER_Y1, LOWER_Y0: LOWER_Y0, LOWER_Y1: LOWER_Y1,
    SECOND_TRACK: SECOND_TRACK, SECOND_ROAD: SECOND_ROAD,
    BELT_X0: BELT_X0, BELT_X1: BELT_X1, BELT_Y0: BELT_Y0, BELT_Y1: BELT_Y1,
    THIRD_LANES: THIRD_LANES, THIRD_PONDS: THIRD_PONDS,
    THIRD_TRACK: THIRD_TRACK, THIRD_ROAD: THIRD_ROAD,
    createFirstMap: createFirstMap,
    spawnFirstMapScenario: spawnFirstMapScenario,
    firstMapOverlaySets: firstMapOverlaySets,
    createSecondMap: createSecondMap,
    spawnSecondMapScenario: spawnSecondMapScenario,
    secondMapOverlaySets: secondMapOverlaySets,
    createThirdMap: createThirdMap,
    spawnThirdMapScenario: spawnThirdMapScenario,
    thirdMapOverlaySets: thirdMapOverlaySets
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.SWMaps = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
