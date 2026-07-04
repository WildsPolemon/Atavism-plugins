import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const chartProps = {
  margin: { top: 8, right: 8, left: -16, bottom: 0 },
};

export function AreaChartBlock({ data, dataKey = 'count', color = '#7c5cff', height = 280 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} {...chartProps}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2f42" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#8b93a7', fontSize: 11 }}
          tickFormatter={(v) => v.slice(5)}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#8b93a7', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: '#1c2030',
            border: '1px solid #2a2f42',
            borderRadius: 12,
          }}
          labelFormatter={(v) => new Date(v).toLocaleDateString('uk-UA')}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${dataKey})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarChartBlock({ data, dataKey = 'count', color = '#9b82ff', height = 240 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} {...chartProps}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2f42" vertical={false} />
        <XAxis
          dataKey="event_type"
          tick={{ fill: '#8b93a7', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fill: '#8b93a7', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
