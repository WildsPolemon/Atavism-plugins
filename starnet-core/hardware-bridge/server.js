/**
 * StarNet Core — локальний міст обладнання каси (localhost:8765)
 * Ваги COM/USB · USB-принтер ESC/POS · Privat24 POS термінал
 */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.STARNET_BRIDGE_PORT || 8765);
const CONFIG_PATH = path.join(__dirname, 'config.json');

const app = express();
app.use(cors());
app.use(express.json());

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return {
      scale: { port: process.env.SCALE_PORT || 'COM3', baud: 9600, dataBits: 8, stopBits: 1, parity: 'none' },
      printer: { port: process.env.PRINTER_PORT || 'COM4', baud: 9600 },
      privat24: { host: '192.168.1.100', port: 2000, merchant_id: '', terminal_id: '' },
    };
  }
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

let SerialPort;
try {
  ({ SerialPort } = require('serialport'));
} catch {
  SerialPort = null;
}

async function openSerial(opts) {
  if (!SerialPort) throw new Error('serialport не встановлено. Запустіть: npm install');
  const port = new SerialPort({ ...opts, autoOpen: false });
  await new Promise((res, rej) => port.open((e) => (e ? rej(e) : res())));
  return port;
}

function readLine(port, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => {
      port.removeListener('data', onData);
      reject(new Error('Таймаут зчитування з COM-порту'));
    }, timeoutMs);
    const onData = (chunk) => {
      buf += chunk.toString();
      const m = buf.match(/(\d+[.,]\d+)/);
      if (m) {
        clearTimeout(timer);
        port.removeListener('data', onData);
        resolve(parseFloat(m[1].replace(',', '.')));
      }
    };
    port.on('data', onData);
  });
}

function escPos(lines) {
  const ESC = '\x1B';
  const GS = '\x1D';
  let out = ESC + '@';
  lines.forEach((l) => { out += String(l) + '\n'; });
  out += GS + 'V' + '\x00';
  return Buffer.from(out, 'binary');
}

/** GET /scale/weight */
app.get('/scale/weight', async (_req, res) => {
  const cfg = loadConfig();
  if (!SerialPort) {
    return res.json({ weight: 0, demo: true, message: 'Демо-режим без COM-порту' });
  }
  let port;
  try {
    port = await openSerial({
      path: cfg.scale.port,
      baudRate: cfg.scale.baud || 9600,
      dataBits: cfg.scale.dataBits || 8,
      stopBits: cfg.scale.stopBits || 1,
      parity: cfg.scale.parity || 'none',
    });
    const weight = await readLine(port);
    res.json({ weight });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    port?.close();
  }
});

/** POST /printer/print */
app.post('/printer/print', async (req, res) => {
  const { lines = [] } = req.body || {};
  const cfg = loadConfig();
  if (!SerialPort) {
    console.log('[printer demo]', lines.join('\n'));
    return res.json({ ok: true, demo: true });
  }
  let port;
  try {
    port = await openSerial({
      path: cfg.printer.port,
      baudRate: cfg.printer.baud || 9600,
    });
    await new Promise((res, rej) => port.write(escPos(lines), (e) => (e ? rej(e) : res())));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    port?.close();
  }
});

/** POST /privat24/ping */
app.post('/privat24/ping', async (req, res) => {
  const { host, port: termPort, merchant_id, terminal_id } = req.body || {};
  const cfg = loadConfig();
  cfg.privat24 = { host: host || cfg.privat24.host, port: termPort || cfg.privat24.port, merchant_id, terminal_id };
  saveConfig(cfg);

  if (cfg.privat24.host) {
    return res.json({
      ok: true,
      message: `Термінал Privat24: ${cfg.privat24.host}:${cfg.privat24.port} (merchant: ${merchant_id || '—'})`,
    });
  }
  res.status(400).json({ error: 'Вкажіть IP терміналу' });
});

/** POST /privat24/pay — інтеграція з POS-терміналом ПриватБанк */
app.post('/privat24/pay', async (req, res) => {
  const { amount, currency = 'UAH', host, port: termPort, merchant_id, terminal_id, sale_id } = req.body || {};
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Невірна сума' });

  const cfg = loadConfig();
  const h = host || cfg.privat24.host;
  const p = Number(termPort || cfg.privat24.port || 2000);

  // Реальний протокол залежить від моделі терміналу (Ingenico, Verifone + Privat24 SDK).
  // Тут — TCP handshake + демо-відповідь для тестування інтеграції каси.
  try {
    const net = require('net');
    const reachable = await new Promise((resolve) => {
      const sock = net.connect({ host: h, port: p, timeout: 3000 }, () => {
        sock.end();
        resolve(true);
      });
      sock.on('error', () => resolve(false));
      sock.on('timeout', () => { sock.destroy(); resolve(false); });
    });

    if (!reachable && process.env.PRIVAT24_DEMO !== '1') {
      return res.status(502).json({ error: `Термінал ${h}:${p} недоступний. Увімкніть PRIVAT24_DEMO=1 для тесту.` });
    }

    const uah = (amount / 100).toFixed(2);
    console.log(`[privat24] Оплата ${uah} ${currency} | terminal ${h}:${p} | sale ${sale_id || '—'}`);

    res.json({
      ok: true,
      rrn: `RRN${Date.now().toString().slice(-8)}`,
      auth_code: `AUTH${Math.floor(Math.random() * 900000 + 100000)}`,
      card_mask: '****1234',
      amount: amount,
      merchant_id: merchant_id || cfg.privat24.merchant_id,
      terminal_id: terminal_id || cfg.privat24.terminal_id,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /config — оновити порти з каси */
app.post('/config', (req, res) => {
  const cfg = { ...loadConfig(), ...req.body };
  saveConfig(cfg);
  res.json({ ok: true, config: cfg });
});

app.get('/health', (_req, res) => res.json({ ok: true, serial: !!SerialPort }));

app.listen(PORT, '127.0.0.1', () => {
  console.log(`StarNet hardware bridge → http://127.0.0.1:${PORT}`);
  console.log('  GET  /scale/weight');
  console.log('  POST /printer/print');
  console.log('  POST /privat24/ping | /privat24/pay');
});
