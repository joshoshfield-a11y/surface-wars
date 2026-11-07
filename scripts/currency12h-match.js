/* WAVE 4 (CURRENCY-12H): earn -> spend -> equip logic + balance proof.
   Part A (pure logic, no sim): two match-end grants buy and equip a
   pack, a match start with it equipped marks it used, and refund is
   then blocked — the same transitions the store UI drives.
   Part B (sim matches): default loadout vs each premium pack
   loadout, on First Map and Twin Bridges at the fixed Wave 1 seed
   20261030, same stand-in as scripts/weapons12h-match.js (AI-red vs
   scripted blue attack-move + mirrored blue economy, no blue
   salvage, hero under RTS orders, no redeploy). Plus hero-off runs
   (original 10v10, no hero at all) on both maps for the hero-on vs
   hero-off comparison. A SWEEP is a premium pack winning every map
   the default loadout loses; per the freeze rule a sweep means the
   pack must be retuned DOWN — never an opponent buff, never a price
   hike as a substitute for a balance fix. Exit code 1 on sweep.
   Usage: node scripts/currency12h-match.js
   Output: JSON rows, then a JSON summary line. */
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');
const Maps = require('../game/maps.js');
const Weapons = require('../game/weapons.js');
const Hero = require('../game/hero.js');
const Prog = require('../game/progression.js');
const Curr = require('../game/currency.js');

const MAX_TICKS = 15000; // 750 sim seconds, same cap as weapons12h-match.js
const SEED = 20261030;
const HERO_BASE = { hp: 200, armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55, movementClass: 'ground' };

// ---- Part A: earn -> spend -> equip -> use -> refund blocked ----
function partA() {
  let w = Curr.defaultWallet();
  w = Curr.applyGrant(w, 'win', 4).wallet; // 160
  w = Curr.applyGrant(w, 'win', 10).wallet; // +220 = 380
  const buy = Curr.buyPack(w, 'pack_ember_line');
  if (!buy.ok) throw new Error('part A buy failed: ' + buy.reason);
  const eq = Curr.equipPack(buy.wallet, 'pack_ember_line');
  if (!eq.ok) throw new Error('part A equip failed: ' + eq.reason);
  const used = Curr.markPackUsed(eq.wallet, 'pack_ember_line');
  const refund = Curr.refundPack(used, 'pack_ember_line');
  console.log(JSON.stringify({ part: 'A-earn-spend-equip-use',
    earned: 380, balanceAfterBuy: buy.wallet.balance, equipped: eq.wallet.equipped,
    used: used.used, refundAfterUseOk: refund.ok, refundAfterUseReason: refund.reason }));
  // And the refund-before-use path on a second wallet.
  let w2 = Curr.defaultWallet();
  w2 = Curr.applyGrant(w2, 'win', 10).wallet;
  w2 = Curr.applyGrant(w2, 'draw', 10).wallet; // 380
  w2 = Curr.buyPack(w2, 'pack_bulwark_march').wallet; // 80
  w2 = Curr.equipPack(w2, 'pack_bulwark_march').wallet;
  const ref2 = Curr.refundPack(w2, 'pack_bulwark_march');
  console.log(JSON.stringify({ part: 'A-refund-before-use',
    refundOk: ref2.ok, balanceAfterRefund: ref2.wallet.balance, ownedAfterRefund: ref2.wallet.owned }));
}

// ---- Part B: sim matches ----
function baseLoadout() {
  return { primary: null, secondary: null, armor: null, mobility: null,
    reactor: null, sensor: null, ability: null };
}
function packLevel(pack) {
  // The hero level at which the pack is first fully equippable:
  // max tier in the loadout mapped through the tier bands.
  let maxTier = 1;
  const l = pack.loadout;
  ['primary', 'secondary', 'armor', 'mobility', 'reactor', 'sensor'].forEach((slot) => {
    if (!l[slot]) return;
    const r = Weapons.rowById(l[slot]) || Weapons.gearById(l[slot]);
    if (r && r.tier > maxTier) maxTier = r.tier;
  });
  return maxTier >= 3 ? 7 : (maxTier === 2 ? 4 : 1);
}
const LOADOUTS = [{ name: 'default', loadout: Weapons.DEFAULT_LOADOUT, level: 1 }]
  .concat(Curr.PACKS.map((p) => ({ name: p.id, loadout: p.loadout, level: packLevel(p) })));

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

function runMatch(mapName, entry, heroOn) {
  if (heroOn) {
    const v = Weapons.validateLoadout(entry.loadout,
      { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: 3, levelBand: true,
        premiumOwnedIds: Weapons.PREMIUM_ROW_IDS });
    if (!v.ok) throw new Error('invalid currency12h loadout ' + entry.name + ': ' + v.reasons.join(' '));
  }
  const map = mapName === 'second' ? Maps.createSecondMap() : Maps.createFirstMap();
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: SEED });
  if (mapName === 'second') Maps.spawnSecondMapScenario(Sim, s);
  else Maps.spawnFirstMapScenario(Sim, s);
  let heroId = null, heroAlive = true, heroDeaths = 0, heroKills = 0;
  if (heroOn) {
    Hero.applyRoster(s);
    const core = s.structures.find((st) => st.faction === 'iron_eden' && st.typeId === 'command_core');
    const pos = Sim.spawnPosition(s, core, 'ground');
    const st = Weapons.heroStats(entry.loadout, HERO_BASE, { level: entry.level, skills: [] });
    const hu = Sim.addCustomUnit(s, { typeId: 'lancer_mech', faction: 'iron_eden',
      x: pos.x, y: pos.y, hp: st.maxHp, maxHp: st.maxHp, armor: st.armor, speed: st.speed,
      vision: st.vision, radius: st.radius, movementClass: 'ground', weapons: st.weapons,
      isHero: true, costScrap: 380 });
    heroId = hu.id;
  }
  const redCore = s.structures.find((st2) => st2.faction === 'xandria');
  for (let t = 0; t < MAX_TICKS && !s.winner; t++) {
    Sim.step(s);
    if (heroOn) {
      if (heroAlive && !s.units.some((u) => u.id === heroId)) { heroAlive = false; heroDeaths++; }
      heroKills = s.heroXp ? s.heroXp.kills : 0;
    }
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
  const row = { loadout: entry.name, map: mapName, heroOn, winner: s.winner || 'STALLED',
    ticks: s.tick, redLeft, blueLeft, wrecksCreated: s.wrecksCreated };
  if (heroOn) {
    row.heroSurvived = heroAlive;
    row.heroDeaths = heroDeaths;
    row.heroKills = heroKills;
    // What this match would have paid in Salvage Credits at match end.
    const result = s.winner === 'draw' ? 'draw' : (s.winner === 'iron_eden' ? 'win' : 'loss');
    row.creditsEarned = Curr.grantForMatch(result, heroKills).total;
  }
  return row;
}

partA();
const rows = [];
for (const entry of LOADOUTS) {
  rows.push(runMatch('first', entry, true));
  rows.push(runMatch('second', entry, true));
}
rows.push(runMatch('first', { name: 'hero-off' }, false));
rows.push(runMatch('second', { name: 'hero-off' }, false));
for (const r of rows) console.log(JSON.stringify(r));
const byLoadout = {};
for (const r of rows) {
  if (!r.heroOn) continue;
  (byLoadout[r.loadout] = byLoadout[r.loadout] || {})[r.map] = r.winner;
}
const defaultLostMaps = ['first', 'second'].filter((m) => byLoadout.default[m] !== 'iron_eden');
const sweeps = [];
for (const entry of LOADOUTS) {
  if (entry.name === 'default') continue;
  if (defaultLostMaps.length > 0
    && defaultLostMaps.every((m) => byLoadout[entry.name][m] === 'iron_eden')) sweeps.push(entry.name);
}
const wins = {}, draws = {}, losses = {};
for (const entry of LOADOUTS.concat([{ name: 'hero-off' }])) {
  const rs = rows.filter((r) => r.loadout === entry.name);
  wins[entry.name] = rs.filter((r) => r.winner === 'iron_eden').length;
  draws[entry.name] = rs.filter((r) => r.winner === 'draw').length;
  losses[entry.name] = rs.filter((r) => r.winner !== 'iron_eden' && r.winner !== 'draw').length;
}
const summary = { seed: SEED, maxTicks: MAX_TICKS, wins, draws, losses,
  defaultLostMaps, sweeps, freezeRuleViolated: sweeps.length > 0 };
console.log(JSON.stringify(summary));
if (sweeps.length > 0) {
  console.error('FREEZE RULE: sweep detected for: ' + sweeps.join(', ') + ' — retune down, do not buff the opponent, do not raise the price as a substitute.');
  process.exit(1);
}
