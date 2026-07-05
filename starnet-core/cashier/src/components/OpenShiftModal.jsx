import { useState } from 'react';
import { fmt } from '../utils';

export default function OpenShiftModal({ register, onConfirm, onClose }) {
  const [cash, setCash] = useState('0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="mb-2 text-lg font-semibold">Відкрити зміну</h2>
        <p className="mb-4 text-sm text-ainur-muted">
          Каса: <strong>{register?.code} {register?.name}</strong><br />
          Баланс рахунку: {fmt(register?.balance)}
        </p>
        <label className="mb-4 block text-sm">Готівка на початку зміни
          <input type="number" step="0.01" value={cash} onChange={(e) => setCash(e.target.value)} autoFocus
            className="mt-1 w-full rounded-lg border border-ainur-border px-4 py-2.5" />
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-ainur-border py-2.5 text-sm">Скасувати</button>
          <button type="button" onClick={() => onConfirm(parseFloat(cash) || 0)}
            className="flex-1 rounded-lg bg-ainur-green py-2.5 text-sm font-medium text-white">Відкрити зміну</button>
        </div>
      </div>
    </div>
  );
}
