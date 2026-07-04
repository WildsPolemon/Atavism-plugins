import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Suppliers() {
  const [list, setList] = useState([]);
  useEffect(() => { api.suppliers().then((r) => setList(r.suppliers || [])); }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Постачальники</h1>
      <p className="mb-6 text-sm text-slate-400">Управління постачальниками та боргами (як AinurPOS)</p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => (
          <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="font-semibold text-white">{s.name}</p>
            <p className="text-sm text-slate-400">{s.phone || s.email || '—'}</p>
            {s.debt > 0 && <p className="mt-2 text-sm text-rose-400">Борг: {s.debt} ₴</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
