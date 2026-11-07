/* Surface Wars Prototype 01 — sprite / terrain / overlay mapping + loader.
   Rendering only: no sim rules, stats, balance, movement, pathfinding or
   damage live here. Team colours are fixed by the catalog factions:
   iron_eden -> blue sprite (no suffix), xandria -> red sprite (-red).
   All paths are relative to game/index.html (../assets/...), so the game
   works from file:// and from a local static server alike.
   In a browser, images are loaded on demand and cached; draw code falls
   back to the old canvas placeholder whenever an image is not yet loaded
   or fails, so the game never goes blank. In Node (tests) this module
   exports only the pure mapping tables — no DOM access happens there. */
(function (global) {
  'use strict';

  // Sim terrain ids (sim.js T): 0 GRASS, 1 DIRT, 2 BRIDGE, 3 FOREST, 4 WATER, 5 ROCK.
  var TERRAIN_BASE = {
    0: 'grass',          // west open ground
    1: 'dirt',           // east broken ground
    2: 'water_plain',    // bridge tiles sit over water; bridge_deck overlays them
    3: 'forest_floor',   // own base (dark forest floor); no canopy sprite exists
    4: 'water_plain',    // river
    5: 'rocky_ground'    // cliffs / LOS blockers
  };
  var TERRAIN_COLORS = ['#4a7c3a', '#8a6f4d', '#6b6b6b', '#2e5d2a', '#1d4e9e', '#5a5a5a'];

  // TILING-SPEC.md neighbour bitmask: N=1, E=2, S=4, W=8.
  // T_<dir> opens to <dir> (that arm is MISSING). Mask 0 -> no overlay.
  var MASK_TO_VARIANT = {
    5: 'straight_ns', 10: 'straight_ew',
    3: 'corner_ne', 9: 'corner_nw', 6: 'corner_se', 12: 'corner_sw',
    14: 't_north', 11: 't_south', 13: 't_east', 7: 't_west',
    15: 'cross',
    1: 'end_north', 4: 'end_south', 2: 'end_east', 8: 'end_west'
  };
  function variantForMask(mask) { return MASK_TO_VARIANT[mask] || null; }
  function maskForNeighbours(n, e, s, w) {
    return (n ? 1 : 0) + (e ? 2 : 0) + (s ? 4 : 0) + (w ? 8 : 0);
  }
  // Base variant hash from TILING-SPEC.md: adjacent tiles never share a
  // variant in a simple repeating block, and no 2x2 block repeats it.
  function baseVariant(tx, ty) { return ((tx * 7 + ty * 13) % 3) + 1; }

  function teamSuffix(faction) {
    if (faction === 'xandria') return '-red';
    return ''; // iron_eden (blue) and any other faction default to the blue sprite
  }
  // MECHS-12H (2026-11-01): expansion chassis wired to their generated
  // art in assets/sprites-90/mechs-expansion/<class>/, NOT copied into
  // units/. Folder is the manifest class: bulwark/vespid/longshot for
  // the matching chassis, striker art maps to the Lancer catalog
  // chassis (mobile assault). Blue = no suffix, red = -red, same as
  // the units/ convention. No wreck art exists for these ids yet:
  // render.js skips a wreck whose image is not ready, so a missing
  // wreck file draws nothing instead of crashing (see MECHS-12H-REPORT).
  var EXPANSION_SPRITES = {
    bastion: 'bulwark/bastion', gatekeeper: 'bulwark/gatekeeper',
    deadeye: 'longshot/deadeye', mortarjack: 'longshot/mortarjack',
    needlewing: 'vespid/needlewing', longsight: 'vespid/longsight',
    javelin: 'striker/javelin', raptor: 'striker/raptor'
  };
  function unitPath(typeId, faction) {
    if (Object.prototype.hasOwnProperty.call(EXPANSION_SPRITES, typeId)) {
      return '../assets/sprites-90/mechs-expansion/' + EXPANSION_SPRITES[typeId] + teamSuffix(faction) + '-512.png';
    }
    return '../assets/sprites-90/units/' + typeId + teamSuffix(faction) + '-512.png';
  }
  function structurePath(typeId, faction) {
    return '../assets/sprites-90/structures/' + typeId + teamSuffix(faction) + '-512.png';
  }
  function basePath(terrainId, tx, ty) {
    var type = TERRAIN_BASE[terrainId] || 'grass';
    return '../assets/tiles-overlay/base/' + type + '_v' + baseVariant(tx, ty) + '-512.png';
  }
  function overlayPath(family, variant) {
    return '../assets/tiles-overlay/overlays/' + family + '/' + variant + '-512.png';
  }

  // Cosmetic-only demo overlays on the test map. These tiles are NOT sim
  // terrain and do NOT change movement, collision, LOS or combat in any way.
  // They are drawn purely from this list, after bases, before units.
  // Track: an L on empty west grass — horizontal row y=5, x=4..20, turning
  // south at x=20 down to y=10. No unit, structure, forest or rock sits on
  // any of these tiles in spawnScenario/createTestMap.
  // Road: a straight line on empty east dirt, row y=35, x=40..55.
  var DEMO_TRACK = [];
  for (var x = 4; x <= 20; x++) DEMO_TRACK.push([x, 5]);
  for (var y = 6; y <= 10; y++) DEMO_TRACK.push([20, y]);
  var DEMO_ROAD = [];
  for (var rx = 40; rx <= 55; rx++) DEMO_ROAD.push([rx, 35]);
  function demoOverlayMap() {
    // Returns { "x,y": { family, variant } } with variants computed from
    // same-family neighbours in the demo sets (autotile mask logic).
    return overlayMapForSets([
      { tiles: DEMO_TRACK, family: 'train_tracks' },
      { tiles: DEMO_ROAD, family: 'road' }
    ]);
  }

  // ---- Animation art (assets/animation/, team-neutral) ----
  // Wrecks are named <unit-id>_wreck; FX/projectiles/canopy by plain name.
  // All are -512 files, matching the sprites-90 convention. Any image
  // that fails to load falls back to the still sprite in render.js —
  // animation art is never allowed to blank a unit out.
  function wreckPath(typeId) {
    return '../assets/animation/wrecks/' + typeId + '_wreck-512.png';
  }
  function fxPath(name) {
    return '../assets/animation/fx/' + name + '-512.png';
  }
  function projectilePath(name) {
    return '../assets/animation/projectiles/' + name + '-512.png';
  }
  function canopyPath(name) {
    return '../assets/animation/canopy/' + name + '-512.png';
  }
  // Canopy variant from same-tile forest neighbours (n/e/s/w = a forest
  // tile exists in that direction). Edge tiles are named for the half
  // that IS foliage: a tile open to the south (forest to the north)
  // draws canopy_edge_n, foliage on its north half, open ground showing
  // on its south half. Interior tiles are dense; a tile open on two or
  // more sides, or isolated, draws single (a lone crown, no false edge).
  function canopyVariantForNeighbours(n, e, s, w) {
    var count = (n ? 1 : 0) + (e ? 1 : 0) + (s ? 1 : 0) + (w ? 1 : 0);
    if (count === 4) return 'canopy_dense';
    if (count === 3) {
      if (!n) return 'canopy_edge_s';
      if (!s) return 'canopy_edge_n';
      if (!e) return 'canopy_edge_w';
      return 'canopy_edge_e';
    }
    return 'canopy_single';
  }

  // ---- Structure-wreck art (Wave-2 graphics, Wave-3 completion) ----
  // Dedicated generated wreck art for every structure type (Wave-3
  // added the last 8: advanced_reactor, vehicle_factory, mech_bay,
  // aircraft_hangar, heavy_plant, salvage_processor, logistics_hub,
  // experimental_facility, so no type falls back to generic rubble any
  // more; 'rubble' remains on disk as an unused fallback stem).
  // Turret types share one turret wreck (same silhouette family).
  // Wave-3 also replaced turret/bunker/wall wrecks with flatter
  // top-down versions (see GRAPHICS-WAVE3-REPORT.md); command_core
  // keeps its Wave-2 wreck (the flat candidate's blue discs risked
  // reading as Iron Eden faction colour on a team-neutral wreck).
  var STRUCTURE_WRECK_ART = {
    command_core: 'command_core_wreck', light_turret: 'turret_wreck',
    heavy_turret: 'turret_wreck', aa_turret: 'turret_wreck',
    missile_turret: 'turret_wreck', bunker: 'bunker_wreck',
    wall: 'wall_wreck', light_factory: 'light_factory_wreck',
    scrap_extractor: 'scrap_extractor_wreck', power_plant: 'power_plant_wreck',
    research_lab: 'research_lab_wreck', repair_depot: 'repair_depot_wreck',
    radar_station: 'radar_station_wreck', ammo_depot: 'ammo_depot_wreck',
    shield_generator: 'shield_generator_wreck',
    advanced_reactor: 'advanced_reactor_wreck',
    vehicle_factory: 'vehicle_factory_wreck',
    mech_bay: 'mech_bay_wreck', aircraft_hangar: 'aircraft_hangar_wreck',
    heavy_plant: 'heavy_plant_wreck',
    salvage_processor: 'salvage_processor_wreck',
    logistics_hub: 'logistics_hub_wreck',
    experimental_facility: 'experimental_facility_wreck'
  };
  function structureWreckPath(typeId) {
    var stem = STRUCTURE_WRECK_ART[typeId] || 'rubble';
    return '../assets/animation/structure-wrecks/' + stem + '-512.png';
  }
  function structureWreckStem(typeId) {
    return STRUCTURE_WRECK_ART[typeId] || 'rubble';
  }
  // ---- UI icons (Wave-2 graphics) ----
  // Generated icons that SUPPLEMENT the order-button text labels —
  // text stays for clarity/accessibility; icons never replace it.
  function iconPath(name) {
    return '../assets/ui-icons/' + name + '.png';
  }
  // Same neighbour-mask logic as the demo sets (see TILING-SPEC.md).
  function overlayMapForSets(sets) {
    var map = {};
    for (var si = 0; si < sets.length; si++) {
      var list = sets[si].tiles, family = sets[si].family;
      var set = {};
      for (var i = 0; i < list.length; i++) set[list[i][0] + ',' + list[i][1]] = true;
      for (var j = 0; j < list.length; j++) {
        var tx = list[j][0], ty = list[j][1];
        var mask = maskForNeighbours(
          !!set[tx + ',' + (ty - 1)], !!set[(tx + 1) + ',' + ty],
          !!set[tx + ',' + (ty + 1)], !!set[(tx - 1) + ',' + ty]);
        var variant = variantForMask(mask);
        if (variant) map[tx + ',' + ty] = { family: family, variant: variant, mask: mask };
      }
    }
    return map;
  }

  // Browser image cache (no-op in Node).
  var cache = {};
  function loadImage(path) {
    if (typeof document === 'undefined' || typeof Image === 'undefined') return null;
    if (!cache[path]) {
      var img = new Image();
      img.src = path;
      cache[path] = img;
    }
    return cache[path];
  }
  function readyImage(path) {
    var img = loadImage(path);
    if (!img) return null;
    if (img.complete && img.naturalWidth > 0) return img;
    return null;
  }
  function preloadPriority() {
    // Scenario set first so the first screenshot/frame has real art fast;
    // every other mapped sprite is created on first demand by readyImage.
    var priority = [
      'scout_buggy', 'medium_tank', 'heavy_tank', 'bulwark_mech',
      'lancer_mech', 'longshot_mech', 'flak_tank'
    ];
    for (var i = 0; i < priority.length; i++) {
      loadImage(unitPath(priority[i], 'iron_eden'));
      loadImage(unitPath(priority[i], 'xandria'));
    }
    // MECHS-12H: preload the expansion units too, so a produced unit
    // has real art on its first frame instead of a placeholder.
    var expansionPriority = ['bastion', 'gatekeeper', 'deadeye', 'mortarjack',
      'needlewing', 'longsight', 'javelin', 'raptor'];
    for (var ei = 0; ei < expansionPriority.length; ei++) {
      loadImage(unitPath(expansionPriority[ei], 'iron_eden'));
      loadImage(unitPath(expansionPriority[ei], 'xandria'));
    }
    loadImage(structurePath('command_core', 'iron_eden'));
    loadImage(structurePath('command_core', 'xandria'));
    for (var t = 0; t <= 5; t++) {
      for (var v = 1; v <= 3; v++) {
        loadImage('../assets/tiles-overlay/base/' + (TERRAIN_BASE[t] || 'grass') + '_v' + v + '-512.png');
      }
    }
    // Animation art priority: scenario wrecks, all FX frames, all
    // projectile sprites, all canopy tiles.
    var animPriority = ['scout_buggy', 'medium_tank', 'heavy_tank', 'bulwark_mech',
      'lancer_mech', 'longshot_mech', 'flak_tank'];
    for (var ai = 0; ai < animPriority.length; ai++) loadImage(wreckPath(animPriority[ai]));
    // Wave-2: structure wrecks (all dedicated stems + generic rubble),
    // damage decals, and UI icons.
    var swStems = ['command_core_wreck', 'turret_wreck', 'bunker_wreck',
      'wall_wreck', 'light_factory_wreck', 'scrap_extractor_wreck',
      'power_plant_wreck', 'research_lab_wreck', 'repair_depot_wreck',
      'radar_station_wreck', 'ammo_depot_wreck', 'shield_generator_wreck',
      'advanced_reactor_wreck', 'vehicle_factory_wreck', 'mech_bay_wreck',
      'aircraft_hangar_wreck', 'heavy_plant_wreck', 'salvage_processor_wreck',
      'logistics_hub_wreck', 'experimental_facility_wreck', 'rubble'];
    for (var swi = 0; swi < swStems.length; swi++) loadImage('../assets/animation/structure-wrecks/' + swStems[swi] + '-512.png');
    loadImage(fxPath('damage_light')); loadImage(fxPath('damage_heavy'));
    var iconNames = ['move', 'attack-move', 'hold', 'patrol', 'salvage', 'guard', 'drop-back-in'];
    for (var ii = 0; ii < iconNames.length; ii++) loadImage(iconPath(iconNames[ii]));
    var fxNames = ['smoke_1', 'smoke_2', 'smoke_3', 'fire_1', 'fire_2', 'fire_3',
      'muzzle_1', 'muzzle_2', 'muzzle_3', 'explosion_1', 'explosion_2',
      'explosion_3', 'explosion_4', 'dust_1', 'dust_2'];
    for (var fi = 0; fi < fxNames.length; fi++) loadImage(fxPath(fxNames[fi]));
    var projNames = ['kinetic_tracer', 'missile', 'energy_bolt', 'flame'];
    for (var pj = 0; pj < projNames.length; pj++) loadImage(projectilePath(projNames[pj]));
    var canopyNames = ['canopy_single', 'canopy_dense', 'canopy_edge_n',
      'canopy_edge_s', 'canopy_edge_e', 'canopy_edge_w'];
    for (var ci = 0; ci < canopyNames.length; ci++) loadImage(canopyPath(canopyNames[ci]));
    var families = ['bridge_deck', 'train_tracks', 'road', 'stepping_stones'];
    for (var f = 0; f < families.length; f++) {
      for (var m in MASK_TO_VARIANT) {
        if (Object.prototype.hasOwnProperty.call(MASK_TO_VARIANT, m)) {
          loadImage(overlayPath(families[f], MASK_TO_VARIANT[m]));
        }
      }
    }
  }
  if (typeof document !== 'undefined') preloadPriority();

  var api = {
    TERRAIN_BASE: TERRAIN_BASE, TERRAIN_COLORS: TERRAIN_COLORS,
    MASK_TO_VARIANT: MASK_TO_VARIANT, variantForMask: variantForMask,
    maskForNeighbours: maskForNeighbours, baseVariant: baseVariant,
    teamSuffix: teamSuffix, unitPath: unitPath, EXPANSION_SPRITES: EXPANSION_SPRITES,
    structurePath: structurePath,
    basePath: basePath, overlayPath: overlayPath,
    wreckPath: wreckPath, fxPath: fxPath, projectilePath: projectilePath,
    structureWreckPath: structureWreckPath,
    structureWreckStem: structureWreckStem,
    STRUCTURE_WRECK_ART: STRUCTURE_WRECK_ART, iconPath: iconPath,
    canopyPath: canopyPath, canopyVariantForNeighbours: canopyVariantForNeighbours,
    overlayMapForSets: overlayMapForSets,
    DEMO_TRACK: DEMO_TRACK, DEMO_ROAD: DEMO_ROAD, demoOverlayMap: demoOverlayMap,
    loadImage: loadImage, readyImage: readyImage, preloadPriority: preloadPriority
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.SWAssets = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
