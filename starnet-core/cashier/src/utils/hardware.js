/** Обладнання каси — просте підключення як AinurPOS (без мосту) */

const LS_SCALE = 'starnet_scale_connected';
const LS_PRINTER = 'starnet_printer_wifi_ip';
const LS_PRINTER_USB = 'starnet_printer_usb';

export function serialSupported() {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

let scalePort = null;
let printerPort = null;

function openOpts(settings, kind = 'scale') {
  const baud = Number(kind === 'scale' ? settings.pos_scale_baud : settings.pos_printer_baud) || 9600;
  if (kind === 'scale') {
    return {
      baudRate: baud,
      dataBits: Number(settings.pos_scale_data_bits || 8),
      stopBits: Number(settings.pos_scale_stop_bits || 1),
      parity: settings.pos_scale_parity || 'none',
    };
  }
  return { baudRate: baud };
}

async function openSerialPort(port, settings, kind = 'scale') {
  if (port.readable || port.writable) {
    try { await port.close(); } catch { /* */ }
  }
  await port.open(openOpts(settings, kind));
}

/** Авто-підключення ваг: спочатку вже дозволені порти, потім діалог вибору */
export async function autoConnectScale(settings) {
  if (!serialSupported()) throw new Error('Потрібен Chrome або Edge для підключення ваг');

  const ports = await navigator.serial.getPorts();
  for (const port of ports) {
    try {
      await openSerialPort(port, settings, 'scale');
      scalePort = port;
      localStorage.setItem(LS_SCALE, '1');
      return 'Ваги знайдено та підключено';
    } catch { /* спробувати наступний */ }
  }

  scalePort = await navigator.serial.requestPort();
  await openSerialPort(scalePort, settings, 'scale');
  localStorage.setItem(LS_SCALE, '1');
  return 'Ваги підключено';
}

export async function connectScale(settings) {
  return autoConnectScale(settings);
}

function parseWeight(buf, protocol) {
  const text = typeof buf === 'string' ? buf : new TextDecoder().decode(buf);
  if (protocol === 'cas') {
    const m = text.match(/[SW][NT]?\s*(\d+[.,]\d+)/i);
    if (m) return parseFloat(m[1].replace(',', '.'));
  }
  const m = text.match(/(\d+[.,]\d+)/);
  if (m) return parseFloat(m[1].replace(',', '.'));
  return null;
}

export async function readScaleWeight(settings, timeoutMs = 3000) {
  if (!scalePort?.readable) {
    if (settings.pos_scale_enabled === '1' || settings.pos_scale_enabled === true) {
      await autoConnectScale(settings);
    } else {
      throw new Error('Увімкніть ваги в Налаштування → Обладнання');
    }
  }

  const reader = scalePort.readable.getReader();
  let buf = '';
  const deadline = Date.now() + timeoutMs;
  try {
    while (Date.now() < deadline) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += new TextDecoder().decode(value);
      const w = parseWeight(buf, settings.pos_scale_protocol || 'auto');
      if (w != null) return w;
    }
  } finally {
    reader.releaseLock();
  }
  throw new Error('Покладіть товар на ваги та спробуйте знову');
}

function escPosReceipt(lines) {
  const ESC = '\x1B';
  const GS = '\x1D';
  let out = ESC + '@';
  lines.forEach((l) => { out += String(l) + '\n'; });
  out += GS + 'V' + '\x00';
  return new TextEncoder().encode(out);
}

/** Сканування WiFi-принтерів у локальній мережі */
export async function discoverWifiPrinters(onProgress) {
  const subnet = await guessSubnet();
  const found = [];
  const batch = 20;

  for (let start = 1; start <= 254; start += batch) {
    const jobs = [];
    for (let i = start; i < start + batch && i <= 254; i++) {
      const ip = `${subnet}.${i}`;
      jobs.push(probeHost(ip).then((ok) => { if (ok) found.push({ ip, name: `Принтер ${ip}` }); }));
    }
    await Promise.all(jobs);
    onProgress?.(Math.min(100, Math.round((start / 254) * 100)));
  }
  return found;
}

async function guessSubnet() {
  try {
    const r = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2000) });
    const { ip } = await r.json();
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}`;
  } catch { /* */ }
  return '192.168.1';
}

function probeHost(ip) {
  return new Promise((resolve) => {
    const img = new Image();
    const done = (ok) => { clearTimeout(t); resolve(ok); };
    const t = setTimeout(() => done(false), 350);
    img.onload = () => done(true);
    img.onerror = () => {
      fetch(`http://${ip}/`, { mode: 'no-cors', signal: AbortSignal.timeout(350) })
        .then(() => done(true))
        .catch(() => done(false));
    };
    img.src = `http://${ip}/favicon.ico?${Date.now()}`;
  });
}

/** Друк на WiFi принтер (ESC/POS через HTTP — більшість WiFi чекових принтерів) */
async function printWifi(settings, data) {
  const ip = settings.pos_printer_wifi_ip || localStorage.getItem(LS_PRINTER);
  if (!ip) throw new Error('Спочатку знайдіть WiFi-принтер');

  const urls = [
    `http://${ip}/`,
    `http://${ip}/print`,
    `http://${ip}:8080/print`,
  ];
  for (const url of urls) {
    try {
      await fetch(url, { method: 'POST', mode: 'no-cors', body: data });
      return true;
    } catch { /* */ }
  }
  throw new Error(`Не вдалося надіслати на принтер ${ip}`);
}

export async function autoConnectPrinter(settings) {
  const mode = settings.pos_printer_connection || 'wifi';

  if (mode === 'usb' && serialSupported()) {
    const ports = await navigator.serial.getPorts();
    for (const port of ports) {
      try {
        await openSerialPort(port, settings, 'printer');
        printerPort = port;
        localStorage.setItem(LS_PRINTER_USB, '1');
        return 'USB-принтер підключено';
      } catch { /* */ }
    }
    printerPort = await navigator.serial.requestPort();
    await openSerialPort(printerPort, settings, 'printer');
    localStorage.setItem(LS_PRINTER_USB, '1');
    return 'USB-принтер підключено';
  }

  const ip = settings.pos_printer_wifi_ip;
  if (ip) {
    localStorage.setItem(LS_PRINTER, ip);
    return `WiFi-принтер: ${ip}`;
  }
  throw new Error('Натисніть «Знайти принтер у WiFi»');
}

export async function connectPrinter(settings) {
  return autoConnectPrinter(settings);
}

export async function printReceipt(settings, lines) {
  const data = escPosReceipt(lines);
  const mode = settings.pos_printer_connection || 'wifi';

  if (mode === 'usb' && serialSupported()) {
    if (!printerPort?.writable) await autoConnectPrinter({ ...settings, pos_printer_connection: 'usb' });
    const writer = printerPort.writable.getWriter();
    await writer.write(data);
    writer.releaseLock();
    return true;
  }

  if (mode === 'wifi') {
    try {
      await printWifi(settings, data);
      return true;
    } catch { /* fallback */ }
  }

  window.print();
  return false;
}

/** Privat24 — оплата на фізичному терміналі, підтвердження касиром */
export async function privat24Pay(settings, amount) {
  if (settings.pos_terminal_enabled !== '1') {
    throw new Error('Термінал вимкнено в налаштуваннях');
  }
  const ok = window.confirm(
    `Оплата карткою: ${amount.toFixed(2)} грн\n\nПроведіть оплату на терміналі Privat24${settings.pos_terminal_ip ? ` (${settings.pos_terminal_ip})` : ''}.\n\nПідтвердити успішну оплату?`
  );
  if (!ok) throw new Error('Оплату скасовано');
  return { ok: true, rrn: `TX${Date.now()}`, auth_code: '', card_mask: '' };
}

export async function testScale(settings) {
  const w = await readScaleWeight(settings, 5000);
  return `Вага: ${w} кг`;
}

export async function testPrinter(settings) {
  await printReceipt(settings, [
    settings.company_name || 'AinurPOS',
    '--- ТЕСТ ДРУКУ ---',
    new Date().toLocaleString('uk-UA'),
    'Принтер OK',
  ]);
  return 'Тестовий чек надіслано';
}

export async function testTerminal(settings) {
  if (settings.pos_terminal_enabled !== '1') return 'Термінал вимкнено';
  if (settings.pos_terminal_ip) return `Термінал Privat24: ${settings.pos_terminal_ip}`;
  return 'Термінал готовий — оплата підтверджується на пристрої';
}

export function scaleConnected() {
  return !!scalePort?.readable || localStorage.getItem(LS_SCALE) === '1';
}

export function printerConnected(settings) {
  const mode = settings?.pos_printer_connection || 'wifi';
  if (mode === 'usb') return !!printerPort?.writable || localStorage.getItem(LS_PRINTER_USB) === '1';
  return !!(settings?.pos_printer_wifi_ip || localStorage.getItem(LS_PRINTER));
}

export const EQUIPMENT_DEFAULTS = {
  pos_printer_enabled: '1',
  pos_printer_connection: 'wifi',
  pos_printer_wifi_ip: '',
  pos_printer_baud: '9600',
  pos_scale_enabled: '0',
  pos_scale_baud: '9600',
  pos_scale_data_bits: '8',
  pos_scale_stop_bits: '1',
  pos_scale_parity: 'none',
  pos_scale_protocol: 'auto',
  pos_terminal_enabled: '0',
  pos_terminal_ip: '',
};
