#!/usr/bin/env node
// Production smoke test for the StadiumMind AI API.
// Verifies: health, matches list, and ticket verification (valid + mismatch).
// Assumes the API is already running (npm run start --workspace @stadiummind/api).
// Usage: node scripts/smoke.mjs [baseUrl]
//   default baseUrl = http://localhost:4000/api

const BASE = process.argv[2] || process.env.API_BASE_URL || 'http://localhost:4000/api';
const MATCH_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; // France vs Spain (demo seed)

let failures = 0;

function ok(name, cond, detail = '') {
  const status = cond ? 'PASS' : 'FAIL';
  if (!cond) failures++;
  console.log(`  [${status}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function getJson(path, init) {
  const res = await fetch(`${BASE}${path}`, init);
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function main() {
  console.log(`\nStadiumMind AI smoke test → ${BASE}\n`);

  try {
    // 1. Health
    const health = await getJson('/health');
    ok('GET /health returns 200', health.status === 200, `status ${health.status}`);
    ok('health.ok is true', health.body.ok === true);

    // 2. Matches
    const matches = await getJson('/matches');
    ok('GET /matches returns 200', matches.status === 200, `status ${matches.status}`);
    ok('matches list is non-empty', Array.isArray(matches.body.matches) && matches.body.matches.length > 0,
      `count ${matches.body.matches?.length ?? 0}`);

    // 3. Ticket verify — valid
    const valid = await getJson('/tickets/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: 'WC2026-453621', matchId: MATCH_ID }),
    });
    ok('POST /tickets/verify (valid) returns 200', valid.status === 200, `status ${valid.status}`);
    ok('valid ticket verified', valid.body.valid === true && valid.body.reason === 'ok');

    // 4. Ticket verify — wrong match (WC2026-777111 belongs to Dallas match)
    const mismatch = await getJson('/tickets/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: 'WC2026-777111', matchId: MATCH_ID }),
    });
    ok('wrong-match ticket rejected', mismatch.body.valid === false && mismatch.body.reason === 'match_mismatch');
  } catch (err) {
    failures++;
    console.log(`\n  [FAIL] Could not reach API: ${err.message}`);
    console.log('  Is the API running?  npm run start --workspace @stadiummind/api\n');
  }

  console.log(`\n${failures === 0 ? '✅ All smoke checks passed.' : `❌ ${failures} check(s) failed.`}\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
