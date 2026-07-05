import { useEffect, useState } from 'react';
import { Plus, ArrowRightLeft, TrendingDown, TrendingUp } from 'lucide-react';
import { api, fmtUah } from '../api';

const ACCOUNT_LABELS = { store: 'Магазин', cash: 'Каси', bank: 'Банк' };
const EXPENSE_CATS = ['Оренда', 'Зарплата', 'Комунальні', 'Закупівля', 'Інше'];

export default function MoneyMovement() {
  const [grouped, setGrouped] = useState({ store: [], cash: [], bank: [] });
  const [totalBalance, setTotalBalance] = useState(0);
  const [movements, setMovements] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0 });
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const loadAccounts = () => api.financeAccounts().then((r) => {
    setGrouped(r.grouped || { store: [], cash: [], bank: [] });
    setTotalBalance(r.total_balance || 0);
  });

  const loadMovements = (accountId) => {
    api.moneyMovements(null, null, accountId).then((r) => {
      setMovements(r.movements || []);
      setSummary(r.summary || {});
    });
  };

  useEffect(() => { loadAccounts(); loadMovements(null); }, []);

  const selectAccount = (a) => {
    setSelectedAccount(a);
    loadMovements(a?.id);
  };

  const allAccounts = [...(grouped.store || []), ...(grouped.cash || []), ...(grouped.bank || [])];

  const openModal = (type) => {
    setForm({
      type,
      amount: '',
      from_account_id: type === 'expense' || type === 'transfer' ? (selectedAccount?.id || '') : '',
      to_account_id: type === 'income' || type === 'transfer' ? (selectedAccount?.id || '') : '',
      expense_category: '',
      notes: '',
    });
    setModal(type);
  };

  const save = async (e) => {
    e.preventDefault();
    await api.createMoneyMovement({
      type: modal,
      amount: +form.amount,
      from_account_id: form.from_account_id ? +form.from_account_id : null,
      to_account_id: form.to_account_id ? +form.to_account_id : null,
      expense_category: form.expense_category || null,
      notes: form.notes,
    });
    setModal(null);
    loadAccounts();
    loadMovements(selectedAccount?.id);
  };

  const typeLabel = (t) => ({
    income: 'Прихід', expense: 'Витрата', transfer: 'Переказ',
    debt_payment: 'Погашення боргу', sale_cash: 'Продаж (готівка)',
  }[t] || t);

  return (
    <div className="flex gap-6">
      <aside className="w-72 shrink-0">
        <div className="glass mb-4 p-4">
          <p className="text-xs text-muted">Усього на рахунках</p>
          <p className="text-2xl font-bold text-accent">{fmtUah(totalBalance)}</p>
        </div>
        {['store', 'cash', 'bank'].map((type) => (
          <div key={type} className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase text-muted">{ACCOUNT_LABELS[type]}</p>
            <div className="space-y-1">
              {(grouped[type] || []).map((a) => (
                <button key={a.id} type="button" onClick={() => selectAccount(a)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${selectedAccount?.id === a.id ? 'bg-accent text-white' : 'bg-surface-elevated hover:bg-surface-elevated/80'}`}>
                  <p className="font-medium truncate">{a.name}</p>
                  <p className={`text-xs ${selectedAccount?.id === a.id ? 'text-white/80' : 'text-muted'}`}>{fmtUah(a.balance)}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
        <button type="button" onClick={() => { setForm({ type: 'store', name: '', balance: 0, bank_details: '' }); setModal('new_account'); }}
          className="w-full rounded-xl border border-dashed border-accent py-2 text-sm text-accent">+ Новий рахунок</button>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Рух грошей</h1>
            <p className="text-sm text-muted">
              {selectedAccount ? `Рахунок: ${selectedAccount.name}` : 'Усі операції'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => openModal('income')} className="flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-sm text-white">
              <TrendingUp className="h-4 w-4" /> Прихід
            </button>
            <button type="button" onClick={() => openModal('expense')} className="flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-sm text-white">
              <TrendingDown className="h-4 w-4" /> Витрата
            </button>
            <button type="button" onClick={() => openModal('transfer')} className="flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm text-white">
              <ArrowRightLeft className="h-4 w-4" /> Переказ
            </button>
          </div>
        </div>

        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div className="glass p-4"><p className="text-sm text-muted">Приходи</p><p className="text-xl font-bold text-green-600">{fmtUah(summary.income)}</p></div>
          <div className="glass p-4"><p className="text-sm text-muted">Витрати</p><p className="text-xl font-bold text-red-600">{fmtUah(summary.expense)}</p></div>
        </div>

        {selectedAccount && (
          <button type="button" onClick={() => selectAccount(null)} className="mb-3 text-sm text-accent">Показати всі рахунки</button>
        )}

        <div className="glass overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-elevated/60 text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Дата</th>
                <th className="px-4 py-3 text-left">Тип</th>
                <th className="px-4 py-3 text-left">З рахунку</th>
                <th className="px-4 py-3 text-left">На рахунок</th>
                <th className="px-4 py-3 text-left">Категорія</th>
                <th className="px-4 py-3 text-right">Сума</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-t border-surface-border/50">
                  <td className="px-4 py-3 text-muted">{m.created_at}</td>
                  <td className="px-4 py-3">{typeLabel(m.type)}</td>
                  <td className="px-4 py-3">{m.from_account_name || '—'}</td>
                  <td className="px-4 py-3">{m.to_account_name || '—'}</td>
                  <td className="px-4 py-3">{m.expense_category || m.category || m.notes || '—'}</td>
                  <td className={`px-4 py-3 text-right font-medium ${['income', 'debt_payment', 'sale_cash'].includes(m.type) ? 'text-green-600' : 'text-red-600'}`}>
                    {['income', 'debt_payment', 'sale_cash'].includes(m.type) ? '+' : '−'}{fmtUah(m.amount)}
                  </td>
                </tr>
              ))}
              {!movements.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Операцій немає</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && modal !== 'new_account' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={save} className="glass w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-bold">
              {modal === 'income' ? 'Прихід' : modal === 'expense' ? 'Витрата' : 'Переказ'}
            </h3>
            <input required type="number" step="0.01" placeholder="Сума" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="mb-3 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm" />
            {(modal === 'expense' || modal === 'transfer') && (
              <select required value={form.from_account_id} onChange={(e) => setForm({ ...form, from_account_id: e.target.value })}
                className="mb-3 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm">
                <option value="">З рахунку</option>
                {allAccounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({fmtUah(a.balance)})</option>)}
              </select>
            )}
            {(modal === 'income' || modal === 'transfer') && (
              <select required value={form.to_account_id} onChange={(e) => setForm({ ...form, to_account_id: e.target.value })}
                className="mb-3 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm">
                <option value="">На рахунок</option>
                {allAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            )}
            {modal === 'expense' && (
              <select value={form.expense_category} onChange={(e) => setForm({ ...form, expense_category: e.target.value })}
                className="mb-3 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm">
                <option value="">Категорія витрат</option>
                {EXPENSE_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            <textarea placeholder="Коментар" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mb-4 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm" rows={2} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 rounded-xl border py-2 text-sm">Скасувати</button>
              <button type="submit" className="flex-1 rounded-xl bg-accent py-2 text-sm text-white">Зберегти</button>
            </div>
          </form>
        </div>
      )}

      {modal === 'new_account' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={async (e) => {
            e.preventDefault();
            await api.createFinanceAccount({ ...form, balance: +form.balance });
            setModal(null);
            loadAccounts();
          }} className="glass w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-bold">Новий рахунок</h3>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="mb-3 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm">
              <option value="store">Магазин</option>
              <option value="bank">Банк</option>
            </select>
            <input required placeholder="Назва" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mb-3 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm" />
            {form.type === 'bank' && (
              <input placeholder="Реквізити" value={form.bank_details} onChange={(e) => setForm({ ...form, bank_details: e.target.value })}
                className="mb-3 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm" />
            )}
            <input type="number" step="0.01" placeholder="Початковий баланс" value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
              className="mb-4 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 rounded-xl border py-2 text-sm">Скасувати</button>
              <button type="submit" className="flex-1 rounded-xl bg-accent py-2 text-sm text-white">Створити</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
