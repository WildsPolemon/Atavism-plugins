import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api, fmtUah, fmt } from '../api';

export default function Dashboard() {
  const [o, setO] = useState(null);
  const [chart, setChart] = useState([]);
  const [top, setTop] = useState([]);

  useEffect(() => {
    api.overview().then(setO);
    api.salesChart(30).then((r) => setChart(r.series || []));
    api.topProducts(7).then((r) => setTop(r.products || []));
  }, []);

  const kpis = o ? [
    { l: 'Продажі сьогодні', v: fmtUah(o.salesToday), c: 'text-success' },
    { l: 'Чеків сьогодні', v: fmt(o.salesCountToday), c: 'text-ainur-text' },
    { l: 'Прибуток сьогодні', v: fmtUah(o.profitToday), c: 'text-ainur-blue' },
    { l: 'Товарів', v: fmt(o.productsCount), c: 'text-ainur-text' },
    { l: 'Мало на складі', v: fmt(o.lowStockCount), c: 'text-warning' },
    { l: 'Клієнтів', v: fmt(o.customersCount), c: 'text-ainur-text' },
    { l: 'Борги', v: fmtUah(o.totalDebt), c: 'text-danger' },
    { l: 'Зміна', v: o.openShift ? 'Відкрита' : 'Закрита', c: o.openShift ? 'text-success' : 'text-ainur-muted' },
  ] : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ainur-text">Огляд</h1>
      <p className="text-sm text-ainur-muted">StarNet Core — огляд бізнесу</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.l} className="glass p-5">
            <p className="text-xs text-ainur-muted">{k.l}</p>
            <p className={`mt-1 text-2xl font-bold ${k.c}`}>{k.v}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="glass p-5">
          <h3 className="mb-4 font-semibold text-ainur-text">Продажі (30 днів)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chart}>
              <CartesianGrid stroke="#E0E0E0" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} tickFormatter={(v) => v?.slice(5)} />
              <YAxis tick={{ fill: '#666', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8 }} />
              <Area type="monotone" dataKey="amount" stroke="#2E7BD6" fill="rgba(46,123,214,0.15)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="glass p-5">
          <h3 className="mb-4 font-semibold text-ainur-text">Топ товарів (7 днів)</h3>
          <div className="space-y-2">
            {top.map((p, i) => (
              <div key={i} className="flex justify-between rounded-lg bg-ainur-bg px-3 py-2 text-sm">
                <span>{p.name}</span>
                <span className="font-medium text-ainur-blue">{fmtUah(p.revenue)}</span>
              </div>
            ))}
            {!top.length && <p className="text-sm text-ainur-muted">Немає продажів</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
