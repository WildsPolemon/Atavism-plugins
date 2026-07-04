const token = () => localStorage.getItem('cashier_token');
export const getToken = token;
export const setToken = (t) => (t ? localStorage.setItem('cashier_token', t) : localStorage.removeItem('cashier_token'));

async function req(path, opts = {}) {
  const r = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...opts.headers },
  });
  const b = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(b.error || `HTTP ${r.status}`);
  return b;
}

export const api = {
  login: (email, password) => req('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => req('/api/auth/me'),
  shift: () => req('/api/pos/shift'),
  openShift: (cash) => req('/api/pos/shift/open', { method: 'POST', body: JSON.stringify({ opening_cash: cash }) }),
  searchProducts: (q) => req(`/api/pos/search?q=${encodeURIComponent(q)}`),
  heldSales: () => req('/api/pos/sales/held'),
  holdSale: (data) => req('/api/pos/sale', { method: 'POST', body: JSON.stringify({ ...data, status: 'held', payment_cash: 0, payment_card: 0 }) }),
  sale: (data) => req('/api/pos/sale', { method: 'POST', body: JSON.stringify(data) }),
  deleteHeld: (id) => req(`/api/pos/sales/${id}/held`, { method: 'DELETE' }),
};

export const fmt = (n) => `${new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 2 }).format(n ?? 0)} ₴`;
