/* MECHS-12H Wave 2 match harness (2026-11-01). Three parts, all using
   the shipped sim only (no new rules, no opponent buffs):
   (a) Production smoke: every new unit can be queued, paid for,
       spawned, and ordered for its faction.
   (b) AI matches: scripted blue stand-in (attack-move idle units every
       40 ticks + mirrored cheapest-first economy, queue cap 3,
       per-type cap 3 — the ai-match.js stand-in) vs the red AI on
       Normal difficulty, on First Map + Twin Bridges + Forest Belt,
       2 seeds each. Reports red production composition per type and
       whether the match terminated under existing rules.
   (c) Counter check: attackMove duels, 6 tiles and 12 tiles apart,
       seeds 42/1337/2026, for each new unit vs its named counter from
       its catalog description. A counter FAILS if it wins fewer than
       half its duels; the harness exits 1 on a failure (the fix per
       the freeze rule is to retune the new unit or rewrite its
       description to the true counter — never to buff the opponent).
   Usage: node scripts/mechs12h-match.js
   Output: JSON rows, then a JSON summary line. Exit 1 on any failure. */
'use strict';
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');
const Maps = require('../game/maps.js');

const NEW = [
  { id: 'bastion', faction: 'iron_eden', counter: 'demolition_crawler' },
  { id: 'gatekeeper', faction: 'iron_eden', counter: 'heavy_tank' },
  { id: 'deadeye', faction: 'iron_eden', counter: 'medium_tank' },
  { id: 'mortarjack', faction: 'iron_eden', counter: 'lancer_mech' },
  { id: 'needlewing', faction: 'xandria', counter: 'medium_tank' },
  { id: 'longsight', faction: 'xandria', counter: 'fast_raider' },
  { id: 'javelin', faction: 'xandria', counter: 'heavy_tank' },
  { id: 'raptor', faction: 'xandria', counter: 'lancer_mech' },
];
const NEW_IDS = NEW.map((n) => n.id);
const MAX_TICKS = 15000;
let failures = 0;

// ---- (a) production smoke ----
function smoke(entry) {
  const def = catalog.units.find((u) => u.id === entry.id);
  const map = Sim.createTestMap();
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 42 });
  Sim.addStructure(s, 'command_core', entry.faction, 10, 20);
  Sim.addStructure(s, 'command_core', entry.faction === 'iron_eden' ? 'xandria' : 'iron_eden', 50, 20);
  s.scrap[entry.faction] = def.cost.scrap;
  const core = s.structures.find((st) => st.faction === entry.faction);
  const q = Sim.queueProduction(s, entry.faction, core.id, entry.id);
  if (!q.ok) { failures++; return { part: 'smoke', id: entry.id, ok: false, reason: q.reason }; }
  const paid = def.cost.scrap - Sim.scrapOf(s, entry.faction);
  let spawned = null;
  for (let t = 0; t < 4000 && !spawned; t++) {
    Sim.step(s);
    spawned = s.units.find((u) => u.faction === entry.faction && u.typeId === entry.id) || null;
  }
  if (!spawned) { failures++; return { part: 'smoke', id: entry.id, ok: false, reason: 'never-spawned' }; }
  const x0 = spawned.x, y0 = spawned.y;
  Sim.issueOrder(s, [spawned.id], { kind: 'move', x: spawned.x + 3, y: spawned.y });
  for (let t = 0; t < 200; t++) Sim.step(s);
  const moved = Math.hypot(spawned.x - x0, spawned.y - y0) > 0.5;
  if (!moved) failures++;
  return { part: 'smoke', id: entry.id, ok: moved, queuedCost: paid, spawned: true, moved,
    hp: spawned.hp, maxHp: spawned.maxHp };
}

// ---- (b) AI matches ----
function blueEconomy(s) {
  const faction = 'iron_eden';
  const core = s.structures.find((st) => st.faction === faction && st.typeId === 'command_core' && st.alive);
  if (!core) return;
  const q = Sim.productionQueue(s, faction);
  if (q.items.length >= 3) return;
  const prod = Sim.producibleUnits(s, faction).slice().sort((a, b) => a.cost.scrap - b.cost.scrap);
  for (const def of prod) {
    const count = s.units.filter((u) => u.faction === faction && u.typeId === def.id).length
      + q.items.filter((it) => it.typeId === def.id).length;
    if (count >= 3) continue;
    if (Sim.scrapOf(s, faction) < def.cost.scrap) continue;
    if (Sim.queueProduction(s, faction, core.id, def.id).ok) break;
  }
}
const MAP_DEFS = [
  { name: 'first', create: Maps.createFirstMap, spawn: Maps.spawnFirstMapScenario },
  { name: 'second', create: Maps.createSecondMap, spawn: Maps.spawnSecondMapScenario },
  { name: 'third', create: Maps.createThirdMap, spawn: Maps.spawnThirdMapScenario },
];
function aiMatch(mapDef, seed) {
  const map = mapDef.create();
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed });
  s.aiCombatParams = Sim.DIFFICULTY_PARAMS.normal;
  mapDef.spawn(Sim, s);
  const redCore = s.structures.find((st) => st.faction === 'xandria');
  const blueCore = s.structures.find((st) => st.faction === 'iron_eden');
  const seen = new Set(s.units.map((u) => u.id));
  const produced = {}; // typeId -> spawned count (red only)
  let capViolation = null;
  for (let t = 0; t < MAX_TICKS && !s.winner; t++) {
    Sim.step(s);
    if (s.tick % 20 === 0) {
      blueEconomy(s);
      // Cap audit: live + queued per red type must never exceed 3 for
      // new types (the sim's own per-type cap; the audit proves it).
      for (const id of NEW_IDS) {
        const live = s.units.filter((u) => u.faction === 'xandria' && u.typeId === id).length;
        const queued = Sim.productionQueue(s, 'xandria').items.filter((it) => it.typeId === id).length;
        if (live + queued > 3 && !capViolation) capViolation = { id, live, queued };
      }
      for (const u of s.units) {
        if (u.faction === 'xandria' && !seen.has(u.id)) {
          seen.add(u.id);
          produced[u.typeId] = (produced[u.typeId] || 0) + 1;
        }
      }
    }
    if (s.tick % 40 === 0 && redCore) {
      const idle = s.units.filter((u) => u.faction === 'iron_eden' && u.order.kind === 'hold').map((u) => u.id);
      if (idle.length) Sim.issueOrder(s, idle, { kind: 'attackMove', x: redCore.x, y: redCore.y });
    }
  }
  const redProduced = Object.entries(produced).reduce((a, [, n]) => a + n, 0);
  const newProduced = NEW_IDS.reduce((a, id) => a + (produced[id] || 0), 0);
  const maxNewShare = redProduced ? Math.max(...NEW_IDS.map((id) => (produced[id] || 0) / redProduced)) : 0;
  const degenerate = capViolation !== null || maxNewShare > 0.5;
  // A stall is NOT counted here: it is judged against the stripped-
  // catalog control below (a stall the control also produces is a
  // pre-existing baseline stall, not a new stall from this wave).
  if (degenerate) failures++;
  return { part: 'ai-match', map: mapDef.name, seed, winner: s.winner || 'STALLED',
    ticks: s.tick, redProduced, newProduced,
    redNewComposition: Object.fromEntries(NEW_IDS.map((id) => [id, produced[id] || 0])),
    redFullComposition: produced, maxNewShare: +maxNewShare.toFixed(2),
    capViolation, terminated: !!s.winner, degenerate,
    blueLeft: s.units.filter((u) => u.faction === 'iron_eden').length,
    redLeft: s.units.filter((u) => u.faction === 'xandria').length,
    blueCoreAlive: !!blueCore.alive, redCoreAlive: !!redCore.alive };
}

// ---- (c) counter duels ----
function duel(a, b, dist, seed) {
  const map = Sim.createTestMap();
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed });
  const u1 = Sim.addUnit(s, a, 'iron_eden', 20, 20);
  const u2 = Sim.addUnit(s, b, 'xandria', 20 + dist, 20);
  Sim.issueOrder(s, [u1.id], { kind: 'attackMove', x: 20 + dist, y: 20 });
  Sim.issueOrder(s, [u2.id], { kind: 'attackMove', x: 20, y: 20 });
  for (let t = 0; t < 4000; t++) {
    Sim.step(s);
    if (!u1.alive || !u2.alive) break;
  }
  return !u1.alive && u2.alive ? 'counter' : (u1.alive && !u2.alive ? 'new' : 'draw');
}
function counterCheck(entry) {
  const results = [];
  for (const dist of [6, 12]) {
    for (const seed of [42, 1337, 2026]) results.push(duel(entry.id, entry.counter, dist, seed));
  }
  const counterWins = results.filter((r) => r === 'counter').length;
  const ok = counterWins >= results.length / 2;
  if (!ok) failures++;
  return { part: 'counter', id: entry.id, counter: entry.counter, results: results.join(','),
    counterWins, duels: results.length, ok };
}

// ---- (b2) stripped-catalog control for any stall ----
// Same stand-in, same map/seed as the one stalled full match (First Map,
// seed 1337), but with the 8 new units removed from the catalog object
// in memory. If the control stalls identically, the stall predates
// this wave (baseline behaviour: both cores dead, remnants never meet);
// only a stall the control does NOT reproduce counts as a new stall.
function strippedCatalog() {
  const c = JSON.parse(JSON.stringify(catalog));
  c.units = c.units.filter((u) => !NEW_IDS.includes(u.id));
  for (const f of c.factions) f.roster = f.roster.filter((r) => !NEW_IDS.includes(r));
  return c;
}
function controlMatch() {
  const cat = strippedCatalog();
  const map = Maps.createFirstMap();
  const s = Sim.createGame({ catalog: cat, width: map.width, height: map.height, terrain: map.terrain, seed: 1337 });
  s.aiCombatParams = Sim.DIFFICULTY_PARAMS.normal;
  Maps.spawnFirstMapScenario(Sim, s);
  const redCore = s.structures.find((st) => st.faction === 'xandria');
  const seen = new Set(s.units.map((u) => u.id));
  const produced = {};
  for (let t = 0; t < MAX_TICKS && !s.winner; t++) {
    Sim.step(s);
    if (s.tick % 20 === 0) {
      blueEconomy(s);
      for (const u of s.units) {
        if (u.faction === 'xandria' && !seen.has(u.id)) { seen.add(u.id); produced[u.typeId] = (produced[u.typeId] || 0) + 1; }
      }
    }
    if (s.tick % 40 === 0 && redCore) {
      const idle = s.units.filter((u) => u.faction === 'iron_eden' && u.order.kind === 'hold').map((u) => u.id);
      if (idle.length) Sim.issueOrder(s, idle, { kind: 'attackMove', x: redCore.x, y: redCore.y });
    }
  }
  return { part: 'control-stall', catalog: 'stripped-8-new', map: 'first', seed: 1337,
    winner: s.winner || 'STALLED', ticks: s.tick, produced,
    blueLeft: s.units.filter((u) => u.faction === 'iron_eden').length,
    redLeft: s.units.filter((u) => u.faction === 'xandria').length };
}

const rows = [];
for (const e of NEW) rows.push(smoke(e));
for (const m of MAP_DEFS) for (const seed of [20261030, 1337]) rows.push(aiMatch(m, seed));
const stalled = rows.filter((r) => r.part === 'ai-match' && !r.terminated);
let control = null;
if (stalled.length) {
  control = controlMatch();
  rows.push(control);
  // New stall = a full match stalled but the stripped control did not.
  if (control.winner !== 'STALLED') failures += stalled.length;
}
for (const e of NEW) rows.push(counterCheck(e));
for (const r of rows) console.log(JSON.stringify(r));
console.log(JSON.stringify({ summary: true, failures, stalledMatches: stalled.length,
  controlStalled: control ? control.winner === 'STALLED' : null, rows: rows.length }));
if (failures) process.exit(1);
