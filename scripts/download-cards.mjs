#!/usr/bin/env node
/**
 * Downloads the Vector-Playing-Cards SVG deck and converts each card to PNG,
 * naming them to match the existing convention (e.g. ace_of_spades.png).
 */

import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const OUT_DIR = join(__dirname, '../client/public/cards');
const RAW_BASE = 'https://raw.githubusercontent.com/notpeter/Vector-Playing-Cards/master/cards-svg';

// Card width in pixels (poker size ratio ~1:1.4)
const CARD_WIDTH = 320;

// White padding added around the card in SVG coordinate units
const SVG_PADDING = 10;

/** Expands the viewBox and injects a white background rect for padding */
function withPadding(svg) {
  const vbMatch = svg.match(/viewBox="([^"]+)"/);
  if (!vbMatch) return svg;
  const [x, y, w, h] = vbMatch[1].trim().split(/[\s,]+/).map(Number);
  const px = x - SVG_PADDING;
  const py = y - SVG_PADDING;
  const pw = w + SVG_PADDING * 2;
  const ph = h + SVG_PADDING * 2;
  return svg
    .replace(/viewBox="[^"]+"/, `viewBox="${px} ${py} ${pw} ${ph}"`)
    .replace(/(<svg[^>]*>)/, `$1<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="white"/>`);
}

const RANK_MAP = {
  'A': 'ace', '2': '2', '3': '3', '4': '4', '5': '5',
  '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
  'J': 'jack', 'Q': 'queen', 'K': 'king',
};

const SUIT_MAP = { C: 'clubs', D: 'diamonds', H: 'hearts', S: 'spades' };

// Build the 52 card filenames: e.g. "AS" → ace_of_spades.png
const cards = [];
for (const [short, rank] of Object.entries(RANK_MAP)) {
  for (const [suitShort, suit] of Object.entries(SUIT_MAP)) {
    cards.push({
      svgName: `${short}${suitShort}.svg`,
      outName: `${rank}_of_${suit}.png`,
    });
  }
}

mkdirSync(OUT_DIR, { recursive: true });

let done = 0;
for (const { svgName, outName } of cards) {
  const url = `${RAW_BASE}/${svgName}`;
  const res = await fetch(url);
  if (!res.ok) { console.error(`  FAILED ${svgName}: HTTP ${res.status}`); continue; }
  const svg = await res.text();

  const resvg = new Resvg(withPadding(svg), { fitTo: { mode: 'width', value: CARD_WIDTH } });
  const png = resvg.render().asPng();
  writeFileSync(join(OUT_DIR, outName), png);

  done++;
  process.stdout.write(`\r${done}/${cards.length}  ${outName}            `);
}

console.log(`\nDone — ${done} cards saved to ${OUT_DIR}`);
