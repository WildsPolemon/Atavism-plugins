const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const outDir = process.argv[2] || '/workspace/releases/editor_media_2026-07-04';
const cdpPort = process.argv[3] || '9222';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();

  return new Promise((resolve, reject) => {
    ws.on('open', () => {
      const api = {
        send(method, params = {}) {
          const msgId = ++id;
          return new Promise((res, rej) => {
            pending.set(msgId, {res, rej});
            ws.send(JSON.stringify({id: msgId, method, params}));
          });
        },
        close() {
          ws.close();
        },
      };
      resolve(api);
    });
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw);
      if (msg.id && pending.has(msg.id)) {
        const {res, rej} = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) {
          rej(new Error(JSON.stringify(msg.error)));
        } else {
          res(msg.result);
        }
      }
    });
    ws.on('error', reject);
  });
}

async function clickNav(api, section, tab) {
  const expr = `(() => {
    const clickByText = (selector, text) => {
      const el = [...document.querySelectorAll(selector)].find((n) => n.textContent.trim() === text);
      if (!el) return false;
      (el.closest('a') || el).click();
      return true;
    };
    const sectionOk = clickByText('fuse-nav-vertical-collapsable .nav-link-title', ${JSON.stringify(section)});
    if (!sectionOk) return 'section-missing';
    return 'section-clicked';
  })()`;
  return api.send('Runtime.evaluate', {expression: expr, returnByValue: true});
}

(async () => {
  const targets = await fetchJson(`http://127.0.0.1:${cdpPort}/json/list`);
  const pageTarget = targets.find((t) => t.type === 'page' && t.url.includes('localhost:4200'));
  if (!pageTarget) {
    throw new Error('Electron page target not found. Start electron with --remote-debugging-port=9222');
  }

  const api = await cdp(pageTarget.webSocketDebuggerUrl);
  await api.send('Page.enable');
  await api.send('Runtime.enable');

  await new Promise((r) => setTimeout(r, 3000));
  await clickNav(api, 'Character');
  await new Promise((r) => setTimeout(r, 1000));

  const tabExpr = `(() => {
    const el = [...document.querySelectorAll('fuse-nav-vertical-item .nav-link-title')]
      .find((n) => n.textContent.trim() === ${JSON.stringify('Class Abilities by Level')});
    if (!el) return 'tab-missing';
    (el.closest('a') || el).click();
    return 'tab-clicked';
  })()`;
  const tabResult = await api.send('Runtime.evaluate', {expression: tabExpr, returnByValue: true});
  console.log('Tab click:', tabResult.result.value);
  await new Promise((r) => setTimeout(r, 4000));

  const shot = await api.send('Page.captureScreenshot', {format: 'png', fromSurface: true});
  const outFile = path.join(outDir, 'class_abilities_by_level_editor_real.png');
  fs.writeFileSync(outFile, Buffer.from(shot.data, 'base64'));
  console.log('Saved CDP screenshot to', outFile);

  api.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
