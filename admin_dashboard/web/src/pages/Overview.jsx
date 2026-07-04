import { useEffect, useState } from 'react';
import { Users, UserPlus, LogIn, Activity } from 'lucide-react';
import { api, fillDateGaps, formatNumber, formatDate } from '../api';
import {
  KpiCard,
  PageHeader,
  LoadingState,
  ErrorState,
  ChartCard,
  useOverview,
} from '../components/ui';
import { AreaChartBlock, BarChartBlock } from '../components/Charts';

export default function Overview() {
  const { data, loading, error } = useOverview();
  const [registrations, setRegistrations] = useState([]);
  const [logins, setLogins] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    Promise.all([
      api.registrations(30),
      api.logins(30),
      api.eventBreakdown(30),
      api.events(20),
    ]).then(([reg, log, br, ev]) => {
      setRegistrations(fillDateGaps(reg.series, 30));
      setLogins(fillDateGaps(log.series, 30));
      setBreakdown(br.breakdown ?? []);
      setEvents(ev.events ?? []);
    });
  }, []);

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} />;

  const regTrend =
    data.registeredToday - (data.registeredYesterday ?? 0);

  return (
    <div>
      <PageHeader
        title="Огляд"
        description="Повна статистика сервера Atavism — онлайн, реєстрації, логіни"
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Гравців онлайн"
          value={formatNumber(data.onlineNow)}
          sub={`Оновлено: ${formatDate(data.serverLastUpdate)}`}
          icon={Activity}
          accent="success"
        />
        <KpiCard
          label="Всього акаунтів"
          value={formatNumber(data.totalAccounts)}
          icon={Users}
        />
        <KpiCard
          label="Реєстрацій сьогодні"
          value={formatNumber(data.registeredToday)}
          trend={regTrend}
          icon={UserPlus}
          accent="accent"
        />
        <KpiCard
          label="Логінів сьогодні"
          value={formatNumber(data.loginsToday)}
          sub={`З рестарту: ${formatNumber(data.loginsSinceRestart)}`}
          icon={LogIn}
          accent="warning"
        />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Реєстрації (30 днів)">
          <AreaChartBlock data={registrations} color="#7c5cff" />
        </ChartCard>
        <ChartCard title="Логіни (30 днів)">
          <AreaChartBlock data={logins} color="#22c55e" dataKey="count" />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Події за 30 днів">
          {breakdown.length > 0 ? (
            <BarChartBlock data={breakdown} />
          ) : (
            <p className="py-12 text-center text-sm text-muted">Немає даних у data_logs</p>
          )}
        </ChartCard>

        <div className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Останні події</h3>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {events.length === 0 && (
              <p className="text-sm text-muted">Події не знайдено</p>
            )}
            {events.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-lg bg-surface-elevated px-4 py-3 text-sm"
              >
                <span className="font-medium text-accent-soft">{e.event_type}</span>
                <span className="text-xs text-muted">{formatDate(e.event_time)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
