import { useEffect, useState } from 'react';
import { api, fillDateGaps, formatNumber } from '../api';
import { PageHeader, LoadingState, ErrorState, ChartCard, PeriodSelect } from '../components/ui';
import { AreaChartBlock } from '../components/Charts';

export default function Logins() {
  const [days, setDays] = useState(30);
  const [series, setSeries] = useState([]);
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .logins(days)
      .then((res) => {
        setSeries(fillDateGaps(res.series, days));
        setSource(res.source);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [days]);

  const total = series.reduce((s, r) => s + r.count, 0);
  const avg = series.length ? Math.round(total / series.length) : 0;
  const max = series.reduce((m, r) => Math.max(m, r.count), 0);

  return (
    <div>
      <PageHeader
        title="Логіни"
        description="Статистика входів гравців на сервер"
        action={<PeriodSelect value={days} onChange={setDays} />}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-6">
          <p className="kpi-label">Всього за період</p>
          <p className="kpi-value mt-2">{formatNumber(total)}</p>
        </div>
        <div className="glass-card p-6">
          <p className="kpi-label">Середньо на день</p>
          <p className="kpi-value mt-2">{formatNumber(avg)}</p>
        </div>
        <div className="glass-card p-6">
          <p className="kpi-label">Максимум за день</p>
          <p className="kpi-value mt-2">{formatNumber(max)}</p>
        </div>
      </div>

      <ChartCard title={`Логіни за ${days} днів`}>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <>
            <p className="mb-4 text-xs text-muted">Джерело: {source}</p>
            <AreaChartBlock data={series} color="#f59e0b" height={360} />
          </>
        )}
      </ChartCard>
    </div>
  );
}
