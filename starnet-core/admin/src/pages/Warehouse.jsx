import { useEffect, useState } from 'react';
import { api, fmtUah } from '../api';

export default function Warehouse() {
  const [stock, setStock] = useState([]);
  useEffect(() => { api.stock().then((r) => setStock(r.stock || [])); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Склад</h1>
      <p className="mb-6 text-sm text-muted">Залишки та контроль складу</p>
      <div className="glass overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-elevated/60 text-muted"><tr><th className="px-4 py-3 text-left">Товар</th><th className="px-4 py-3 text-left">Склад</th><th className="px-4 py-3 text-right">Кількість</th></tr></thead>
          <tbody>
            {stock.map((s, i) => (
              <tr key={i} className="border-t border-surface-border/50">
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3 text-muted">{s.warehouse_name}</td>
                <td className={`px-4 py-3 text-right font-mono ${s.quantity <= 5 ? 'text-warning' : ''}`}>{s.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
