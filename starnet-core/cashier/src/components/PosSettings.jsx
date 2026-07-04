import { useState } from 'react';
import { ArrowLeft, SlidersHorizontal, Plug, ScanBarcode, Scale, Printer, CreditCard } from 'lucide-react';
import { testScale, testPrinter, testTerminal, serialSupported, connectScale, connectPrinter } from '../utils/hardware';

const TABS = [
  { id: 'basic', label: 'Основні', icon: SlidersHorizontal },
  { id: 'equipment', label: 'Обладнання', icon: Plug },
  { id: 'display', label: 'Відображення товарів', icon: ScanBarcode },
];

export default function PosSettings({ settings, onClose, onSave }) {
  const [tab, setTab] = useState('basic');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [testing, setTesting] = useState('');

  const [form, setForm] = useState({
    pos_theme: settings.pos_theme || 'light',
    pos_sound: settings.pos_sound || 'on',
    pos_language: settings.pos_language || 'uk',
    pos_print_default: settings.pos_print_default !== '0',
    pos_printer_type: settings.pos_printer_type || 'receipt',
    pos_receipt_width: settings.pos_receipt_width || '80',
    pos_receipt_font: settings.pos_receipt_font || '4',
    pos_receipt_margin: settings.pos_receipt_margin || '4',
    pos_show_zero_stock: settings.pos_show_zero_stock !== '0',
    pos_sort_by: settings.pos_sort_by || 'updated_at',
    pos_sort_dir: settings.pos_sort_dir || 'desc',
    pos_printer_enabled: settings.pos_printer_enabled !== '0',
    pos_printer_connection: settings.pos_printer_connection || 'usb_serial',
    pos_printer_baud: settings.pos_printer_baud || '9600',
    pos_printer_model: settings.pos_printer_model || 'escpos',
    pos_scale_enabled: settings.pos_scale_enabled === '1',
    pos_scale_port: settings.pos_scale_port || 'COM3',
    pos_scale_baud: settings.pos_scale_baud || '9600',
    pos_scale_data_bits: settings.pos_scale_data_bits || '8',
    pos_scale_stop_bits: settings.pos_scale_stop_bits || '1',
    pos_scale_parity: settings.pos_scale_parity || 'none',
    pos_scale_protocol: settings.pos_scale_protocol || 'auto',
    pos_terminal_enabled: settings.pos_terminal_enabled === '1',
    pos_terminal_provider: settings.pos_terminal_provider || 'privat24',
    pos_terminal_ip: settings.pos_terminal_ip || '192.168.1.100',
    pos_terminal_port: settings.pos_terminal_port || '2000',
    pos_terminal_merchant: settings.pos_terminal_merchant || '',
    pos_terminal_id: settings.pos_terminal_id || '',
    pos_terminal_mode: settings.pos_terminal_mode || 'bridge',
    pos_hardware_bridge: settings.pos_hardware_bridge || 'http://127.0.0.1:8765',
    pos_barcode_test: '',
    pos_scale_test: '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toPayload = () => ({
    pos_theme: form.pos_theme,
    pos_sound: form.pos_sound,
    pos_language: form.pos_language,
    pos_print_default: form.pos_print_default ? '1' : '0',
    pos_printer_type: form.pos_printer_type,
    pos_receipt_width: form.pos_receipt_width,
    pos_receipt_font: form.pos_receipt_font,
    pos_receipt_margin: form.pos_receipt_margin,
    pos_show_zero_stock: form.pos_show_zero_stock ? '1' : '0',
    pos_sort_by: form.pos_sort_by,
    pos_sort_dir: form.pos_sort_dir,
    pos_printer_enabled: form.pos_printer_enabled ? '1' : '0',
    pos_printer_connection: form.pos_printer_connection,
    pos_printer_baud: form.pos_printer_baud,
    pos_printer_model: form.pos_printer_model,
    pos_scale_enabled: form.pos_scale_enabled ? '1' : '0',
    pos_scale_port: form.pos_scale_port,
    pos_scale_baud: form.pos_scale_baud,
    pos_scale_data_bits: form.pos_scale_data_bits,
    pos_scale_stop_bits: form.pos_scale_stop_bits,
    pos_scale_parity: form.pos_scale_parity,
    pos_scale_protocol: form.pos_scale_protocol,
    pos_terminal_enabled: form.pos_terminal_enabled ? '1' : '0',
    pos_terminal_provider: form.pos_terminal_provider,
    pos_terminal_ip: form.pos_terminal_ip,
    pos_terminal_port: form.pos_terminal_port,
    pos_terminal_merchant: form.pos_terminal_merchant,
    pos_terminal_id: form.pos_terminal_id,
    pos_terminal_mode: form.pos_terminal_mode,
    pos_hardware_bridge: form.pos_hardware_bridge,
  });

  const runTest = async (kind) => {
    setTesting(kind); setErr(''); setMsg('');
    const s = { ...settings, ...toPayload() };
    try {
      if (kind === 'scale') {
        const result = await testScale(s);
        const w = result.replace(/^Вага:\s*/, '');
        set('pos_scale_test', w);
        setMsg(result);
      } else if (kind === 'printer') { setMsg(await testPrinter(s)); }
      else if (kind === 'terminal') { setMsg(await testTerminal(s)); }
    } catch (e) { setErr(e.message); }
    finally { setTesting(''); }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ainur-bg">
      <header className="flex h-14 shrink-0 items-center gap-3 bg-ainur-blue px-4 text-white">
        <button type="button" onClick={onClose} className="flex items-center gap-2 text-sm font-medium">
          <ArrowLeft className="h-5 w-5" /> Налаштування
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-56 shrink-0 border-r border-ainur-border bg-white py-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setTab(id)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm ${tab === id ? 'bg-blue-50 text-ainur-blue font-medium' : 'text-ainur-text hover:bg-gray-50'}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-auto bg-white p-6">
          {msg && <p className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</p>}
          {err && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{err}</p>}

          {tab === 'basic' && (
            <>
              <Section title="Оформлення">
                <RadioGroup value={form.pos_theme} onChange={(v) => set('pos_theme', v)} options={[
                  { v: 'auto', l: 'Автоматично' }, { v: 'light', l: 'Світлий' }, { v: 'dark', l: 'Темний' },
                ]} />
              </Section>
              <Section title="Звук">
                <RadioGroup value={form.pos_sound} onChange={(v) => set('pos_sound', v)} options={[
                  { v: 'on', l: 'Увімкнути' }, { v: 'off', l: 'Вимкнути' },
                ]} />
              </Section>
              <Section title="Мова інтерфейсу">
                <select value={form.pos_language} onChange={(e) => set('pos_language', e.target.value)} className="inp">
                  <option value="uk">Українська</option><option value="en">English</option><option value="ru">Русский</option>
                </select>
              </Section>
              <Section title="Друк на принтері">
                <label className="mb-3 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.pos_print_default} onChange={(e) => set('pos_print_default', e.target.checked)} />
                  Друкувати чек за замовчуванням
                </label>
                <RadioGroup value={form.pos_printer_type} onChange={(v) => set('pos_printer_type', v)} options={[
                  { v: 'a4', l: 'Принтер A4' }, { v: 'receipt', l: 'Принтер чека' },
                ]} />
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <Field label="Ширина (мм)" value={form.pos_receipt_width} onChange={(v) => set('pos_receipt_width', v)} />
                  <Field label="Шрифт (мм)" value={form.pos_receipt_font} onChange={(v) => set('pos_receipt_font', v)} />
                  <Field label="Відступ (мм)" value={form.pos_receipt_margin} onChange={(v) => set('pos_receipt_margin', v)} />
                </div>
              </Section>
            </>
          )}

          {tab === 'equipment' && (
            <>
              {/* Privat24 */}
              <Card title="Інтеграція Privat24 (ПриватБанк)" icon={CreditCard} warn={!form.pos_terminal_enabled}>
                <label className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={form.pos_terminal_enabled} onChange={(e) => set('pos_terminal_enabled', e.target.checked)} />
                  Увімкнути банківський термінал для оплати карткою
                </label>
                <p className="mb-3 text-xs text-ainur-muted">Підключення POS-терміналу ПриватБанк (Privat24) через TCP/IP або USB/COM через локальний міст.</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Field label="IP терміналу" value={form.pos_terminal_ip} onChange={(v) => set('pos_terminal_ip', v)} />
                  <Field label="Порт" value={form.pos_terminal_port} onChange={(v) => set('pos_terminal_port', v)} />
                  <Field label="Merchant ID" value={form.pos_terminal_merchant} onChange={(v) => set('pos_terminal_merchant', v)} />
                  <Field label="Terminal ID" value={form.pos_terminal_id} onChange={(v) => set('pos_terminal_id', v)} />
                </div>
                <label className="mb-1 block text-xs text-ainur-muted">Режим підключення</label>
                <select value={form.pos_terminal_mode} onChange={(e) => set('pos_terminal_mode', e.target.value)} className="inp mb-3">
                  <option value="bridge">Міст (localhost:8765) — рекомендовано</option>
                  <option value="tcp">TCP напряму до терміналу</option>
                  <option value="manual">Ручне підтвердження на терміналі</option>
                </select>
                <Field label="URL мосту обладнання" value={form.pos_hardware_bridge} onChange={(v) => set('pos_hardware_bridge', v)} />
                <TestBtn label="Перевірити термінал Privat24" loading={testing === 'terminal'} onClick={() => runTest('terminal')} />
              </Card>

              {/* Printer USB */}
              <Card title="USB принтер чека (ESC/POS)" icon={Printer}>
                <label className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={form.pos_printer_enabled} onChange={(e) => set('pos_printer_enabled', e.target.checked)} />
                  Увімкнути друк на USB/COM принтері
                </label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="lbl">Підключення</label>
                    <select value={form.pos_printer_connection} onChange={(e) => set('pos_printer_connection', e.target.value)} className="inp">
                      <option value="usb_serial">USB → COM (Serial)</option>
                      <option value="browser">Web Serial (Chrome)</option>
                      <option value="bridge">Через міст</option>
                    </select>
                  </div>
                  <Field label="Швидкість (baud)" value={form.pos_printer_baud} onChange={(v) => set('pos_printer_baud', v)} />
                </div>
                <div className="flex gap-2">
                  {serialSupported() && (
                    <button type="button" onClick={() => connectPrinter(toPayload()).then(() => setMsg('Принтер підключено')).catch((e) => setErr(e.message))}
                      className="btn-secondary">Підключити USB принтер</button>
                  )}
                  <TestBtn label="Тест друку" loading={testing === 'printer'} onClick={() => runTest('printer')} />
                </div>
              </Card>

              {/* Scales */}
              <Card title="Терези (COM / USB порт)" icon={Scale}>
                <label className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={form.pos_scale_enabled} onChange={(e) => set('pos_scale_enabled', e.target.checked)} />
                  Увімкнути зчитування ваги з терезів
                </label>
                <p className="mb-3 text-xs text-ainur-muted">Підтримка ваг через COM-порт (USB-адаптер). Протоколи: CAS, Штрих-М, авто.</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Field label="COM порт" value={form.pos_scale_port} onChange={(v) => set('pos_scale_port', v)} placeholder="COM3 / /dev/ttyUSB0" />
                  <Field label="Baud rate" value={form.pos_scale_baud} onChange={(v) => set('pos_scale_baud', v)} />
                  <Field label="Data bits" value={form.pos_scale_data_bits} onChange={(v) => set('pos_scale_data_bits', v)} />
                  <Field label="Stop bits" value={form.pos_scale_stop_bits} onChange={(v) => set('pos_scale_stop_bits', v)} />
                </div>
                <label className="lbl">Парність</label>
                <select value={form.pos_scale_parity} onChange={(e) => set('pos_scale_parity', e.target.value)} className="inp mb-3">
                  <option value="none">None</option><option value="even">Even</option><option value="odd">Odd</option>
                </select>
                <label className="lbl">Протокол</label>
                <select value={form.pos_scale_protocol} onChange={(e) => set('pos_scale_protocol', e.target.value)} className="inp mb-3">
                  <option value="auto">Авто</option><option value="cas">CAS</option><option value="shtrih">Штрих-М</option><option value="raw">Raw ASCII</option>
                </select>
                <div className="flex gap-2 mb-3">
                  {serialSupported() && (
                    <button type="button" onClick={() => connectScale(toPayload()).then(() => setMsg('Терези підключено')).catch((e) => setErr(e.message))}
                      className="btn-secondary">Підключити COM/USB</button>
                  )}
                  <TestBtn label="Зчитати вагу" loading={testing === 'scale'} onClick={() => runTest('scale')} />
                </div>
                <Field label="Діагностика — покладіть товар на ваги" value={form.pos_scale_test} onChange={(v) => set('pos_scale_test', v)} placeholder="Вага з'явиться тут..." readOnly />
              </Card>

              {/* Barcode scanner diagnostic */}
              <Card title="Діагностика обладнання" icon={ScanBarcode}>
                <p className="mb-2 text-sm text-ainur-muted">Сканер штрих-кодів</p>
                <Field label="Штрих-код" value={form.pos_barcode_test} onChange={(v) => set('pos_barcode_test', v)} placeholder="Відскануйте код для перевірки" />
              </Card>
            </>
          )}

          {tab === 'display' && (
            <>
              <Section title="Товари з нульовим залишком">
                <RadioGroup value={form.pos_show_zero_stock ? 'show' : 'hide'} onChange={(v) => set('pos_show_zero_stock', v === 'show')} options={[
                  { v: 'show', l: 'Показувати' }, { v: 'hide', l: 'Не показувати' },
                ]} />
              </Section>
              <Section title="Сортування товарів">
                <select value={form.pos_sort_by} onChange={(e) => set('pos_sort_by', e.target.value)} className="inp mb-2">
                  <option value="name">Найменування</option><option value="sale_price">Ціна</option><option value="updated_at">Дата зміни</option>
                </select>
                <RadioGroup value={form.pos_sort_dir} onChange={(v) => set('pos_sort_dir', v)} options={[
                  { v: 'asc', l: 'За зростанням' }, { v: 'desc', l: 'За спаданням' },
                ]} />
              </Section>
              <button type="button" onClick={() => onSave({ ...toPayload(), pos_reset: '1' })}
                className="mt-4 text-sm text-ainur-muted hover:text-red-600">ВСТАНОВИТИ НАЛАШТУВАННЯ ЗА ЗАМОВЧУВАННЯМ</button>
            </>
          )}

          <p className="mt-8 text-center text-xs text-ainur-muted">Версія: 4.0.1 (StarNet Core)</p>
        </div>
      </div>

      <div className="border-t border-ainur-border bg-white p-4 flex gap-2">
        <button type="button" onClick={() => onSave(toPayload())} className="rounded-lg bg-ainur-blue px-6 py-2.5 text-sm font-semibold text-white">Зберегти</button>
        <button type="button" onClick={onClose} className="rounded-lg border border-ainur-border px-6 py-2.5 text-sm">Скасувати</button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return <div className="mb-6 max-w-2xl"><h3 className="mb-3 font-medium text-ainur-blue">{title}</h3>{children}</div>;
}

function Card({ title, icon: Icon, warn, children }) {
  return (
    <div className="mb-6 max-w-2xl rounded-xl border border-ainur-border p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-ainur-blue" />
        <h3 className="font-medium">{title}</h3>
        {warn && <span className="text-xs text-amber-600">⚠ Потрібне налаштування</span>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, readOnly }) {
  return (
    <div>
      <label className="lbl">{label}</label>
      <input value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} readOnly={readOnly}
        className="inp" />
    </div>
  );
}

function TestBtn({ label, onClick, loading }) {
  return (
    <button type="button" onClick={onClick} disabled={loading}
      className="rounded-lg border border-ainur-blue px-4 py-2 text-sm text-ainur-blue hover:bg-blue-50 disabled:opacity-50">
      {loading ? '...' : label}
    </button>
  );
}

function RadioGroup({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className={`rounded-lg border px-4 py-2 text-sm ${value === o.v ? 'border-ainur-blue bg-blue-50 text-ainur-blue' : 'border-ainur-border'}`}>
          {o.l}
        </button>
      ))}
    </div>
  );
}
