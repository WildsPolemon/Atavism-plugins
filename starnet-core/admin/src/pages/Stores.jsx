import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Stores() {
  const [list, setList] = useState([]);
  useEffect(() => { api.stores().then((r) => setList(r.stores || [])); }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Магазини</h1>
      <p className="mb-6 text-sm text-slate-400">Багатоточковий облік (до 10 магазинів у Pro-тарифі)</p>
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((s) => (
          <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-lg font-semibold text-white">{s.name}</p>
            <p className="text-sm text-slate-400">{s.address}</p>
            <p className="text-sm text-slate-500">{s.phone}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
