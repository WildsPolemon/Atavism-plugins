import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, Warehouse, Users, BarChart3, Store, Truck, Building2, Settings, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, fmtUah } from './api';

const NAV = [
  { to: '/', label: 'Огляд', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Товари', icon: Package },
  { to: '/warehouse', label: 'Склад', icon: Warehouse },
  { to: '/suppliers', label: 'Постачальники', icon: Truck },
  { to: '/stores', label: 'Магазини', icon: Building2 },
  { to: '/crm', label: 'CRM', icon: Users },
  { to: '/reports', label: 'Звіти', icon: BarChart3 },
  { to: '/settings', label: 'Налаштування', icon: Settings },
];

export default function Layout() {
  const [s, setS] = useState(null);
  useEffect(() => { api.overview().then(setS).catch(() => {}); }, []);

  return (
    <div className="flex min-h-screen bg-[#0a0d14]">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-white/5 bg-[#0d111c]/95 backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-white/5 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
            <Store className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-white">StarNet Core</p>
            <p className="text-xs text-slate-400">Адмін-панель</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {NAV.map(({ to, label, icon: I, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition ${isActive ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <I className="h-4 w-4" />{label}
            </NavLink>
          ))}
          <a href="http://localhost:5175" target="_blank" rel="noreferrer"
            className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-indigo-500/40 px-4 py-2.5 text-sm text-indigo-300 hover:bg-indigo-500/10">
            <ShoppingCart className="h-4 w-4" /> Відкрити касу →
          </a>
        </nav>
        <div className="border-t border-white/5 p-4">
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-xs text-slate-400">Продажі сьогодні</p>
            <p className="text-xl font-bold text-emerald-400">{fmtUah(s?.salesToday)}</p>
          </div>
        </div>
      </aside>
      <main className="ml-64 flex-1 p-8"><Outlet /></main>
    </div>
  );
}
