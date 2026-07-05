import { useEffect, useState } from 'react';
import { fmt } from '../utils';
import { printReceipt } from '../utils/hardware';

export default function CloseShiftModal({ shift, settings, cashier, onClose, onPreview, onCloseShift }) {
  const [report, setReport] = useState(null);
  const [counted, setCounted] = useState('');
  const [withdrawal, setWithdrawal] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [printReport, setPrintReport] = useState(true);

  useEffect(() => {
    onPreview('Z').then(setReport).catch((e) => setErr(e.message));
  }, [onPreview]);

  const expected = Number(report?.shift?.expected_cash ?? shift?.expected_cash ?? 0);
  const countedNum = parseFloat(counted.replace(',', '.')) || 0;
  const withdrawalNum = parseFloat(withdrawal.replace(',', '.')) || 0;
  const afterWithdrawal = expected - withdrawalNum;
  const variance = countedNum - (withdrawalNum > 0 ? afterWithdrawal : expected);

  const printZ = (data) => {
    const s = data?.shift || report?.shift;
    const sales = data?.sales || report?.sales;
    const lines = [
      settings?.company_name || 'StarNet Core',
      'Z-ЗВІТ · закриття зміни',
      `Зміна #${s?.id}`,
      `Касир: ${cashier || '—'}`,
      `Відкрито: ${s?.opened_at || ''}`,
      `Чеків: ${sales?.count || 0}`,
      `Оборот: ${fmt(sales?.total)}`,
      `Готівка: ${fmt(sales?.cash)}`,
      `Картка: ${fmt(sales?.card)}`,
      `Початкова: ${fmt(s?.opening_cash)}`,
      `Внесення: ${fmt(s?.cash_in_total)}`,
      `Вилучення: ${fmt(s?.cash_out_total)}`,
      `Очікувана: ${fmt(s?.expected_cash)}`,
      `Фактична: ${fmt(s?.closing_cash)}`,
      `Різниця: ${fmt(s?.variance)}`,
      settings?.receipt_footer || '',
    ];
    if (settings?.pos_printer_enabled === '1') {
      printReceipt(settings, lines).catch(() => window.print());
    } else {
      window.print();
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (cart.length) { setErr('Спочатку завершіть або скасуйте чек'); return; }
    setBusy(true);
    setErr('');
    try {
      const result = await onCloseShift({
        closing_cash: countedNum,
        cash_withdrawal: withdrawalNum,
        note: note.trim(),
      });
      if (printReport) printZ(result);
      onClose();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  const sales = report?.sales;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center p-0 sm:p-4">
      <form onSubmit={submit} className="flex max-h-[95vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div className="border-b border-ainur-border p-5">
          <h3 className="text-lg font-semibold text-red-600">Закрити зміну</h3>
          <p className="text-sm text-ainur-muted">Зміна #{shift?.id} · Z-звіт</p>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          {err && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}

          <div className="rounded-lg bg-ainur-bg p-4 text-sm space-y-2">
            <div className="flex justify-between"><span>Чеків</span><strong>{sales?.count ?? '…'}</strong></div>
            <div className="flex justify-between"><span>Оборот</span><strong>{fmt(sales?.total)}</strong></div>
            <div className="flex justify-between"><span>Готівка (продажі)</span><span>{fmt(sales?.cash)}</span></div>
            <div className="flex justify-between"><span>Картка</span><span>{fmt(sales?.card)}</span></div>
            <hr className="border-ainur-border" />
            <div className="flex justify-between"><span>Початкова готівка</span><span>{fmt(report?.shift?.opening_cash)}</span></div>
            <div className="flex justify-between"><span>Внесення / вилучення</span>
              <span>{fmt(report?.shift?.cash_in_total)} / {fmt(report?.shift?.cash_out_total)}</span>
            </div>
            <div className="flex justify-between font-semibold text-ainur-blue">
              <span>Очікувана в касі</span><span>{fmt(expected)}</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ainur-text">Вилучення коштів (в сейф / інкасація)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={withdrawal}
              onChange={(e) => setWithdrawal(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-3 text-lg"
              placeholder="0.00"
            />
            {withdrawalNum > 0 && (
              <p className="mt-1 text-xs text-ainur-muted">Залишок після вилучення: {fmt(afterWithdrawal)}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-ainur-text">Фактична готівка в касі (перерахунок)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-3 text-lg font-semibold"
              placeholder={String(expected)}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {[expected, afterWithdrawal].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map((n) => (
                <button key={n} type="button" onClick={() => setCounted(String(n))}
                  className="rounded border border-ainur-border px-2 py-1 text-xs">{fmt(n)}</button>
              ))}
            </div>
          </div>

          {counted && (
            <p className={`text-sm font-medium ${Math.abs(variance) < 0.02 ? 'text-green-600' : 'text-orange-600'}`}>
              Різниця: {fmt(variance)} {Math.abs(variance) < 0.02 ? '✓' : '(перевірте)'}
            </p>
          )}

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-ainur-border px-3 py-2 text-sm"
            placeholder="Коментар до закриття"
          />

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={printReport} onChange={(e) => setPrintReport(e.target.checked)} />
            Друкувати Z-звіт
          </label>
        </div>

        <div className="flex gap-3 border-t border-ainur-border p-5">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-ainur-border py-3 text-sm">Скасувати</button>
          <button type="submit" disabled={busy || !counted}
            className="flex-1 rounded-lg bg-red-600 py-3 text-sm font-semibold text-white disabled:opacity-50">
            Закрити зміну
          </button>
        </div>
      </form>
    </div>
  );
}
