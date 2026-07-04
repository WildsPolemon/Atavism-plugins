import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { api, fmtUah, fmt, downloadExport } from '../api';

export default function Reports() {
  const [finance, setFinance] = useState(null);
  const [profit, setProfit] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [sales, setSales] = useState([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    api.reportFinance().then(setFinance);
    api.reportSales().then((r) => setSales(r.series || []));
  }, []);

  useEffect(() => {
    api.reportProfit(days).then((r) => setProfit(r.series || []));
    api.reportEmployees(days).then((r) => setEmployees(r.employees || []));
  }, [days]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Звіти</h1>
          <p className="text-sm text-muted">Продажі, прибуток, фінанси, працівники — як AinurPOS</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => downloadExport(api.exportProducts, 'products.csv')} className="rounded-xl border border-surface-border px-3 py-2 text-sm">Експорт товарів</button>
          <button onClick={() => downloadExport(api.exportCustomers, 'customers.csv')} className="rounded-xl border border-surface-border px-3 py-2 text-sm">Експорт клієнтів</button>
          <select value={days} onChange={(e) => setDays(+e.target.value)} className="rounded-xl border border-surface-border bg-surface-elevated px-3 py-2 text-sm">
            <option value={7}>7 днів</option>
            <option value={30}>30 днів</option>
            <option value={90}>90 днів</option>
          </select>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="glass p-4"><p className="text-xs text-muted">Готівка</p><p className="text-xl font-bold text-emerald-400">{fmtUah(finance?.cash)}</p></div>
        <div className="glass p-4"><p className="text-xs text-muted">Картка</p><p className="text-xl font-bold text-indigo-400">{fmtUah(finance?.card)}</p></div>
        <div className="glass p-4"><p className="text-xs text-muted">Борги клієнтів</p><p className="text-xl font-bold text-rose-400">{fmtUah(finance?.debt)}</p></div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass p-4">
          <h3 className="mb-3 font-semibold">Прибуток</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={profit}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => fmtUah(v)} />
              <Area type="monotone" dataKey="profit" stroke="#818cf8" fill="#818cf833" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="glass p-4">
          <h3 className="mb-3 font-semibold">Продажі по днях</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sales}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => fmtUah(v)} />
              <Bar dataKey="revenue" fill="#34d399" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-elevated/60 text-muted"><tr><th className="px-4 py-3 text-left">Працівник</th><th className="px-4 py-3 text-right">Чеків</th><th className="px-4 py-3 text-right">Виручка</th></tr></thead>
          <tbody>
            {employees.map((e, i) => (
              <tr key={i} className="border-t border-surface-border/50">
                <td className="px-4 py-3">{e.name}</td>
                <td className="px-4 py-3 text-right">{fmt(e.sales_count)}</td>
                <td className="px-4 py-3 text-right">{fmtUah(e.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
