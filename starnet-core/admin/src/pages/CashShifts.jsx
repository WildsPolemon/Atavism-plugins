import { useEffect, useState } from 'react';
import { Plus, ExternalLink, Download } from 'lucide-react';
import { api, fmtUah } from '../api';

const TABS = [
  { id: 'shifts', label: 'Зміни' },
  { id: 'registers', label: 'Каси' },
  { id: 'apps', label: 'Завантажити програму' },
];

export default function CashShifts() {
  const [tab, setTab] = useState('shifts');
  const [shifts, setShifts] = useState([]);
  const [detail, setDetail] = useState(null);
  const [registers, setRegisters] = useState({ registers: [], total_balance: 0 });
  const [showReg, setShowReg] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', store_name: '' });

  const loadShifts = () => api.adminShifts().then((r) => setShifts(r.shifts || []));
  const loadRegs = () => api.adminRegisters().then(setRegisters);

  useEffect(() => {
    loadShifts();
    loadRegs();
  }, []);

  const openShift = async (id) => {
    const r = await api.adminShiftDetail(id);
    setDetail(r);
  };

  const saveRegister = async (e) => {
    e.preventDefault();
    await api.createRegister(regForm);
    setShowReg(false);
    setRegForm({ name: '', store_name: '' });
    loadRegs();
  };

  const cashierUrl = `${window.location.origin}/cashier/`;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ainur-text">Каса та зміни</h1>
      <p className="mb-4 text-sm text-ainur-muted">Касові зміни, реєстратори та додатки — як AinurPOS</p>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setDetail(null); }}
            className={`rounded-lg px-4 py-2 text-sm ${tab === t.id ? 'bg-ainur-blue text-white' : 'bg-white border border-ainur-border text-ainur-muted'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'shifts' && !detail && (
        <div className="glass overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ainur-bg text-ainur-muted">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Касир</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Відкрита</th>
                <th className="px-4 py-3 text-right">Чеків</th>
                <th className="px-4 py-3 text-right">Оборот</th>
                <th className="px-4 py-3 text-right">Готівка</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((s) => (
                <tr key={s.id} onClick={() => openShift(s.id)} className="border-t border-ainur-border/50 cursor-pointer hover:bg-ainur-bg">
                  <td className="px-4 py-3 font-medium">#{s.id}</td>
                  <td className="px-4 py-3">{s.cashier_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={s.status === 'open' ? 'text-success' : 'text-ainur-muted'}>
                      {s.status === 'open' ? 'Відкрита' : 'Закрита'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ainur-muted">{s.opened_at}</td>
                  <td className="px-4 py-3 text-right">{s.sales_count}</td>
                  <td className="px-4 py-3 text-right">{fmtUah(s.sales_total)}</td>
                  <td className="px-4 py-3 text-right">{fmtUah(s.sales_cash)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'shifts' && detail && (
        <div>
          <button onClick={() => setDetail(null)} className="mb-4 text-sm text-ainur-blue">← Назад до списку</button>
          <div className="glass mb-4 p-5 space-y-2 text-sm">
            <p className="text-lg font-semibold">Зміна #{detail.shift?.id} · {detail.shift?.cashier_name}</p>
            <p className="text-ainur-muted">{detail.shift?.opened_at} — {detail.shift?.closed_at || 'відкрита'}</p>
            <div className="grid grid-cols-2 gap-4 pt-2 md:grid-cols-4">
              <div><p className="text-xs text-ainur-muted">Початкова</p><p className="font-medium">{fmtUah(detail.shift?.opening_cash)}</p></div>
              <div><p className="text-xs text-ainur-muted">Закриття</p><p className="font-medium">{fmtUah(detail.shift?.closing_cash)}</p></div>
              <div><p className="text-xs text-ainur-muted">Готівка</p><p className="font-medium">{fmtUah(detail.shift?.cash_sales)}</p></div>
              <div><p className="text-xs text-ainur-muted">Картка</p><p className="font-medium">{fmtUah(detail.shift?.card_sales)}</p></div>
            </div>
          </div>
          <h3 className="mb-2 font-semibold">Чеки зміни</h3>
          <div className="glass overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ainur-bg text-ainur-muted">
                <tr><th className="px-4 py-2 text-left">#</th><th className="px-4 py-2 text-left">Дата</th><th className="px-4 py-2 text-right">Сума</th></tr>
              </thead>
              <tbody>
                {(detail.sales || []).map((s) => (
                  <tr key={s.id} className="border-t border-ainur-border/50">
                    <td className="px-4 py-2">#{s.id}</td>
                    <td className="px-4 py-2 text-ainur-muted">{s.created_at}</td>
                    <td className="px-4 py-2 text-right">{fmtUah(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'registers' && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-ainur-muted">Всього грошей в касах: <strong className="text-ainur-text">{fmtUah(registers.total_balance)}</strong></p>
            <button onClick={() => setShowReg(true)} className="flex items-center gap-2 rounded-lg bg-ainur-blue px-4 py-2 text-sm text-white">
              <Plus className="h-4 w-4" /> Створити касу
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {registers.registers?.map((r) => (
              <div key={r.id} className="glass p-5">
                <p className="text-lg font-semibold text-ainur-text">{r.name}</p>
                <p className="text-sm text-ainur-muted">{r.store_name || '—'}</p>
                <p className="mt-3 text-2xl font-bold text-ainur-blue">{fmtUah(r.balance)}</p>
                <p className="mt-1 text-xs text-ainur-muted">
                  {r.open_shift_id ? `Зміна #${r.open_shift_id} відкрита` : 'Зміна не відкрита'}
                </p>
                <p className="mt-2 text-xs text-ainur-muted">Створено: {r.created_at}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'apps' && (
        <div className="grid gap-4 md:grid-cols-2">
          <a href={cashierUrl} target="_blank" rel="noreferrer" className="glass flex items-center gap-4 p-5 hover:border-ainur-blue">
            <ExternalLink className="h-8 w-8 text-ainur-blue" />
            <div>
              <p className="font-semibold">Веб-каса (Інтерфейс касира)</p>
              <p className="text-sm text-ainur-muted">Відкрити в браузері</p>
            </div>
          </a>
          <div className="glass flex items-center gap-4 p-5 opacity-80">
            <Download className="h-8 w-8 text-ainur-muted" />
            <div>
              <p className="font-semibold">Windows / Android</p>
              <p className="text-sm text-ainur-muted">Скоро — завантаження додатку каси</p>
            </div>
          </div>
        </div>
      )}

      {showReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={saveRegister} className="glass w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-bold">Нова каса</h3>
            <label className="text-xs text-ainur-muted">Назва каси</label>
            <input required className="inp mt-1 mb-3" value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} placeholder="Каса №2" />
            <label className="text-xs text-ainur-muted">Магазин</label>
            <input className="inp mt-1 mb-4" value={regForm.store_name} onChange={(e) => setRegForm({ ...regForm, store_name: e.target.value })} placeholder="Основний магазин" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowReg(false)} className="flex-1 rounded-lg border border-ainur-border py-2 text-sm">Скасувати</button>
              <button type="submit" className="flex-1 rounded-lg bg-ainur-blue py-2 text-sm text-white">Зберегти</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
