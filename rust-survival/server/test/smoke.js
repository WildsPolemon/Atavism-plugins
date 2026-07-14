#!/usr/bin/env node
/** Quick smoke test for RUSt WebSocket server */
import WebSocket from 'ws';

const url = process.env.RUST_URL || 'ws://127.0.0.1:7777';
const ws = new WebSocket(url);
let passed = 0;

function ok(name) { passed++; console.log(`✓ ${name}`); }
function fail(name, err) { console.error(`✗ ${name}: ${err}`); process.exit(1); }

ws.on('open', () => {
  ok('connected');
  ws.send(JSON.stringify({ t: 'C2S_JOIN', name: 'TestBot' }));
});

ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString());
  if (msg.t === 'S2C_WELCOME') {
    ok('welcome');
    ws.send(JSON.stringify({ t: 'C2S_MOVE', x: 1, y: 1, z: 2, yaw: 90 }));
  } else if (msg.t === 'S2C_WORLD') {
    ok(`world nodes=${msg.nodes?.length ?? 0}`);
    if (msg.nodes?.length > 0) {
      ws.send(JSON.stringify({ t: 'C2S_GATHER', nodeId: msg.nodes[0].id }));
    }
  } else if (msg.t === 'S2C_INVENTORY') {
    ok(`inventory wood=${msg.slots?.wood ?? 0}`);
    ws.close();
  }
});

ws.on('error', (e) => fail('connection', e.message));
ws.on('close', () => {
  console.log(`\n${passed} checks passed`);
  process.exit(passed >= 3 ? 0 : 1);
});

setTimeout(() => fail('timeout', 'no response in 5s'), 5000);
