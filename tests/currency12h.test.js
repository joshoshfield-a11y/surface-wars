// WAVE 4 (CURRENCY-12H): earnable Salvage Credits + Premium Store.
// Pure-logic tests: the wallet module is DOM-free, so every store
// rule is tested here without a browser. The browser playthrough
// (scripts/currency12h-browser.js) covers the same rules through
// real clicks; the Node harness (scripts/currency12h-match.js)
// covers earn -> spend -> equip and the match balance data.
const test = require('node:test');
const assert = require('node:assert/strict');
const Curr = require('../game/currency.js');
const Weapons = require('../game/weapons.js');
const Prog = require('../game/progression.js');

function dpsOf(w) { return w.damage * w.accuracy / w.interval; }
function tierOf(id) {
  const r = Weapons.rowById(id);
  if (r) return r.tier;
  const g = Weapons.gearById(id);
  return g ? g.tier : null;
}
function richWallet(balance) {
  const w = Curr.defaultWallet();
  w.balance = balance;
  return w;
}
function buyAll(w, ids) {
  let cur = w;
  for (const id of ids) {
    const res = Curr.buyPack(cur, id);
    assert.ok(res.ok, res.reason);
    cur = res.wallet;
  }
  return cur;
}

// ---- Currency identity: never scrap, separate record ----
test('currency12h: currency is Salvage Credits, wallet key is separate from the hero key', () => {
  assert.equal(Curr.CURRENCY_NAME, 'Salvage Credits');
  assert.notEqual(Curr.CURRENCY_NAME.toLowerCase(), 'scrap');
  assert.equal(Curr.WALLET_KEY, 'surfacewars.wallet.v1');
  assert.equal(Prog.RECORD_KEY, 'surfacewars.hero.v1');
  assert.notEqual(Curr.WALLET_KEY, Prog.RECORD_KEY);
  assert.equal(Curr.SCHEMA, 1);
});

// ---- Earn formula: one auditable function ----
test('currency12h: grant formula — win > draw > loss, all above 0, plus hero-kill milestone', () => {
  assert.deepEqual(Curr.grantForMatch('win', 0), { result: 'win', base: 120, milestoneKills: 0, milestone: 0, total: 120 });
  assert.deepEqual(Curr.grantForMatch('draw', 0), { result: 'draw', base: 60, milestoneKills: 0, milestone: 0, total: 60 });
  assert.deepEqual(Curr.grantForMatch('loss', 0), { result: 'loss', base: 30, milestoneKills: 0, milestone: 0, total: 30 });
  assert.equal(Curr.grantForMatch('win', 4).total, 160); // 120 + 4x10
  assert.equal(Curr.grantForMatch('loss', 3).total, 60); // 30 + 3x10
  assert.equal(Curr.grantForMatch('win', 10).total, 220); // milestone capped at 10 kills
  assert.equal(Curr.grantForMatch('win', 40).total, 220); // cap holds past 10 kills
  assert.equal(Curr.grantForMatch('win', 10).milestoneKills, 10);
  assert.equal(Curr.grantForMatch('draw', -5).total, 60); // negative kills clamp to 0, never a penalty
  assert.throws(() => Curr.grantForMatch('stalled', 0), /unknown result/);
});

test('currency12h: applyGrant accumulates and never mutates its input', () => {
  const w = richWallet(100);
  const { wallet: w2, grant } = Curr.applyGrant(w, 'win', 4);
  assert.equal(grant.total, 160);
  assert.equal(w2.balance, 260);
  assert.equal(w.balance, 100); // input untouched
  assert.deepEqual(w2.owned, []);
});

// ---- Corruption rule: same pattern as hero progress ----
test('currency12h: corruption — missing is fresh with no notice, garbled/invalid resets with the notice', () => {
  const fresh = Curr.parseWallet(null);
  assert.deepEqual(fresh.wallet, Curr.defaultWallet());
  assert.equal(fresh.reset, false);
  assert.equal(fresh.notice, '');
  const freshUndef = Curr.parseWallet(undefined);
  assert.equal(freshUndef.reset, false);
  for (const bad of ['{garbled', 'not json at all', '', JSON.stringify({ schema: 2, balance: 0, owned: [], used: [], equipped: null }),
    JSON.stringify({ schema: 1, balance: -5, owned: [], used: [], equipped: null }),
    JSON.stringify({ schema: 1, balance: 10.5, owned: [], used: [], equipped: null }),
    JSON.stringify({ schema: 1, balance: 100, owned: ['pack_nope'], used: [], equipped: null }),
    JSON.stringify({ schema: 1, balance: 100, owned: ['pack_ember_line'], used: ['pack_gilded_reach'], equipped: null }),
    JSON.stringify({ schema: 1, balance: 100, owned: [], used: [], equipped: 'pack_ember_line' }),
    JSON.stringify({ schema: 1, balance: 100, owned: ['pack_ember_line', 'pack_ember_line'], used: [], equipped: null })]) {
    const p = Curr.parseWallet(bad);
    assert.equal(p.reset, true, 'expected reset for: ' + bad);
    assert.equal(p.notice, 'Wallet could not be read, so it was reset to 0.');
    assert.deepEqual(p.wallet, Curr.defaultWallet());
  }
  const ok = Curr.parseWallet(JSON.stringify({ schema: 1, balance: 250, owned: ['pack_ember_line'], used: [], equipped: 'pack_ember_line' }));
  assert.equal(ok.reset, false);
  assert.equal(ok.notice, '');
  assert.equal(ok.wallet.balance, 250);
  assert.deepEqual(ok.wallet.owned, ['pack_ember_line']);
});

test('currency12h: a wallet reset never touches the hero record shape', () => {
  // The wallet module has no hero fields and no hero key; a reset
  // produces a wallet only, so hero progress cannot be wiped here.
  const p = Curr.parseWallet('{garbled');
  assert.equal(p.wallet.schema, 1);
  assert.ok(!('level' in p.wallet) && !('xp' in p.wallet) && !('skills' in p.wallet));
});

// ---- Purchase rules ----
test('currency12h: duplicate purchase blocked — never a second charge', () => {
  const w = buyAll(richWallet(1000), ['pack_ember_line']);
  assert.equal(w.balance, 650);
  const again = Curr.buyPack(w, 'pack_ember_line');
  assert.equal(again.ok, false);
  assert.match(again.reason, /already owned/);
  // No wallet returned on failure: the caller's balance is untouched.
  assert.equal(w.balance, 650);
  assert.deepEqual(w.owned, ['pack_ember_line']);
});

test('currency12h: insufficient funds block purchase, balances never go negative', () => {
  const w = richWallet(299);
  const res = Curr.buyPack(w, 'pack_bulwark_march'); // costs 300
  assert.equal(res.ok, false);
  assert.match(res.reason, /Not enough Salvage Credits/);
  assert.match(res.reason, /300/);
  assert.equal(w.balance, 299);
  const exact = Curr.buyPack(richWallet(300), 'pack_bulwark_march');
  assert.equal(exact.ok, true);
  assert.equal(exact.wallet.balance, 0); // exact funds allowed, floor is 0, never below
  assert.equal(Curr.buyPack(richWallet(0), 'pack_bulwark_march').ok, false);
});

test('currency12h: unknown pack ids fail closed on buy, refund, and equip', () => {
  const w = richWallet(1000);
  assert.equal(Curr.buyPack(w, 'pack_nope').ok, false);
  assert.equal(Curr.refundPack(w, 'pack_nope').ok, false);
  assert.equal(Curr.equipPack(w, 'pack_nope').ok, false);
});

// ---- Refund rules ----
test('currency12h: refund before use restores the full price and clears equipped', () => {
  let w = buyAll(richWallet(1000), ['pack_ember_line']);
  const eq = Curr.equipPack(w, 'pack_ember_line');
  assert.equal(eq.ok, true);
  w = eq.wallet;
  assert.equal(w.equipped, 'pack_ember_line');
  const res = Curr.refundPack(w, 'pack_ember_line');
  assert.equal(res.ok, true);
  assert.equal(res.wallet.balance, 1000); // full 350 back
  assert.deepEqual(res.wallet.owned, []);
  assert.equal(res.wallet.equipped, null);
});

test('currency12h: refund after use is blocked, and refund of an unowned pack is blocked', () => {
  let w = buyAll(richWallet(1000), ['pack_ember_line']);
  w = Curr.markPackUsed(w, 'pack_ember_line');
  const res = Curr.refundPack(w, 'pack_ember_line');
  assert.equal(res.ok, false);
  assert.match(res.reason, /used in a match/);
  assert.equal(Curr.refundPack(w, 'pack_gilded_reach').ok, false);
  assert.match(Curr.refundPack(w, 'pack_gilded_reach').reason, /not owned/);
});

test('currency12h: markPackUsed is a no-op for unowned packs and idempotent', () => {
  const w = richWallet(1000);
  assert.deepEqual(Curr.markPackUsed(w, 'pack_ember_line').used, []);
  const owned = buyAll(w, ['pack_ember_line']);
  const once = Curr.markPackUsed(owned, 'pack_ember_line');
  assert.deepEqual(once.used, ['pack_ember_line']);
  assert.deepEqual(Curr.markPackUsed(once, 'pack_ember_line').used, ['pack_ember_line']);
});

// ---- Equip rules: ownership + tier-band gating (ownership never bypasses gates) ----
test('currency12h: equip of an unowned pack is blocked', () => {
  const w = richWallet(1000);
  const res = Curr.equipPack(w, 'pack_ember_line');
  assert.equal(res.ok, false);
  assert.match(res.reason, /not owned/);
});

test('currency12h: equip sets the hero loadout to the pack loadout', () => {
  const w = buyAll(richWallet(1000), ['pack_ember_line']);
  const res = Curr.equipPack(w, 'pack_ember_line');
  assert.equal(res.ok, true);
  assert.equal(res.wallet.equipped, 'pack_ember_line');
  assert.deepEqual(res.loadout, Curr.packById('pack_ember_line').loadout);
  assert.ok(Curr.loadoutEquals(res.loadout, Curr.packById('pack_ember_line').loadout));
});

test('currency12h: tier-gate on equip — gated items listed with the level each needs', () => {
  const ember = Curr.packById('pack_ember_line');
  const storm = Curr.packById('pack_storm_cell');
  const bulwark = Curr.packById('pack_bulwark_march');
  // Level-1 hero: band 1. Ember's T2 primary is gated (needs 4);
  // Storm's T3 weapons are gated (need 7); Bulwark is all T1.
  const g1 = Curr.gatedPackItems(ember, Prog.tierBand(1), tierOf);
  assert.equal(g1.length, 1);
  assert.equal(g1[0].id, 'nw_ember_repeater');
  assert.equal(g1[0].needLevel, 4);
  const gStorm = Curr.gatedPackItems(storm, Prog.tierBand(1), tierOf);
  // Storm at band 1 gates 4 items (2x T3 weapons + T2 reactor + T2 sensor).
  assert.deepEqual(gStorm.map((g) => g.id).sort(),
    ['gear_reactor_2', 'gear_sensor_2', 'nw_hailstorm_minigun', 'nw_phase_cutter'].sort());
  assert.ok(gStorm.every((g) => g.needLevel === 7 || g.needLevel === 4));
  assert.deepEqual(Curr.gatedPackItems(bulwark, Prog.tierBand(1), tierOf), []);
  // Level-4 hero: band 2. Ember fully equippable; Storm's T3 weapons still gated.
  assert.deepEqual(Curr.gatedPackItems(ember, Prog.tierBand(4), tierOf), []);
  assert.deepEqual(Curr.gatedPackItems(storm, Prog.tierBand(4), tierOf).map((g) => g.id).sort(),
    ['nw_hailstorm_minigun', 'nw_phase_cutter']);
  // Level-7 hero: band 3. Nothing gated.
  assert.deepEqual(Curr.gatedPackItems(storm, Prog.tierBand(7), tierOf), []);
});

test('currency12h: ownership never bypasses level gates in validateLoadout', () => {
  const ember = Curr.packById('pack_ember_line').loadout;
  const owned = ['nw_ember_repeater'];
  // Owned premium row, but tier band 1: the T2 row still fails.
  const v = Weapons.validateLoadout(ember, { chassis: 'Lancer', movementClass: 'ground',
    phaseTierCap: 1, levelBand: true, premiumOwnedIds: owned });
  assert.equal(v.ok, false);
  assert.ok(v.reasons.some((r) => r.includes('needs hero level 4')));
  // Same row at band 2 with ownership: passes.
  const v2 = Weapons.validateLoadout(ember, { chassis: 'Lancer', movementClass: 'ground',
    phaseTierCap: 2, levelBand: true, premiumOwnedIds: owned });
  assert.equal(v2.ok, true, v2.reasons.join(' '));
  // Same row at band 2 WITHOUT ownership: fails with the store reason.
  const v3 = Weapons.validateLoadout(ember, { chassis: 'Lancer', movementClass: 'ground',
    phaseTierCap: 2, levelBand: true, premiumOwnedIds: [] });
  assert.equal(v3.ok, false);
  assert.ok(v3.reasons.some((r) => r.includes('Premium Store')));
  // And with no premiumOwnedIds passed at all (hero-record path),
  // ownership is not checked — the loadout passes at band 2.
  const v4 = Weapons.validateLoadout(ember, { chassis: 'Lancer', movementClass: 'ground',
    phaseTierCap: 2, levelBand: true });
  assert.equal(v4.ok, true, v4.reasons.join(' '));
});

// ---- Premium rows: sidegrades with DPS bounds ----
test('currency12h: premium rows resolve within 1.5x family baseline DPS with stated trade-offs', () => {
  assert.deepEqual(Weapons.PREMIUM_ROW_IDS, ['nw_ember_repeater', 'nw_gilded_lance']);
  for (const id of Weapons.PREMIUM_ROW_IDS) {
    const row = Weapons.rowById(id);
    assert.ok(row, id + ' missing');
    assert.ok(Object.keys(row.mult).length <= 2, id + ' exceeds two multipliers');
    assert.ok(Weapons.SPECIALS.includes(row.special), id + ' special outside the closed list');
    assert.ok(Weapons.CHASSIS_PRIMARY_FAMILIES.Lancer.includes(row.family), id + ' is not Lancer-compatible');
    const w = Weapons.resolveWeapon(row);
    const b = Weapons.FAMILY_BASELINES[row.family];
    const baseDps = b.damage * b.accuracy / b.interval;
    assert.ok(dpsOf(w) <= 1.5 * baseDps, id + ' DPS ' + dpsOf(w).toFixed(2) + ' exceeds 1.5x baseline ' + baseDps.toFixed(2));
  }
  // Exact resolved values (the sidegrade claims in the report).
  // Gilded Lance is 12.8 damage at range 8, not 14.4 at range 10:
  // two Wave 4 freeze-rule retunes (damage, then the range bonus)
  // after Gilded Reach swept two balance runs (see weapons.js
  // and the Wave 4 report).
  const ember = Weapons.resolveWeapon(Weapons.rowById('nw_ember_repeater'));
  assert.deepEqual([ember.damage, ember.range, ember.interval, ember.special], [13.2, 5, 0.5, 'overheat']);
  const gilded = Weapons.resolveWeapon(Weapons.rowById('nw_gilded_lance'));
  assert.deepEqual([gilded.damage, gilded.range, gilded.interval, gilded.special], [12.8, 8, 0.7, 'pierce']);
  assert.ok(dpsOf(gilded) < 16 * 0.9 / 0.7, 'Gilded Lance DPS must sit BELOW its family baseline');
});

// ---- Packs: shape, prices, validity ----
test('currency12h: four packs, earnable-currency prices only, all loadouts valid at band 3', () => {
  assert.equal(Curr.PACKS.length, 4);
  const ids = Curr.PACKS.map((p) => p.id);
  assert.equal(new Set(ids).size, 4);
  for (const p of Curr.PACKS) {
    assert.ok(Number.isInteger(p.price) && p.price > 0, p.id + ' price must be a positive integer');
    assert.ok(p.tradeoff && p.tradeoff.length > 20, p.id + ' must state its trade-off');
    assert.ok(!('realPrice' in p) && !('checkout' in p), p.id + ' must carry no real-money field');
    const v = Weapons.validateLoadout(p.loadout, { chassis: 'Lancer', movementClass: 'ground',
      phaseTierCap: 3, levelBand: true, premiumOwnedIds: Weapons.PREMIUM_ROW_IDS });
    assert.equal(v.ok, true, p.id + ': ' + v.reasons.join(' '));
  }
  assert.deepEqual(Curr.PACKS.map((p) => p.price), [350, 450, 300, 600]);
  // At least two packs contain a premium-only row.
  const withPremium = Curr.PACKS.filter((p) =>
    Curr.packWeaponIds(p).some((wid) => Weapons.PREMIUM_ROW_IDS.includes(wid)));
  assert.ok(withPremium.length >= 2, 'expected >= 2 packs with a premium row, got ' + withPremium.length);
});

test('currency12h: heroStats resolves every pack loadout at its band level without error', () => {
  const HERO_BASE = { hp: 200, armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55, movementClass: 'ground' };
  for (const p of Curr.PACKS) {
    const band = p.loadout.primary && Weapons.rowById(p.loadout.primary).tier === 3 ? 7
      : (Curr.gatedPackItems(p, 1, tierOf).length ? 4 : 1);
    const st = Weapons.heroStats(p.loadout, HERO_BASE, { level: band, skills: [] });
    assert.ok(st.maxHp >= 200, p.id + ' HP below the L1 anchor');
    assert.ok(st.weapons.length >= 1, p.id + ' must carry at least one weapon');
  }
  // L1 anchor unchanged: the default loadout still resolves to the lancer baseline.
  const d = Weapons.heroStats(Weapons.DEFAULT_LOADOUT, HERO_BASE, { level: 1, skills: [] });
  assert.deepEqual([d.maxHp, d.speed, d.vision], [200, 6.0, 8]);
});

// ---- End-to-end pure flow: earn -> spend -> equip -> use -> refund blocked ----
test('currency12h: earn -> spend -> equip -> mark used -> refund blocked', () => {
  let w = Curr.defaultWallet();
  // Two wins: 4 kills (160) + 10 kills (220) = 380.
  w = Curr.applyGrant(w, 'win', 4).wallet;
  w = Curr.applyGrant(w, 'win', 10).wallet;
  assert.equal(w.balance, 380);
  const buy = Curr.buyPack(w, 'pack_ember_line');
  assert.equal(buy.ok, true);
  assert.equal(buy.wallet.balance, 30);
  const eq = Curr.equipPack(buy.wallet, 'pack_ember_line');
  assert.equal(eq.ok, true);
  // A match starts with the pack loadout equipped: it is now used.
  assert.ok(Curr.loadoutEquals(eq.loadout, Curr.packById('pack_ember_line').loadout));
  const used = Curr.markPackUsed(eq.wallet, 'pack_ember_line');
  assert.equal(Curr.refundPack(used, 'pack_ember_line').ok, false);
  // And a second purchase attempt is still blocked after use.
  assert.equal(Curr.buyPack(used, 'pack_ember_line').ok, false);
});

test('currency12h: earn -> spend -> equip -> refund before any match restores everything', () => {
  let w = Curr.defaultWallet();
  w = Curr.applyGrant(w, 'win', 10).wallet; // 220
  w = Curr.applyGrant(w, 'draw', 10).wallet; // +160 = 380
  assert.equal(w.balance, 380);
  w = Curr.buyPack(w, 'pack_bulwark_march').wallet; // -300 = 80
  assert.equal(w.balance, 80);
  w = Curr.equipPack(w, 'pack_bulwark_march').wallet;
  assert.equal(w.equipped, 'pack_bulwark_march');
  // No match started: refund pays back in full.
  const res = Curr.refundPack(w, 'pack_bulwark_march');
  assert.equal(res.ok, true);
  assert.equal(res.wallet.balance, 380);
  assert.deepEqual(res.wallet.owned, []);
  assert.equal(res.wallet.equipped, null);
});
