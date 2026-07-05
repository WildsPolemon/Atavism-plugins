import { useEffect, useState } from 'react';
import { api, fmtUah } from '../api';

export default function Estore() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api.estoreOrders().then((r) => setOrders(r.orders || [])); }, []);

  const setStatus = async (id, status) => {
    await api.updateEstoreOrder(id, status);
    api.estoreOrders().then((r) => setOrders(r.orders || []));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">eStore</h1>
      <p className="mb-4 text-sm text-muted">Онлайн-замовлення · інтеграція з POS (як AinurPOS eStore)</p>
      <a href={`${window.location.origin}/`} target="_blank" rel="noreferrer" className="mb-6 inline-block rounded-lg border border-ainur-blue px-4 py-2 text-sm text-ainur-blue hover:bg-blue-50">Відкрити вітрину →</a>
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="glass flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">#{o.id} · {o.customer_name}</p>
              <p className="text-sm text-muted">{o.phone} · {fmtUah(o.total)} · {o.delivery_type} · {o.status}</p>
            </div>
            <div className="flex gap-2">
              {['processing', 'ready', 'completed', 'cancelled'].map((s) => (
                <button key={s} onClick={() => setStatus(o.id, s)} className="rounded-lg bg-white/5 px-3 py-1 text-xs capitalize">{s}</button>
              ))}
            </div>
          </div>
        ))}
        {!orders.length && <p className="text-muted text-sm">Замовлень ще немає</p>}
      </div>
    </div>
  );
}
