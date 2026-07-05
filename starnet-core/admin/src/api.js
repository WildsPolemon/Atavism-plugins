const API = '';
export const setToken = (t) => (t ? localStorage.setItem('token', t) : localStorage.removeItem('token'));
const token = () => localStorage.getItem('token');

async function req(path, opts = {}) {
  const r = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...opts.headers },
  });
  if (opts.raw) return r;
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
  settings: () => req('/api/settings'),
  saveSettings: (d) => req('/api/settings', { method: 'PUT', body: JSON.stringify(d) }),
  nextProductCode: () => req('/api/products/next-code'),
  createCategory: (d) => req('/api/products/categories', { method: 'POST', body: JSON.stringify(d) }),
  updateCategory: (id, d) => req(`/api/products/categories/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
  deleteCategory: (id) => req(`/api/products/categories/${id}`, { method: 'DELETE' }),
  products: (page, search, filters = {}) => {
    const q = new URLSearchParams({ page });
    if (search) q.set('search', search);
    if (filters.type) q.set('type', filters.type);
    if (filters.category_id) q.set('category_id', filters.category_id);
    if (filters.group_id) q.set('group_id', filters.group_id);
    return req(`/api/products?${q}`);
  },
  createProduct: (d) => req('/api/products', { method: 'POST', body: JSON.stringify(d) }),
  updateProduct: (id, d) => req(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
  generateBarcode: (id) => req(`/api/products/${id}/barcode`, { method: 'POST' }),
  stock: (wid) => req(`/api/warehouse/stock${wid ? `?warehouse_id=${wid}` : ''}`),
  warehouses: () => req('/api/warehouse/warehouses'),
  warehouseOps: () => req('/api/warehouse/operations'),
  warehouseOp: (d) => req('/api/warehouse/operations', { method: 'POST', body: JSON.stringify(d) }),
  warehouseReport: () => req('/api/warehouse/report'),
  purchases: () => req('/api/purchases'),
  createPurchase: (d) => req('/api/purchases', { method: 'POST', body: JSON.stringify(d) }),
  receivePurchase: (id) => req(`/api/purchases/${id}/receive`, { method: 'POST' }),
  inventoryCounts: () => req('/api/inventory'),
  createInventory: (d) => req('/api/inventory', { method: 'POST', body: JSON.stringify(d) }),
  inventoryDetail: (id) => req(`/api/inventory/${id}`),
  updateInventoryItem: (id, itemId, actual_qty) => req(`/api/inventory/${id}/items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ actual_qty }) }),
  completeInventory: (id) => req(`/api/inventory/${id}/complete`, { method: 'POST' }),
  customers: (s) => req(`/api/crm/customers${s ? `?search=${encodeURIComponent(s)}` : ''}`),
  createCustomer: (d) => req('/api/crm/customers', { method: 'POST', body: JSON.stringify(d) }),
  customer: (id) => req(`/api/crm/customers/${id}`),
  updateCustomer: (id, d) => req(`/api/crm/customers/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
  suppliers: () => req('/api/suppliers'),
  createSupplier: (d) => req('/api/suppliers', { method: 'POST', body: JSON.stringify(d) }),
  stores: () => req('/api/stores'),
  createStore: (d) => req('/api/stores', { method: 'POST', body: JSON.stringify(d) }),
  reportFinance: () => req('/api/reports/finance'),
  reportProfit: (d) => req(`/api/reports/profit?days=${d}`),
  reportEmployees: (d) => req(`/api/reports/employees?days=${d}`),
  reportSales: () => req('/api/reports/sales'),
  topProducts: (limit = 10, days = 30) => req(`/api/reports/top-products?limit=${limit}&days=${days}`),
  estoreOrders: () => req('/api/estore/orders'),
  updateEstoreOrder: (id, status) => req(`/api/estore/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  exportProducts: () => req('/api/export/products', { raw: true }),
  exportCustomers: () => req('/api/export/customers', { raw: true }),
  importProducts: (rows) => req('/api/import/products', { method: 'POST', body: JSON.stringify({ rows }) }),
  adminShifts: () => req('/api/admin/shifts'),
  adminShiftDetail: (id) => req(`/api/admin/shifts/${id}`),
  adminRegisters: () => req('/api/admin/registers'),
  createRegister: (d) => req('/api/admin/registers', { method: 'POST', body: JSON.stringify(d) }),
  moneyFlow: (days = 30) => req(`/api/admin/money-flow?days=${days}`),
  adminUsers: () => req('/api/admin/users'),
};

export const fmtUah = (n) => `${new Intl.NumberFormat('uk-UA').format(n ?? 0)} ₴`;
export const fmt = (n) => new Intl.NumberFormat('uk-UA').format(n ?? 0);

export async function downloadExport(fn, filename) {
  const r = await fn();
  const blob = await r.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
