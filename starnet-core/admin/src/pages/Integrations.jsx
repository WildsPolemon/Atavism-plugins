import { useEffect, useState } from 'react';
import { api } from '../api';

const INTEGRATIONS = [
  { key: 'pos_printer_enabled', label: 'Принтер чеків', type: 'toggle' },
  { key: 'pos_printer_connection', label: 'Підключення принтера', type: 'select', options: ['wifi', 'usb'] },
  { key: 'pos_printer_wifi_ip', label: 'IP принтера (Wi‑Fi)', type: 'text' },
  { key: 'pos_printer_model', label: 'Модель принтера', type: 'select', options: ['escpos', 'star'] },
  { key: 'pos_printer_baud', label: 'Швидкість (baud)', type: 'text' },
  { key: 'pos_terminal_enabled', label: 'Термінал оплати', type: 'toggle' },
  { key: 'pos_terminal_ip', label: 'IP терміналу Privat24', type: 'text' },
  { key: 'pos_scale_enabled', label: 'Терези', type: 'toggle' },
  { key: 'pos_scale_ip', label: 'IP терезів', type: 'text' },
];

export default function Integrations() {
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.settings().then((r) => setForm(r.settings || {}));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.saveSettings(form);
    setMsg('Збережено ✓');
    setTimeout(() => setMsg(''), 2000);
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-ainur-text">Інтеграції</h1>
      <p className="mb-6 text-sm text-ainur-muted">Обладнання каси: принтер, термінал, терези — як AinurPOS</p>
      {msg && <p className="mb-4 text-sm text-success">{msg}</p>}

      <form onSubmit={save} className="glass max-w-2xl space-y-4 p-6">
        {INTEGRATIONS.map(({ key, label, type, options }) => (
          <div key={key}>
            <label className="text-xs font-medium text-ainur-muted">{label}</label>
            {type === 'toggle' ? (
              <label className="mt-1 flex items-center gap-2">
                <input type="checkbox" checked={form[key] === '1'} onChange={(e) => set(key, e.target.checked ? '1' : '0')} />
                <span className="text-sm">{form[key] === '1' ? 'Увімкнено' : 'Вимкнено'}</span>
              </label>
            ) : type === 'select' ? (
              <select className="inp mt-1" value={form[key] || ''} onChange={(e) => set(key, e.target.value)}>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input className="inp mt-1" value={form[key] || ''} onChange={(e) => set(key, e.target.value)} />
            )}
          </div>
        ))}
        <button type="submit" className="rounded-lg bg-ainur-blue px-6 py-2 text-sm font-medium text-white">Зберегти</button>
      </form>

      <div className="mt-8 glass max-w-2xl p-6">
        <h3 className="font-semibold mb-2">Хмарне сховище / QR-сканер</h3>
        <p className="text-sm text-ainur-muted mb-4">Інтеграції Mertech QR та хмарного сховища налаштовуються в інтерфейсі касира → Налаштування → Обладнання.</p>
        <a href={`${window.location.origin}/cashier/`} target="_blank" rel="noreferrer" className="text-sm text-ainur-blue hover:underline">Відкрити касу →</a>
      </div>
    </div>
  );
}
