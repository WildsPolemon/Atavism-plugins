import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, Warehouse, Users, BarChart3, Store, Truck, Building2, Settings, ShoppingCart, ClipboardList, ScanBarcode, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, fmtUah } from './api';

const NAV = [
  { to: '/', label: 'Огляд', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Товари', icon: Package },
  { to: '/warehouse', label: 'Склад', icon: Warehouse },
  { to: '/purchases', label: 'Закупівлі', icon: ClipboardList },
  { to: '/inventory', label: 'Інвентаризація', icon: ScanBarcode },
  { to: '/price-tags', label: 'Цінники', icon: ScanBarcode },
  { to: '/suppliers', label: 'Постачальники', icon: Truck },
  { to: '/stores', label: 'Магазини', icon: Building2 },
  { to: '/crm', label: 'CRM', icon: Users },
  { to: '/estore', label: 'eStore', icon: Globe },
  { to: '/reports', label: 'Звіти', icon: BarChart3 },
  { to: '/settings', label: 'Налаштування', icon: Settings },
];

export default function Layout() {
  const [s, setS] = useState(null);
  useEffect(() => { api.overview().then(setS).catch(() => {}); }, []);

  return (
    <div className="flex min-h-screen bg-ainur-bg">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-ainur-border bg-white">
        <div className="flex items-center gap-3 border-b border-ainur-border px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ainur-blue text-lg font-bold text-white">S</div>
          <div>
            <p className="text-sm font-bold text-ainur-text">StarNet Core</p>
            <p className="text-xs text-ainur-muted">Адмін-панель</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {NAV.map(({ to, label, icon: I, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition ${isActive ? 'bg-blue-50 text-ainur-blue font-medium' : 'text-ainur-muted hover:bg-gray-50 hover:text-ainur-text'}`}>
              <I className="h-4 w-4" />{label}
            </NavLink>
          ))}
          <a href="http://localhost:5175" target="_blank" rel="noreferrer"
            className="mt-4 flex items-center gap-3 rounded-lg border border-dashed border-ainur-blue/40 px-4 py-2.5 text-sm text-ainur-blue hover:bg-blue-50">
            <ShoppingCart className="h-4 w-4" /> Відкрити касу →
          </a>
        </nav>
        <div className="border-t border-ainur-border p-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-xs text-ainur-muted">Продажі сьогодні</p>
            <p className="text-xl font-bold text-ainur-blue">{fmtUah(s?.salesToday)}</p>
          </div>
        </div>
      </aside>
      <main className="ml-64 flex-1 p-8"><Outlet /></main>
    </div>
  );
}
