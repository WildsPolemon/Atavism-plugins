const API_BASE = import.meta.env.VITE_API_URL || '';

async function fetchJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  overview: () => fetchJson('/api/stats/overview'),
  registrations: (days = 30) => fetchJson(`/api/stats/registrations?days=${days}`),
  logins: (days = 30) => fetchJson(`/api/stats/logins?days=${days}`),
  onlineHistory: (hours = 24) => fetchJson(`/api/stats/online-history?hours=${hours}`),
  events: (limit = 50) => fetchJson(`/api/stats/events?limit=${limit}`),
  eventBreakdown: (days = 30) => fetchJson(`/api/stats/event-breakdown?days=${days}`),
  accounts: (page = 1, search = '') => {
    const q = new URLSearchParams({ page, limit: 25 });
    if (search) q.set('search', search);
    return fetchJson(`/api/accounts?${q}`);
  },
  serverStatus: () => fetchJson('/api/server/status'),
  health: () => fetchJson('/api/server/health'),
};

export function fillDateGaps(series, days, dateKey = 'date', valueKey = 'count') {
  const map = new Map(series.map((r) => [r[dateKey], Number(r[valueKey])]));
  const result = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: map.get(key) ?? 0 });
  }
  return result;
}

export function formatNumber(n) {
  return new Intl.NumberFormat('uk-UA').format(n ?? 0);
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('uk-UA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
