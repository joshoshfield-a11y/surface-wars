/* Headless match harness for Generation Cycle 2 variant evaluation.
   AI-red (one behaviour variant) vs a scripted blue stand-in: the old
   browser behaviour (idle blue units attack-move to the red core every
   40 ticks) plus a mirrored blue economy (cheapest affordable, queue
   cap 3, per-type cap 3 — the same rules as runAiEconomy, written
   here because that function is xandria-only). The blue stand-in
   does NOT salvage, so red has a small edge in these matches; they
   compare AI behaviours against each other, they are not a balance
   verdict against a human.
   Usage: node scripts/ai-match.js [variant] [map]
   Variants: balanced (shipped defaults), rush, turtle. Maps: first, second.
   With no args, runs all 3 variants x both maps and prints a table. */
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');
const Maps = require('../game/maps.js');

const VARIANTS = {
  balanced: {},
  rush: { gatherCount: 2, attackFloor: 2, defendCount: 99 },
  turtle: { gatherCount: 14, attackFloor: 10, defendCount: 1, defendRange: 35 },
};
const MAX_TICKS = 15000; // 750 sim seconds

function blueEconomy(s) {
  const faction = 'iron_eden';
  const core = s.structures.find((st) => st.faction === faction && st.typeId === 'command_core' && st.alive);
  if (!core) return;
  const q = Sim.productionQueue(s, faction);
  if (q.items.length >= 3) return;
  const prod = Sim.producibleUnits(s, faction).slice().sort((a, b) => a.cost.scrap - b.cost.scrap);
  for (const def of prod) {
    let count = s.units.filter((u) => u.faction === faction && u.typeId === def.id).length
      + q.items.filter((it) => it.typeId === def.id).length;
    if (count >= 3) continue;
    if (Sim.scrapOf(s, faction) < def.cost.scrap) continue;
    if (Sim.queueProduction(s, faction, core.id, def.id).ok) break;
  }
}

function runMatch(variantName, mapName) {
  const map = mapName === 'second' ? Maps.createSecondMap() : Maps.createFirstMap();
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 20261030 });
  if (mapName === 'second') Maps.spawnSecondMapScenario(Sim, s);
  else Maps.spawnFirstMapScenario(Sim, s);
  s.aiCombatParams = VARIANTS[variantName];
  const redCore = s.structures.find((st) => st.faction === 'xandria');
  let firstAttackTick = null, maxAttackers = 0, maxRedCombat = 0, modes = {};
  for (let t = 0; t < MAX_TICKS && !s.winner; t++) {
    Sim.step(s);
    if (s.tick % 20 === 0) blueEconomy(s);
    if (s.tick % 40 === 0) {
      const idle = s.units.filter((u) => u.faction === 'iron_eden' && u.order.kind === 'hold').map((u) => u.id);
      if (idle.length) Sim.issueOrder(s, idle, { kind: 'attackMove', x: redCore.x, y: redCore.y });
    }
    if (s.aiCombat) {
      modes[s.aiCombat.mode] = (modes[s.aiCombat.mode] || 0) + 1;
      if (s.aiCombat.mode === 'attack' && firstAttackTick === null) firstAttackTick = s.tick;
    }
    const attackers = s.units.filter((u) => u.faction === 'xandria' && u.order.kind === 'attackMove').length;
    if (attackers > maxAttackers) maxAttackers = attackers;
    const combat = s.units.filter((u) => u.faction === 'xandria' && u.weapons && u.weapons.length).length;
    if (combat > maxRedCombat) maxRedCombat = combat;
  }
  const fellBack = s.units.filter((u) => u.faction === 'xandria' && u.aiFellBack).length;
  const redLeft = s.units.filter((u) => u.faction === 'xandria').length
    + s.structures.filter((st) => st.faction === 'xandria').length;
  const blueLeft = s.units.filter((u) => u.faction === 'iron_eden').length
    + s.structures.filter((st) => st.faction === 'iron_eden').length;
  return {
    variant: variantName, map: mapName,
    winner: s.winner || 'STALLED (no winner)',
    ticks: s.tick, simSeconds: (s.tick / 20).toFixed(0),
    redLeft, blueLeft, firstAttackTick, maxAttackers, maxRedCombat, fellBack,
    modes, redScrap: Sim.scrapOf(s, 'xandria'), wrecksCreated: s.wrecksCreated,
  };
}

const onlyVariant = process.argv[2], onlyMap = process.argv[3];
const variants = onlyVariant ? [onlyVariant] : Object.keys(VARIANTS);
const maps = onlyMap ? [onlyMap] : ['first', 'second'];
for (const v of variants) for (const m of maps) {
  const r = runMatch(v, m);
  console.log(JSON.stringify(r));
}
