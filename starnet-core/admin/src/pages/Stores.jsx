import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../api';

export default function Stores({ embedded }) {
  const [list, setList] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const load = () => api.stores().then((r) => setList(r.stores || []));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.createStore(form);
    setShow(false);
    load();
  };

  return (
    <div>
      {!embedded && (
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ainur-text">Магазини</h1>
            <p className="text-sm text-ainur-muted">Багатоточковий облік</p>
          </div>
          <button onClick={() => setShow(true)} className="flex items-center gap-2 rounded-lg bg-ainur-blue px-4 py-2 text-sm font-medium text-white">
            <Plus className="h-4 w-4" /> Додати
          </button>
        </div>
      )}
      {embedded && (
        <div className="mb-4 flex justify-end">
          <button onClick={() => setShow(true)} className="flex items-center gap-2 rounded-lg bg-ainur-blue px-4 py-2 text-sm font-medium text-white">
            <Plus className="h-4 w-4" /> Додати магазин
          </button>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((s) => (
          <div key={s.id} className="glass p-6">
            <p className="text-lg font-semibold text-ainur-text">{s.name}</p>
            <p className="text-sm text-ainur-muted">{s.address || '—'}</p>
            <p className="text-sm text-ainur-muted">{s.phone || '—'}</p>
          </div>
        ))}
      </div>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={save} className="glass w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-bold text-ainur-text">Новий магазин</h3>
            <input required placeholder="Назва магазину" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="inp mb-3" />
            <input placeholder="Адреса" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="inp mb-3" />
            <input placeholder="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="inp mb-4" />
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
