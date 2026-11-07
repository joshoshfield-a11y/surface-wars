/* Twin-Stick Phase B: hero-on vs hero-off headless comparison.
   Same stand-in as scripts/ai-match.js (AI-red vs scripted blue
   attack-move + mirrored blue economy, no blue salvage) so the two
   modes differ ONLY by the hero. In the harness the hero fights under
   RTS orders like every other blue unit: the harness cannot twin-
   stick, and the hero does NOT redeploy on death here (Drop Back In
   is a shell button; the sim has no redeploy). So this measures the
   loadout/stat swing of the hero, NOT twin-stick skill and NOT
   reserve play. A hero-on sweep (hero-on wins every match the
   stand-in wins none of) must NOT freeze the phase: retune by
   lowering caps, never by buffing the opponent.
   Usage: node scripts/hero-match.js [first|second]
   With no args, runs both maps, hero-on and hero-off each. */
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');
const Maps = require('../game/maps.js');
const Weapons = require('../game/weapons.js');
const Hero = require('../game/hero.js');

const MAX_TICKS = 15000; // 750 sim seconds, same cap as ai-match.js
const HERO_BASE = { hp: 200, armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55, movementClass: 'ground' };

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

function runMatch(mapName, heroOn) {
  const map = mapName === 'second' ? Maps.createSecondMap() : Maps.createFirstMap();
  const seed = process.env.SEED ? parseInt(process.env.SEED, 10) : 20261030;
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed });
  if (mapName === 'second') Maps.spawnSecondMapScenario(Sim, s);
  else Maps.spawnFirstMapScenario(Sim, s);
  let heroId = 0, heroDeaths = 0, heroAlive = false;
  if (heroOn) {
    Hero.applyRoster(s);
    const core = s.structures.find((st) => st.faction === 'iron_eden' && st.typeId === 'command_core');
    const pos = Sim.spawnPosition(s, core, 'ground');
    const st = Weapons.heroStats(Weapons.DEFAULT_LOADOUT, HERO_BASE);
    const hu = Sim.addCustomUnit(s, { typeId: 'lancer_mech', faction: 'iron_eden',
      x: pos.x, y: pos.y, hp: st.maxHp, maxHp: st.maxHp, armor: st.armor, speed: st.speed,
      vision: st.vision, radius: st.radius, movementClass: 'ground', weapons: st.weapons,
      isHero: true, costScrap: 380 });
    heroId = hu.id; heroAlive = true;
  }
  const redCore = s.structures.find((st) => st.faction === 'xandria');
  let firstAttackTick = null, maxAttackers = 0;
  for (let t = 0; t < MAX_TICKS && !s.winner; t++) {
    Sim.step(s);
    if (heroOn && heroAlive && !s.units.some((u) => u.id === heroId)) { heroAlive = false; heroDeaths++; }
    if (s.tick % 20 === 0) blueEconomy(s);
    if (s.tick % 40 === 0) {
      const idle = s.units.filter((u) => u.faction === 'iron_eden' && u.order.kind === 'hold').map((u) => u.id);
      if (idle.length) Sim.issueOrder(s, idle, { kind: 'attackMove', x: redCore.x, y: redCore.y });
    }
    if (s.aiCombat && s.aiCombat.mode === 'attack' && firstAttackTick === null) firstAttackTick = s.tick;
    const attackers = s.units.filter((u) => u.faction === 'xandria' && u.order.kind === 'attackMove').length;
    if (attackers > maxAttackers) maxAttackers = attackers;
  }
  const redLeft = s.units.filter((u) => u.faction === 'xandria').length
    + s.structures.filter((st) => st.faction === 'xandria').length;
  const blueLeft = s.units.filter((u) => u.faction === 'iron_eden').length
    + s.structures.filter((st) => st.faction === 'iron_eden').length;
  return { map: mapName, hero: heroOn ? 'on' : 'off', winner: s.winner || 'STALLED',
    ticks: s.tick, simSeconds: (s.tick / 20).toFixed(0), redLeft, blueLeft,
    firstAttackTick, maxAttackers, heroDeaths, wrecksCreated: s.wrecksCreated };
}

const onlyMap = process.argv[2];
const maps = onlyMap ? [onlyMap] : ['first', 'second'];
const rows = [];
for (const m of maps) { rows.push(runMatch(m, false)); rows.push(runMatch(m, true)); }
for (const r of rows) console.log(JSON.stringify(r));
