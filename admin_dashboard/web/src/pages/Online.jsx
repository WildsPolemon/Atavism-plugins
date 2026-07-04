import { useEffect, useState } from 'react';
import { api, formatNumber } from '../api';
import { PageHeader, LoadingState, ErrorState, ChartCard } from '../components/ui';
import { AreaChartBlock } from '../components/Charts';
import { useOverview } from '../components/ui';

export default function Online() {
  const { data: overview } = useOverview();
  const [hours, setHours] = useState(24);
  const [series, setSeries] = useState([]);
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .onlineHistory(hours)
      .then((res) => {
        const mapped = (res.series ?? []).map((r) => ({
          date: r.recorded_at,
          count: r.players_online,
        }));
        setSeries(mapped);
        setSource(res.source);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [hours]);

  const peak = series.reduce((m, r) => Math.max(m, r.count), 0);

  return (
    <div>
      <PageHeader
        title="Онлайн"
        description="Поточний онлайн та історія гравців на сервері"
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-6">
          <p className="kpi-label">Зараз онлайн</p>
          <p className="kpi-value mt-2 text-success">{formatNumber(overview?.onlineNow)}</p>
        </div>
        <div className="glass-card p-6">
          <p className="kpi-label">Пік за період</p>
          <p className="kpi-value mt-2">{formatNumber(peak)}</p>
        </div>
        <div className="glass-card p-6">
          <p className="kpi-label">Активних за 7 днів</p>
          <p className="kpi-value mt-2">{formatNumber(overview?.activeLast7Days)}</p>
        </div>
      </div>

      <ChartCard
        title="Історія онлайну"
        controls={
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-sm text-white"
          >
            <option value={6}>6 год</option>
            <option value={12}>12 год</option>
            <option value={24}>24 год</option>
            <option value={48}>48 год</option>
            <option value={168}>7 днів</option>
          </select>
        }
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : series.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted">Немає історичних даних</p>
            <p className="mt-2 text-xs text-muted">
              Запустіть cron для таблиці online_snapshots (див. sql/online_snapshots.sql)
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-muted">Джерело: {source}</p>
            <AreaChartBlock
              data={series}
              dataKey="count"
              color="#22c55e"
              height={320}
            />
          </>
        )}
      </ChartCard>
    </div>
  );
}
