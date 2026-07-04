import { useState } from 'react';
import { fmt } from '../utils';

export default function ItemEditModal({ item, onClose, onSave }) {
  const [price, setPrice] = useState(item.price);
  const [qty, setQty] = useState(item.qty);
  const [discPct, setDiscPct] = useState(0);
  const [discFix, setDiscFix] = useState(item.disc || 0);
  const lineTotal = price * qty - discFix;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold">{item.name}</h3>
        <label className="mb-1 block text-xs text-ainur-muted">Ціна</label>
        <input type="number" step="0.01" value={price} onChange={(e) => setPrice(+e.target.value)} className="mb-3 w-full rounded border border-ainur-border px-3 py-2" />
        <label className="mb-1 block text-xs text-ainur-muted">Кількість</label>
        <input type="number" min="1" value={qty} onChange={(e) => setQty(+e.target.value)} className="mb-3 w-full rounded border border-ainur-border px-3 py-2" />
        <label className="mb-1 block text-xs text-ainur-muted">Знижка %</label>
        <input type="number" value={discPct} onChange={(e) => { const p = +e.target.value; setDiscPct(p); setDiscFix(price * qty * p / 100); }} className="mb-3 w-full rounded border border-ainur-border px-3 py-2" />
        <label className="mb-1 block text-xs text-ainur-muted">Знижка (сума)</label>
        <input type="number" step="0.01" value={discFix} onChange={(e) => setDiscFix(+e.target.value)} className="mb-4 w-full rounded border border-ainur-border px-3 py-2" />
        <p className="mb-4 text-right text-lg font-bold">Разом: {fmt(lineTotal)}</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded border py-2 text-sm">Скасувати</button>
          <button onClick={() => onSave({ ...item, price, qty, disc: discFix })} className="flex-1 rounded bg-ainur-blue py-2 text-sm font-medium text-white">Зберегти</button>
        </div>
      </div>
    </div>
  );
}
