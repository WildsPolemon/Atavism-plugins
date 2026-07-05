import { useState } from 'react';
import { X, Loader2, Receipt } from 'lucide-react';
import { fmt } from '../utils';

export default function CloseShiftModal({ shift, report, prroEnabled, loading, onClose, onConfirm }) {
  const [cash, setCash] = useState('');
  const expected = (+shift?.opening_cash || 0) + (+report?.sales?.cash || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-red-600">Закрити зміну #{shift?.id}</h2>
          <button type="button" onClick={onClose} disabled={loading} className="rounded-lg p-1 hover:bg-gray-100 disabled:opacity-50"><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-4 text-sm text-ainur-muted">Після закриття буде сформовано Z-звіт. Очікувана готівка в касі: <strong>{fmt(expected)}</strong></p>

        {prroEnabled && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <div className="mb-1 flex items-center gap-2 font-medium">
              <Receipt className="h-4 w-4" /> Checkbox (ПРРО)
            </div>
            <p className="text-xs text-blue-800">Зміна в Checkbox.ua також буде закрита (Z-звіт ПРРО).</p>
          </div>
        )}

        <label className="mb-4 block text-sm">Фактична готівка в касі
          <input type="number" step="0.01" value={cash} onChange={(e) => setCash(e.target.value)} autoFocus disabled={loading}
            placeholder={String(expected)}
            className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-2.5 disabled:opacity-50" />
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} disabled={loading} className="flex-1 rounded-lg border border-ainur-border py-2.5 text-sm disabled:opacity-50">Скасувати</button>
          <button type="button" onClick={() => onConfirm(parseFloat(cash) || expected)} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white disabled:opacity-50">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> {prroEnabled ? 'Checkbox...' : 'Закриття...'}</> : 'Закрити зміну'}
          </button>
        </div>
      </div>
    </div>
  );
}
