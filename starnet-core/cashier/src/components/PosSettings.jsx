import { useState } from 'react';
import { ArrowLeft, SlidersHorizontal, Plug, ScanBarcode, Scale, Printer, CreditCard, Wifi, Search, Receipt } from 'lucide-react';
import { api } from '../api';
import {
  testScale, testPrinter, testTerminal, serialSupported,
  autoConnectScale, autoConnectPrinter, discoverWifiPrinters,
  scaleConnected, printerConnected,
} from '../utils/hardware';

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
  const [scanPct, setScanPct] = useState(0);
  const [foundPrinters, setFoundPrinters] = useState([]);

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
    pos_printer_connection: settings.pos_printer_connection || 'wifi',
    pos_printer_wifi_ip: settings.pos_printer_wifi_ip || '',
    pos_scale_enabled: settings.pos_scale_enabled === '1',
    pos_scale_test: '',
    pos_terminal_enabled: settings.pos_terminal_enabled === '1',
    pos_terminal_ip: settings.pos_terminal_ip || '',
    pos_barcode_test: '',
    prro_enabled: settings.prro_enabled === '1',
    checkbox_license_key: settings.checkbox_license_key || '',
    checkbox_login: settings.checkbox_login || '',
    checkbox_password: settings.checkbox_password || '',
    pos_fiscal_default: settings.pos_fiscal_default === '1',
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
    pos_printer_wifi_ip: form.pos_printer_wifi_ip,
    pos_scale_enabled: form.pos_scale_enabled ? '1' : '0',
    pos_terminal_enabled: form.pos_terminal_enabled ? '1' : '0',
    pos_terminal_ip: form.pos_terminal_ip,
    prro_enabled: form.prro_enabled ? '1' : '0',
    checkbox_license_key: form.checkbox_license_key,
    checkbox_login: form.checkbox_login,
    checkbox_password: form.checkbox_password,
    pos_fiscal_default: form.pos_fiscal_default ? '1' : '0',
  });

  const s = () => ({ ...settings, ...toPayload() });

  const runTest = async (kind) => {
    setTesting(kind); setErr(''); setMsg('');
    try {
      if (kind === 'scale') {
        const result = await testScale(s());
        set('pos_scale_test', result.replace(/^Вага:\s*/, ''));
        setMsg(result);
      } else if (kind === 'printer') setMsg(await testPrinter(s()));
      else if (kind === 'terminal') setMsg(await testTerminal(s()));
      else if (kind === 'checkbox') {
        await api.updateSettings(toPayload());
        const r = await api.prroTest();
        setMsg(r.message || 'Підключено до Checkbox');
      }
    } catch (e) { setErr(e.message); }
    finally { setTesting(''); }
  };

  const findScale = async () => {
    setErr(''); setMsg('');
    try {
      setMsg(await autoConnectScale(s()));
    } catch (e) { setErr(e.message); }
  };

  const findPrinter = async () => {
    setErr(''); setMsg(''); setScanPct(0); setFoundPrinters([]);
    setTesting('scan');
    try {
      const list = await discoverWifiPrinters(setScanPct);
      setFoundPrinters(list);
      if (list.length === 1) {
        set('pos_printer_wifi_ip', list[0].ip);
        setMsg(`Знайдено принтер: ${list[0].ip}`);
      } else if (list.length > 1) {
        setMsg(`Знайдено ${list.length} пристроїв — оберіть принтер`);
      } else {
        setErr('Принтер не знайдено. Перевірте WiFi та вкажіть IP вручну.');
      }
    } catch (e) { setErr(e.message); }
    finally { setTesting(''); setScanPct(0); }
  };

  const scaleOk = scaleConnected();
  const printerOk = printerConnected(s());

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
              <p className="mb-4 text-sm text-ainur-muted">Підключіть обладнання — система сама знайде пристрої у мережі або через USB.</p>

              {/* Scales — simple */}
              <Card title="Терези" icon={Scale} status={scaleOk ? 'ok' : form.pos_scale_enabled ? 'warn' : null}>
                <label className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={form.pos_scale_enabled} onChange={(e) => set('pos_scale_enabled', e.target.checked)} />
                  Увімкнути ваги
                </label>
                <p className="mb-3 text-xs text-ainur-muted">Підключіть ваги через USB. Натисніть кнопку — браузер знайде пристрій автоматично.</p>
                {serialSupported() ? (
                  <button type="button" onClick={findScale}
                    className="mb-3 flex items-center gap-2 rounded-lg bg-ainur-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-ainur-blue-dark">
                    <Search className="h-4 w-4" />
                    {scaleOk ? 'Ваги підключені ✓' : 'Знайти і підключити ваги'}
                  </button>
                ) : (
                  <p className="mb-3 text-xs text-amber-600">Відкрийте касу в Chrome або Edge для підключення ваг</p>
                )}
                <div className="flex gap-2 mb-3">
                  <TestBtn label="Зчитати вагу" loading={testing === 'scale'} onClick={() => runTest('scale')} />
                </div>
                <Field label="Поточна вага" value={form.pos_scale_test} placeholder="кг" readOnly />
              </Card>

              {/* WiFi Printer — simple */}
              <Card title="Принтер чека (WiFi)" icon={Printer} status={printerOk ? 'ok' : form.pos_printer_enabled ? 'warn' : null}>
                <label className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={form.pos_printer_enabled} onChange={(e) => set('pos_printer_enabled', e.target.checked)} />
                  Увімкнути друк чеків
                </label>
                <div className="mb-3 flex gap-2">
                  <RadioGroup value={form.pos_printer_connection} onChange={(v) => set('pos_printer_connection', v)} options={[
                    { v: 'wifi', l: 'WiFi' }, { v: 'usb', l: 'USB' },
                  ]} />
                </div>

                {form.pos_printer_connection === 'wifi' && (
                  <>
                    <p className="mb-3 text-xs text-ainur-muted">Принтер має бути в тій самій WiFi-мережі, що й каса.</p>
                    <button type="button" onClick={findPrinter} disabled={testing === 'scan'}
                      className="mb-3 flex items-center gap-2 rounded-lg bg-ainur-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-ainur-blue-dark disabled:opacity-50">
                      <Wifi className="h-4 w-4" />
                      {testing === 'scan' ? `Пошук... ${scanPct}%` : 'Знайти принтер у WiFi'}
                    </button>
                    {foundPrinters.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {foundPrinters.map((p) => (
                          <button key={p.ip} type="button" onClick={() => { set('pos_printer_wifi_ip', p.ip); setMsg(`Обрано: ${p.ip}`); }}
                            className={`rounded-lg border px-3 py-1.5 text-sm ${form.pos_printer_wifi_ip === p.ip ? 'border-ainur-blue bg-blue-50 text-ainur-blue' : 'border-ainur-border'}`}>
                            {p.ip}
                          </button>
                        ))}
                      </div>
                    )}
                    <Field label="IP принтера (якщо знаєте)" value={form.pos_printer_wifi_ip} onChange={(v) => set('pos_printer_wifi_ip', v)} placeholder="192.168.1.50" />
                  </>
                )}

                {form.pos_printer_connection === 'usb' && serialSupported() && (
                  <button type="button" onClick={() => autoConnectPrinter(s()).then(setMsg).catch((e) => setErr(e.message))}
                    className="mb-3 rounded-lg border border-ainur-border px-4 py-2 text-sm hover:bg-gray-50">
                    Підключити USB-принтер
                  </button>
                )}

                <TestBtn label="Тест друку" loading={testing === 'printer'} onClick={() => runTest('printer')} />
              </Card>

              {/* Privat24 — simple */}
              <Card title="Термінал Privat24" icon={CreditCard}>
                <label className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={form.pos_terminal_enabled} onChange={(e) => set('pos_terminal_enabled', e.target.checked)} />
                  Оплата карткою через термінал
                </label>
                <p className="mb-3 text-xs text-ainur-muted">Підключіть термінал до WiFi. Касир проводить оплату на терміналі та підтверджує в касі.</p>
                <Field label="IP терміналу (необов'язково)" value={form.pos_terminal_ip} onChange={(v) => set('pos_terminal_ip', v)} placeholder="192.168.1.100" />
                <TestBtn label="Перевірити" loading={testing === 'terminal'} onClick={() => runTest('terminal')} />
              </Card>

              <Card title="Сканер штрих-кодів" icon={ScanBarcode}>
                <Field label="Відскануйте код для перевірки" value={form.pos_barcode_test} onChange={(v) => set('pos_barcode_test', v)} placeholder="Штрих-код..." />
              </Card>

              <Card title="CheckBox v1 (ПРРО)" icon={Receipt} status={form.prro_enabled && form.checkbox_login ? 'ok' : form.prro_enabled ? 'warn' : null}>
                <label className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={form.prro_enabled} onChange={(e) => set('prro_enabled', e.target.checked)} />
                  Увімкнути фіскалізацію через Checkbox.ua
                </label>
                <p className="mb-3 text-xs text-ainur-muted">Ліцензійний ключ, логін і пароль касира з особистого кабінету Checkbox.</p>
                <div className="mb-3 space-y-3">
                  <Field label="License key" value={form.checkbox_license_key} onChange={(v) => set('checkbox_license_key', v)} placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" />
                  <Field label="Логін касира Checkbox" value={form.checkbox_login} onChange={(v) => set('checkbox_login', v)} />
                  <Field label="Пароль касира Checkbox" value={form.checkbox_password} onChange={(v) => set('checkbox_password', v)} />
                </div>
                <label className="mb-3 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.pos_fiscal_default} onChange={(e) => set('pos_fiscal_default', e.target.checked)} />
                  Фіскалізувати чек за замовчуванням
                </label>
                <TestBtn label="Перевірити підключення Checkbox" loading={testing === 'checkbox'} onClick={() => runTest('checkbox')} />
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

function Card({ title, icon: Icon, status, children }) {
  return (
    <div className="mb-6 max-w-2xl rounded-xl border border-ainur-border p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-ainur-blue" />
        <h3 className="font-medium">{title}</h3>
        {status === 'ok' && <span className="text-xs text-green-600">● Підключено</span>}
        {status === 'warn' && <span className="text-xs text-amber-600">● Потрібне підключення</span>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, readOnly }) {
  return (
    <div>
      <label className="lbl">{label}</label>
      <input value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} readOnly={readOnly} className="inp" />
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
