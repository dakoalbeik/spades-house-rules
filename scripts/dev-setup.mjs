#!/usr/bin/env node
/**
 * Playwright-powered dev setup script.
 *
 * - Starts the dev server (unless --no-server flag is passed)
 * - Waits for client + server to be ready
 * - Opens a Chromium window, creates a Spades game as Player 1
 * - Opens 3 more tabs and joins with Player 2, 3, 4
 * - Leaves everything open so you can start developing immediately
 *
 * Usage:
 *   npm run dev:setup
 *   node scripts/dev-setup.mjs
 *   node scripts/dev-setup.mjs --no-server   # if dev server is already running
 *   node scripts/dev-setup.mjs --players 2   # only 1 host + 1 joiner
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';

// ── Config ───────────────────────────────────────────────────────────────────
const args        = process.argv.slice(2);
const NO_SERVER   = args.includes('--no-server');
const EXTRA_TABS  = Number(args[args.indexOf('--players') + 1] ?? 3); // joiners
const CLIENT_URL  = 'http://localhost:5173';
const SERVER_URL  = 'http://localhost:4000/health';

// ── Helpers ──────────────────────────────────────────────────────────────────
async function waitForServer(url, { intervalMs = 500, timeoutMs = 60_000 } = {}) {
  const start = Date.now();
  process.stdout.write(`Waiting for ${url} `);
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (res.ok || res.status < 500) { console.log('✓'); return; }
    } catch { /* not ready yet */ }
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, intervalMs));
  }
  console.log('');
  throw new Error(`${url} did not respond within ${timeoutMs}ms`);
}

function startDevServer() {
  console.log('Starting dev server…');
  const cwd = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
  const proc = spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: true, cwd });
  proc.on('error', err => { console.error('Dev server error:', err.message); process.exit(1); });
  return proc;
}

// ── Main ─────────────────────────────────────────────────────────────────────
let devProcess = null;

if (!NO_SERVER) {
  devProcess = startDevServer();
}

await waitForServer(CLIENT_URL);
await waitForServer(SERVER_URL);

console.log('Launching browser…');
const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();

// ── Tab 1: Create game ────────────────────────────────────────────────────────
console.log('Tab 1 — creating game as Player 1…');
const host = await context.newPage();
await host.goto(CLIENT_URL);

// Wait for lobby + socket to connect (button becomes enabled)
await host.waitForSelector('.lobby-btn:not([disabled])', { timeout: 15_000 });

// Fill name in the "New game" panel (first .lobby-panel)
const createPanel = host.locator('.lobby-panel').first();
await createPanel.locator('input[placeholder="Enter your name"]').fill('Player 1');

// Click "Create lobby"
await createPanel.locator('.lobby-btn').click();

// Wait until the game ID lands in sessionStorage
const gameId = await host.waitForFunction(
  () => sessionStorage.getItem('spades_gameId'),
  { timeout: 10_000 }
);
const gameIdValue = await gameId.jsonValue();

console.log(`Game created! ID: ${gameIdValue}`);
host.bringToFront();

// ── Tabs 2‥N: Join game ───────────────────────────────────────────────────────
for (let i = 0; i < EXTRA_TABS; i++) {
  const playerName = `Player ${i + 2}`;
  console.log(`Tab ${i + 2} — joining as ${playerName}…`);

  const page = await context.newPage();
  await page.goto(CLIENT_URL);

  // Wait for lobby + socket connected
  await page.waitForSelector('.join-btn:not([disabled])', { timeout: 15_000 });

  // Fill game ID and name in the "Join game" panel
  await page.locator('.gameid-input').fill(gameIdValue);
  const joinPanel = page.locator('.lobby-panel').last();
  await joinPanel.locator('input[placeholder="Enter your name"]').fill(playerName);

  // Click "Join game"
  await page.locator('.join-btn').click();

  // Wait until joined (sessionStorage gameId set, same as host)
  await page.waitForFunction(
    id => sessionStorage.getItem('spades_gameId') === id,
    gameIdValue,
    { timeout: 10_000 }
  );
}

console.log(`\nAll set! Game ${gameIdValue} is ready with ${EXTRA_TABS + 1} players.`);
console.log('Browser is open. Press Ctrl+C here to shut everything down.\n');

// ── Keep alive ────────────────────────────────────────────────────────────────
process.on('SIGINT', async () => {
  console.log('\nShutting down…');
  await browser.close().catch(() => {});
  devProcess?.kill();
  process.exit(0);
});

// Prevent the process from exiting while the browser is open
browser.on('disconnected', () => {
  console.log('Browser closed.');
  devProcess?.kill();
  process.exit(0);
});
