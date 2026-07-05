import { useEffect, useState } from 'react';
import { api } from '../api';

const TABS = [
  { id: 'company', label: 'Компанія' },
  { id: 'users', label: 'Співробітники' },
];

export default function Settings() {
  const [tab, setTab] = useState('company');
  const [form, setForm] = useState({ company_name: '', receipt_footer: '', receipt_logo: '', site_url: '', receipt_address: '' });
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.settings().then((r) => setForm((f) => ({ ...f, ...r.settings })));
    api.adminUsers().then((r) => setUsers(r.users || [])).catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.saveSettings(form);
    setMsg('Збережено ✓');
    setTimeout(() => setMsg(''), 2000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ainur-text">Компанія</h1>
      <p className="mb-4 text-sm text-ainur-muted">Реквізити, чеки, співробітники</p>

      <div className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm ${tab === t.id ? 'bg-ainur-blue text-white' : 'bg-white border border-ainur-border text-ainur-muted'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {msg && <p className="mb-4 text-sm text-success">{msg}</p>}

      {tab === 'company' && (
        <form onSubmit={save} className="glass max-w-xl space-y-4 p-6">
          <div>
            <label className="text-xs text-ainur-muted">Назва компанії</label>
            <input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="inp mt-1" />
          </div>
          <div>
            <label className="text-xs text-ainur-muted">Адреса на чеку</label>
            <input value={form.receipt_address || ''} onChange={(e) => setForm({ ...form, receipt_address: e.target.value })} className="inp mt-1" />
          </div>
          <div>
            <label className="text-xs text-ainur-muted">Сайт на чеку</label>
            <input value={form.site_url} onChange={(e) => setForm({ ...form, site_url: e.target.value })} className="inp mt-1" />
          </div>
          <div>
            <label className="text-xs text-ainur-muted">Текст внизу чека</label>
            <input value={form.receipt_footer} onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })} className="inp mt-1" />
          </div>
          <div>
            <label className="text-xs text-ainur-muted">Логотип на чеку (URL)</label>
            <input value={form.receipt_logo} onChange={(e) => setForm({ ...form, receipt_logo: e.target.value })} placeholder="https://..." className="inp mt-1" />
          </div>
          <button type="submit" className="rounded-lg bg-ainur-blue px-6 py-2 text-sm font-medium text-white">Зберегти</button>
        </form>
      )}

      {tab === 'users' && (
        <div className="glass overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ainur-bg text-ainur-muted">
              <tr>
                <th className="px-4 py-3 text-left">Ім'я</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Роль</th>
                <th className="px-4 py-3 text-left">Статус</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-ainur-border/50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-ainur-muted">{u.email}</td>
                  <td className="px-4 py-3">{u.role === 'admin' ? 'Власник' : u.role === 'cashier' ? 'Касир' : u.role}</td>
                  <td className="px-4 py-3">{u.active ? <span className="text-success">Активний</span> : <span className="text-ainur-muted">Неактивний</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="p-4 text-xs text-ainur-muted">Додавання співробітників — через інсталятор або базу даних. Ролі: admin (власник), cashier (касир).</p>
        </div>
      )}
    </div>
  );
}
