/* WEAPONS-12H Wave 1: hero-loadout match harness.
   Same stand-in as scripts/hero-match.js (AI-red vs scripted blue
   attack-move + mirrored blue economy, no blue salvage) so loadouts
   differ ONLY by the hero's weapons. The hero fights under RTS
   orders like every other blue unit: the harness cannot twin-stick,
   and the hero does NOT redeploy on death here (Drop Back In is a
   shell button; the sim has no redeploy). So this measures the
   loadout swing, NOT twin-stick skill and NOT reserve play.
   Each loadout runs on First Map and Twin Bridges at the fixed seed
   20261030, the same seed hero-match.js uses by default.
   A SWEEP is a tuned loadout winning every map the default loadout
   loses; per the freeze rule a sweep means the tuned loadout must
   be retuned DOWN, never the opponent buffed. Exit code 1 on sweep.
   Usage: node scripts/weapons12h-match.js
   Output: one JSON row per match, then a JSON summary line. */
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');
const Maps = require('../game/maps.js');
const Weapons = require('../game/weapons.js');
const Hero = require('../game/hero.js');

const MAX_TICKS = 15000; // 750 sim seconds, same cap as hero-match.js
const SEED = 20261030;
const HERO_BASE = { hp: 200, armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55, movementClass: 'ground' };

function baseLoadout() {
  return { primary: null, secondary: null, armor: null, mobility: null,
    reactor: null, sensor: null, ability: null };
}
function lo(primary, secondary) {
  const l = baseLoadout(); l.primary = primary; l.secondary = secondary || null; return l;
}
// Default first, then one loadout per tuned primary, then the four
// tuned-secondary combos (secondary tier <= primary tier, per the
// validator: T3 secondaries pair with the T3 Hailstorm, T2
// secondaries pair with the T2 Widowmaker).
const LOADOUTS = [
  { name: 'default', loadout: Weapons.DEFAULT_LOADOUT },
  { name: 'scrapstorm', loadout: lo('nw_scrapstorm_rotary_gun') },
  { name: 'hailstorm', loadout: lo('nw_hailstorm_minigun') },
  { name: 'widowmaker', loadout: lo('nw_widowmaker_lmg') },
  { name: 'sawtooth', loadout: lo('nw_sawtooth_repeater') },
  { name: 'thunderclap', loadout: lo('nw_thunderclap_autocannon') },
  { name: 'double-feed', loadout: lo('nw_double_feed') },
  { name: 'slugger', loadout: lo('nw_slugger_cannon') },
  { name: 'bonecrusher', loadout: lo('nw_bonecrusher') },
  { name: 'meltdown', loadout: lo('nw_meltdown_cannon') },
  { name: 'helios', loadout: lo('nw_helios_projector') },
  { name: 'horizon', loadout: lo('nw_horizon_cutter') },
  { name: 'capacitor', loadout: lo('nw_capacitor_rifle') },
  { name: 'arc-thrower', loadout: lo('nw_arc_thrower') },
  { name: 'furnace-shotgun', loadout: lo('nw_furnace_shotgun') },
  { name: 'hailstorm+guillotine', loadout: lo('nw_hailstorm_minigun', 'nw_guillotine_arm') },
  { name: 'hailstorm+phase-cutter', loadout: lo('nw_hailstorm_minigun', 'nw_phase_cutter') },
  { name: 'widowmaker+machete', loadout: lo('nw_widowmaker_lmg', 'nw_plasma_machete') },
  { name: 'widowmaker+bellringer', loadout: lo('nw_widowmaker_lmg', 'nw_bellringer') }
];

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

function runMatch(mapName, entry) {
  const v = Weapons.validateLoadout(entry.loadout,
    { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: 3, levelBand: true });
  if (!v.ok) throw new Error('invalid 12h loadout ' + entry.name + ': ' + v.reasons.join(' '));
  const map = mapName === 'second' ? Maps.createSecondMap() : Maps.createFirstMap();
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: SEED });
  if (mapName === 'second') Maps.spawnSecondMapScenario(Sim, s);
  else Maps.spawnFirstMapScenario(Sim, s);
  Hero.applyRoster(s);
  const core = s.structures.find((st) => st.faction === 'iron_eden' && st.typeId === 'command_core');
  const pos = Sim.spawnPosition(s, core, 'ground');
  const st = Weapons.heroStats(entry.loadout, HERO_BASE);
  const hu = Sim.addCustomUnit(s, { typeId: 'lancer_mech', faction: 'iron_eden',
    x: pos.x, y: pos.y, hp: st.maxHp, maxHp: st.maxHp, armor: st.armor, speed: st.speed,
    vision: st.vision, radius: st.radius, movementClass: 'ground', weapons: st.weapons,
    isHero: true, costScrap: 380 });
  const heroId = hu.id;
  const redCore = s.structures.find((st2) => st2.faction === 'xandria');
  let heroDeaths = 0, heroAlive = true;
  for (let t = 0; t < MAX_TICKS && !s.winner; t++) {
    Sim.step(s);
    if (heroAlive && !s.units.some((u) => u.id === heroId)) { heroAlive = false; heroDeaths++; }
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
  return { loadout: entry.name, map: mapName, winner: s.winner || 'STALLED',
    ticks: s.tick, redLeft, blueLeft, heroSurvived: heroAlive, heroDeaths,
    wrecksCreated: s.wrecksCreated };
}

const rows = [];
for (const entry of LOADOUTS) {
  rows.push(runMatch('first', entry));
  rows.push(runMatch('second', entry));
}
for (const r of rows) console.log(JSON.stringify(r));
// Sweep analysis: a tuned loadout sweeps if it wins every map the
// default loadout loses (draws and stalls count as not-wins for both).
const byLoadout = {};
for (const r of rows) (byLoadout[r.loadout] = byLoadout[r.loadout] || {})[r.map] = r.winner;
const defaultLostMaps = ['first', 'second'].filter((m) => byLoadout.default[m] !== 'iron_eden');
const sweeps = [];
for (const entry of LOADOUTS) {
  if (entry.name === 'default') continue;
  if (defaultLostMaps.length > 0
    && defaultLostMaps.every((m) => byLoadout[entry.name][m] === 'iron_eden')) sweeps.push(entry.name);
}
const wins = {}, draws = {}, losses = {};
for (const entry of LOADOUTS) {
  const rs = rows.filter((r) => r.loadout === entry.name);
  wins[entry.name] = rs.filter((r) => r.winner === 'iron_eden').length;
  draws[entry.name] = rs.filter((r) => r.winner === 'draw').length;
  losses[entry.name] = rs.filter((r) => r.winner !== 'iron_eden' && r.winner !== 'draw').length;
}
const summary = { seed: SEED, maxTicks: MAX_TICKS, wins, draws, losses,
  defaultLostMaps, sweeps, freezeRuleViolated: sweeps.length > 0 };
console.log(JSON.stringify(summary));
if (sweeps.length > 0) {
  console.error('FREEZE RULE: sweep detected for: ' + sweeps.join(', ') + ' — retune down, do not buff the opponent.');
  process.exit(1);
}
