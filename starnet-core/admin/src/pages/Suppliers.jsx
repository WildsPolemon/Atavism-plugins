import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api, fmtUah } from '../api';

export default function Suppliers({ embedded }) {
  const [list, setList] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const load = () => api.suppliers().then((r) => setList(r.suppliers || []));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.createSupplier(form);
    setShow(false);
    setForm({ name: '', phone: '', email: '' });
    load();
  };

  return (
    <div>
      {!embedded && (
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ainur-text">Постачальники</h1>
            <p className="text-sm text-ainur-muted">Управління постачальниками та боргами</p>
          </div>
          <button onClick={() => setShow(true)} className="flex items-center gap-2 rounded-lg bg-ainur-blue px-4 py-2 text-sm font-medium text-white">
            <Plus className="h-4 w-4" /> Додати
          </button>
        </div>
      )}
      {embedded && (
        <div className="mb-4 flex justify-end">
          <button onClick={() => setShow(true)} className="flex items-center gap-2 rounded-lg bg-ainur-blue px-4 py-2 text-sm font-medium text-white">
            <Plus className="h-4 w-4" /> Додати
          </button>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => (
          <div key={s.id} className="glass p-5">
            <p className="font-semibold text-ainur-text">{s.name}</p>
            <p className="text-sm text-ainur-muted">{s.phone || s.email || '—'}</p>
            {s.debt > 0 && <p className="mt-2 text-sm text-danger">Борг: {fmtUah(s.debt)}</p>}
          </div>
        ))}
      </div>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={save} className="glass w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-bold text-ainur-text">Новий постачальник</h3>
            <input required placeholder="Назва" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="inp mb-3" />
            <input placeholder="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="inp mb-3" />
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="inp mb-4" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShow(false)} className="flex-1 rounded-lg border border-ainur-border py-2 text-sm">Скасувати</button>
              <button type="submit" className="flex-1 rounded-lg bg-ainur-blue py-2 text-sm text-white">Зберегти</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
