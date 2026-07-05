import { useState } from 'react';
import { fmt } from '../utils';

export default function OpenShiftModal({ defaultCash, onClose, onSubmit }) {
  const [cash, setCash] = useState(defaultCash != null ? String(defaultCash) : '0');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit(parseFloat(cash.replace(',', '.')) || 0);
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
        <h3 className="text-lg font-semibold">Відкрити зміну</h3>
        <p className="mt-1 text-sm text-ainur-muted">
          {defaultCash != null
            ? `Розмінна з попередньої зміни: ${fmt(defaultCash)}`
            : 'Вкажіть готівку в касі на початок зміни (розмінна)'}
        </p>
        {err && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
        <label className="mt-4 block text-sm text-ainur-muted">Початкова готівка, ₴</label>
        <input
          type="number"
          step="0.01"
          min="0"
          autoFocus
          value={cash}
          onChange={(e) => setCash(e.target.value)}
          className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-3 text-xl font-semibold"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {[0, 500, 1000, 2000].map((n) => (
            <button key={n} type="button" onClick={() => setCash(String(n))}
              className="rounded-lg border border-ainur-border px-3 py-1.5 text-sm hover:bg-gray-50">{fmt(n)}</button>
          ))}
        </div>
        <button type="submit" disabled={busy} className="mt-6 w-full rounded-lg bg-ainur-blue py-3 text-sm font-semibold text-white">
          Відкрити зміну
        </button>
      </form>
    </div>
  );
}
