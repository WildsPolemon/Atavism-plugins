import { useEffect, useState } from 'react';
import { api } from '../api';

export function usePoll(fetcher, intervalMs = 30000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await fetcher();
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [fetcher, intervalMs]);

  return { data, loading, error, refresh: () => fetcher().then(setData) };
}

export function KpiCard({ label, value, sub, icon: Icon, trend, accent = 'accent' }) {
  const accentMap = {
    accent: 'from-accent/20 to-transparent text-accent-soft',
    success: 'from-success/20 to-transparent text-success',
    warning: 'from-warning/20 to-transparent text-warning',
    danger: 'from-danger/20 to-transparent text-danger',
  };

  return (
    <div className="glass-card relative overflow-hidden p-6">
      <div
        className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${accentMap[accent]} opacity-60 blur-2xl`}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="kpi-label">{label}</p>
          <p className="kpi-value mt-2">{value}</p>
          {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
          {trend != null && (
            <p className={`mt-2 text-xs font-medium ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
              {trend >= 0 ? '+' : ''}
              {trend} vs вчора
            </p>
          )}
        </div>
        {Icon && (
          <div className="rounded-xl bg-surface-elevated p-3">
            <Icon className="h-5 w-5 text-accent-soft" />
          </div>
        )}
      </div>
    </div>
  );
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="glass-card border-danger/30 p-6 text-center">
      <p className="text-danger">Помилка завантаження</p>
      <p className="mt-2 text-sm text-muted">{message}</p>
      <p className="mt-4 text-xs text-muted">
        Перевірте підключення до MySQL (atavism_admin) та запуск API на порту 4000
      </p>
    </div>
  );
}

export function ChartCard({ title, children, controls }) {
  return (
    <div className="glass-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {controls}
      </div>
      {children}
    </div>
  );
}

export function PeriodSelect({ value, onChange, options = [7, 14, 30, 90] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-sm text-white outline-none focus:border-accent"
    >
      {options.map((d) => (
        <option key={d} value={d}>
          {d} днів
        </option>
      ))}
    </select>
  );
}

export function useOverview() {
  return usePoll(() => api.overview(), 15000);
}
