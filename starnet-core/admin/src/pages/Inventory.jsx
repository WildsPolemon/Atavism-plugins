import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Inventory({ embedded }) {
  const [counts, setCounts] = useState([]);
  const [detail, setDetail] = useState(null);
  const [warehouses, setWarehouses] = useState([]);

  const load = () => api.inventoryCounts().then((r) => setCounts(r.counts || []));
  useEffect(() => {
    load();
    api.warehouses().then((r) => setWarehouses(r.warehouses || []));
  }, []);

  const start = async (warehouseId) => {
    await api.createInventory({ warehouse_id: warehouseId });
    load();
  };

  const open = async (id) => {
    const r = await api.inventoryDetail(id);
    setDetail(r);
  };

  const saveQty = async (itemId, qty) => {
    await api.updateInventoryItem(detail.count.id, itemId, +qty);
    open(detail.count.id);
  };

  const complete = async () => {
    await api.completeInventory(detail.count.id);
    setDetail(null);
    load();
  };

  return (
    <div>
      {!embedded && (
        <>
          <h1 className="text-2xl font-bold text-ainur-text">Інвентаризація</h1>
          <p className="mb-6 text-sm text-ainur-muted">Перевірка залишків на складі</p>
        </>
      )}

      {!detail ? (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {warehouses.map((w) => (
              <button key={w.id} onClick={() => start(w.id)} className="rounded-xl bg-accent px-4 py-2 text-sm">Інвентаризація: {w.name}</button>
            ))}
          </div>
          <div className="space-y-2">
            {counts.map((c) => (
              <button key={c.id} onClick={() => open(c.id)} className="glass block w-full p-4 text-left">
                <span className="font-medium">#{c.id} · {c.warehouse_name}</span>
                <span className="ml-3 text-sm text-muted">{c.status}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Інвентаризація #{detail.count.id}</h2>
            <div className="flex gap-2">
              <button onClick={() => setDetail(null)} className="rounded-lg border px-3 py-1 text-sm">Назад</button>
              {detail.count.status === 'open' && <button onClick={complete} className="rounded-lg bg-emerald-600 px-3 py-1 text-sm">Завершити</button>}
            </div>
          </div>
          <div className="glass overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-elevated/60 text-muted"><tr><th className="px-4 py-3 text-left">Товар</th><th className="px-4 py-3 text-right">Очікується</th><th className="px-4 py-3 text-right">Факт</th></tr></thead>
              <tbody>
                {detail.items?.map((it) => (
                  <tr key={it.id} className="border-t border-surface-border/50">
                    <td className="px-4 py-3">{it.name}</td>
                    <td className="px-4 py-3 text-right font-mono">{it.expected_qty}</td>
                    <td className="px-4 py-3 text-right">
                      <input type="number" step="0.001" defaultValue={it.actual_qty ?? ''} onBlur={(e) => saveQty(it.id, e.target.value)} className="w-24 rounded border border-surface-border bg-surface-elevated px-2 py-1 text-right" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
