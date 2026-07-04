import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  LogIn,
  Activity,
  Server,
  Sparkles,
} from 'lucide-react';
import { useOverview } from './ui';

const nav = [
  { to: '/', label: 'Огляд', icon: LayoutDashboard, end: true },
  { to: '/online', label: 'Онлайн', icon: Activity },
  { to: '/logins', label: 'Логіни', icon: LogIn },
  { to: '/registrations', label: 'Реєстрації', icon: UserPlus },
  { to: '/accounts', label: 'Акаунти', icon: Users },
  { to: '/server', label: 'Сервер', icon: Server },
];

export default function Layout() {
  const { data } = useOverview();

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-surface-border bg-surface/95 backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-surface-border px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-soft shadow-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Atavism</p>
            <p className="text-xs text-muted">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item w-full ${isActive ? 'active' : ''}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-surface-border p-4">
          <div className="rounded-xl bg-surface-elevated p-4">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${data?.serverOnline ? 'bg-success animate-pulse' : 'bg-danger'}`}
              />
              <span className="text-xs font-medium text-white">
                {data?.serverOnline ? 'Сервер online' : 'Сервер offline'}
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-accent-soft">
              {data?.onlineNow ?? '—'}
              <span className="ml-1 text-sm font-normal text-muted">гравців</span>
            </p>
          </div>
        </div>
      </aside>

      <main className="ml-64 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
