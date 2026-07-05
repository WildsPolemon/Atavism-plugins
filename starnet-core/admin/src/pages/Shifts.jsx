import { useEffect, useState } from 'react';
import { Plus, Printer, Users } from 'lucide-react';
import { api, fmtUah } from '../api';

const TABS = [
  { id: 'shifts', label: 'Зміни' },
  { id: 'registers', label: 'Каса' },
];

function XZPanel({ shiftId, initialType = 'X', onClose }) {
  const [report, setReport] = useState(null);
  const [type, setType] = useState(initialType);
  useEffect(() => {
    api.shiftXzReport(shiftId, type).then(setReport).catch(() => {});
  }, [shiftId, type]);
  const s = report?.shift;
  const sales = report?.sales;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{type === 'Z' ? 'Z-звіт' : 'X-звіт'} · зміна #{shiftId}</h3>
          <button type="button" onClick={onClose} className="text-sm text-muted">Закрити</button>
        </div>
        {s && (
          <div className="space-y-2 text-sm">
            <p>Касир: {s.cashier}</p>
            <p>Каса: {s.register_code} {s.register_name}</p>
            <p>Магазин: {s.store_name}</p>
            <p>Відкрита: {s.opened_at}{s.closed_at ? ` · Закрита: ${s.closed_at}` : ''}</p>
            <hr className="border-surface-border" />
            <p>Чеків: {sales?.count ?? 0}</p>
            <p>Готівка: {fmtUah(sales?.cash)}</p>
            <p>Картка: {fmtUah(sales?.card)}</p>
            <p className="font-bold">Разом: {fmtUah(sales?.total)}</p>
            {s.expected_cash != null && <p>Очікувана готівка: {fmtUah(s.expected_cash)}</p>}
            {s.variance != null && <p>Розбіжність: {fmtUah(s.variance)}</p>}
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setType(type === 'X' ? 'Z' : 'X')} className="flex-1 rounded-xl border border-surface-border py-2 text-sm">
            {type === 'X' ? 'Z-звіт' : 'X-звіт'}
          </button>
          <button type="button" onClick={() => window.print()} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-2 text-sm text-white">
            <Printer className="h-4 w-4" /> Друк
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Shifts() {
  const [tab, setTab] = useState('shifts');
  const [shifts, setShifts] = useState([]);
  const [registers, setRegisters] = useState([]);
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [detail, setDetail] = useState(null);
  const [regDetail, setRegDetail] = useState(null);
  const [xzShift, setXzShift] = useState(null);
  const [showReg, setShowReg] = useState(false);
  const [editCashiers, setEditCashiers] = useState(null);
  const [regForm, setRegForm] = useState({ name: '', store_id: '', terminal_info: 'Каса', balance: 0, user_ids: [] });

  const load = () => {
    api.shifts().then((r) => setShifts(r.shifts || []));
    api.registers().then((r) => { setRegisters(r.registers || []); setTotalBalance(r.total_balance || 0); });
    api.shiftUsers().then((r) => setUsers(r.users || []));
    api.stores().then((r) => setStores(r.stores || []));
  };
  useEffect(() => { load(); }, []);

  const openReg = async (id) => setRegDetail(await api.registerDetail(id));

  const saveReg = async (e) => {
    e.preventDefault();
    await api.createRegister({
      ...regForm,
      store_id: regForm.store_id ? +regForm.store_id : null,
      balance: +regForm.balance,
      user_ids: regForm.user_ids.map(Number),
    });
    setShowReg(false);
    setRegForm({ name: '', store_id: '', terminal_info: 'Каса', balance: 0, user_ids: [] });
    load();
  };

  const saveCashiers = async () => {
    await api.updateRegister(editCashiers.id, { user_ids: editCashiers.user_ids });
    setEditCashiers(null);
    load();
    if (regDetail?.id === editCashiers.id) openReg(editCashiers.id);
  };

  const toggleCashier = (uid) => {
    setRegForm((f) => ({
      ...f,
      user_ids: f.user_ids.includes(uid) ? f.user_ids.filter((x) => x !== uid) : [...f.user_ids, uid],
    }));
  };

  const toggleEditCashier = (uid) => {
    setEditCashiers((e) => ({
      ...e,
      user_ids: e.user_ids.includes(uid) ? e.user_ids.filter((x) => x !== uid) : [...e.user_ids, uid],
    }));
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Каса та зміни</h1>
          <p className="text-sm text-muted">Прив&apos;язка касирів до кас, баланси, X/Z-звіти</p>
        </div>
        <div className="rounded-xl bg-blue-50 px-4 py-2 text-sm">
          Всього грошей в касах: <strong className="text-accent">{fmtUah(totalBalance)}</strong>
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => { setTab(t.id); setDetail(null); setRegDetail(null); }}
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
                <th className="px-4 py-3 text-left">Магазин</th>
                <th className="px-4 py-3 text-left">Відкрита</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-right">Продажі</th>
                <th className="px-4 py-3 text-right">Звіти</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((s) => (
                <tr key={s.id} className="border-t border-surface-border/50 hover:bg-surface-elevated/30">
                  <td className="px-4 py-3 font-medium cursor-pointer" onClick={() => api.shiftDetail(s.id).then(setDetail)}>#{s.id}</td>
                  <td className="px-4 py-3">{s.cashier}</td>
                  <td className="px-4 py-3">{s.register_code} {s.register_name}</td>
                  <td className="px-4 py-3 text-muted">{s.store_name}</td>
                  <td className="px-4 py-3 text-muted">{s.opened_at}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs ${s.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                      {s.status === 'open' ? 'Відкрита' : 'Закрита'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{fmtUah((+s.cash_sales || 0) + (+s.card_sales || 0))}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => setXzShift({ id: s.id, type: 'X' })} className="mr-2 text-accent hover:underline">X</button>
                    {s.status === 'closed' && (
                      <button type="button" onClick={() => setXzShift({ id: s.id, type: 'Z' })} className="text-accent hover:underline">Z</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'shifts' && detail && (
        <div>
          <button type="button" onClick={() => setDetail(null)} className="mb-4 text-sm text-accent">← Назад</button>
          <div className="glass p-6">
            <div className="mb-4 flex justify-between">
              <h2 className="text-lg font-bold">Зміна #{detail.id}</h2>
              <button type="button" onClick={() => setXzShift({ id: detail.id, type: detail.status === 'closed' ? 'Z' : 'X' })} className="flex items-center gap-2 rounded-xl bg-accent px-3 py-1.5 text-sm text-white">
                <Printer className="h-4 w-4" /> X/Z-звіт
              </button>
            </div>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <p>Касир: {detail.cashier}</p>
              <p>Каса: {detail.register_code} {detail.register_name}</p>
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

      {tab === 'registers' && !regDetail && (
        <>
          <div className="mb-4 flex justify-end">
            <button type="button" onClick={() => setShowReg(true)} className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white">
              <Plus className="h-4 w-4" /> Створити
            </button>
          </div>
          <div className="space-y-3">
            {registers.map((r) => (
              <button key={r.id} type="button" onClick={() => openReg(r.id)}
                className="glass flex w-full flex-wrap items-center justify-between gap-4 p-5 text-left hover:bg-surface-elevated/40">
                <div>
                  <p className="text-lg font-bold">{r.code || `N${r.id}`} · {r.name}</p>
                  <p className="text-sm text-muted">{r.store_name} · {r.terminal_info || 'Каса'}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                    <Users className="h-3 w-3" />
                    {(r.cashiers || []).map((c) => c.name).join(', ') || 'Касирів не призначено'}
                  </p>
                  <p className="text-xs text-muted">Створено: {r.created_at}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">БАЛАНС, ГРН</p>
                  <p className="text-2xl font-bold text-accent">{fmtUah(r.balance)}</p>
                  {r.open_shift && <p className="text-xs text-green-600">Зміна #{r.open_shift.id} відкрита</p>}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {tab === 'registers' && regDetail && (
        <div>
          <button type="button" onClick={() => setRegDetail(null)} className="mb-4 text-sm text-accent">← Назад</button>
          <div className="glass mb-4 p-6">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{regDetail.code} · {regDetail.name}</h2>
                <p className="text-muted">{regDetail.store_name}</p>
                <p className="mt-2 text-2xl font-bold text-accent">{fmtUah(regDetail.balance)}</p>
              </div>
              <button type="button" onClick={() => setEditCashiers({ id: regDetail.id, user_ids: (regDetail.cashiers || []).map((c) => c.id) })}
                className="flex h-fit items-center gap-2 rounded-xl border border-surface-border px-4 py-2 text-sm">
                <Users className="h-4 w-4" /> Призначити касирів
              </button>
            </div>
          </div>
          <h3 className="mb-2 font-semibold">Рух по касі</h3>
          <div className="glass mb-6 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-elevated/60 text-muted">
                <tr><th className="px-4 py-2 text-left">Дата</th><th className="px-4 py-2 text-left">Тип</th><th className="px-4 py-2 text-left">Опис</th><th className="px-4 py-2 text-right">Сума</th></tr>
              </thead>
              <tbody>
                {(regDetail.movements || []).map((m) => (
                  <tr key={m.id} className="border-t border-surface-border/50">
                    <td className="px-4 py-2 text-muted">{m.created_at}</td>
                    <td className="px-4 py-2">{m.type}</td>
                    <td className="px-4 py-2">{m.notes || m.from_name || m.to_name}</td>
                    <td className="px-4 py-2 text-right">{fmtUah(m.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="mb-2 font-semibold">Зміни на касі</h3>
          <div className="space-y-2">
            {(regDetail.shifts || []).map((s) => (
              <div key={s.id} className="glass flex justify-between p-3 text-sm">
                <span>#{s.id} · {s.cashier} · {s.opened_at}</span>
                <button type="button" onClick={() => setXzShift({ id: s.id, type: s.status === 'closed' ? 'Z' : 'X' })} className="text-accent">X/Z</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={saveReg} className="glass max-h-[90vh] w-full max-w-lg overflow-auto p-6">
            <h3 className="mb-4 text-lg font-bold">Нова каса</h3>
            <input required placeholder="Назва" value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
              className="mb-3 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm" />
            <select value={regForm.store_id} onChange={(e) => setRegForm({ ...regForm, store_id: e.target.value })}
              className="mb-3 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm">
              <option value="">Магазин</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input placeholder="Термінал (Каса)" value={regForm.terminal_info} onChange={(e) => setRegForm({ ...regForm, terminal_info: e.target.value })}
              className="mb-3 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm" />
            <input type="number" step="0.01" placeholder="Початковий баланс" value={regForm.balance}
              onChange={(e) => setRegForm({ ...regForm, balance: e.target.value })}
              className="mb-3 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm" />
            <p className="mb-2 text-sm font-medium">Касири</p>
            <div className="mb-4 max-h-40 space-y-1 overflow-auto">
              {users.filter((u) => u.role !== 'admin' || true).map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={regForm.user_ids.includes(u.id)} onChange={() => toggleCashier(u.id)} />
                  {u.name} <span className="text-muted">({u.role})</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowReg(false)} className="flex-1 rounded-xl border py-2 text-sm">Скасувати</button>
              <button type="submit" className="flex-1 rounded-xl bg-accent py-2 text-sm text-white">Створити</button>
            </div>
          </form>
        </div>
      )}

      {editCashiers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-bold">Касири на касі</h3>
            <div className="mb-4 max-h-60 space-y-2 overflow-auto">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editCashiers.user_ids.includes(u.id)} onChange={() => toggleEditCashier(u.id)} />
                  {u.name}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditCashiers(null)} className="flex-1 rounded-xl border py-2 text-sm">Скасувати</button>
              <button type="button" onClick={saveCashiers} className="flex-1 rounded-xl bg-accent py-2 text-sm text-white">Зберегти</button>
            </div>
          </div>
        </div>
      )}

      {xzShift && <XZPanel shiftId={xzShift.id} initialType={xzShift.type} onClose={() => setXzShift(null)} />}
    </div>
  );
}
