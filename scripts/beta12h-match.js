/* WAVE 6 (BETA-12H): multi-seed balance checks for the items Waves 1/4
   left as single-seed.
   (a) Wave 1 range-flipper loadouts (Meltdown, Helios, Horizon,
       Capacitor, Arc-Thrower) vs default, First Map + Twin Bridges.
   (b) Wave 4 premium packs vs default, same maps, packs run at the
       level that first unlocks them (Bulwark 1, Ember/Gilded 4,
       Storm 7); default runs at level 1.
   (c) Sweep definition (Wave 1, unchanged): a loadout/pack sweeps if
       it wins EVERY map the default loadout fails to win at THAT
       seed (loss, draw, or stall all count as default-not-win).
       A single-seed flip is NOT a retune trigger; only a multi-seed
       sweep is. This script reports; it never retunes (exit 0
       always — the retune decision lives in BETA-12H-REPORT.md).
   Stand-in: same as weapons12h/currency12h (AI-red vs scripted blue
   attack-move every 40 ticks + mirrored cheapest-first blue economy,
   no blue salvage, hero under RTS orders, no redeploy). Cap 15000.
   Usage: node scripts/beta12h-match.js [seed ...]
   Default seeds: 20261030 1337 42. Output: JSON rows, then a JSON
   summary per seed + sweep table. */
'use strict';
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');
const Maps = require('../game/maps.js');
const Weapons = require('../game/weapons.js');
const Hero = require('../game/hero.js');
const Curr = require('../game/currency.js');

const MAX_TICKS = 15000;
const SEEDS = process.argv.slice(2).map(Number).filter((n) => Number.isFinite(n));
if (!SEEDS.length) SEEDS.push(20261030, 1337, 42);
const HERO_BASE = { hp: 200, armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55, movementClass: 'ground' };
function baseLoadout() {
  return { primary: null, secondary: null, armor: null, mobility: null,
    reactor: null, sensor: null, ability: null };
}
function lo(primary, secondary) {
  const l = baseLoadout(); l.primary = primary; l.secondary = secondary || null; return l;
}
function packLevel(pack) {
  let maxTier = 1;
  const l = pack.loadout;
  ['primary', 'secondary', 'armor', 'mobility', 'reactor', 'sensor'].forEach((slot) => {
    if (!l[slot]) return;
    const r = Weapons.rowById(l[slot]) || Weapons.gearById(l[slot]);
    if (r && r.tier > maxTier) maxTier = r.tier;
  });
  return maxTier >= 3 ? 7 : (maxTier === 2 ? 4 : 1);
}
const LOADOUTS = [
  { name: 'default', loadout: Weapons.DEFAULT_LOADOUT, level: 1, kind: 'baseline' },
  { name: 'meltdown', loadout: lo('nw_meltdown_cannon'), level: 1, kind: 'flipper' },
  { name: 'helios', loadout: lo('nw_helios_projector'), level: 1, kind: 'flipper' },
  { name: 'horizon', loadout: lo('nw_horizon_cutter'), level: 1, kind: 'flipper' },
  { name: 'capacitor', loadout: lo('nw_capacitor_rifle'), level: 1, kind: 'flipper' },
  { name: 'arc-thrower', loadout: lo('nw_arc_thrower'), level: 1, kind: 'flipper' },
].concat(Curr.PACKS.map((p) => ({ name: p.id, loadout: p.loadout, level: packLevel(p), kind: 'pack' })));

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
function runMatch(seed, mapName, entry) {
  const v = Weapons.validateLoadout(entry.loadout,
    { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: 3, levelBand: true,
      premiumOwnedIds: Weapons.PREMIUM_ROW_IDS });
  if (!v.ok) throw new Error('invalid beta12h loadout ' + entry.name + ': ' + v.reasons.join(' '));
  const map = mapName === 'second' ? Maps.createSecondMap() : Maps.createFirstMap();
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed });
  if (mapName === 'second') Maps.spawnSecondMapScenario(Sim, s);
  else Maps.spawnFirstMapScenario(Sim, s);
  Hero.applyRoster(s);
  const core = s.structures.find((st) => st.faction === 'iron_eden' && st.typeId === 'command_core');
  const pos = Sim.spawnPosition(s, core, 'ground');
  const st = Weapons.heroStats(entry.loadout, HERO_BASE, { level: entry.level, skills: [] });
  const hu = Sim.addCustomUnit(s, { typeId: 'lancer_mech', faction: 'iron_eden',
    x: pos.x, y: pos.y, hp: st.maxHp, maxHp: st.maxHp, armor: st.armor, speed: st.speed,
    vision: st.vision, radius: st.radius, movementClass: 'ground', weapons: st.weapons,
    isHero: true, costScrap: 380 });
  const heroId = hu.id;
  const redCore = s.structures.find((st2) => st2.faction === 'xandria');
  let heroAlive = true;
  for (let t = 0; t < MAX_TICKS && !s.winner; t++) {
    Sim.step(s);
    if (heroAlive && !s.units.some((u) => u.id === heroId)) heroAlive = false;
    if (s.tick % 20 === 0) blueEconomy(s);
    if (s.tick % 40 === 0) {
      const idle = s.units.filter((u) => u.faction === 'iron_eden' && u.order.kind === 'hold').map((u) => u.id);
      if (idle.length) Sim.issueOrder(s, idle, { kind: 'attackMove', x: redCore.x, y: redCore.y });
    }
  }
  const redLeft = s.units.filter((u) => u.faction === 'xandria').length
    + s.structures.filter((st2) => st2.faction === 'xandria').length;
  const blueLeft = s.units.filter((u) => u.faction === 'iron_eden').length
    + s.structures.filter((st2) => st2.faction === 'iron_eden').length;
  return { seed, loadout: entry.name, kind: entry.kind, map: mapName,
    winner: s.winner || 'STALLED', ticks: s.tick, redLeft, blueLeft,
    heroSurvived: heroAlive, wrecksCreated: s.wrecksCreated };
}
const rows = [];
for (const seed of SEEDS) for (const entry of LOADOUTS) {
  rows.push(runMatch(seed, 'first', entry));
  rows.push(runMatch(seed, 'second', entry));
}
for (const r of rows) console.log(JSON.stringify(r));
// Per-seed sweep analysis under the Wave 1 definition.
const sweepTable = {};
for (const seed of SEEDS) {
  const byLoadout = {};
  for (const r of rows.filter((x) => x.seed === seed)) (byLoadout[r.loadout] = byLoadout[r.loadout] || {})[r.map] = r.winner;
  const defaultLost = ['first', 'second'].filter((m) => byLoadout.default[m] !== 'iron_eden');
  const sweeps = [];
  for (const entry of LOADOUTS) {
    if (entry.name === 'default') continue;
    if (defaultLost.length > 0 && defaultLost.every((m) => byLoadout[entry.name][m] === 'iron_eden')) sweeps.push(entry.name);
  }
  sweepTable[seed] = { defaultLostMaps: defaultLost, sweeps };
}
const multiSeedSweeps = LOADOUTS.filter((e) => e.name !== 'default'
  && SEEDS.every((seed) => sweepTable[seed].sweeps.indexOf(e.name) !== -1)).map((e) => e.name);
console.log(JSON.stringify({ seeds: SEEDS, maxTicks: MAX_TICKS, perSeed: sweepTable,
  multiSeedSweeps, retuneTrigger: multiSeedSweeps.length > 0 }));
