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
  openShift: (registerId, cash) => req('/api/pos/shift/open', { method: 'POST', body: JSON.stringify({ register_id: registerId, opening_cash: cash }) }),
  myRegisters: () => req('/api/pos/my-registers'),
  closeShift: (cash) => req('/api/pos/shift/close', { method: 'POST', body: JSON.stringify({ closing_cash: cash }) }),
  products: (categoryId) => req(`/api/pos/products${categoryId ? `?category_id=${categoryId}` : ''}`),
  categories: () => req('/api/products/categories'),
  searchProducts: (q) => req(`/api/pos/search?q=${encodeURIComponent(q)}`),
  barcode: (code) => req(`/api/barcode/${encodeURIComponent(code)}`),
  heldSales: () => req('/api/pos/sales/held'),
  holdSale: (data) => req('/api/pos/sale', { method: 'POST', body: JSON.stringify({ ...data, status: 'held', payment_cash: 0, payment_card: 0 }) }),
  sale: (data) => req('/api/pos/sale', { method: 'POST', body: JSON.stringify(data) }),
  deleteHeld: (id) => req(`/api/pos/sales/${id}/held`, { method: 'DELETE' }),
  sales: (status, filters = {}) => {
    const q = new URLSearchParams();
    if (status) q.set('status', status);
    if (filters.date) q.set('date', filters.date);
    if (filters.search) q.set('search', filters.search);
    return req(`/api/pos/sales${q.toString() ? `?${q}` : ''}`);
  },
  saleDetail: (id) => req(`/api/pos/sales/${id}`),
  returnSale: (id, items) => req(`/api/pos/sales/${id}/return`, { method: 'POST', body: JSON.stringify(items ? { items } : {}) }),
  xzReport: (type = 'X') => req(`/api/pos/xz-report?type=${type}`),
  shifts: (status) => req(`/api/pos/shifts${status ? `?status=${status}` : ''}`),
  debtors: () => req('/api/crm/customers/debtors'),
  debtPayment: (id, d) => req(`/api/crm/customers/${id}/debt-payment`, { method: 'POST', body: JSON.stringify(d) }),
  receiptSettings: () => req('/api/pos/receipt-settings'),
  searchCustomers: (q) => req(`/api/crm/customers?search=${encodeURIComponent(q)}`),
  createCustomer: (d) => req('/api/crm/customers', { method: 'POST', body: JSON.stringify(d) }),
  createProduct: (d) => req('/api/pos/products', { method: 'POST', body: JSON.stringify(d) }),
  recommendations: (cartIds) => req(`/api/pos/recommendations?cart_ids=${cartIds}`),
  updateSettings: (data) => req('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
};

export const fmt = (n) => `${new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 2 }).format(n ?? 0)} ₴`;
