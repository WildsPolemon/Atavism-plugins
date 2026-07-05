import { useEffect, useState } from 'react';
import { fmt } from '../utils';

export default function CashMovementsModal({ shift, onClose, onLoad, onCashIn, onCashOut }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  const reload = () => onLoad().then(setData).catch((e) => setErr(e.message));

  useEffect(() => { reload(); }, [onLoad]);

  const movements = data?.movements || [];
  const s = data?.shift || shift;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-ainur-border p-4">
          <div>
            <h3 className="text-lg font-semibold">Рух готівки</h3>
            <p className="text-xs text-ainur-muted">Зміна #{s?.id} · в касі {fmt(s?.expected_cash)}</p>
          </div>
          <button type="button" onClick={onClose} className="text-ainur-muted">✕</button>
        </div>

        {err && <p className="mx-4 mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}

        <div className="flex gap-2 px-4 pt-3">
          <button type="button" onClick={() => { onCashIn(); onClose(); }}
            className="flex-1 rounded-lg bg-ainur-blue py-2 text-sm font-medium text-white">+ Внесення</button>
          <button type="button" onClick={() => { onCashOut(); onClose(); }}
            className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white">− Вилучення</button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {movements.length === 0 ? (
            <p className="text-center text-sm text-ainur-muted py-8">Операцій ще немає</p>
          ) : (
            <div className="space-y-2">
              {movements.map((m) => (
                <div key={m.id} className="flex items-start justify-between rounded-lg border border-ainur-border px-3 py-2 text-sm">
                  <div>
                    <p className={`font-medium ${m.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                      {m.type === 'in' ? 'Внесення' : 'Вилучення'}
                    </p>
                    <p className="text-xs text-ainur-muted">{m.created_at}</p>
                    {m.note && <p className="mt-0.5 text-xs">{m.note}</p>}
                  </div>
                  <span className="font-semibold">{m.type === 'in' ? '+' : '−'}{fmt(m.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-ainur-border p-4">
          <button type="button" onClick={onClose} className="w-full rounded-lg border border-ainur-border py-2.5 text-sm">Закрити</button>
        </div>
      </div>
    </div>
  );
}
