import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Settings() {
  const [form, setForm] = useState({ company_name: '', receipt_footer: '', receipt_logo: '', site_url: '', receipt_address: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.settings().then((r) => setForm((f) => ({ ...f, ...r.settings })));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.saveSettings(form);
    setMsg('Збережено ✓');
    setTimeout(() => setMsg(''), 2000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ainur-text">Налаштування</h1>
      <p className="mb-6 text-sm text-ainur-muted">Чеки, логотип, компанія (як AinurPOS)</p>
      {msg && <p className="mb-4 text-success text-sm">{msg}</p>}
      <form onSubmit={save} className="glass max-w-xl space-y-4 p-6">
        <div>
          <label className="text-xs text-ainur-muted">Назва компанії</label>
          <input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-2 text-sm" />
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
        <button type="submit" className="rounded-lg bg-ainur-blue px-6 py-2 text-sm font-medium text-white hover:bg-ainur-blue-dark">Зберегти</button>
      </form>
    </div>
  );
}
