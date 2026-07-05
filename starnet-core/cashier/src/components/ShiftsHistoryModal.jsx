import { useEffect, useState } from 'react';
import { fmt } from '../utils';

export default function ShiftsHistoryModal({ onClose, onLoad, onReport }) {
  const [shifts, setShifts] = useState([]);
  const [detail, setDetail] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    onLoad().then((r) => setShifts(r.shifts || [])).catch((e) => setErr(e.message));
  }, [onLoad]);

  const openReport = async (id, type) => {
    try {
      const r = await onReport(id, type);
      setDetail({ ...r, type });
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-ainur-border p-4">
          <h3 className="text-lg font-semibold">Зміни</h3>
          <button type="button" onClick={onClose} className="text-ainur-muted hover:text-ainur-text">✕</button>
        </div>
        {err && <p className="mx-4 mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
        <div className="flex-1 overflow-auto p-4">
          {!detail ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-ainur-muted">
                  <th className="py-2">#</th>
                  <th>Статус</th>
                  <th>Відкрита</th>
                  <th>Оборот</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((s) => (
                  <tr key={s.id} className="border-b border-ainur-border/50">
                    <td className="py-2 font-medium">#{s.id}</td>
                    <td>{s.status === 'open' ? <span className="text-green-600">відкрита</span> : 'закрита'}</td>
                    <td className="text-xs text-ainur-muted">{s.opened_at}</td>
                    <td>{fmt((Number(s.cash_sales) || 0) + (Number(s.card_sales) || 0))}</td>
                    <td className="text-right">
                      <button type="button" onClick={() => openReport(s.id, 'X')} className="text-ainur-blue text-xs mr-2">X</button>
                      {s.status === 'closed' && (
                        <button type="button" onClick={() => openReport(s.id, 'Z')} className="text-ainur-blue text-xs">Z</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div>
              <button type="button" onClick={() => setDetail(null)} className="mb-3 text-sm text-ainur-blue">← Назад</button>
              <div className="rounded-lg bg-ainur-bg p-4 text-sm space-y-2">
                <p className="font-semibold">{detail.type}-звіт · зміна #{detail.shift?.id}</p>
                <p className="text-xs text-ainur-muted">{detail.shift?.opened_at} — {detail.shift?.closed_at || 'відкрита'}</p>
                <div className="flex justify-between"><span>Чеків</span><span>{detail.sales?.count}</span></div>
                <div className="flex justify-between"><span>Готівка</span><span>{fmt(detail.sales?.cash)}</span></div>
                <div className="flex justify-between"><span>Картка</span><span>{fmt(detail.sales?.card)}</span></div>
                <div className="flex justify-between font-semibold"><span>Очікувана готівка</span><span>{fmt(detail.shift?.expected_cash)}</span></div>
                {detail.type === 'Z' && (
                  <>
                    <div className="flex justify-between"><span>Фактична</span><span>{fmt(detail.shift?.closing_cash)}</span></div>
                    <div className="flex justify-between"><span>Різниця</span><span>{fmt(detail.shift?.variance)}</span></div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
