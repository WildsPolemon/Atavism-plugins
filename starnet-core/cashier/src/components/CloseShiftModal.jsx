import { useState } from 'react';
import { X } from 'lucide-react';
import { fmt } from '../utils';

export default function CloseShiftModal({ shift, report, onClose, onConfirm }) {
  const [cash, setCash] = useState('');
  const expected = (+shift?.opening_cash || 0) + (+report?.sales?.cash || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-red-600">Закрити зміну #{shift?.id}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-4 text-sm text-ainur-muted">Після закриття буде сформовано Z-звіт. Очікувана готівка в касі: <strong>{fmt(expected)}</strong></p>
        <label className="mb-4 block text-sm">Фактична готівка в касі
          <input type="number" step="0.01" value={cash} onChange={(e) => setCash(e.target.value)} autoFocus
            placeholder={String(expected)}
            className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-2.5" />
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-ainur-border py-2.5 text-sm">Скасувати</button>
          <button type="button" onClick={() => onConfirm(parseFloat(cash) || expected)}
            className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white">Закрити зміну</button>
        </div>
      </div>
    </div>
  );
}
