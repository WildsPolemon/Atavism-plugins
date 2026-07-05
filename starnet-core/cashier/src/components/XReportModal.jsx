import { useEffect, useState } from 'react';
import { fmt } from '../utils';
import { printReceipt } from '../utils/hardware';

export default function XReportModal({ shift, settings, cashier, onClose, onLoad }) {
  const [report, setReport] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    onLoad('X').then(setReport).catch((e) => setErr(e.message));
  }, [onLoad]);

  const print = async () => {
    setBusy(true);
    const { shift: s, sales, movements } = report || {};
    const lines = [
      settings?.company_name || 'StarNet Core',
      'X-ЗВІТ',
      `Зміна #${s?.id}`,
      `Касир: ${cashier || '—'}`,
      `Відкрито: ${s?.opened_at || ''}`,
      `Чеків: ${sales?.count || 0}`,
      `Оборот: ${fmt(sales?.total)}`,
      `Готівка: ${fmt(sales?.cash)}`,
      `Картка: ${fmt(sales?.card)}`,
      `Відстрочення: ${fmt(sales?.deferred)}`,
      `Початкова: ${fmt(s?.opening_cash)}`,
      `Внесення: ${fmt(s?.cash_in_total)}`,
      `Вилучення: ${fmt(s?.cash_out_total)}`,
      `В касі: ${fmt(s?.expected_cash)}`,
      ...(movements || []).map((m) => `${m.type === 'in' ? '+' : '−'}${fmt(m.amount)} ${m.note || ''}`),
      settings?.receipt_footer || '',
    ];
    try {
      if (settings?.pos_printer_enabled === '1') await printReceipt(settings, lines);
      else window.print();
    } catch {
      window.print();
    } finally {
      setBusy(false);
    }
  };

  const s = report?.shift;
  const sales = report?.sales;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-ainur-border p-4">
          <h3 className="text-lg font-semibold">X-звіт</h3>
          <button type="button" onClick={onClose} className="text-ainur-muted">✕</button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3 text-sm">
          {err && <p className="rounded bg-red-50 px-3 py-2 text-red-600">{err}</p>}
          <p className="text-xs text-ainur-muted">Зміна #{shift?.id} · без закриття</p>
          <div className="rounded-lg bg-ainur-bg p-4 space-y-2">
            <div className="flex justify-between"><span>Чеків</span><strong>{sales?.count ?? '…'}</strong></div>
            <div className="flex justify-between"><span>Оборот</span><strong>{fmt(sales?.total)}</strong></div>
            <div className="flex justify-between"><span>Готівка</span><span>{fmt(sales?.cash)}</span></div>
            <div className="flex justify-between"><span>Картка</span><span>{fmt(sales?.card)}</span></div>
            <div className="flex justify-between"><span>Відстрочення</span><span>{fmt(sales?.deferred)}</span></div>
            <hr className="border-ainur-border" />
            <div className="flex justify-between"><span>Початкова</span><span>{fmt(s?.opening_cash)}</span></div>
            <div className="flex justify-between"><span>Внесення / вилучення</span>
              <span>{fmt(s?.cash_in_total)} / {fmt(s?.cash_out_total)}</span>
            </div>
            <div className="flex justify-between font-semibold text-ainur-blue">
              <span>Залишок в касі</span><span>{fmt(s?.expected_cash)}</span>
            </div>
          </div>
          {(report?.movements || []).length > 0 && (
            <div>
              <p className="mb-2 font-medium">Рух готівки</p>
              <div className="space-y-1 text-xs">
                {report.movements.map((m) => (
                  <div key={m.id} className="flex justify-between rounded bg-gray-50 px-2 py-1">
                    <span className={m.type === 'in' ? 'text-green-600' : 'text-red-600'}>
                      {m.type === 'in' ? 'Внесення' : 'Вилучення'}
                    </span>
                    <span>{fmt(m.amount)} · {m.note || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 border-t border-ainur-border p-4">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-ainur-border py-2.5 text-sm">Закрити</button>
          <button type="button" onClick={print} disabled={busy || !report}
            className="flex-1 rounded-lg bg-ainur-blue py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            Друкувати
          </button>
        </div>
      </div>
    </div>
  );
}
