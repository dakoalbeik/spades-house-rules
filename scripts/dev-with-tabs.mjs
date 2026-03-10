#!/usr/bin/env node
/**
 * Starts the dev server (npm run dev) then opens 4 browser tabs
 * pointing at the client URL once it's ready.
 *
 * Usage:  node scripts/dev-with-tabs.mjs
 *         node scripts/dev-with-tabs.mjs --port 5173 --tabs 4
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const args = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : fallback;
};

const CLIENT_PORT = Number(getArg('--port', '5173'));
const TAB_COUNT   = Number(getArg('--tabs', '4'));
const CLIENT_URL  = `http://localhost:${CLIENT_PORT}`;

// ── open a URL in the default browser (cross-platform) ──────────────────────
async function openUrl(url) {
  const platform = process.platform;
  if (platform === 'win32') {
    await execAsync(`start "" "${url}"`);
  } else if (platform === 'darwin') {
    await execAsync(`open "${url}"`);
  } else {
    await execAsync(`xdg-open "${url}"`);
  }
}

// ── poll until the dev server responds ──────────────────────────────────────
async function waitForServer(url, { intervalMs = 500, timeoutMs = 60_000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      // Node 18+ has built-in fetch; fall back to a TCP check otherwise
      const res = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (res.ok || res.status < 500) return true;
    } catch {
      // not ready yet
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`Server at ${url} did not respond within ${timeoutMs}ms`);
}

// ── main ─────────────────────────────────────────────────────────────────────
console.log('Starting dev server…');

const devProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'), // handle Windows leading slash
});

devProcess.on('error', err => {
  console.error('Failed to start dev server:', err.message);
  process.exit(1);
});

console.log(`Waiting for client at ${CLIENT_URL}…`);
try {
  await waitForServer(CLIENT_URL);
} catch (err) {
  console.error(err.message);
  devProcess.kill();
  process.exit(1);
}

console.log(`Opening ${TAB_COUNT} browser tab(s) at ${CLIENT_URL}`);
for (let i = 0; i < TAB_COUNT; i++) {
  await openUrl(CLIENT_URL);
  // small delay so each tab opens distinctly
  await new Promise(r => setTimeout(r, 200));
}

console.log('Done. Dev server is running. Press Ctrl+C to stop.');

// keep the process alive so the dev server stays up
process.on('SIGINT', () => {
  devProcess.kill();
  process.exit(0);
});
