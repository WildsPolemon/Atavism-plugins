import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { fmt } from '../utils';

export default function DebtReturnModal({ customers, onSearch, onPay, onClose }) {
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [cash, setCash] = useState('');
  const [card, setCard] = useState('');
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => { onSearch(''); }, []);

  const select = (c) => {
    setSelected(c);
    setAmount(String(c.debt || ''));
    setCash(String(c.debt || ''));
    setCard('0');
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    const amt = parseFloat(amount) || 0;
    const c = parseFloat(cash) || 0;
    const k = parseFloat(card) || 0;
    if (!selected || amt <= 0) { setErr('Оберіть клієнта та суму'); return; }
    if (c + k < amt - 0.01) { setErr('Недостатньо коштів'); return; }
    try {
      await onPay(selected.id, { amount: amt, payment_cash: c, payment_card: k });
      onClose();
    } catch (ex) { setErr(ex.message); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-ainur-border px-5 py-4">
          <h2 className="text-lg font-semibold">Повернення боргу</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        {!selected ? (
          <div className="flex-1 overflow-auto p-4">
            <input value={q} onChange={(e) => { setQ(e.target.value); onSearch(e.target.value); }}
              placeholder="Пошук клієнта з боргом..." className="mb-3 w-full rounded-lg border border-ainur-border px-4 py-2.5 text-sm" />
            {!customers.length && <p className="py-6 text-center text-sm text-ainur-muted">Немає клієнтів з боргом</p>}
            {customers.map((c) => (
              <button key={c.id} type="button" onClick={() => select(c)}
                className="mb-2 flex w-full justify-between rounded-lg border border-ainur-border p-3 text-left hover:bg-gray-50">
                <span>{c.name}<br /><span className="text-xs text-ainur-muted">{c.phone}</span></span>
                <span className="font-medium text-red-600">{fmt(c.debt)}</span>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3 p-5">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="font-medium">{selected.name}</p>
              <p className="text-sm text-red-600">Борг: {fmt(selected.debt)}</p>
              <button type="button" onClick={() => setSelected(null)} className="mt-1 text-xs text-ainur-blue">Змінити клієнта</button>
            </div>
            <label className="block text-sm">Сума погашення
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-2.5" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">Готівка
                <input type="number" step="0.01" value={cash} onChange={(e) => setCash(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-2.5" />
              </label>
              <label className="block text-sm">Картка
                <input type="number" step="0.01" value={card} onChange={(e) => setCard(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-2.5" />
              </label>
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button type="submit" className="w-full rounded-lg bg-ainur-green py-3 text-sm font-semibold text-white">Прийняти оплату</button>
          </form>
        )}
      </div>
    </div>
  );
}
