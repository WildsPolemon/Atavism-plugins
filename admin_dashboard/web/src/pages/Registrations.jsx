import { useEffect, useState } from 'react';
import { api, fillDateGaps, formatNumber } from '../api';
import { PageHeader, LoadingState, ErrorState, ChartCard, PeriodSelect } from '../components/ui';
import { AreaChartBlock } from '../components/Charts';

export default function Registrations() {
  const [days, setDays] = useState(30);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .registrations(days)
      .then((res) => {
        setSeries(fillDateGaps(res.series, days));
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
        title="Реєстрації"
        description="Нові акаунти на сервері"
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

      <ChartCard title={`Реєстрації за ${days} днів`}>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <AreaChartBlock data={series} color="#7c5cff" height={360} />
        )}
      </ChartCard>
    </div>
  );
}
