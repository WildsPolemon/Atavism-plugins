/** Обладнання каси: ваги COM/USB, USB-принтер, термінал Privat24 */

const BRIDGE_DEFAULT = 'http://127.0.0.1:8765';

export function serialSupported() {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

let scalePort = null;
let printerPort = null;

export async function connectScale(settings) {
  if (!serialSupported()) throw new Error('Web Serial не підтримується. Використайте Chrome/Edge або локальний міст.');
  scalePort = await navigator.serial.requestPort();
  await scalePort.open({
    baudRate: Number(settings.pos_scale_baud || 9600),
    dataBits: Number(settings.pos_scale_data_bits || 8),
    stopBits: Number(settings.pos_scale_stop_bits || 1),
    parity: settings.pos_scale_parity || 'none',
  });
  localStorage.setItem('starnet_scale_port', 'connected');
  return true;
}

export async function readScaleWeight(settings, timeoutMs = 3000) {
  const bridge = settings.pos_hardware_bridge || BRIDGE_DEFAULT;
  try {
    const r = await fetch(`${bridge}/scale/weight`, { method: 'GET', signal: AbortSignal.timeout(2000) });
    if (r.ok) { const j = await r.json(); return Number(j.weight || 0); }
  } catch { /* local bridge offline */ }

  if (!scalePort?.readable) {
    if (serialSupported() && settings.pos_scale_port === 'auto') await connectScale(settings);
    else throw new Error('Ваги не підключені. Налаштуйте COM/USB порт у Налаштування → Обладнання');
  }

  const reader = scalePort.readable.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  const deadline = Date.now() + timeoutMs;
  try {
    while (Date.now() < deadline) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value);
      const m = buf.match(/(\d+[.,]\d+)/);
      if (m) return parseFloat(m[1].replace(',', '.'));
    }
  } finally {
    reader.releaseLock();
  }
  throw new Error('Не вдалося зчитати вагу');
}

export async function connectPrinter(settings) {
  if (!serialSupported()) throw new Error('Web Serial не підтримується');
  printerPort = await navigator.serial.requestPort();
  await printerPort.open({ baudRate: Number(settings.pos_printer_baud || 9600) });
  return true;
}

function escPosReceipt(lines) {
  const ESC = '\x1B', GS = '\x1D';
  let out = ESC + '@';
  lines.forEach((l) => { out += l + '\n'; });
  out += GS + 'V' + '\x00';
  return new TextEncoder().encode(out);
}

export async function printReceipt(settings, lines) {
  const bridge = settings.pos_hardware_bridge || BRIDGE_DEFAULT;
  try {
    const r = await fetch(`${bridge}/printer/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines, width: settings.pos_receipt_width || 80 }),
      signal: AbortSignal.timeout(5000),
    });
    if (r.ok) return true;
  } catch { /* */ }

  if (settings.pos_printer_connection === 'browser') {
    if (!printerPort?.writable) await connectPrinter(settings);
    const writer = printerPort.writable.getWriter();
    await writer.write(escPosReceipt(lines));
    writer.releaseLock();
    return true;
  }

  window.print();
  return false;
}

/** Privat24 / ПриватБанк POS термінал */
export async function privat24Pay(settings, amount, saleId = '') {
  const bridge = settings.pos_hardware_bridge || BRIDGE_DEFAULT;
  const terminalIp = settings.pos_terminal_ip || '';
  const terminalPort = settings.pos_terminal_port || '2000';
  const merchantId = settings.pos_terminal_merchant || '';
  const terminalId = settings.pos_terminal_id || '';

  if (settings.pos_terminal_enabled !== '1') {
    throw new Error('Термінал вимкнено в налаштуваннях');
  }

  const payload = {
    amount: Math.round(amount * 100),
    currency: 'UAH',
    merchant_id: merchantId,
    terminal_id: terminalId,
    sale_id: saleId,
    provider: 'privat24',
  };

  try {
    const r = await fetch(`${bridge}/privat24/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, host: terminalIp, port: terminalPort }),
      signal: AbortSignal.timeout(120000),
    });
    const j = await r.json();
    if (!r.ok || j.error) throw new Error(j.error || 'Помилка терміналу');
    return { ok: true, rrn: j.rrn, auth_code: j.auth_code, card_mask: j.card_mask };
  } catch (e) {
    if (settings.pos_terminal_mode === 'manual') {
      const ok = window.confirm(`Термінал Privat24: проведіть оплату ${amount.toFixed(2)} грн на терміналі.\nПідтвердити успішну оплату?`);
      if (!ok) throw new Error('Оплату скасовано');
      return { ok: true, rrn: 'MANUAL', auth_code: '', card_mask: '' };
    }
    throw e;
  }
}

export async function testScale(settings) {
  const w = await readScaleWeight(settings, 5000);
  return `Вага: ${w} кг`;
}

export async function testPrinter(settings) {
  await printReceipt(settings, [
    settings.company_name || 'StarNet Core',
    '--- ТЕСТ ДРУКУ ---',
    new Date().toLocaleString('uk-UA'),
    'Принтер OK',
  ]);
  return 'Тестовий чек надіслано';
}

export async function testTerminal(settings) {
  const bridge = settings.pos_hardware_bridge || BRIDGE_DEFAULT;
  try {
    const r = await fetch(`${bridge}/privat24/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: settings.pos_terminal_ip,
        port: settings.pos_terminal_port || '2000',
        merchant_id: settings.pos_terminal_merchant,
        terminal_id: settings.pos_terminal_id,
      }),
      signal: AbortSignal.timeout(5000),
    });
    const j = await r.json();
    if (r.ok) return j.message || 'Термінал Privat24 доступний';
  } catch { /* */ }
  if (settings.pos_terminal_mode === 'manual') return 'Режим ручного підтвердження — термінал готовий';
  throw new Error('Міст обладнання недоступний (запустіть starnet-hardware-bridge на localhost:8765)');
}

export const EQUIPMENT_DEFAULTS = {
  pos_printer_enabled: '1',
  pos_printer_connection: 'usb_serial',
  pos_printer_baud: '9600',
  pos_printer_model: 'escpos',
  pos_scale_enabled: '0',
  pos_scale_port: 'COM3',
  pos_scale_baud: '9600',
  pos_scale_data_bits: '8',
  pos_scale_stop_bits: '1',
  pos_scale_parity: 'none',
  pos_scale_protocol: 'auto',
  pos_terminal_enabled: '0',
  pos_terminal_provider: 'privat24',
  pos_terminal_ip: '192.168.1.100',
  pos_terminal_port: '2000',
  pos_terminal_merchant: '',
  pos_terminal_id: '',
  pos_terminal_mode: 'bridge',
  pos_hardware_bridge: 'http://127.0.0.1:8765',
};
