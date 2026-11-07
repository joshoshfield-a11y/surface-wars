/* WAVE 6 (BETA-12H): red-AI fielding investigation (Wave 2 exclusion).
   Question: under what conditions does the shipped cheapest-first
   red AI field the new Xandria types (needlewing, longsight,
   javelin, raptor) in a match?
   Parts:
   (S) Saturation mechanism: a state with 3 live of EVERY cheaper
       Xandria producible type (80/80/90/110/120 + fast_raider 140)
       and a large red scrap bank. If the rule is cheapest-first
       below cap, the next queue must be needlewing (catalog order
       within the 140 tier: fast_raider, needlewing, longsight).
   (R) Shipped-rule matches: scripted blue stand-in (attack-move
       idle units every 40 ticks + mirrored cheapest-first blue
       economy, no blue salvage) vs red AI, Normal/Easy/Hard, all
       three maps, seeds 20261030/1337/42, cap 15000. Reports red
       production counts by type, max red live count, max red bank.
   (B) Rich-bank variant: same as (R) on First Map / Normal /
       seed 20261030, but red scrap topped up to 5000 every 500
       ticks — does bank size alone change ordering? (It must not:
       the rule sorts by cost, not by bank.)
   (P) Passive-blue variant: blue produces but never attacks
       (no attack-move orders), First Map, Normal + Easy, seed
       20261030 — the most favourable shipped-rule case for red
       accumulation (red marches on an idle base).
   No game file is edited. Exit 0 always; this is investigation,
   not a gate. Usage: node scripts/beta12h-ai-field.js */
'use strict';
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');
const Maps = require('../game/maps.js');

const MAX_TICKS = 15000;
const NEW = ['needlewing', 'longsight', 'javelin', 'raptor'];
const CHEAPER = ['scout_buggy', 'sensor_drone', 'combat_drone', 'radar_scout', 'vespid_scout', 'fast_raider'];

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
function redProduced(s) {
  // Production queue items already spawned count via units; queued
  // items are tracked by the harness (see runMatch) — here we count
  // live red units by type plus queue contents at read time.
  const counts = {};
  for (const u of s.units) if (u.faction === 'xandria') counts[u.typeId] = (counts[u.typeId] || 0) + 1;
  const q = Sim.productionQueue(s, 'xandria');
  for (const it of q.items) counts['queued:' + it.typeId] = (counts['queued:' + it.typeId] || 0) + 1;
  return counts;
}
// ---- (S) saturation ----
function saturation() {
  const map = Maps.createFirstMap();
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 20261030 });
  Maps.spawnFirstMapScenario(Sim, s);
  // Remove the starting red army so live counts are exactly the
  // saturation set; keep both cores alive (economy needs a core).
  s.units = s.units.filter((u) => u.faction !== 'xandria');
  const spots = [];
  for (let x = 60; x < 78; x += 2) for (let y = 10; y < 42; y += 2) spots.push([x, y]);
  let si = 0;
  for (const typeId of CHEAPER) for (let k = 0; k < 3; k++) {
    const [x, y] = spots[si++];
    Sim.addUnit(s, typeId, 'xandria', x, y);
  }
  s.scrap['xandria'] = 5000;
  const before = Sim.productionQueue(s, 'xandria').items.map((i) => i.typeId);
  for (let t = 0; t < 200 && !s.winner; t++) Sim.step(s);
  const q = Sim.productionQueue(s, 'xandria').items.map((i) => i.typeId);
  const liveNew = {};
  for (const u of s.units) if (u.faction === 'xandria' && NEW.indexOf(u.typeId) !== -1) liveNew[u.typeId] = (liveNew[u.typeId] || 0) + 1;
  console.log(JSON.stringify({ part: 'S-saturation', queueBefore: before, queueAfter200: q,
    liveNew, redLive: s.units.filter((u) => u.faction === 'xandria').length }));
}
function runMatch(mapName, seed, diff, opts) {
  const map = mapName === 'first' ? Maps.createFirstMap()
    : mapName === 'second' ? Maps.createSecondMap() : Maps.createThirdMap();
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed });
  if (mapName === 'second') Maps.spawnSecondMapScenario(Sim, s);
  else if (mapName === 'third') Maps.spawnThirdMapScenario(Sim, s);
  else Maps.spawnFirstMapScenario(Sim, s);
  if (Sim.DIFFICULTY_PARAMS && diff) s.aiCombatParams = Sim.DIFFICULTY_PARAMS[diff];
  const redCore = s.structures.find((st) => st.faction === 'xandria');
  // Track every unit the red AI queues: wrap queueProduction is not
  // possible (internal), so count spawns: record each red unit id
  // ever seen, by type, as it appears (spawns + scenario starts are
  // excluded by snapshotting scenario ids first).
  const scenarioRed = new Set(s.units.filter((u) => u.faction === 'xandria').map((u) => u.id));
  const spawned = {};
  let maxRedLive = 0, maxRedBank = 0;
  for (let t = 0; t < MAX_TICKS && !s.winner; t++) {
    Sim.step(s);
    for (const u of s.units) {
      if (u.faction === 'xandria' && !scenarioRed.has(u.id) && !u._betaCounted) { u._betaCounted = true; spawned[u.typeId] = (spawned[u.typeId] || 0) + 1; }
    }
    const live = s.units.filter((u) => u.faction === 'xandria').length;
    if (live > maxRedLive) maxRedLive = live;
    const bank = Sim.scrapOf(s, 'xandria');
    if (bank > maxRedBank) maxRedBank = bank;
    if (opts && opts.richBank && s.tick % 500 === 0) s.scrap['xandria'] = 5000;
    if (s.tick % 20 === 0) blueEconomy(s);
    if (!(opts && opts.passiveBlue) && s.tick % 40 === 0) {
      const idle = s.units.filter((u) => u.faction === 'iron_eden' && u.order.kind === 'hold').map((u) => u.id);
      if (idle.length) Sim.issueOrder(s, idle, { kind: 'attackMove', x: redCore.x, y: redCore.y });
    }
  }
  const newSpawned = {};
  for (const id of NEW) if (spawned[id]) newSpawned[id] = spawned[id];
  const blueLeft = s.units.filter((u) => u.faction === 'iron_eden').length
    + s.structures.filter((st) => st.faction === 'iron_eden').length;
  const redLeft = s.units.filter((u) => u.faction === 'xandria').length
    + s.structures.filter((st) => st.faction === 'xandria').length;
  return { part: opts && opts.richBank ? 'B-rich-bank' : opts && opts.passiveBlue ? 'P-passive-blue' : 'R-shipped',
    map: mapName, seed, diff: diff || 'normal', winner: s.winner || 'STALLED', ticks: s.tick,
    redSpawned: spawned, newSpawned, newTotal: Object.values(newSpawned).reduce((a, b) => a + b, 0),
    maxRedLive, maxRedBank, blueLeft, redLeft };
}
saturation();
const rows = [];
for (const mapName of ['first', 'second', 'third']) for (const seed of [20261030, 1337, 42])
  rows.push(runMatch(mapName, seed, 'normal', {}));
rows.push(runMatch('first', 20261030, 'easy', {}));
rows.push(runMatch('first', 20261030, 'hard', {}));
rows.push(runMatch('first', 20261030, 'normal', { richBank: true }));
rows.push(runMatch('first', 20261030, 'normal', { passiveBlue: true }));
rows.push(runMatch('first', 20261030, 'easy', { passiveBlue: true }));
for (const r of rows) console.log(JSON.stringify(r));
const totalNew = rows.reduce((a, r) => a + r.newTotal, 0);
console.log(JSON.stringify({ summary: 'ai-field', matches: rows.length, totalNewSpawned: totalNew,
  maxRedLiveOverall: Math.max.apply(null, rows.map((r) => r.maxRedLive)),
  maxRedBankOverall: Math.max.apply(null, rows.map((r) => r.maxRedBank)) }));
