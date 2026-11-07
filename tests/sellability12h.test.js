/* SELLABILITY-12H Wave 5 tests (2026-11-01): APK gate fixes (8 new-mech
   wreck sprites + expansion staging + checker), Tutorial II wiring, and
   sellability polish honesty guards. Run with the explicit file list:
   node --test tests/sellability12h.test.js [plus the rest of the suite]
   Nothing here changes weapons, progression, currency, sim, hero,
   catalog, or map scenarios: those are pinned by assertions in the
   Wave 1–4 test files. game.js is a browser IIFE and is NOT
   Node-requireable, so its Tutorial II wiring is checked by reading
   its source, not by executing it; the browser proof lives in
   scripts/sellability12h-browser.py. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const Assets = require('../game/sprites.js');

const ROOT = path.join(__dirname, '..');
const NEW_IDS = ['bastion', 'gatekeeper', 'deadeye', 'mortarjack', 'needlewing', 'longsight', 'javelin', 'raptor'];
const EXPANSION_CLASS = {
  bastion: 'bulwark', gatekeeper: 'bulwark', deadeye: 'longshot', mortarjack: 'longshot',
  needlewing: 'vespid', longsight: 'vespid', javelin: 'striker', raptor: 'striker',
};
const TUT2_STEP_IDS = ['takecontrol', 'drive', 'aimfire', 'release', 'dropback', 'store'];

function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }

// Minimal PNG reader for the wreck pixel guards: 8-bit RGBA,
// non-interlaced only (the format the keying pipeline writes).
// No image dependency is pulled in for this; node:zlib does the work.
function decodePngRGBA(rel) {
  const buf = fs.readFileSync(path.join(ROOT, rel));
  assert.equal(buf.toString('ascii', 1, 4), 'PNG', rel + ' is not a PNG');
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  assert.equal(buf[24], 8, rel + ' must be 8-bit');
  assert.equal(buf[25], 6, rel + ' must be RGBA (color type 6)');
  assert.equal(buf[26], 0, rel + ' must not be compressed oddly');
  assert.equal(buf[27], 0, rel + ' must not use a filter method other than 0');
  assert.equal(buf[28], 0, rel + ' must not be interlaced');
  let pos = 8; const chunks = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IDAT') chunks.push(buf.subarray(pos + 8, pos + 8 + len));
    if (type === 'IEND') break;
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(chunks));
  const bpp = 4, stride = w * bpp;
  const px = Buffer.alloc(w * h * bpp);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = px.subarray(y * stride, (y + 1) * stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? out[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      if (filter === 1) v = (v + a) & 0xff;
      else if (filter === 2) v = (v + b) & 0xff;
      else if (filter === 3) v = (v + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
      }
      out[i] = v;
    }
    prev = Buffer.from(out);
  }
  return { w, h, px };
}

test('sellability12h: all 8 new-mech wreck sprites exist, 512x512 RGBA, team-neutral scrap', () => {
  for (const id of NEW_IDS) {
    // The filename the renderer actually resolves: sprites.js
    // wreckPath is generic (typeId + '_wreck-512.png'), so this test
    // checks the file the resolver returns, not a second pattern.
    const resolved = Assets.wreckPath(id).replace(/^\.\.\//, '');
    assert.equal(resolved, 'assets/animation/wrecks/' + id + '_wreck-512.png', id + ' wreckPath');
    assert.ok(exists(resolved), 'missing wreck ' + resolved);
    assert.ok(exists('assets/animation/wrecks/' + id + '_wreck.png'), 'missing full-size wreck ' + id);
    const { w, h, px } = decodePngRGBA(resolved);
    assert.deepEqual({ w, h }, { w: 512, h: 512 }, id + ' wreck must be 512x512');
    const alphaAt = (x, y) => px[(y * 512 + x) * 4 + 3];
    for (const [x, y] of [[0, 0], [511, 0], [0, 511], [511, 511]]) {
      assert.equal(alphaAt(x, y), 0, id + ' corner (' + x + ',' + y + ') must be transparent');
    }
    let opaque = 0, blueDom = 0, minX = 512, maxX = -1, minY = 512, maxY = -1;
    for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
      const i = (y * 512 + x) * 4;
      if (px[i + 3] === 0) continue;
      opaque++;
      // Team-neutral guard, VISIBLE pixels only (alpha >= 128):
      // faction blue is saturated blue-dominant art. The -512
      // files also carry 7–20 near-transparent fringe pixels
      // (alpha <= 4, LANCZOS/keying edge residue, invisible over
      // any background) that trip an alpha-blind threshold — those
      // are documented in the Wave-5 report, not counted here.
      // (Rust tones are red-ish by a crude threshold and are NOT
      // asserted on here — the report documents the visual check.)
      if (px[i + 3] >= 128 && px[i + 2] > 120 && px[i + 2] > px[i] + 40 && px[i + 2] > px[i + 1] + 40) blueDom++;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    assert.ok(opaque > 50000, id + ' wreck must have substantial opaque content, got ' + opaque);
    assert.equal(blueDom, 0, id + ' wreck must have no blue-dominant pixels, got ' + blueDom);
    assert.ok(maxX - minX > 300 && maxY - minY > 300, id + ' wreck must fill a large central area, got bbox ' + minX + ',' + minY + '-' + maxX + ',' + maxY);
  }
});

test('sellability12h: expansion staging is explicit per-file, never a whole-tree glob', () => {
  const sh = read('apk/build.sh');
  for (const id of NEW_IDS) {
    const cls = EXPANSION_CLASS[id];
    for (const suffix of ['', '-red']) {
      const f = 'mechs-expansion/' + cls + '/' + id + suffix + '-512.png';
      assert.ok(sh.includes(f), 'build.sh must stage exactly ' + f);
    }
    assert.ok(Assets.EXPANSION_SPRITES[id], id + ' must be in EXPANSION_SPRITES');
  }
  assert.ok(!sh.includes('mechs-expansion/*'), 'build.sh must not glob the whole expansion tree');
  for (const line of sh.split('\n')) {
    assert.ok(!(/cp -r/.test(line) && line.includes('mechs-expansion')), 'no build.sh line may recursively copy the expansion tree: ' + line);
  }
  assert.ok(sh.includes('animation/wrecks/*-512.png'), 'wrecks ride the existing -512 glob (one per unit id)');
});

test('sellability12h: verify_refs.py resolves the expansion mapping and the game snapshot', () => {
  const py = read('apk/verify_refs.py');
  assert.ok(py.includes('EXPANSION_SPRITES'), 'checker must parse the sprites.js expansion mapping');
  assert.ok(py.includes('mechs-expansion'), 'checker must check expansion paths');
  assert.ok(py.includes('_wreck-512.png'), 'checker must check wreck paths');
  const sh = read('apk/build.sh');
  assert.ok(sh.includes('game/currency.js'), 'build.sh snapshot must include currency.js (loaded by index.html)');
});

test('sellability12h: Tutorial II structure — 6 steps, own button, own end overlay, store viewing only', () => {
  const game = read('game/game.js');
  const html = read('game/index.html');
  // Step table: all six ids, in task order, as a game.js-local table
  // (view.js is untouched — tier 1's 7 steps live there).
  const tableMatch = game.match(/var TUTORIAL2_STEPS = \[([\s\S]*?)\];/);
  assert.ok(tableMatch, 'game.js must define TUTORIAL2_STEPS');
  const ids = [...tableMatch[1].matchAll(/id: '([a-z]+)'/g)].map((m) => m[1]);
  assert.deepEqual(ids, TUT2_STEP_IDS, 'tutorial II steps must be takecontrol/drive/aimfire/release/dropback/store in order');
  for (const fn of ['startTutorial2', 'setupTutorial2Scenario', 'enterTutorial2Step', 'checkTutorial2Advance', 'updateTutorial2Bar', 'tutorial2Highlight', 'hideTutorial2UI', 'exitTutorial2']) {
    assert.ok(game.includes('function ' + fn), 'game.js must define ' + fn);
  }
  // Separate flag: tier 2 must NOT reuse the tier-1 `tutorial`
  // variable for its own state (that flag hides Take Control).
  assert.ok(game.includes('var tutorial2 = null'), 'tier 2 must have its own tutorial2 variable');
  assert.ok(game.includes('state.tutorial = true') && game.includes('setupTutorial2Scenario'), 'tier 2 scenario must hold the red side via state.tutorial');
  // Cleanup contract: Skip / menu / real game clear tier 2 too.
  assert.ok(game.includes('exitTutorial(); exitTutorial2();'), 'openMainMenu must clear tier 2');
  assert.ok(game.includes("tutorial2 = null; hideTutorial2UI();"), 'startTutorial/startMap must clear tier 2');
  assert.ok(game.includes("if (tutorial2) { setupTutorial2Scenario(); enterTutorial2Step(0); }"), 'newGame restart must restart tier 2');
  // Menu + overlay ids in index.html.
  for (const id of ['mm-tutorial2', 'tutorial2-end', 'tut2-store', 'tut2-finish', 'tut2-play', 'howto-tutorial2']) {
    assert.ok(html.includes('id="' + id + '"'), 'index.html must contain #' + id);
  }
  // Store step never requires a purchase: the overlay and the step
  // text say viewing only, and no buy button is referenced by the
  // tier-2 code.
  assert.ok(html.includes('Viewing only') || html.includes('viewing only'), 'tutorial II store step must say viewing only');
  assert.ok(!game.includes('tut2-buy'), 'tier 2 must not reference a buy button');
  assert.ok(game.includes('tutorial2.storeViewed = true'), 'store step must record viewing, not buying');
});

test('sellability12h: tier 1 untouched — 7 steps, same order, still the tutorial', () => {
  const view = read('game/view.js');
  const tableMatch = view.match(/var TUTORIAL_STEPS = \[([\s\S]*?)\n  \];/);
  assert.ok(tableMatch, 'view.js must still define TUTORIAL_STEPS');
  const ids = [...tableMatch[1].matchAll(/id:\s*'([a-z]+)'/g)].map((m) => m[1]);
  assert.deepEqual(ids, ['look', 'select', 'move', 'attack', 'build', 'salvage', 'win'], 'tier 1 must keep its 7 steps in order');
  const html = read('game/index.html');
  assert.ok(html.includes('id="mm-tutorial"'), 'tier-1 menu button must remain');
  assert.ok(html.includes('id="tutorial-end"'), 'tier-1 end overlay must remain');
});

test('sellability12h: How to Play + menu line cover the new content, honestly', () => {
  const html = read('game/index.html');
  const howto = html.slice(html.indexOf('id="howto-panel"'), html.indexOf('id="tutorial-end"'));
  for (const mech of ['Bastion', 'Gatekeeper', 'Deadeye', 'Mortarjack', 'Needlewing', 'Longsight', 'Javelin', 'Raptor']) {
    assert.ok(howto.includes(mech), 'How to Play must name ' + mech);
  }
  for (const needle of ['Tutorial II', 'mastery', 'Salvage Credits', 'win 120', 'refunds in full', 'Real-money purchases: not live']) {
    assert.ok(howto.includes(needle), 'How to Play must cover: ' + needle);
  }
  assert.ok(howto.includes('multiplayer'), 'How to Play limits list must still name multiplayer as not present');
  // The "does NOT do yet" list must still be present and must not
  // have gained a real-money claim.
  assert.ok(howto.includes('Not in this slice'), 'How to Play must keep its honest limits list');
  assert.ok(!howto.includes('buy with real money') && !howto.includes('purchase with real'), 'How to Play must not claim real-money purchases');
  // Menu line: content additions only, no hype labels, no fake counts.
  const menuLine = html.match(/New in this version:[^<]*/);
  assert.ok(menuLine, 'main menu must carry a "New in this version" line');
  for (const word of ['Tutorial II', '8 new mechs', 'mastery', 'Premium Store']) assert.ok(menuLine[0].includes(word), 'menu line must mention ' + word);
  for (const hype of ['amazing', 'incredible', 'epic', 'best', 'ultimate', '!!!']) assert.ok(!menuLine[0].includes(hype), 'menu line must not use hype label ' + hype);
});

test('sellability12h: CONTROLS.md gains Tutorial II + Wave-5 sections, existing sections kept', () => {
  const doc = read('game/CONTROLS.md');
  assert.ok(doc.includes('## Tutorial II — Twin-Stick & Hero'), 'CONTROLS must add a Tutorial II section');
  assert.ok(doc.includes('## New in this version — 8 mechs, mastery, Salvage Credits store'), 'CONTROLS must add a Wave-5 section');
  assert.ok(doc.includes('9v10 opening') || doc.includes('9v10'), 'CONTROLS Tutorial II must note the 9v10 opening');
  assert.ok(doc.includes('5500'), 'CONTROLS must state the M1 threshold');
  assert.ok(doc.includes('Real-money purchases: not live'), 'CONTROLS must state real-money not live');
  assert.ok(doc.includes('## Still NOT IMPLEMENTED'), 'CONTROLS must keep its not-implemented list');
});

test('sellability12h: staged marketing drafts stay honest and unpublished', () => {
  const listing = read('marketing/listing-draft.md');
  const headline = read('marketing/headline.md');
  const openings = read('marketing/audience-openings.md');
  assert.ok(listing.includes('NOT published'), 'listing draft must stay staged-only');
  assert.ok(listing.includes('Tutorial II'), 'listing must mention Tutorial II');
  assert.ok(listing.includes('8 new mechs'), 'listing must mention the 8 new mechs');
  assert.ok(listing.includes('Salvage Credits'), 'listing must cover Salvage Credits');
  assert.ok(listing.includes('Real-money purchases: not live'), 'listing must keep real-money not live');
  assert.ok(listing.includes('not been benchmarked on a real device'), 'listing must keep the real-phone limit');
  assert.ok(!listing.includes('No difficulty settings'), 'listing must not keep the stale no-difficulty line (difficulty now exists)');
  assert.ok(!listing.toLowerCase().includes('buy now'), 'listing must not invent a purchase call');
  assert.ok(listing.includes('no checkout'), 'listing must state there is no checkout (the word appears only negated)');
  assert.ok(headline.includes('Top-down RTS battles where every wreck is worth scrap.'), 'headline must be unchanged');
  assert.ok(headline.includes('Wave-5 re-check'), 'headline must record the v1.7 re-check');
  assert.ok(openings.includes('two tutorials'), 'audience openings must reflect both tutorials');
  for (const f of ['marketing/listing-draft.md', 'marketing/headline.md', 'marketing/audience-openings.md', 'marketing/sharp-advantage.md']) {
    const text = read(f);
    assert.ok(!text.toLowerCase().includes('bible') && !text.toLowerCase().includes('biblical') && !text.toLowerCase().includes('scripture'), f + ' must contain no religious language');
  }
});
