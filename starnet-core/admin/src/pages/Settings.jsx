import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Settings() {
  const [form, setForm] = useState({
    company_name: '', site_name: '', receipt_footer: '', receipt_logo: '', site_url: '', receipt_address: '',
    country: 'UA', prro_enabled: '0', checkbox_license_key: '', checkbox_login: '', checkbox_password: '',
    checkbox_api_url: 'https://api.checkbox.ua/api/v1', pos_fiscal_default: '0',
  });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    api.settings().then((r) => setForm((f) => ({ ...f, ...r.settings })));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.saveSettings(form);
    setMsg('Збережено ✓');
    setTimeout(() => setMsg(''), 2000);
  };

  const testCheckbox = async () => {
    setTesting(true); setErr(''); setMsg('');
    try {
      await api.saveSettings(form);
      const r = await api.prroTest();
      setMsg(r.message || 'Підключено до Checkbox');
    } catch (e) { setErr(e.message); }
    finally { setTesting(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ainur-text">Налаштування</h1>
      <p className="mb-6 text-sm text-ainur-muted">Чеки, логотип, компанія, ПРРО (Checkbox)</p>
      {msg && <p className="mb-4 text-success text-sm">{msg}</p>}
      {err && <p className="mb-4 text-sm text-red-600">{err}</p>}
      <form onSubmit={save} className="glass max-w-xl space-y-4 p-6">
        <div>
          <label className="text-xs text-ainur-muted">Назва компанії</label>
          <input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-ainur-muted">Назва сайту (портал, привітання)</label>
          <input value={form.site_name || ''} onChange={(e) => setForm({ ...form, site_name: e.target.value })} placeholder="StarNet Core" className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-ainur-muted">Адреса на чеку</label>
          <input value={form.receipt_address || ''} onChange={(e) => setForm({ ...form, receipt_address: e.target.value })} className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-ainur-muted">Сайт на чеку</label>
          <input value={form.site_url} onChange={(e) => setForm({ ...form, site_url: e.target.value })} className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-ainur-muted">Текст внизу чека</label>
          <input value={form.receipt_footer} onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })} className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-ainur-muted">Логотип на чеку (URL)</label>
          <input value={form.receipt_logo} onChange={(e) => setForm({ ...form, receipt_logo: e.target.value })} placeholder="https://..." className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-2 text-sm" />
        </div>

        <hr className="border-ainur-border" />
        <h2 className="text-lg font-semibold">ПРРО — Checkbox.ua</h2>
        <p className="text-xs text-ainur-muted">Інтеграція CheckBox v1 як у AinurPOS. Потрібен ліцензійний ключ та облікові дані касира Checkbox.</p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.prro_enabled === '1'} onChange={(e) => setForm({ ...form, prro_enabled: e.target.checked ? '1' : '0' })} />
          Увімкнути ПРРО (Checkbox)
        </label>
        <div>
          <label className="text-xs text-ainur-muted">Країна</label>
          <select value={form.country || 'UA'} onChange={(e) => setForm({ ...form, country: e.target.value })} className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-2 text-sm">
            <option value="UA">Україна</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-ainur-muted">License key (Checkbox)</label>
          <input value={form.checkbox_license_key || ''} onChange={(e) => setForm({ ...form, checkbox_license_key: e.target.value })} className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-ainur-muted">Логін касира Checkbox</label>
          <input value={form.checkbox_login || ''} onChange={(e) => setForm({ ...form, checkbox_login: e.target.value })} className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-ainur-muted">Пароль касира Checkbox</label>
          <input type="password" value={form.checkbox_password || ''} onChange={(e) => setForm({ ...form, checkbox_password: e.target.value })} className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-ainur-muted">API URL (за замовчуванням)</label>
          <input value={form.checkbox_api_url || 'https://api.checkbox.ua/api/v1'} onChange={(e) => setForm({ ...form, checkbox_api_url: e.target.value })} className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-2 text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.pos_fiscal_default === '1'} onChange={(e) => setForm({ ...form, pos_fiscal_default: e.target.checked ? '1' : '0' })} />
          Фіскалізувати чек за замовчуванням у касі
        </label>
        <button type="button" onClick={testCheckbox} disabled={testing}
          className="rounded-lg border border-ainur-blue px-4 py-2 text-sm text-ainur-blue hover:bg-blue-50 disabled:opacity-50">
          {testing ? 'Перевірка...' : 'Перевірити підключення Checkbox'}
        </button>

        <button type="submit" className="rounded-lg bg-ainur-blue px-6 py-2 text-sm font-medium text-white hover:bg-ainur-blue-dark">Зберегти</button>
      </form>
    </div>
  );
}
