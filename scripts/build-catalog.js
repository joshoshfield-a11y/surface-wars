#!/usr/bin/env node
// Generate game/catalog.js from data/catalog.json (single source of truth).
// Run: node scripts/build-catalog.js
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'data', 'catalog.json');
const out = path.join(root, 'game', 'catalog.js');
const catalog = JSON.parse(fs.readFileSync(src, 'utf8'));
const js = '/* GENERATED from data/catalog.json — do not edit by hand. Run node scripts/build-catalog.js */\n' +
  '(function (global) { var CATALOG = ' + JSON.stringify(catalog) + ';\n' +
  '  if (typeof module !== "undefined" && module.exports) module.exports = CATALOG;\n' +
  '  else global.SWCatalog = CATALOG;\n})(typeof globalThis !== "undefined" ? globalThis : this);\n';
fs.writeFileSync(out, js);
console.log('wrote ' + out);
