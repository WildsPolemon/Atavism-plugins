import { useEffect, useState } from 'react';
import { api, fmtUah } from '../api';

export default function Settings() {
  const [form, setForm] = useState({ company_name: '', receipt_footer: '', receipt_logo: '', site_url: '', loyalty_rate: '10' });
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
      <h1 className="text-2xl font-bold text-white">Налаштування</h1>
      <p className="mb-6 text-sm text-slate-400">Чеки, логотип, компанія (як AinurPOS)</p>
      {msg && <p className="mb-4 text-emerald-400 text-sm">{msg}</p>}
      <form onSubmit={save} className="max-w-xl space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <label className="text-xs text-slate-400">Назва компанії</label>
          <input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-white" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Сайт на чеку</label>
          <input value={form.site_url} onChange={(e) => setForm({ ...form, site_url: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-white" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Текст внизу чека</label>
          <input value={form.receipt_footer} onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-white" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Логотип на чеку (URL)</label>
          <input value={form.receipt_logo} onChange={(e) => setForm({ ...form, receipt_logo: e.target.value })} placeholder="https://..." className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-white" />
        </div>
        <button type="submit" className="rounded-xl bg-indigo-500 px-6 py-2 text-sm font-medium text-white">Зберегти</button>
      </form>
    </div>
  );
}
