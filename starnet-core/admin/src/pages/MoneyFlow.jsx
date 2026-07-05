import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api, fmtUah, fmt } from '../api';

export default function MoneyFlow() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    api.moneyFlow(days).then(setData);
  }, [days]);

  const s = data?.summary;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ainur-text">Рух грошей</h1>
          <p className="text-sm text-ainur-muted">Готівка, безготівкові, борги — як AinurPOS</p>
        </div>
        <select value={days} onChange={(e) => setDays(+e.target.value)} className="inp w-auto">
          <option value={7}>7 днів</option>
          <option value={30}>30 днів</option>
          <option value={90}>90 днів</option>
        </select>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass p-4">
          <p className="text-xs text-ainur-muted">Готівка (продажі)</p>
          <p className="mt-1 text-2xl font-bold text-success">{fmtUah(s?.cash)}</p>
        </div>
        <div className="glass p-4">
          <p className="text-xs text-ainur-muted">Безготівкові</p>
          <p className="mt-1 text-2xl font-bold text-ainur-blue">{fmtUah(s?.card)}</p>
        </div>
        <div className="glass p-4">
          <p className="text-xs text-ainur-muted">Відстрочення</p>
          <p className="mt-1 text-2xl font-bold text-warning">{fmtUah(s?.deferred)}</p>
        </div>
        <div className="glass p-4">
          <p className="text-xs text-ainur-muted">Чеків</p>
          <p className="mt-1 text-2xl font-bold text-ainur-text">{fmt(s?.count)}</p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="glass p-4">
          <p className="text-xs text-ainur-muted">Борг постачальникам</p>
          <p className="text-xl font-bold text-danger">{fmtUah(data?.supplier_debt)}</p>
        </div>
        <div className="glass p-4">
          <p className="text-xs text-ainur-muted">Борг клієнтів</p>
          <p className="text-xl font-bold text-danger">{fmtUah(data?.customer_debt)}</p>
        </div>
      </div>

      <div className="glass mb-6 p-4">
        <h3 className="mb-3 font-semibold">Готівка / картка по днях</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={[...(data?.daily || [])].reverse()}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v?.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => fmtUah(v)} />
            <Bar dataKey="cash" fill="#28A745" name="Готівка" />
            <Bar dataKey="card" fill="#2E7BD6" name="Картка" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h3 className="mb-3 font-semibold">Останні операції</h3>
      <div className="glass overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ainur-bg text-ainur-muted">
            <tr>
              <th className="px-4 py-3 text-left">Чек</th>
              <th className="px-4 py-3 text-left">Дата</th>
              <th className="px-4 py-3 text-left">Касир</th>
              <th className="px-4 py-3 text-right">Готівка</th>
              <th className="px-4 py-3 text-right">Картка</th>
              <th className="px-4 py-3 text-right">Разом</th>
            </tr>
          </thead>
          <tbody>
            {(data?.recent_sales || []).map((r) => (
              <tr key={r.id} className="border-t border-ainur-border/50">
                <td className="px-4 py-3">#{r.id}</td>
                <td className="px-4 py-3 text-ainur-muted">{r.created_at}</td>
                <td className="px-4 py-3">{r.cashier || '—'}</td>
                <td className="px-4 py-3 text-right">{fmtUah(r.payment_cash)}</td>
                <td className="px-4 py-3 text-right">{fmtUah(r.payment_card)}</td>
                <td className="px-4 py-3 text-right font-medium">{fmtUah(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
