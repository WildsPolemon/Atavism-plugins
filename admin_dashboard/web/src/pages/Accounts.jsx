import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api, formatDate } from '../api';
import { PageHeader, LoadingState, ErrorState } from '../components/ui';

const statusLabels = {
  1: { label: 'Active', class: 'text-success' },
  2: { label: 'Suspended', class: 'text-warning' },
  3: { label: 'Banned', class: 'text-danger' },
};

export default function Accounts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .accounts(page, query)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, query]);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div>
      <PageHeader
        title="Акаунти"
        description={`Всього: ${data?.total ?? '—'} акаунтів`}
        action={
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setQuery(search);
            }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Пошук username / email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border border-surface-border bg-surface-elevated py-2 pl-10 pr-4 text-sm text-white outline-none focus:border-accent"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-soft"
            >
              Шукати
            </button>
          </form>
        }
      />

      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-elevated/50">
                <th className="px-6 py-4 font-medium text-muted">ID</th>
                <th className="px-6 py-4 font-medium text-muted">Username</th>
                <th className="px-6 py-4 font-medium text-muted">Email</th>
                <th className="px-6 py-4 font-medium text-muted">Статус</th>
                <th className="px-6 py-4 font-medium text-muted">Створено</th>
                <th className="px-6 py-4 font-medium text-muted">Останній логін</th>
              </tr>
            </thead>
            <tbody>
              {data.accounts.map((a) => {
                const st = statusLabels[a.status_id] ?? { label: a.status_id, class: 'text-muted' };
                return (
                  <tr
                    key={a.id}
                    className="border-b border-surface-border/50 transition hover:bg-surface-elevated/30"
                  >
                    <td className="px-6 py-4 text-muted">{a.id}</td>
                    <td className="px-6 py-4 font-medium text-white">{a.username}</td>
                    <td className="px-6 py-4 text-muted">{a.email || '—'}</td>
                    <td className={`px-6 py-4 font-medium ${st.class}`}>{st.label}</td>
                    <td className="px-6 py-4 text-muted">{formatDate(a.created)}</td>
                    <td className="px-6 py-4 text-muted">{formatDate(a.last_login)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-surface-border px-6 py-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg px-4 py-2 text-sm text-muted hover:bg-surface-elevated disabled:opacity-40"
              >
                Назад
              </button>
              <span className="text-sm text-muted">
                Сторінка {page} з {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg px-4 py-2 text-sm text-muted hover:bg-surface-elevated disabled:opacity-40"
              >
                Далі
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
