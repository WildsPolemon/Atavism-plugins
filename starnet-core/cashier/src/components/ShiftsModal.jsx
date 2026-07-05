import { X } from 'lucide-react';
import { fmt } from '../utils';

export default function ShiftsModal({ shifts, onClose, onSelect }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-start bg-black/30 sm:items-center sm:justify-center sm:p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-xl bg-white shadow-2xl sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-ainur-border px-5 py-4">
          <h2 className="text-lg font-semibold">Зміни</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {!shifts.length && <p className="py-8 text-center text-sm text-ainur-muted">Змін ще немає</p>}
          {shifts.map((s) => (
            <button key={s.id} type="button" onClick={() => onSelect?.(s)}
              className="mb-2 flex w-full items-center justify-between rounded-lg border border-ainur-border p-4 text-left hover:bg-gray-50">
              <div>
                <p className="font-medium">Зміна #{s.id}</p>
                <p className="text-xs text-ainur-muted">{s.cashier || 'Касир'} · {s.register_name || 'Каса'}</p>
                <p className="text-xs text-ainur-muted">{s.opened_at}{s.closed_at ? ` — ${s.closed_at}` : ''}</p>
              </div>
              <div className="text-right text-sm">
                <span className={`rounded px-2 py-0.5 text-xs ${s.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {s.status === 'open' ? 'Відкрита' : 'Закрита'}
                </span>
                <p className="mt-1 font-medium">{fmt((+s.cash_sales || 0) + (+s.card_sales || 0))}</p>
                <p className="text-xs text-ainur-muted">{s.sales_count ?? 0} чеків</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
