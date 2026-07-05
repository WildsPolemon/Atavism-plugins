import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { fmt } from '../utils';

export default function ReturnModal({ sale, onClose, onConfirm }) {
  const [qtys, setQtys] = useState(() =>
    Object.fromEntries((sale?.items || []).map((it) => [it.product_id, 0]))
  );

  const setQ = (pid, v, max) => setQtys((q) => ({ ...q, [pid]: Math.max(0, Math.min(max, v)) }));

  const items = (sale?.items || [])
    .filter((it) => (qtys[it.product_id] || 0) > 0)
    .map((it) => ({ product_id: it.product_id, quantity: qtys[it.product_id], name: it.name }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-2xl">
        <div className="border-b border-ainur-border px-5 py-4">
          <h2 className="text-lg font-semibold">Повернення · чек #{sale?.id}</h2>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {(sale?.items || []).map((it) => (
            <div key={it.id} className="mb-3 flex items-center justify-between rounded-lg border border-ainur-border p-3">
              <div>
                <p className="font-medium">{it.name}</p>
                <p className="text-xs text-ainur-muted">Продано: {it.quantity}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setQ(it.product_id, (qtys[it.product_id] || 0) - 1, +it.quantity)}
                  className="flex h-8 w-8 items-center justify-center rounded border"><Minus className="h-4 w-4" /></button>
                <span className="w-8 text-center font-semibold">{qtys[it.product_id] || 0}</span>
                <button type="button" onClick={() => setQ(it.product_id, (qtys[it.product_id] || 0) + 1, +it.quantity)}
                  className="flex h-8 w-8 items-center justify-center rounded border"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 border-t border-ainur-border p-4">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border py-2.5 text-sm">Скасувати</button>
          <button type="button" disabled={!items.length} onClick={() => onConfirm(items)}
            className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white disabled:opacity-40">
            Повернути {items.length ? `(${items.length} поз.)` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
