const API = '';
export const setToken = (t) => (t ? localStorage.setItem('token', t) : localStorage.removeItem('token'));
const token = () => localStorage.getItem('token');

async function req(path, opts = {}) {
  const r = await fetch(`${API}${path}`, {
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
  overview: () => req('/api/dashboard/overview'),
  salesChart: (d) => req(`/api/dashboard/sales-chart?days=${d}`),
  lookupBarcode: (code) => req(`/api/barcode/${encodeURIComponent(code)}`),
  categories: () => req('/api/products/categories'),
  products: (page, search) => req(`/api/products?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  createProduct: (d) => req('/api/products', { method: 'POST', body: JSON.stringify(d) }),
  stock: () => req('/api/warehouse/stock'),
  customers: (s) => req(`/api/crm/customers${s ? `?search=${encodeURIComponent(s)}` : ''}`),
  suppliers: () => req('/api/suppliers'),
  createSupplier: (d) => req('/api/suppliers', { method: 'POST', body: JSON.stringify(d) }),
  stores: () => req('/api/stores'),
  createStore: (d) => req('/api/stores', { method: 'POST', body: JSON.stringify(d) }),
  reportFinance: () => req('/api/reports/finance'),
  reportProfit: (d) => req(`/api/reports/profit?days=${d}`),
  reportEmployees: (d) => req(`/api/reports/employees?days=${d}`),
  topProducts: (limit = 10, days = 30) => req(`/api/reports/top-products?limit=${limit}&days=${days}`),
};

export const fmtUah = (n) => `${new Intl.NumberFormat('uk-UA').format(n ?? 0)} ₴`;
export const fmt = (n) => new Intl.NumberFormat('uk-UA').format(n ?? 0);
