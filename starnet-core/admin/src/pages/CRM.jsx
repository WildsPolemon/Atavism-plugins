import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api, fmtUah } from '../api';

export default function CRM({ embedded }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', discount_percent: 0, card_number: '' });

  const load = () => api.customers(search).then((r) => setCustomers(r.customers || []));
  useEffect(() => { load(); }, [search]);

  const save = async (e) => {
    e.preventDefault();
    await api.createCustomer(form);
    setShow(false);
    setForm({ name: '', phone: '', email: '', discount_percent: 0, card_number: '' });
    load();
  };

  const open = async (id) => {
    const r = await api.customer(id);
    setDetail(r);
  };

  return (
    <div>
      {!embedded ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ainur-text">Клієнти</h1>
            <p className="text-sm text-ainur-muted">CRM: лояльність, борги, історія</p>
          </div>
          <div className="flex gap-2">
            <input placeholder="Пошук..." value={search} onChange={(e) => setSearch(e.target.value)} className="inp w-48" />
            <button onClick={() => setShow(true)} className="flex items-center gap-2 rounded-lg bg-ainur-blue px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /> Додати</button>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex flex-wrap gap-2">
          <input placeholder="Пошук клієнта..." value={search} onChange={(e) => setSearch(e.target.value)} className="inp flex-1 min-w-[200px]" />
          <button onClick={() => setShow(true)} className="flex items-center gap-2 rounded-lg bg-ainur-blue px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /> Додати</button>
        </div>
      )}

      {!detail ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <button key={c.id} onClick={() => open(c.id)} className="glass p-4 text-left">
              <p className="font-medium">{c.name}</p>
              <p className="text-sm text-muted">{c.phone}</p>
              <div className="mt-2 flex gap-3 text-xs">
                <span className="text-accent">Бали: {c.loyalty_points}</span>
                <span className="text-warning">Знижка: {c.discount_percent}%</span>
                {c.debt > 0 && <span className="text-danger">Борг: {fmtUah(c.debt)}</span>}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <button onClick={() => setDetail(null)} className="mb-4 text-sm text-accent">← Назад</button>
          <div className="glass mb-4 p-4">
            <h2 className="text-lg font-bold">{detail.name}</h2>
            <p className="text-muted">{detail.phone} · {detail.email}</p>
            <p className="mt-2 text-sm">Картка: {detail.card_number || '—'} · Бали: {detail.loyalty_points} · Знижка: {detail.discount_percent}%</p>
          </div>
          <h3 className="mb-2 font-semibold">Історія покупок</h3>
          <div className="space-y-2">
            {detail.purchases?.map((p) => (
              <div key={p.id} className="glass flex justify-between p-3 text-sm">
                <span>Чек #{p.id} · {p.created_at}</span>
                <span className="text-accent">{fmtUah(p.total)}</span>
              </div>
            ))}
            {!detail.purchases?.length && <p className="text-muted text-sm">Покупок ще немає</p>}
          </div>
        </div>
      )}

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={save} className="glass w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-bold">Новий клієнт</h3>
            <input required placeholder="Ім'я" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="inp mb-3" />
            <input placeholder="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="inp mb-3" />
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="inp mb-3" />
            <input placeholder="№ дисконтної картки" value={form.card_number} onChange={(e) => setForm({ ...form, card_number: e.target.value })} className="inp mb-3" />
            <input type="number" placeholder="Знижка %" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} className="inp mb-4" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShow(false)} className="flex-1 rounded-lg border border-ainur-border py-2 text-sm">Скасувати</button>
              <button type="submit" className="flex-1 rounded-lg bg-ainur-blue py-2 text-sm font-medium text-white">Зберегти</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
