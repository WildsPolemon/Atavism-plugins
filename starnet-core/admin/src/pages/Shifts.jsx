import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api, fmtUah } from '../api';

const TABS = [
  { id: 'shifts', label: 'Зміни' },
  { id: 'registers', label: 'Каси' },
];

export default function Shifts() {
  const [tab, setTab] = useState('shifts');
  const [shifts, setShifts] = useState([]);
  const [registers, setRegisters] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [detail, setDetail] = useState(null);
  const [showReg, setShowReg] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', balance: 0 });

  const load = () => {
    api.shifts().then((r) => setShifts(r.shifts || []));
    api.registers().then((r) => { setRegisters(r.registers || []); setTotalBalance(r.total_balance || 0); });
  };
  useEffect(() => { load(); }, []);

  const openShift = async (id) => setDetail(await api.shiftDetail(id));

  const saveReg = async (e) => {
    e.preventDefault();
    await api.createRegister(regForm);
    setShowReg(false);
    setRegForm({ name: '', balance: 0 });
    load();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Каса та зміни</h1>
          <p className="text-sm text-muted">Зміни касирів, каси та баланси — як AinurPOS</p>
        </div>
        <div className="rounded-xl bg-blue-50 px-4 py-2 text-sm">
          Всього грошей в касах: <strong className="text-accent">{fmtUah(totalBalance)}</strong>
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setDetail(null); }}
            className={`rounded-xl px-4 py-2 text-sm ${tab === t.id ? 'bg-accent text-white' : 'bg-surface-elevated text-muted'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'shifts' && !detail && (
        <div className="glass overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-elevated/60 text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Зміна</th>
                <th className="px-4 py-3 text-left">Касир</th>
                <th className="px-4 py-3 text-left">Каса</th>
                <th className="px-4 py-3 text-left">Відкрита</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-right">Продажі</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((s) => (
                <tr key={s.id} onClick={() => openShift(s.id)} className="cursor-pointer border-t border-surface-border/50 hover:bg-surface-elevated/30">
                  <td className="px-4 py-3 font-medium">#{s.id}</td>
                  <td className="px-4 py-3">{s.cashier}</td>
                  <td className="px-4 py-3 text-muted">{s.register_name || '—'}</td>
                  <td className="px-4 py-3 text-muted">{s.opened_at}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs ${s.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                      {s.status === 'open' ? 'Відкрита' : 'Закрита'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{fmtUah((+s.cash_sales || 0) + (+s.card_sales || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'shifts' && detail && (
        <div>
          <button onClick={() => setDetail(null)} className="mb-4 text-sm text-accent">← Назад</button>
          <div className="glass p-6">
            <h2 className="mb-4 text-lg font-bold">Зміна #{detail.id}</h2>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <p>Касир: {detail.cashier}</p>
              <p>Каса: {detail.register_name || '—'}</p>
              <p>Відкрита: {detail.opened_at}</p>
              <p>Закрита: {detail.closed_at || '—'}</p>
              <p>Чеків: {detail.sales?.count ?? 0}</p>
              <p>Готівка: {fmtUah(detail.sales?.cash)}</p>
              <p>Картка: {fmtUah(detail.sales?.card)}</p>
              <p className="font-semibold">Разом: {fmtUah(detail.sales?.total)}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'registers' && (
        <>
          <div className="mb-4 flex justify-end">
            <button onClick={() => setShowReg(true)} className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white">
              <Plus className="h-4 w-4" /> Додати касу
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {registers.map((r) => (
              <div key={r.id} className="glass p-4">
                <p className="font-medium">{r.name}</p>
                <p className="text-sm text-muted">{r.store_name || 'Магазин'}</p>
                <p className="mt-2 text-xl font-bold text-accent">{fmtUah(r.balance)}</p>
                {r.open_shift && <p className="mt-1 text-xs text-green-600">Зміна #{r.open_shift.id} відкрита</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {showReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={saveReg} className="glass w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-bold">Нова каса</h3>
            <input required placeholder="Назва" value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
              className="mb-3 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm" />
            <input type="number" step="0.01" placeholder="Початковий баланс" value={regForm.balance}
              onChange={(e) => setRegForm({ ...regForm, balance: e.target.value })}
              className="mb-4 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowReg(false)} className="flex-1 rounded-xl border border-surface-border py-2 text-sm">Скасувати</button>
              <button type="submit" className="flex-1 rounded-xl bg-accent py-2 text-sm text-white">Зберегти</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
