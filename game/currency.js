/* Surface Wars — WAVE 4 (12H): earnable meta-currency + Premium Store.
   DOM-free: the browser shell (game.js) and node tests share this
   file. It never touches storage, the sim, or the DOM — the shell
   owns localStorage reads/writes, exactly like progression.js owns
   the hero record's shape while game.js owns its storage.

   Currency: Salvage Credits. This is a META currency, distinct
   from match scrap in every way that matters: different record,
   different key, different balance, never converted, never mixed
   in code or UI. Match scrap is spent inside a match on units and
   vanishes with the match; Salvage Credits are earned at match end
   and spent between matches in the Premium Store. No code path
   adds one balance to the other, and no UI line ever shows them
   as one number.

   Earn rule (auditable in ONE function, grantForMatch): at MATCH
   END only, the same moment hero XP is written (game.js
   showVictory) — quitting mid-match earns nothing, because quit
   never reaches showVictory. Base grant by result, all above 0:
   win 120, draw 60, loss 30. PLUS one milestone component, from
   ONE source only: hero killing blows (state.heroXp.kills, the
   same count the sim already tracks for hero XP) at +10 Credits
   per kill, capped at 10 kills (+100 max). A match with the hero
   toggled off earns no Credits: the grant lives in the same
   heroMatch block as the XP write, so the gate is identical.
   Example: a win with 4 hero kills grants 120 + 40 = 160.

   Wallet record: key 'surfacewars.wallet.v1', schema 1, stored
   SEPARATELY from the hero record ('surfacewars.hero.v1'). The
   hero key and schema are never touched here — the wallet is a
   second record, not a hero-record field, so a wallet reset can
   never wipe hero progress and vice versa. Written at match end
   (grant) and on purchase/refund/equip — never every tick, never
   mid-match.

   Corruption rule, the SAME pattern as hero progress: a missing
   record is a fresh wallet (balance 0, no notice); an unreadable
   or failing-validation record resets to balance 0 with owned
   empty and equipped cleared, WITH the plain notice "Wallet could
   not be read, so it was reset to 0." — never a crash, never a
   blocked menu. The shell shows the notice; this module only
   reports the failure (parseWallet return).

   Premium Store rules (pure transitions below, UI in game.js):
   - Prices are in Salvage Credits ONLY. There is no real-money
     price, checkout, or payment provider anywhere in this file,
     and the store UI carries a "Real-money purchases: not live"
     note. Nothing here can charge anyone.
   - Buying an owned pack is impossible: buyPack refuses with a
     reason, and the UI turns the button into Equip. Balances
     never go negative: insufficient funds refuse with a reason.
   - Refund: a pack NEVER used in a match refunds in full (price
     back, ownership removed, equipped cleared). A pack used in a
     match cannot be refunded, with the reason stated. "Used"
     means a match STARTED with that pack's loadout equipped
     (game.js marks it at newGame); merely owning or equipping
     without playing does not count.
   - Equip: sets the hero loadout to the pack's loadout, but
     ownership NEVER bypasses level gates. Tier-band gating is
     checked by the caller through Weapons.validateLoadout (the
     same validator the loadout screen uses); gatedPackItems
     lists exactly which pack items are above the hero's band and
     the level each needs, so the store can say why. Equipping
     a gated pack is refused, not partially applied.
   - Premium-only weapon rows (weapons.js PREMIUM_ROW_IDS) are
     sidegrades, never a stat pile: each resolves to <=1.5x its
     family baseline DPS with a stated trade-off (see PACKS).
   - NOTHING is removed by this wave: packs are bundles of named
     weapons + gear rows that already exist, plus the two new
     premium-only rows. */
(function (global) {
  'use strict';
  var WALLET_KEY = 'surfacewars.wallet.v1';
  var SCHEMA = 1;
  var CURRENCY_NAME = 'Salvage Credits';
  var RESET_NOTICE = 'Wallet could not be read, so it was reset to 0.';
  var GRANT_BASE = { win: 120, draw: 60, loss: 30 };
  var MILESTONE_PER_KILL = 10;
  var MILESTONE_KILL_CAP = 10;

  function packLoadout(primary, secondary, armor, mobility, reactor, sensor) {
    return { primary: primary, secondary: secondary || null,
      armor: armor || null, mobility: mobility || null,
      reactor: reactor || null, sensor: sensor || null, ability: null };
  }
  // Four packs. Prices are in Salvage Credits only (earn rate:
  // ~120-220 per win depending on hero kills, so the cheapest pack
  // is roughly two wins away and the dearest roughly four — the
  // price is a pacing choice, never a balance fix: a pack that
  // sweeps gets retuned down, never repriced as a substitute).
  var PACKS = [
    { id: 'pack_ember_line', name: 'Ember Line', price: 350,
      loadout: packLoadout('nw_ember_repeater', null, 'gear_armor_1', 'gear_mobility_1', null, null),
      tradeoff: 'Rapid-fire Autocannon sidegrade: +10% DPS over the Twin-Bore Autogun, but shorter range (5 vs 6 tiles) and an overheat special. Plated Hull I + Servo Legs I keep it a straight brawler, not a stat pile.' },
    { id: 'pack_gilded_reach', name: 'Gilded Reach', price: 450,
      loadout: packLoadout('nw_gilded_lance', null, 'gear_armor_1b', null, null, 'gear_sensor_1'),
      tradeoff: 'Laser sidegrade with pierce, but LOWER damage than the family baseline (12.8 vs 16) at baseline range (8 tiles) — retuned down twice after freeze-rule sweeps, see the report: first the damage, then the range bonus. Pierce + Reactive Weave speed + sensor vision are what remain. Reactive Weave trades a little HP for speed.' },
    { id: 'pack_bulwark_march', name: 'Bulwark March', price: 300,
      loadout: packLoadout('nw_breacher_12', 'nw_rustfang', 'gear_armor_1', 'gear_mobility_1', null, null),
      tradeoff: 'No premium weapon — the cheap all-tier-1 starter bundle, equippable at level 1. Close-range shotgun + melee secondary: strong up close, no ranged secondary and no sensor reach.' },
    { id: 'pack_storm_cell', name: 'Storm Cell', price: 600,
      loadout: packLoadout('nw_hailstorm_minigun', 'nw_phase_cutter', null, null, 'gear_reactor_2', 'gear_sensor_2'),
      tradeoff: 'High-end bundle: Hailstorm Minigun (overheat) + Phase Cutter (pierce melee). Both weapons are tier 3, so the whole pack is gated to hero level 7 — power bought with a level wait and an overheat primary, not with Credits alone.' }
  ];

  function packById(id) {
    for (var i = 0; i < PACKS.length; i++) if (PACKS[i].id === id) return PACKS[i];
    return null;
  }
  function cloneLoadout(l) {
    return { primary: l.primary, secondary: l.secondary, armor: l.armor,
      mobility: l.mobility, reactor: l.reactor, sensor: l.sensor, ability: l.ability };
  }
  function loadoutEquals(a, b) {
    if (!a || !b) return false;
    return a.primary === b.primary && a.secondary === b.secondary && a.armor === b.armor &&
      a.mobility === b.mobility && a.reactor === b.reactor && a.sensor === b.sensor &&
      a.ability === b.ability;
  }
  function defaultWallet() {
    return { schema: SCHEMA, balance: 0, owned: [], used: [], equipped: null };
  }
  function cloneWallet(w) {
    return { schema: w.schema, balance: w.balance, owned: w.owned.slice(),
      used: w.used.slice(), equipped: w.equipped };
  }
  function validateWallet(w) {
    var reasons = [];
    if (!w || typeof w !== 'object') return { ok: false, reasons: ['Wallet is not an object.'] };
    if (w.schema !== SCHEMA) reasons.push('Unknown wallet schema version: ' + w.schema + '.');
    if (!Number.isInteger(w.balance) || w.balance < 0) reasons.push('Negative or non-integer balance: ' + w.balance + '.');
    if (!Array.isArray(w.owned)) reasons.push('Owned packs is not a list.');
    else {
      var seen = {};
      w.owned.forEach(function (id) {
        if (!packById(id)) reasons.push('Unknown pack id in owned: ' + id + '.');
        else if (seen[id]) reasons.push('Duplicate owned pack id: ' + id + '.');
        else seen[id] = true;
      });
    }
    if (!Array.isArray(w.used)) reasons.push('Used packs is not a list.');
    else {
      w.used.forEach(function (id) {
        if (!packById(id)) reasons.push('Unknown pack id in used: ' + id + '.');
        else if (!Array.isArray(w.owned) || w.owned.indexOf(id) === -1) reasons.push('Used pack is not owned: ' + id + '.');
      });
    }
    if (w.equipped !== null && w.equipped !== undefined) {
      if (!packById(w.equipped)) reasons.push('Unknown equipped pack id: ' + w.equipped + '.');
      else if (!Array.isArray(w.owned) || w.owned.indexOf(w.equipped) === -1) reasons.push('Equipped pack is not owned: ' + w.equipped + '.');
    }
    return { ok: reasons.length === 0, reasons: reasons };
  }
  // Parse a stored wallet string. Missing (null/undefined) is a
  // fresh wallet with NO notice, mirroring the hero record (a
  // missing hero record is a fresh level-1 hero, no notice).
  // Unreadable or failing-validation input resets WITH the notice.
  function parseWallet(raw) {
    if (raw === null || raw === undefined) return { wallet: defaultWallet(), reset: false, notice: '' };
    var parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }
    var v = parsed ? validateWallet(parsed) : { ok: false, reasons: ['Wallet is not readable.'] };
    if (v.ok) return { wallet: cloneWallet(parsed), reset: false, notice: '' };
    return { wallet: defaultWallet(), reset: true, notice: RESET_NOTICE };
  }
  // THE earn formula, in one place. result: 'win' | 'draw' | 'loss'.
  // heroKills: hero killing blows this match (state.heroXp.kills).
  // Returns {result, base, milestoneKills, milestone, total}.
  function grantForMatch(result, heroKills) {
    var base = GRANT_BASE[result];
    if (base === undefined) throw new Error('grantForMatch: unknown result: ' + result);
    var kills = Math.max(0, Math.floor(heroKills || 0));
    var counted = Math.min(kills, MILESTONE_KILL_CAP);
    var milestone = counted * MILESTONE_PER_KILL;
    return { result: result, base: base, milestoneKills: counted, milestone: milestone, total: base + milestone };
  }
  // Pure match-end transition: returns a NEW wallet; input unmutated.
  function applyGrant(wallet, result, heroKills) {
    var grant = grantForMatch(result, heroKills);
    var out = cloneWallet(wallet);
    out.balance = wallet.balance + grant.total;
    return { wallet: out, grant: grant };
  }
  function buyPack(wallet, packId) {
    var pack = packById(packId);
    if (!pack) return { ok: false, reason: 'Unknown pack: ' + packId + '.' };
    if (wallet.owned.indexOf(packId) !== -1) return { ok: false, reason: pack.name + ' is already owned — no second charge.' };
    if (wallet.balance < pack.price) return { ok: false, reason: 'Not enough ' + CURRENCY_NAME + ': ' + pack.name + ' costs ' + pack.price + ' and you have ' + wallet.balance + '.' };
    var out = cloneWallet(wallet);
    out.balance = wallet.balance - pack.price;
    out.owned.push(packId);
    return { ok: true, wallet: out, reason: '' };
  }
  function refundPack(wallet, packId) {
    var pack = packById(packId);
    if (!pack) return { ok: false, reason: 'Unknown pack: ' + packId + '.' };
    if (wallet.owned.indexOf(packId) === -1) return { ok: false, reason: pack.name + ' is not owned, so there is nothing to refund.' };
    if (wallet.used.indexOf(packId) !== -1) return { ok: false, reason: pack.name + ' was used in a match, so it cannot be refunded.' };
    var out = cloneWallet(wallet);
    out.balance = wallet.balance + pack.price;
    out.owned = wallet.owned.filter(function (id) { return id !== packId; });
    if (out.equipped === packId) out.equipped = null;
    return { ok: true, wallet: out, reason: '' };
  }
  // Equip is ownership-only here; the caller MUST also run
  // Weapons.validateLoadout at the hero's tier band before applying
  // the returned loadout (game.js does; gatedPackItems below lists
  // the gated items for the store's "why" text). Returns the pack
  // loadout so the caller sets the hero loadout from one source.
  function equipPack(wallet, packId) {
    var pack = packById(packId);
    if (!pack) return { ok: false, reason: 'Unknown pack: ' + packId + '.' };
    if (wallet.owned.indexOf(packId) === -1) return { ok: false, reason: pack.name + ' is not owned — buy it in the Premium Store first.' };
    var out = cloneWallet(wallet);
    out.equipped = packId;
    return { ok: true, wallet: out, loadout: cloneLoadout(pack.loadout), reason: '' };
  }
  // Mark a pack used (match started with its loadout equipped).
  // Pure; a no-op when the pack is not owned or already marked.
  function markPackUsed(wallet, packId) {
    if (wallet.owned.indexOf(packId) === -1 || wallet.used.indexOf(packId) !== -1) return cloneWallet(wallet);
    var out = cloneWallet(wallet);
    out.used.push(packId);
    return out;
  }
  // Items of a pack loadout above a tier band. tierOf(id) maps a
  // weapon or gear id to its tier (the caller resolves it through
  // Weapons). Returns [{slot, id, tier, needLevel}] — needLevel is
  // the hero level that unlocks the tier (4 for tier 2, 7 for
  // tier 3), matching progression.js tierBand.
  function gatedPackItems(pack, tierBand, tierOf) {
    var gated = [];
    ['primary', 'secondary', 'armor', 'mobility', 'reactor', 'sensor'].forEach(function (slot) {
      var id = pack.loadout[slot];
      if (!id) return;
      var tier = tierOf(id);
      if (tier !== undefined && tier !== null && tier > tierBand) {
        gated.push({ slot: slot, id: id, tier: tier, needLevel: tier >= 3 ? 7 : 4 });
      }
    });
    return gated;
  }
  function packWeaponIds(pack) {
    var ids = [];
    if (pack.loadout.primary) ids.push(pack.loadout.primary);
    if (pack.loadout.secondary) ids.push(pack.loadout.secondary);
    return ids;
  }

  var api = { WALLET_KEY: WALLET_KEY, SCHEMA: SCHEMA, CURRENCY_NAME: CURRENCY_NAME,
    RESET_NOTICE: RESET_NOTICE, GRANT_BASE: GRANT_BASE,
    MILESTONE_PER_KILL: MILESTONE_PER_KILL, MILESTONE_KILL_CAP: MILESTONE_KILL_CAP,
    PACKS: PACKS, packById: packById, cloneLoadout: cloneLoadout, loadoutEquals: loadoutEquals,
    defaultWallet: defaultWallet, cloneWallet: cloneWallet,
    validateWallet: validateWallet, parseWallet: parseWallet,
    grantForMatch: grantForMatch, applyGrant: applyGrant,
    buyPack: buyPack, refundPack: refundPack, equipPack: equipPack,
    markPackUsed: markPackUsed, gatedPackItems: gatedPackItems, packWeaponIds: packWeaponIds };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.SWCurrency = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
