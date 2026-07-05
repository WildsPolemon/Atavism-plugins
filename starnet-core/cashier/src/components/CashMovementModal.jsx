import { useState } from 'react';
import { fmt } from '../utils';

export default function CashMovementModal({ type, shift, onClose, onSubmit }) {
  const isOut = type === 'out';
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const val = parseFloat(amount.replace(',', '.'));
    if (!val || val <= 0) { setErr('Вкажіть суму'); return; }
    setBusy(true);
    try {
      await onSubmit({ amount: val, note: note.trim() });
      onClose();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-ainur-text">
          {isOut ? 'Вилучення готівки' : 'Внесення готівки'}
        </h3>
        <p className="mt-1 text-sm text-ainur-muted">
          Зміна #{shift?.id} · в касі ~ {fmt(shift?.expected_cash)}
        </p>
        {err && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
        <label className="mt-4 block text-sm text-ainur-muted">Сума, ₴</label>
        <input
          type="number"
          step="0.01"
          min="0"
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-3 text-xl font-semibold"
          placeholder="0.00"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {[100, 500, 1000, 2000, 5000].map((n) => (
            <button key={n} type="button" onClick={() => setAmount(String(n))}
              className="rounded-lg border border-ainur-border px-3 py-1.5 text-sm hover:bg-gray-50">{n}</button>
          ))}
        </div>
        <label className="mt-4 block text-sm text-ainur-muted">Коментар</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 w-full rounded-lg border border-ainur-border px-3 py-2 text-sm"
          placeholder={isOut ? 'Інкасація, здача в сейф…' : 'Розмінна, внесення…'}
        />
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-ainur-border py-2.5 text-sm">Скасувати</button>
          <button type="submit" disabled={busy}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold text-white ${isOut ? 'bg-red-600' : 'bg-ainur-blue'}`}>
            {isOut ? 'Вилучити' : 'Внести'}
          </button>
        </div>
      </form>
    </div>
  );
}
