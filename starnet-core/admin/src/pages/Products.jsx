import { useEffect, useState } from 'react';
import { Search, Plus, ScanBarcode, Loader2, Pencil } from 'lucide-react';
import { api, fmtUah } from '../api';

const emptyForm = () => ({
  name: '', barcode: '', sku: '', category_id: '', description: '', unit: 'шт',
  retail_price: '', sale_price: '', cost_price: '', initial_stock: 0, image_url: '', is_weighted: false, type: 'product',
});

export default function Products() {
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMsg, setLookupMsg] = useState('');
  const [form, setForm] = useState(emptyForm());
  const [newCat, setNewCat] = useState('');

  const load = () => api.products(1, search).then(setData);
  useEffect(() => { api.categories().then((r) => setCategories(r.categories || [])); }, []);
  useEffect(() => { load(); }, [search]);

  async function onBarcodeChange(code) {
    setForm((f) => ({ ...f, barcode: code }));
    if (code.length < 4) { setLookupMsg(''); return; }
    setLookupLoading(true);
    try {
      const r = await api.lookupBarcode(code);
      setForm((f) => ({ ...f, name: r.name || f.name, image_url: r.image_url || f.image_url, retail_price: r.retail_price || f.retail_price }));
      setLookupMsg(r.source === 'openfoodfacts' ? '✓ Open Food Facts' : r.source === 'local' ? '✓ В базі' : '');
    } catch { setLookupMsg('Не знайдено'); }
    finally { setLookupLoading(false); }
  }

  const openCreate = () => { setEditId(null); setForm(emptyForm()); setShowForm(true); };
  const openEdit = (p) => {
    setEditId(p.id);
    setForm({
      name: p.name, barcode: p.barcode || '', sku: p.sku || '', category_id: p.category_id || '',
      description: p.description || '', unit: p.unit || 'шт', retail_price: p.retail_price,
      sale_price: p.sale_price || '', cost_price: p.cost_price || '', image_url: p.image_url || '',
      is_weighted: !!p.is_weighted, type: p.type || 'product', initial_stock: 0,
    });
    setShowForm(true);
  };

  async function save(e) {
    e.preventDefault();
    const payload = {
      ...form,
      category_id: form.category_id ? +form.category_id : null,
      retail_price: +form.retail_price,
      sale_price: form.sale_price ? +form.sale_price : null,
      cost_price: +form.cost_price || 0,
      initial_stock: +form.initial_stock || 0,
      is_weighted: form.is_weighted ? 1 : 0,
    };
    if (editId) await api.updateProduct(editId, payload);
    else await api.createProduct(payload);
    setShowForm(false);
    setForm(emptyForm());
    load();
  }

  const addCategory = async () => {
    if (!newCat.trim()) return;
    await api.createCategory({ name: newCat.trim() });
    setNewCat('');
    api.categories().then((r) => setCategories(r.categories || []));
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ainur-text">Товари і послуги</h1>
          <p className="text-sm text-ainur-muted">Повне управління каталогом — як AinurPOS</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ainur-muted" />
            <input placeholder="Пошук..." value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-lg border border-ainur-border bg-white py-2 pl-10 pr-4 text-sm" />
          </div>
          <button type="button" onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-ainur-blue px-4 py-2 text-sm font-medium text-white">
            <Plus className="h-4 w-4" /> Додати товар
          </button>
        </div>
      </div>

      <div className="glass mb-6 flex flex-wrap items-center gap-2 p-4">
        <span className="text-sm font-medium text-ainur-muted">Категорії:</span>
        {categories.map((c) => <span key={c.id} className="rounded-full bg-blue-50 px-3 py-1 text-xs text-ainur-blue">{c.name}</span>)}
        <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Нова категорія" className="rounded-lg border border-ainur-border px-3 py-1 text-sm" />
        <button type="button" onClick={addCategory} className="rounded-lg bg-ainur-orange px-3 py-1 text-xs font-medium text-white">+</button>
      </div>

      <div className="glass overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-ainur-bg text-ainur-muted">
            <tr>
              <th className="px-4 py-3">Товар</th>
              <th className="px-4 py-3">Категорія</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Штрихкод</th>
              <th className="px-4 py-3">Ціна</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {data?.products?.map((p) => (
              <tr key={p.id} className="border-t border-ainur-border hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.image_url ? <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded bg-ainur-bg text-ainur-muted">📦</div>}
                    <div>
                      <span className="font-medium">{p.name}</span>
                      <p className="text-xs text-ainur-muted">{p.unit}{p.is_weighted ? ' · ваговий' : ''}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-ainur-muted">{p.category_name || '—'}</td>
                <td className="px-4 py-3 text-ainur-muted">{p.sku}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.barcode}</td>
                <td className="px-4 py-3 font-medium text-ainur-blue">{fmtUah(p.sale_price || p.retail_price)}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => openEdit(p)} className="text-ainur-muted hover:text-ainur-blue"><Pencil className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/50 p-4 pt-10">
          <form onSubmit={save} className="glass max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
            <h3 className="mb-4 text-lg font-bold text-ainur-text">{editId ? 'Редагувати товар' : 'Новий товар'}</h3>

            <label className="mb-1 flex items-center gap-2 text-xs text-ainur-muted"><ScanBarcode className="h-3 w-3" /> Штрихкод</label>
            <div className="relative mb-1">
              <input autoFocus={!editId} value={form.barcode} onChange={(e) => onBarcodeChange(e.target.value)} className="mb-1 w-full rounded-lg border border-ainur-border px-4 py-2 font-mono text-sm" placeholder="Скануйте..." />
              {lookupLoading && <Loader2 className="absolute right-3 top-2 h-5 w-5 animate-spin text-ainur-blue" />}
            </div>
            {lookupMsg && <p className="mb-3 text-xs text-success">{lookupMsg}</p>}
            {form.image_url && <img src={form.image_url} alt="" className="mb-4 h-24 w-24 rounded-lg border object-cover" />}

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-ainur-muted">Найменування *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-ainur-border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-ainur-muted">Артикул (SKU)</label>
                <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full rounded-lg border border-ainur-border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-ainur-muted">Категорія</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full rounded-lg border border-ainur-border px-3 py-2 text-sm">
                  <option value="">—</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-3 grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs text-ainur-muted">Роздрібна ціна *</label>
                <input required type="number" step="0.01" value={form.retail_price} onChange={(e) => setForm({ ...form, retail_price: e.target.value })} className="w-full rounded-lg border border-ainur-border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-ainur-muted">Акційна ціна</label>
                <input type="number" step="0.01" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} className="w-full rounded-lg border border-ainur-border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-ainur-muted">Собівартість</label>
                <input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} className="w-full rounded-lg border border-ainur-border px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="mb-3 grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs text-ainur-muted">Одиниця</label>
                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full rounded-lg border border-ainur-border px-3 py-2 text-sm">
                  <option value="шт">шт</option><option value="кг">кг</option><option value="л">л</option><option value="уп">уп</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-ainur-muted">Тип</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-ainur-border px-3 py-2 text-sm">
                  <option value="product">Товар</option><option value="service">Послуга</option>
                </select>
              </div>
              {!editId && (
                <div>
                  <label className="mb-1 block text-xs text-ainur-muted">Початковий залишок</label>
                  <input type="number" step="0.001" value={form.initial_stock} onChange={(e) => setForm({ ...form, initial_stock: e.target.value })} className="w-full rounded-lg border border-ainur-border px-3 py-2 text-sm" />
                </div>
              )}
            </div>

            <label className="mb-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_weighted} onChange={(e) => setForm({ ...form, is_weighted: e.target.checked })} /> Ваговий товар
            </label>

            <label className="mb-1 block text-xs text-ainur-muted">Опис</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mb-4 w-full rounded-lg border border-ainur-border px-3 py-2 text-sm resize-none" />

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-ainur-border py-2.5 text-sm">Скасувати</button>
              <button type="submit" className="flex-1 rounded-lg bg-ainur-orange py-2.5 text-sm font-bold text-white">{editId ? 'ЗБЕРЕГТИ' : 'ДОДАТИ ТОВАР'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
