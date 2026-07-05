import { useState } from 'react';
import { Loader2, Receipt } from 'lucide-react';
import { fmt } from '../utils';

export default function OpenShiftModal({ register, prroEnabled, loading, onConfirm, onClose }) {
  const [cash, setCash] = useState('0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="mb-2 text-lg font-semibold">Відкрити зміну</h2>
        <p className="mb-4 text-sm text-ainur-muted">
          Каса: <strong>{register?.code} {register?.name}</strong><br />
          Баланс рахунку: {fmt(register?.balance)}
        </p>

        {prroEnabled && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <div className="mb-1 flex items-center gap-2 font-medium">
              <Receipt className="h-4 w-4" /> Checkbox (ПРРО)
            </div>
            <p className="text-xs text-blue-800">
              Разом із касовою зміною буде відкрита зміна в Checkbox.ua.
              Початкова готівка буде внесена службовим чеком.
            </p>
          </div>
        )}

        <label className="mb-4 block text-sm">Готівка на початку зміни
          <input type="number" step="0.01" value={cash} onChange={(e) => setCash(e.target.value)} autoFocus disabled={loading}
            className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-2.5 disabled:opacity-50" />
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} disabled={loading} className="flex-1 rounded-lg border border-ainur-border py-2.5 text-sm disabled:opacity-50">Скасувати</button>
          <button type="button" onClick={() => onConfirm(parseFloat(cash) || 0)} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-ainur-green py-2.5 text-sm font-medium text-white disabled:opacity-50">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> {prroEnabled ? 'Checkbox...' : 'Відкриття...'}</> : 'Відкрити зміну'}
          </button>
        </div>
      </div>
    </div>
  );
}
