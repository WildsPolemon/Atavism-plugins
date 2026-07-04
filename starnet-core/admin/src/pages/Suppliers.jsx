import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../api';

export default function Suppliers() {
  const [list, setList] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const load = () => api.suppliers().then((r) => setList(r.suppliers || []));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.createSupplier(form);
    setShow(false);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Постачальники</h1>
          <p className="text-sm text-slate-400">Управління постачальниками та боргами (як AinurPOS)</p>
        </div>
        <button onClick={() => setShow(true)} className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /> Додати</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => (
          <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="font-semibold text-white">{s.name}</p>
            <p className="text-sm text-slate-400">{s.phone || s.email || '—'}</p>
            {s.debt > 0 && <p className="mt-2 text-sm text-rose-400">Борг: {s.debt} ₴</p>}
          </div>
        ))}
      </div>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={save} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d111c] p-6">
            <input required placeholder="Назва" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mb-3 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-white" />
            <input placeholder="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mb-3 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-white" />
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mb-4 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-white" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShow(false)} className="flex-1 rounded-xl border border-white/10 py-2 text-sm">Скасувати</button>
              <button type="submit" className="flex-1 rounded-xl bg-indigo-500 py-2 text-sm text-white">Зберегти</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
