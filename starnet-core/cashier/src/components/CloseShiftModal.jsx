import { useEffect, useState } from 'react';
import { fmt } from '../utils';
import { printReceipt } from '../utils/hardware';

export default function CloseShiftModal({ shift, settings, cashier, onClose, onPreview, onCloseShift }) {
  const [report, setReport] = useState(null);
  const [counted, setCounted] = useState('');
  const [remainder, setRemainder] = useState('');
  const [withdrawal, setWithdrawal] = useState('');
  const [withdrawalManual, setWithdrawalManual] = useState(false);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [printReport, setPrintReport] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    onPreview('Z').then((r) => {
      setReport(r);
      if (!initialized) {
        const exp = Number(r?.shift?.expected_cash ?? shift?.expected_cash ?? 0);
        const opening = Number(r?.shift?.opening_cash ?? shift?.opening_cash ?? 0);
        setCounted(String(exp));
        setRemainder(String(opening));
        setWithdrawal(String(Math.max(0, exp - opening)));
        setInitialized(true);
      }
    }).catch((e) => setErr(e.message));
  }, [onPreview, shift, initialized]);

  const expected = Number(report?.shift?.expected_cash ?? shift?.expected_cash ?? 0);
  const countedNum = parseFloat(String(counted).replace(',', '.')) || 0;
  const remainderNum = parseFloat(String(remainder).replace(',', '.')) || 0;
  const withdrawalNum = parseFloat(String(withdrawal).replace(',', '.')) || 0;
  const autoWithdrawal = Math.max(0, countedNum - remainderNum);
  const variance = countedNum - expected;

  const syncWithdrawal = (countVal, remVal) => {
    if (!withdrawalManual) {
      setWithdrawal(String(Math.max(0, countVal - remVal)));
    }
  };

  const onCountedChange = (val) => {
    setCounted(val);
    const c = parseFloat(String(val).replace(',', '.')) || 0;
    const r = parseFloat(String(remainder).replace(',', '.')) || 0;
    syncWithdrawal(c, r);
  };

  const onRemainderChange = (val) => {
    setRemainder(val);
    const c = parseFloat(String(counted).replace(',', '.')) || 0;
    const r = parseFloat(String(val).replace(',', '.')) || 0;
    syncWithdrawal(c, r);
  };

  const onWithdrawalChange = (val) => {
    setWithdrawalManual(true);
    setWithdrawal(val);
  };

  const printZ = (data) => {
    const s = data?.shift || report?.shift;
    const sales = data?.sales || report?.sales;
    const w = data?.cash_withdrawal ?? withdrawalNum;
    const rem = data?.cash_remainder ?? remainderNum;
    const cnt = data?.counted_cash ?? countedNum;
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
      `Очікувана: ${fmt(expected)}`,
      `Перерахунок: ${fmt(cnt)}`,
      `Вилучено (магазин): ${fmt(w)}`,
      `Розмінна: ${fmt(rem)}`,
      `Різниця: ${fmt(s?.variance ?? variance)}`,
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
    if (counted === '') { setErr('Вкажіть фактичну готівку в касі'); return; }
    if (remainderNum > countedNum + 0.01) { setErr('Розмінна не може перевищувати перерахунок'); return; }
    if (Math.abs(autoWithdrawal - withdrawalNum) > 0.02) {
      setErr('Вилучення має дорівнювати перерахунку мінус розмінна');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const result = await onCloseShift({
        counted_cash: countedNum,
        cash_remainder: remainderNum,
        cash_withdrawal: withdrawalNum,
        note: note.trim(),
      });
      if (printReport) printZ(result);
      onClose(result);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  const sales = report?.sales;
  const opening = Number(report?.shift?.opening_cash ?? shift?.opening_cash ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center p-0 sm:p-4">
      <form onSubmit={submit} className="flex max-h-[95vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div className="border-b border-ainur-border p-5">
          <h3 className="text-lg font-semibold text-red-600">Закрити зміну</h3>
          <p className="text-sm text-ainur-muted">Зміна #{shift?.id} · Z-звіт · переказ на рахунок магазину</p>
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
            <label className="text-sm font-medium text-ainur-text">1. Перерахунок готівки в ящику</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={counted}
              onChange={(e) => onCountedChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-3 text-lg font-semibold"
              placeholder={String(expected)}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {[expected].filter((v) => v > 0).map((n) => (
                <button key={n} type="button" onClick={() => onCountedChange(String(n))}
                  className="rounded border border-ainur-border px-2 py-1 text-xs">{fmt(n)} = очікувана</button>
              ))}
            </div>
          </div>

          {counted !== '' && (
            <p className={`text-sm font-medium ${Math.abs(variance) < 0.02 ? 'text-green-600' : 'text-orange-600'}`}>
              Різниця перерахунку: {fmt(variance)} {Math.abs(variance) < 0.02 ? '✓' : '(перевірте)'}
            </p>
          )}

          <div>
            <label className="text-sm font-medium text-ainur-text">2. Розмінна на завтра (залишити в касі)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={remainder}
              onChange={(e) => onRemainderChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-3 text-lg"
              placeholder={String(opening)}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {[0, opening, 500, 1000].filter((v, i, a) => a.indexOf(v) === i).map((n) => (
                <button key={n} type="button" onClick={() => onRemainderChange(String(n))}
                  className="rounded border border-ainur-border px-2 py-1 text-xs">{fmt(n)}</button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <label className="text-sm font-medium text-ainur-text">3. Вилучення — переказ на рахунок магазину</label>
            <p className="mt-0.5 text-xs text-ainur-muted">Оформлюється автоматично при закритті зміни (як в AinurPOS)</p>
            <input
              type="number"
              step="0.01"
              min="0"
              value={withdrawal}
              onChange={(e) => onWithdrawalChange(e.target.value)}
              className="mt-2 w-full rounded-lg border border-ainur-border bg-white px-4 py-3 text-lg font-semibold text-red-700"
            />
            <p className="mt-1 text-xs text-ainur-muted">
              {countedNum} − {fmt(remainderNum)} = <strong>{fmt(autoWithdrawal)}</strong>
            </p>
          </div>

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-ainur-border px-3 py-2 text-sm"
            placeholder="Коментар до закриття (необов'язково)"
          />

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={printReport} onChange={(e) => setPrintReport(e.target.checked)} />
            Друкувати Z-звіт
          </label>
        </div>

        <div className="flex gap-3 border-t border-ainur-border p-5">
          <button type="button" onClick={() => onClose()} className="flex-1 rounded-lg border border-ainur-border py-3 text-sm">Скасувати</button>
          <button type="submit" disabled={busy || counted === ''}
            className="flex-1 rounded-lg bg-red-600 py-3 text-sm font-semibold text-white disabled:opacity-50">
            Закрити зміну
          </button>
        </div>
      </form>
    </div>
  );
}
