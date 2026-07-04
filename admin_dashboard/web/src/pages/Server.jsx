import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { api, formatNumber, formatDate } from '../api';
import { PageHeader, LoadingState, ErrorState } from '../components/ui';

export default function Server() {
  const [status, setStatus] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [s, h] = await Promise.all([api.serverStatus(), api.health()]);
      setStatus(s);
      setHealth(h);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <PageHeader
        title="Сервер"
        description="Статус Atavism world server та підключення до БД"
        action={
          <button
            onClick={load}
            className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm text-white hover:border-accent"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Оновити
          </button>
        }
      />

      {loading && !status ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card p-8">
            <div className="flex items-center gap-4">
              <span
                className={`h-4 w-4 rounded-full ${status?.online ? 'bg-success animate-pulse' : 'bg-danger'}`}
              />
              <div>
                <h3 className="text-xl font-bold text-white">
                  {status?.online ? 'Сервер працює' : 'Сервер offline'}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Останнє оновлення: {formatDate(status?.statusLastUpdate)}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-surface-elevated p-4">
                <p className="text-xs text-muted">Гравців онлайн</p>
                <p className="mt-1 text-2xl font-bold text-success">
                  {formatNumber(status?.playersOnline)}
                </p>
              </div>
              <div className="rounded-xl bg-surface-elevated p-4">
                <p className="text-xs text-muted">Логінів з рестарту</p>
                <p className="mt-1 text-2xl font-bold text-accent-soft">
                  {formatNumber(status?.loginsSinceRestart)}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-8">
            <h3 className="text-lg font-semibold text-white">Підключення</h3>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-surface-elevated px-4 py-3">
                <span className="text-sm text-muted">MySQL (atavism_admin)</span>
                <span
                  className={`text-sm font-medium ${health?.db === 'ok' ? 'text-success' : 'text-danger'}`}
                >
                  {health?.db === 'ok' ? 'OK' : 'Помилка'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-surface-elevated px-4 py-3">
                <span className="text-sm text-muted">API</span>
                <span className="text-sm font-medium text-success">OK</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-surface-elevated px-4 py-3">
                <span className="text-sm text-muted">Stats оновлено</span>
                <span className="text-sm text-muted">{formatDate(status?.statsLastUpdate)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
