import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Warehouse, Users, BarChart3, ShoppingCart,
  Settings, Globe, CreditCard, Banknote, Plug, LogOut, ExternalLink,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, fmtUah, setToken } from './api';

const NAV = [
  { to: '/', label: 'Головна', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Товари і послуги', icon: Package },
  { to: '/cash', label: 'Каса та зміни', icon: CreditCard },
  { to: '/stock', label: 'Рух товару', icon: Warehouse },
  { to: '/money', label: 'Рух грошей', icon: Banknote },
  { to: '/reports', label: 'Звіти', icon: BarChart3 },
  { to: '/partners', label: 'Контрагенти', icon: Users },
  { to: '/settings', label: 'Компанія', icon: Settings },
  { to: '/estore', label: 'Інтернет-вітрина', icon: Globe },
  { to: '/integrations', label: 'Інтеграції', icon: Plug },
  { to: '/plans', label: 'Тарифи і оплата', icon: CreditCard, accent: true },
];

export default function Layout() {
  const [s, setS] = useState(null);
  const [user, setUser] = useState(null);
  const nav = useNavigate();
  const cashierUrl = `${window.location.origin}/cashier/`;

  useEffect(() => {
    api.overview().then(setS).catch(() => {});
    api.me().then(setUser).catch(() => {});
  }, []);

  const logout = () => {
    setToken(null);
    nav('/login');
  };

  return (
    <div className="flex min-h-screen bg-ainur-bg">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-ainur-border bg-white">
        <div className="flex items-center gap-3 border-b border-ainur-border px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ainur-blue text-lg font-bold text-white">A</div>
          <div>
            <p className="text-sm font-bold text-ainur-text">StarNet Core</p>
            <p className="text-xs text-ainur-muted">Адмін-панель</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {NAV.map(({ to, label, icon: I, end, accent }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                isActive ? 'bg-blue-50 text-ainur-blue font-medium' : accent ? 'text-ainur-orange hover:bg-orange-50' : 'text-ainur-muted hover:bg-gray-50 hover:text-ainur-text'
              }`}>
              <I className="h-4 w-4 shrink-0" />{label}
            </NavLink>
          ))}
          <a href={cashierUrl} target="_blank" rel="noreferrer"
            className="mt-3 flex items-center gap-3 rounded-lg border border-dashed border-ainur-blue/40 px-3 py-2.5 text-sm text-ainur-blue hover:bg-blue-50">
            <ShoppingCart className="h-4 w-4" /> Інтерфейс касира <ExternalLink className="ml-auto h-3 w-3" />
          </a>
        </nav>
        <div className="border-t border-ainur-border p-4">
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs text-ainur-muted">Продажі сьогодні</p>
            <p className="text-lg font-bold text-ainur-blue">{fmtUah(s?.salesToday)}</p>
          </div>
        </div>
      </aside>

      <div className="ml-64 flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ainur-border bg-white px-8 py-3">
          <p className="text-sm text-ainur-muted">StarNet Core · панель керування</p>
          <div className="flex items-center gap-4">
            <a href={cashierUrl} target="_blank" rel="noreferrer" className="text-sm text-ainur-blue hover:underline">Інтерфейс-Касира</a>
            <div className="text-right text-sm">
              <p className="font-medium text-ainur-text">{user?.name || 'Адмін'}</p>
              <p className="text-xs text-ainur-muted">{user?.role === 'admin' ? 'Власник' : user?.role}</p>
            </div>
            <button type="button" onClick={logout} className="flex items-center gap-1 rounded-lg border border-ainur-border px-3 py-1.5 text-sm text-ainur-muted hover:text-danger">
              <LogOut className="h-4 w-4" /> Вийти
            </button>
          </div>
        </header>
        <main className="flex-1 p-8"><Outlet /></main>
      </div>
    </div>
  );
}
