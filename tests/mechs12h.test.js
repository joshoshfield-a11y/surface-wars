/* MECHS-12H Wave 2 tests (2026-11-01): 8 expansion chassis brought into
   the catalog. Run with the explicit file list (directory invocation
   fails on this Node):
   node --test tests/mechs12h.test.js [plus the rest of the suite]
   Nothing here touches weapons, progression, hero, sim AI rules, or
   starting scenarios: those are pinned by assertions below. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');
const Maps = require('../game/maps.js');
const Assets = require('../game/sprites.js');

const ROOT = path.join(__dirname, '..');
const NEW = {
  bastion: { faction: 'iron_eden', chassis: 'Bulwark', move: 'ground', speed: 3.8, hp: 340, armor: 'Heavy', vision: 7, size: 0.65, weapons: ['w_heavy_cannon'], scrap: 480, build: 28, counter: 'Demolition Crawler' },
  gatekeeper: { faction: 'iron_eden', chassis: 'Bulwark', move: 'ground', speed: 4.2, hp: 240, armor: 'Medium', vision: 8, size: 0.6, weapons: ['w_laser'], scrap: 380, build: 24, counter: 'Heavy Tank' },
  deadeye: { faction: 'iron_eden', chassis: 'Longshot', move: 'ground', speed: 4.0, hp: 190, armor: 'Medium', vision: 10, size: 0.6, weapons: ['w_light_railgun'], scrap: 460, build: 26, counter: 'Medium Tank' },
  mortarjack: { faction: 'iron_eden', chassis: 'Longshot', move: 'ground', speed: 4.5, hp: 150, armor: 'Light', vision: 8, size: 0.55, weapons: ['w_mortar'], scrap: 340, build: 22, counter: 'Lancer Mech' },
  needlewing: { faction: 'xandria', chassis: 'Vespid', move: 'ground', speed: 9.0, hp: 80, armor: 'Light', vision: 11, size: 0.4, weapons: ['w_scout_gun'], scrap: 140, build: 10, counter: 'Medium Tank' },
  longsight: { faction: 'xandria', chassis: 'Vespid', move: 'ground', speed: 8.0, hp: 60, armor: 'Light', vision: 13, size: 0.4, weapons: ['w_scout_gun'], scrap: 140, build: 10, counter: 'Fast Raider' },
  javelin: { faction: 'xandria', chassis: 'Lancer', move: 'ground', speed: 6.5, hp: 180, armor: 'Medium', vision: 8, size: 0.55, weapons: ['w_autocannon'], scrap: 320, build: 22, counter: 'Heavy Tank' },
  raptor: { faction: 'xandria', chassis: 'Lancer', move: 'ground', speed: 7.5, hp: 170, armor: 'Medium', vision: 8, size: 0.55, weapons: ['w_melee'], scrap: 300, build: 20, counter: 'Lancer Mech' },
};
const NEW_IDS = Object.keys(NEW);
const BASELINE_49 = ['scout_buggy', 'vespid_scout', 'combat_drone', 'radar_scout', 'salvage_team', 'repair_scout', 'sensor_drone', 'ew_skirmisher', 'fast_raider', 'decoy_drone', 'medium_tank', 'heavy_tank', 'bulwark_mech', 'lancer_mech', 'siege_cannon', 'longshot_mech', 'rocket_battery', 'breach_walker', 'mortar_carrier', 'heavy_railgun', 'rocket_artillery_mech', 'siege_engineer', 'demolition_crawler', 'experimental_artillery', 'interceptor_drone', 'flak_tank', 'missile_carrier', 'gunship', 'strike_bomber', 'transport_aircraft', 'drone_carrier', 'recon_aircraft', 'construction_vehicle', 'field_repair_mech', 'recovery_crawler', 'supply_carrier', 'shield_projector', 'ew_mech', 'command_walker', 'bridge_layer', 'combat_engineer', 'rampart_fortress', 'titan_breaker', 'storm_lance', 'warden_platform', 'mobile_foundry', 'colossus_engine', 'command_carrier', 'drone_swarm'];
const OPEN_10V10 = ['scout_buggy', 'scout_buggy', 'medium_tank', 'medium_tank', 'medium_tank', 'heavy_tank', 'bulwark_mech', 'lancer_mech', 'longshot_mech', 'flak_tank'];

function byId(id) { return catalog.units.find((u) => u.id === id); }
function faction(id) { return catalog.factions.find((f) => f.id === id); }
function pngSize(rel) {
  const buf = fs.readFileSync(path.join(ROOT, rel));
  assert.equal(buf.toString('ascii', 1, 4), 'PNG', rel + ' is not a PNG');
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}
function diskPath(p) { return p.replace(/^\.\.\//, ''); }
function dpsOf(unit) {
  return unit.weapons.reduce((sum, wid) => {
    const w = catalog.weapons.find((x) => x.id === wid);
    return sum + (w.damage * w.accuracy) / w.interval;
  }, 0);
}

test('mechs12h: all 8 new ids present with documented stats, costs, times, counters', () => {
  assert.equal(catalog.units.length, 57, '49 baseline + 8 new');
  for (const [id, exp] of Object.entries(NEW)) {
    const u = byId(id);
    assert.ok(u, 'missing unit ' + id);
    assert.equal(u.chassis, exp.chassis, id + ' chassis');
    assert.equal(u.movementClass, exp.move, id + ' movement');
    assert.equal(u.speed, exp.speed, id + ' speed');
    assert.equal(u.hp, exp.hp, id + ' hp');
    assert.equal(u.armor, exp.armor, id + ' armor');
    assert.equal(u.vision, exp.vision, id + ' vision');
    assert.equal(u.size, exp.size, id + ' size');
    assert.deepEqual(u.weapons, exp.weapons, id + ' weapons');
    assert.equal(u.cost.scrap, exp.scrap, id + ' scrap');
    assert.equal(u.cost.power, 0, id + ' must be power 0 for the producible filter');
    assert.equal(u.cost.components, 0, id + ' must be components 0 for the producible filter');
    assert.equal(u.buildTime, exp.build, id + ' buildTime');
    assert.ok(u.description.includes(exp.counter), id + ' description must name counter ' + exp.counter);
    for (const wid of exp.weapons) assert.ok(catalog.weapons.some((w) => w.id === wid), id + ' weapon ' + wid + ' must exist');
  }
});

test('mechs12h: faction rosters as assigned, and only as assigned', () => {
  const ie = faction('iron_eden').roster, xa = faction('xandria').roster;
  for (const [id, exp] of Object.entries(NEW)) {
    if (exp.faction === 'iron_eden') {
      assert.ok(ie.includes(id), id + ' must be in iron_eden roster');
      assert.ok(!xa.includes(id), id + ' must NOT be in xandria roster');
    } else {
      assert.ok(xa.includes(id), id + ' must be in xandria roster');
      assert.ok(!ie.includes(id), id + ' must NOT be in iron_eden roster');
    }
  }
  assert.equal(ie.length, 27, '23 baseline iron_eden + 4 new');
  assert.equal(xa.length, 28, '24 baseline xandria + 4 new');
});

test('mechs12h: sprite wiring — expansion paths exist for both teams, 512x512, preload covers them', () => {
  for (const id of NEW_IDS) {
    for (const fac of ['iron_eden', 'xandria']) {
      const p = Assets.unitPath(id, fac);
      assert.ok(p.includes('mechs-expansion/'), id + ' must map to mechs-expansion, got ' + p);
      const size = pngSize(diskPath(p));
      assert.deepEqual(size, { w: 512, h: 512 }, id + ' ' + fac + ' must be 512x512');
    }
    assert.ok(Assets.EXPANSION_SPRITES[id], id + ' must be in EXPANSION_SPRITES');
  }
  const src = fs.readFileSync(path.join(ROOT, 'game/sprites.js'), 'utf8');
  for (const id of NEW_IDS) assert.ok(src.includes("'" + id + "'"), 'preload list must cover ' + id);
  // Old units still resolve to units/ — the mapping is additive only.
  assert.ok(Assets.unitPath('scout_buggy', 'iron_eden').endsWith('units/scout_buggy-512.png'));
});

test('mechs12h: producible-filter admission for both factions (zero power/components + roster)', () => {
  const map = Sim.createTestMap();
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 42 });
  for (const [id, exp] of Object.entries(NEW)) {
    const prod = Sim.producibleUnits(s, exp.faction).map((u) => u.id);
    assert.ok(prod.includes(id), id + ' must be producible for ' + exp.faction);
  }
  // The build menu needs no code change: game.js lists producibleUnits
  // automatically (verified here so a future menu rewrite is caught).
  const gameSrc = fs.readFileSync(path.join(ROOT, 'game/game.js'), 'utf8');
  assert.ok(gameSrc.includes('producibleUnits(state, PLAYER)'), 'build menu must list producibleUnits');
});

test('mechs12h: starting scrap conservation unchanged (500 both factions)', () => {
  const map = Maps.createFirstMap();
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 42 });
  Maps.spawnFirstMapScenario(Sim, s);
  assert.equal(Sim.scrapOf(s, 'iron_eden'), 500);
  assert.equal(Sim.scrapOf(s, 'xandria'), 500);
});

test('mechs12h: starting 10v10 scenarios unchanged on all three maps', () => {
  const defs = [
    [Maps.createFirstMap, Maps.spawnFirstMapScenario],
    [Maps.createSecondMap, Maps.spawnSecondMapScenario],
    [Maps.createThirdMap, Maps.spawnThirdMapScenario],
  ];
  for (const [create, spawn] of defs) {
    const map = create();
    const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 42 });
    spawn(Sim, s);
    assert.equal(s.units.length, 20, 'scenario must stay 10v10');
    for (const fac of ['iron_eden', 'xandria']) {
      const got = s.units.filter((u) => u.faction === fac).map((u) => u.typeId).sort();
      assert.deepEqual(got, [...OPEN_10V10].sort(), fac + ' opening composition changed');
      assert.ok(!s.units.some((u) => u.faction === fac && NEW_IDS.includes(u.typeId)), 'new mechs must NOT enter via starting scenarios');
    }
  }
});

test('mechs12h: red-AI per-type cap still enforced with the new catalog (live + queued <= 3)', () => {
  const map = Maps.createFirstMap();
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 20261030 });
  s.aiCombatParams = Sim.DIFFICULTY_PARAMS.normal;
  Maps.spawnFirstMapScenario(Sim, s);
  for (let t = 0; t < 3000; t++) {
    Sim.step(s);
    if (s.tick % 20 !== 0) continue;
    const q = Sim.productionQueue(s, 'xandria');
    const counts = {};
    for (const u of s.units) if (u.faction === 'xandria') counts[u.typeId] = (counts[u.typeId] || 0) + 1;
    for (const it of q.items) counts[it.typeId] = (counts[it.typeId] || 0) + 1;
    for (const [type, n] of Object.entries(counts)) {
      assert.ok(n <= 3, `red ${type} live+queued ${n} exceeds per-type cap 3 at tick ${s.tick}`);
    }
    if (s.winner) break;
  }
});

test('mechs12h: pricing rules — scout-buggy floor, top-end envelope, HP x DPS band', () => {
  const scout = byId('scout_buggy');
  const scoutDps = dpsOf(scout);
  for (const id of NEW_IDS) {
    const u = byId(id);
    const d = dpsOf(u);
    // No new unit cheaper than Scout Buggy (80) while beating it on HP,
    // speed, AND DPS simultaneously.
    assert.ok(!(u.cost.scrap < scout.cost.scrap && u.hp > scout.hp && u.speed > scout.speed && d > scoutDps),
      id + ' undercuts scout_buggy on every axis at once');
    // Top-end envelope: nothing above the existing producible ceiling
    // (Heavy Tank 520 scrap) and nothing above the existing DPS ceiling
    // (melee 29.7) without a named drawback — all 8 satisfy the ceiling
    // outright, so no drawback exception is needed.
    assert.ok(u.cost.scrap <= 520, id + ' cost exceeds top-end envelope');
    assert.ok(d <= 29.7 + 1e-9, id + ' DPS exceeds top-end envelope');
  }
  // HP x DPS band vs the nearest neighbours (direct units ~0.07-0.12,
  // indirect/mortar/railgun premium ~0.22-0.32, melee ~0.055).
  const band = (id, lo, hi) => {
    const u = byId(id), r = (u.cost.scrap / (u.hp * dpsOf(u)));
    assert.ok(r >= lo && r <= hi, `${id} cost/(HP*DPS) ${r.toFixed(3)} outside [${lo},${hi}]`);
  };
  band('bastion', 0.06, 0.10); band('gatekeeper', 0.06, 0.10); band('javelin', 0.06, 0.12);
  band('needlewing', 0.09, 0.14); band('longsight', 0.12, 0.20);
  band('deadeye', 0.20, 0.32); band('mortarjack', 0.22, 0.34); band('raptor', 0.04, 0.08);
});

test('mechs12h: no existing unit row changed — 49 baseline ids intact, neighbours pinned', () => {
  const ids = catalog.units.map((u) => u.id);
  for (const id of BASELINE_49) assert.ok(ids.includes(id), 'baseline unit removed: ' + id);
  assert.equal(ids.length, 57);
  // Spot-check full values of the 8 nearest pricing neighbours.
  const pin = (id, fields) => {
    const u = byId(id);
    for (const [k, v] of Object.entries(fields)) assert.deepEqual(u[k], v, `neighbour ${id}.${k} changed`);
  };
  pin('scout_buggy', { hp: 60, speed: 7.0, armor: 'Light', vision: 10, weapons: ['w_scout_gun'], buildTime: 8 });
  assert.equal(byId('scout_buggy').cost.scrap, 80);
  pin('vespid_scout', { hp: 70, speed: 8.5, armor: 'Light', vision: 11, weapons: ['w_scout_gun'], buildTime: 10 });
  assert.equal(byId('vespid_scout').cost.scrap, 120);
  pin('medium_tank', { hp: 220, speed: 4.5, armor: 'Medium', weapons: ['w_heavy_cannon'], buildTime: 20 });
  assert.equal(byId('medium_tank').cost.scrap, 300);
  pin('heavy_tank', { hp: 380, speed: 3.5, armor: 'Heavy', weapons: ['w_heavy_cannon'], buildTime: 30 });
  assert.equal(byId('heavy_tank').cost.scrap, 520);
  pin('bulwark_mech', { hp: 320, speed: 4.0, armor: 'Heavy', weapons: ['w_heavy_cannon'], buildTime: 28 });
  assert.equal(byId('bulwark_mech').cost.scrap, 460);
  pin('mortar_carrier', { hp: 140, speed: 5.0, armor: 'Light', weapons: ['w_mortar'], buildTime: 22 });
  assert.equal(byId('mortar_carrier').cost.scrap, 320);
  pin('flak_tank', { hp: 200, speed: 4.5, armor: 'Medium', weapons: ['w_aa_cannon'], buildTime: 22 });
  assert.equal(byId('flak_tank').cost.scrap, 340);
  pin('lancer_mech', { hp: 200, speed: 6.0, armor: 'Medium', weapons: ['w_autocannon', 'w_melee'], buildTime: 24 });
  assert.equal(byId('lancer_mech').cost.scrap, 380);
  // Weapons untouched: 19 rows, spot values for every weapon the new
  // units use.
  assert.equal(catalog.weapons.length, 19);
  const w = (id) => catalog.weapons.find((x) => x.id === id);
  assert.deepEqual([w('w_heavy_cannon').damage, w('w_heavy_cannon').interval], [28, 1.2]);
  assert.deepEqual([w('w_laser').damage, w('w_laser').interval], [16, 0.7]);
  assert.deepEqual([w('w_light_railgun').damage, w('w_light_railgun').range, w('w_light_railgun').minRange], [24, 14, 3]);
  assert.deepEqual([w('w_mortar').damage, w('w_mortar').range, w('w_mortar').minRange], [20, 12, 3]);
  assert.deepEqual([w('w_scout_gun').damage, w('w_scout_gun').interval], [8, 0.45]);
  assert.deepEqual([w('w_autocannon').damage, w('w_autocannon').interval], [12, 0.5]);
  assert.deepEqual([w('w_melee').damage, w('w_melee').range], [25, 1.2]);
});
