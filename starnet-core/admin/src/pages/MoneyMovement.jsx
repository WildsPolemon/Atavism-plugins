import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api, fmtUah } from '../api';

const TYPES = [
  { id: 'income', label: 'Прихід' },
  { id: 'expense', label: 'Витрата' },
  { id: 'transfer', label: 'Переказ' },
];

export default function MoneyMovement() {
  const [movements, setMovements] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0 });
  const [registers, setRegisters] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ type: 'income', amount: '', register_id: '', category: '', notes: '' });

  const load = () => {
    api.moneyMovements().then((r) => { setMovements(r.movements || []); setSummary(r.summary || {}); });
    api.registers().then((r) => setRegisters(r.registers || []));
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.createMoneyMovement({ ...form, amount: +form.amount, register_id: form.register_id ? +form.register_id : null });
    setShow(false);
    setForm({ type: 'income', amount: '', register_id: '', category: '', notes: '' });
    load();
  };

  const typeLabel = (t) => ({ income: 'Прихід', expense: 'Витрата', transfer: 'Переказ', debt_payment: 'Погашення боргу' }[t] || t);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Рух грошей</h1>
          <p className="text-sm text-muted">Приходи, витрати, перекази — як AinurPOS</p>
        </div>
        <button onClick={() => setShow(true)} className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white">
          <Plus className="h-4 w-4" /> Нова операція
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="glass p-4">
          <p className="text-sm text-muted">Приходи</p>
          <p className="text-2xl font-bold text-green-600">{fmtUah(summary.income)}</p>
        </div>
        <div className="glass p-4">
          <p className="text-sm text-muted">Витрати</p>
          <p className="text-2xl font-bold text-red-600">{fmtUah(summary.expense)}</p>
        </div>
      </div>

      <div className="glass overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-elevated/60 text-muted">
            <tr>
              <th className="px-4 py-3 text-left">Дата</th>
              <th className="px-4 py-3 text-left">Тип</th>
              <th className="px-4 py-3 text-left">Категорія</th>
              <th className="px-4 py-3 text-left">Каса</th>
              <th className="px-4 py-3 text-left">Користувач</th>
              <th className="px-4 py-3 text-right">Сума</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id} className="border-t border-surface-border/50">
                <td className="px-4 py-3 text-muted">{m.created_at}</td>
                <td className="px-4 py-3">{typeLabel(m.type)}</td>
                <td className="px-4 py-3">{m.category || m.notes || '—'}</td>
                <td className="px-4 py-3">{m.register_name || '—'}</td>
                <td className="px-4 py-3">{m.user_name || m.customer_name || '—'}</td>
                <td className={`px-4 py-3 text-right font-medium ${['income', 'debt_payment'].includes(m.type) ? 'text-green-600' : 'text-red-600'}`}>
                  {['income', 'debt_payment'].includes(m.type) ? '+' : '-'}{fmtUah(m.amount)}
                </td>
              </tr>
            ))}
            {!movements.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Операцій ще немає</td></tr>}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={save} className="glass w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-bold">Нова операція</h3>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="mb-3 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm">
              {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <input required type="number" step="0.01" placeholder="Сума" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="mb-3 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm" />
            <select value={form.register_id} onChange={(e) => setForm({ ...form, register_id: e.target.value })}
              className="mb-3 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm">
              <option value="">Без каси</option>
              {registers.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <input placeholder="Категорія" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mb-3 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm" />
            <textarea placeholder="Коментар" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mb-4 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm" rows={2} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShow(false)} className="flex-1 rounded-xl border border-surface-border py-2 text-sm">Скасувати</button>
              <button type="submit" className="flex-1 rounded-xl bg-accent py-2 text-sm text-white">Зберегти</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
