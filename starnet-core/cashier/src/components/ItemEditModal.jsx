import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { fmt } from '../utils';

export default function ItemEditModal({ item, onClose, onSave }) {
  const [price, setPrice] = useState(item.price);
  const [qty, setQty] = useState(item.qty);
  const [discPct, setDiscPct] = useState(item.discPct ?? 0);
  const [discFix, setDiscFix] = useState(item.disc || 0);
  const lineTotal = Math.max(0, price * qty - discFix);

  const setPct = (p) => {
    setDiscPct(p);
    setDiscFix(price * qty * p / 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-5 text-lg font-semibold text-ainur-text">{item.name}</h3>

        <label className="mb-1 block text-xs text-ainur-muted">Ціна</label>
        <input type="number" step="0.01" value={price} onChange={(e) => {
          const v = +e.target.value;
          setPrice(v);
          setDiscFix(v * qty * discPct / 100);
        }} className="mb-4 w-full rounded-lg border border-ainur-border px-4 py-3 text-lg font-semibold focus:border-ainur-blue focus:outline-none" />

        <label className="mb-2 block text-xs text-ainur-muted">Кількість</label>
        <div className="mb-4 flex items-center justify-center gap-4">
          <button type="button" onClick={() => setQty(Math.max(1, qty - 1))}
            className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-ainur-border text-ainur-blue hover:border-ainur-blue">
            <Minus className="h-6 w-6" />
          </button>
          <span className="min-w-[3rem] text-center text-2xl font-bold">{qty}</span>
          <button type="button" onClick={() => setQty(qty + 1)}
            className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-ainur-border text-ainur-blue hover:border-ainur-blue">
            <Plus className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-ainur-muted">Знижка %</label>
            <input type="number" value={discPct} onChange={(e) => setPct(+e.target.value)}
              className="w-full rounded-lg border border-ainur-border px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ainur-muted">грн.</label>
            <input type="number" step="0.01" value={discFix} onChange={(e) => setDiscFix(+e.target.value)}
              className="w-full rounded-lg border border-ainur-border px-3 py-2" />
          </div>
        </div>

        <p className="mb-5 text-right text-lg">
          <span className="text-ainur-muted">Підсумок: </span>
          <span className="font-bold text-ainur-text">{fmt(lineTotal)}</span>
        </p>

        <button type="button" onClick={() => onSave({ ...item, price, qty, disc: discFix, discPct })}
          className="w-full rounded-lg bg-ainur-orange py-3.5 text-base font-bold text-white hover:opacity-90">
          ЗАСТОСУВАТИ
        </button>
        <button type="button" onClick={onClose} className="mt-2 w-full py-2 text-sm text-ainur-muted hover:text-ainur-text">
          Закрити [ESC]
        </button>
      </div>
    </div>
  );
}
