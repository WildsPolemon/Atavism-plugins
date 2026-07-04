import { useEffect, useState } from 'react';
import { api } from '../api';

export default function CRM() {
  const [customers, setCustomers] = useState([]);
  useEffect(() => { api.customers().then((r) => setCustomers(r.customers || [])); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">CRM</h1>
      <p className="mb-6 text-sm text-muted">Клієнти, лояльність, борги</p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {customers.map((c) => (
          <div key={c.id} className="glass p-5">
            <p className="font-semibold">{c.name}</p>
            <p className="text-sm text-muted">{c.phone || '—'}</p>
            {c.debt > 0 && <p className="mt-2 text-sm text-danger">Борг: {c.debt} ₴</p>}
          </div>
        ))}
        {!customers.length && <p className="text-muted">Немає клієнтів</p>}
      </div>
    </div>
  );
}
